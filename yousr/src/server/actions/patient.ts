"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  ACTION_STATES,
  CONDITION_CODES,
  DATA_SOURCES,
  DOMAINS,
  FAMILY_HISTORY_CODES,
  INTENTIONS,
  OBS_CODES,
  type ActionState,
  type DataSourceId,
  type Domain,
  type Intention,
  type ObsCode,
} from "@/lib/domain/types";
import { setRecipientConsent, setSourceConsent } from "@/server/consent";
import { loadPatientBundle, syncDerived } from "@/server/patient";
import { transitionAction } from "@/server/actions-state";
import { recordTeachBack } from "@/server/teachback";
import { importSynthetic, type SyntheticObservation } from "@/server/integrations";
import { setMyScopes } from "@/server/couple";

async function recompute(userId: string) {
  const bundle = await loadPatientBundle({ userId, role: "patient" }, userId, "PersonalView", "recompute");
  await syncDerived(bundle);
}

export async function toggleSource(source: string, on: boolean) {
  const s = await requireSession();
  if (!(DATA_SOURCES as readonly string[]).includes(source)) return;
  await setSourceConsent(s.userId, source as DataSourceId, on);
  await recompute(s.userId);
  revalidatePath("/", "layout");
}

export async function toggleRecipient(recipient: string, on: boolean) {
  const s = await requireSession();
  if (!["Clinician", "Partner", "Analytics"].includes(recipient)) return;
  await setRecipientConsent(s.userId, recipient as "Clinician" | "Partner" | "Analytics", on);
  revalidatePath("/", "layout");
}

export async function updateIntention(intention: string) {
  const s = await requireSession();
  if (!(INTENTIONS as readonly string[]).includes(intention)) return;
  await prisma.user.update({ where: { id: s.userId }, data: { intention: intention as Intention } });
  await recompute(s.userId);
  revalidatePath("/", "layout");
}

export async function setPreferSameGenderClinician(prefer: boolean) {
  const s = await requireSession();
  await prisma.healthProfile.upsert({
    where: { userId: s.userId },
    create: { userId: s.userId, preferSameGenderClinician: prefer },
    update: { preferSameGenderClinician: prefer },
  });
  revalidatePath("/", "layout");
}

interface CheckinPayload {
  sleep?: number;
  activity?: number;
  smoking?: "never" | "former" | "current";
  alcohol?: number;
  stress?: number;
  laughter?: number;
  heat?: "low" | "high";
}

async function markStep(userId: string, step: string) {
  const profile = await prisma.healthProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
  const done = new Set<string>(JSON.parse(profile.completed) as string[]);
  done.add(step);
  await prisma.healthProfile.update({ where: { userId }, data: { completed: JSON.stringify([...done]) } });
}

export async function saveCycles(lengths: number[], absentDays?: number) {
  const s = await requireSession();
  const now = new Date();
  const rows = lengths
    .filter((n) => Number.isFinite(n) && n > 10 && n < 120)
    .slice(0, 6)
    .map((n, i, arr) => {
      // Space the entries backwards in time so they form a series.
      const at = new Date(now);
      at.setDate(at.getDate() - (arr.length - 1 - i) * Math.round(n));
      return { userId: s.userId, dataSourceId: "SelfReport", code: "cycle_length", valueNum: n, unit: OBS_CODES.cycle_length, effectiveAt: at };
    });
  if (rows.length) await prisma.observation.createMany({ data: rows });
  if (absentDays && absentDays > 0) {
    await prisma.observation.create({
      data: { userId: s.userId, dataSourceId: "SelfReport", code: "period_absent_days", valueNum: absentDays, unit: "days", effectiveAt: now },
    });
  }
  await markStep(s.userId, "cycle");
  await recompute(s.userId);
  revalidatePath("/", "layout");
}

export async function saveConditions(conditions: string[], familyHistory: string[]) {
  const s = await requireSession();
  const conds = conditions.filter((c) => (CONDITION_CODES as readonly string[]).includes(c));
  const fam = familyHistory.filter((c) => (FAMILY_HISTORY_CODES as readonly string[]).includes(c));
  await prisma.healthProfile.upsert({
    where: { userId: s.userId },
    create: { userId: s.userId, conditions: JSON.stringify(conds), familyHistory: JSON.stringify(fam) },
    update: { conditions: JSON.stringify(conds), familyHistory: JSON.stringify(fam) },
  });
  await markStep(s.userId, "conditions");
  await markStep(s.userId, "family");
  await recompute(s.userId);
  revalidatePath("/", "layout");
}

export async function saveCheckin(payload: CheckinPayload) {
  const s = await requireSession();
  const at = new Date();
  const rows: { code: ObsCode; valueNum?: number; valueText?: string }[] = [];
  if (payload.sleep !== undefined) rows.push({ code: "sleep_hours", valueNum: payload.sleep });
  if (payload.activity !== undefined) rows.push({ code: "activity_minutes_week", valueNum: payload.activity });
  if (payload.smoking) rows.push({ code: "smoking", valueText: payload.smoking });
  if (payload.alcohol !== undefined) rows.push({ code: "alcohol_units_week", valueNum: payload.alcohol });
  if (payload.stress !== undefined) rows.push({ code: "stress_level", valueNum: payload.stress });
  if (payload.laughter !== undefined) rows.push({ code: "laughter_days_week", valueNum: payload.laughter });
  if (payload.heat) rows.push({ code: "heat_exposure", valueText: payload.heat });
  if (rows.length) {
    await prisma.observation.createMany({
      data: rows.map((r) => ({
        userId: s.userId,
        dataSourceId: "SelfReport",
        code: r.code,
        valueNum: r.valueNum,
        valueText: r.valueText,
        unit: OBS_CODES[r.code] === "text" ? null : OBS_CODES[r.code],
        effectiveAt: at,
      })),
    });
  }
  await markStep(s.userId, "lifestyle");
  await recompute(s.userId);
  revalidatePath("/", "layout");
}

export async function saveLab(code: string, value: number, date: string) {
  const s = await requireSession();
  if (!(code in OBS_CODES) || !Number.isFinite(value)) return;
  const at = date ? new Date(date) : new Date();
  await prisma.observation.create({
    data: {
      userId: s.userId,
      dataSourceId: "SelfReport",
      code,
      valueNum: value,
      unit: OBS_CODES[code as ObsCode],
      effectiveAt: at,
    },
  });
  await markStep(s.userId, "labs");
  await recompute(s.userId);
  revalidatePath("/", "layout");
}

export async function saveMedications(medications: string[]) {
  const s = await requireSession();
  await prisma.healthProfile.upsert({
    where: { userId: s.userId },
    create: { userId: s.userId, medications: JSON.stringify(medications) },
    update: { medications: JSON.stringify(medications) },
  });
  await markStep(s.userId, "medications");
  await recompute(s.userId);
  revalidatePath("/", "layout");
}

export async function moveAction(actionId: string, to: string) {
  const s = await requireSession();
  if (!(ACTION_STATES as readonly string[]).includes(to)) return;
  const action = await prisma.careAction.findUniqueOrThrow({ where: { id: actionId } });
  if (action.userId !== s.userId && s.role !== "clinician") throw new Error("FORBIDDEN");
  await transitionAction(actionId, to as ActionState, { userId: s.userId, role: s.role }, s.role === "clinician" ? { clinicianId: s.userId } : undefined);
  revalidatePath("/", "layout");
}

export async function answerTeachBack(domain: string, questionId: string, answer: "yes" | "no") {
  const s = await requireSession();
  if (!(DOMAINS as readonly string[]).includes(domain)) return { correct: false, escalated: false };
  const result = await recordTeachBack(s.userId, domain as Domain, questionId, answer);
  if (result.escalated) revalidatePath("/", "layout");
  return result;
}

export async function saveCoupleScopes(scopes: string[]) {
  const s = await requireSession();
  const clean = scopes.filter((d) => (DOMAINS as readonly string[]).includes(d)) as Domain[];
  await setMyScopes(s.userId, clean);
  revalidatePath("/", "layout");
}

export type ImportKind = "lab_amh" | "lab_tsh" | "lab_hba1c" | "lab_semen" | "device_sleep" | "malaffi_bmi" | "healthage";

const IMPORTS: Record<ImportKind, { source: DataSourceId; build: (now: Date) => SyntheticObservation[] }> = {
  lab_amh: { source: "LabMock", build: (now) => [{ code: "amh", valueNum: 1.9, unit: "ng/mL", effectiveAt: now }] },
  lab_tsh: { source: "LabMock", build: (now) => [{ code: "tsh", valueNum: 2.4, unit: "mIU/L", effectiveAt: now }] },
  lab_hba1c: { source: "LabMock", build: (now) => [{ code: "hba1c", valueNum: 5.6, unit: "%", effectiveAt: now }] },
  lab_semen: {
    source: "LabMock",
    build: (now) => [
      { code: "semen_concentration", valueNum: 14, unit: "M/mL", effectiveAt: now },
      { code: "semen_motility", valueNum: 45, unit: "%", effectiveAt: now },
      { code: "semen_volume", valueNum: 2.1, unit: "mL", effectiveAt: now },
    ],
  },
  device_sleep: {
    source: "DeviceMock",
    build: (now) => [
      { code: "sleep_hours", valueNum: 7.2, unit: "hours", effectiveAt: now },
      { code: "activity_minutes_week", valueNum: 160, unit: "min/week", effectiveAt: now },
    ],
  },
  malaffi_bmi: {
    source: "MalaffiMock",
    build: (now) => [
      { code: "bmi", valueNum: 28.6, unit: "kg/m2", effectiveAt: now },
      { code: "bp_systolic", valueNum: 117, unit: "mmHg", effectiveAt: now },
    ],
  },
  healthage: { source: "HealthAgeMock", build: (now) => [{ code: "health_age", valueNum: 35, unit: "years", effectiveAt: now }] },
};

export async function runImport(kind: ImportKind, targetUserId?: string) {
  const s = await requireSession();
  const userId = targetUserId && s.role !== "patient" ? targetUserId : s.userId;
  const spec = IMPORTS[kind];
  if (!spec) return { status: "empty" as const, added: 0, skipped: 0, source: "SelfReport" as DataSourceId };
  const result = await importSynthetic(userId, spec.source, spec.build(new Date()));
  if (result.status === "ok") {
    const bundle = await loadPatientBundle({ userId, role: "patient" }, userId, "PersonalView", "recompute");
    await syncDerived(bundle);
  }
  revalidatePath("/", "layout");
  return { ...result, source: spec.source };
}
