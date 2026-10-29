import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type { Actor } from "@/lib/consent/authorize";
import { authorizeOrThrow } from "@/lib/consent/authorize";
import {
  parseJsonArray,
  type Confidence,
  type ConditionCode,
  type DataSourceId,
  type Direction,
  type Domain,
  type DomainResult,
  type FamilyHistoryCode,
  type Intention,
  type ObsCode,
  type ObservationLite,
  type Purpose,
  type Sex,
} from "@/lib/domain/types";
import { assessAll, type AssessInput } from "@/lib/engine/assess";
import { DOMAIN_CODES } from "@/lib/engine/breakdown";
import { stalenessFor } from "@/lib/engine/trajectory";
import { routeActions } from "@/lib/router/care-router";

export interface PatientBundle {
  user: {
    id: string;
    name: string;
    nameAr: string;
    sex: Sex;
    birthYear: number;
    intention: Intention;
    nationality: string;
    language: string;
    hue: number;
  };
  profile: AssessInput;
  observations: ObservationLite[];
  sources: DataSourceId[];
  results: DomainResult[];
}

/**
 * Loads everything the engine needs for one person, filtered to the sources
 * they have switched on, after the consent gate has approved the actor.
 */
export async function loadPatientBundle(
  actor: Actor,
  subjectId: string,
  purpose: Purpose,
  resource = "trajectory",
): Promise<PatientBundle> {
  const decision = await authorizeOrThrow({ actor, subjectId, purpose, resource });
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: subjectId },
    include: { profile: true },
  });
  const rows = await prisma.observation.findMany({
    where: { userId: subjectId, dataSourceId: { in: decision.sources } },
    orderBy: { effectiveAt: "asc" },
  });
  const observations: ObservationLite[] = rows.map((r) => ({
    code: r.code as ObsCode,
    valueNum: r.valueNum,
    valueText: r.valueText,
    unit: r.unit,
    effectiveAt: r.effectiveAt,
    dataSourceId: r.dataSourceId as DataSourceId,
  }));
  const profile: AssessInput = {
    sex: user.sex as Sex,
    birthYear: user.birthYear,
    intention: user.intention as Intention,
    conditions: parseJsonArray<ConditionCode>(user.profile?.conditions),
    familyHistory: parseJsonArray<FamilyHistoryCode>(user.profile?.familyHistory),
    completedSteps: parseJsonArray<string>(user.profile?.completed),
  };
  const results = assessAll(profile, observations);
  return {
    user: {
      id: user.id,
      name: user.name,
      nameAr: user.nameAr,
      sex: user.sex as Sex,
      birthYear: user.birthYear,
      intention: user.intention as Intention,
      nationality: user.nationality,
      language: user.language,
      hue: user.hue,
    },
    profile,
    observations,
    sources: decision.sources,
    results,
  };
}

/** Bump when the rules change so stored interpretations can be told apart. */
export const ENGINE_VERSION = "rules-2026.10";

/** A short fingerprint of everything the rules looked at, so a stored interpretation can say why it exists. */
function inputsKeyFor(bundle: PatientBundle): string {
  const { profile, observations, sources } = bundle;
  const latest = observations.reduce((m, o) => Math.max(m, o.effectiveAt.getTime()), 0);
  return createHash("sha1")
    .update(
      [
        [...sources].sort().join(","),
        observations.length,
        latest,
        [...profile.conditions].sort().join(","),
        [...profile.familyHistory].sort().join(","),
        profile.intention,
        profile.sex,
        profile.birthYear,
      ].join("|"),
    )
    .digest("hex")
    .slice(0, 12);
}

// Renders can overlap (prefetch, parallel server components). Running syncDerived
// one at a time per person keeps two renders from storing the same interpretation twice.
const syncQueue = new Map<string, Promise<void>>();

/**
 * Stores an interpretation event per area when direction or confidence changed,
 * and creates CareActions for newly routed suggestions. Idempotent and serialised.
 */
export function syncDerived(bundle: PatientBundle): Promise<void> {
  const id = bundle.user.id;
  const run = (syncQueue.get(id) ?? Promise.resolve()).catch(() => undefined).then(() => syncDerivedNow(bundle));
  syncQueue.set(id, run);
  void run.finally(() => {
    if (syncQueue.get(id) === run) syncQueue.delete(id);
  });
  return run;
}

async function syncDerivedNow(bundle: PatientBundle) {
  const { user, profile, results } = bundle;
  const key = inputsKeyFor(bundle);
  for (const r of results) {
    const last = await prisma.domainAssessment.findFirst({
      where: { userId: user.id, domain: r.domain },
      orderBy: { computedAt: "desc" },
    });
    if (!last || last.direction !== r.direction || last.confidence !== r.confidence) {
      const sameInputs = Boolean(last && last.inputsKey === key && last.engineVersion === ENGINE_VERSION);
      const hoursSince = last ? (Date.now() - last.computedAt.getTime()) / 3_600_000 : Infinity;
      // Same records, same rules, same day: a render or clock tick is not a new event.
      if (sameInputs && hoursSince < 24) continue;
      await prisma.domainAssessment.create({
        data: {
          userId: user.id,
          domain: r.domain,
          direction: r.direction,
          confidence: r.confidence,
          drivers: JSON.stringify(r.drivers),
          unknowns: JSON.stringify(r.unknowns),
          reason: !last ? "first" : last.inputsKey && last.inputsKey === key ? "time" : "inputs",
          inputsKey: key,
          engineVersion: ENGINE_VERSION,
        },
      });
    }
  }
  const suggestions = routeActions(profile, results);
  const existing = await prisma.careAction.findMany({ where: { userId: user.id } });
  for (const s of suggestions) {
    const dup = existing.find(
      (e) => e.type === s.type && e.domain === s.domain && e.titleKey === s.titleKey && e.state !== "Expired",
    );
    if (!dup) {
      await prisma.careAction.create({
        data: {
          userId: user.id,
          type: s.type,
          domain: s.domain,
          titleKey: s.titleKey,
          reasonKey: s.reasonKey,
          triggerCode: s.triggerCode,
        },
      });
    }
  }
}

export async function listActions(userId: string) {
  return prisma.careAction.findMany({
    where: { userId },
    orderBy: [{ state: "asc" }, { suggestedAt: "asc" }],
  });
}

export async function assessmentHistory(userId: string) {
  return prisma.domainAssessment.findMany({
    where: { userId },
    orderBy: { computedAt: "asc" },
  });
}

/* ---------- "Your health story, over time" ---------- */

export type TimelineEvent =
  | {
      kind: "snapshot";
      id: string;
      at: string;
      domain: Domain;
      direction: Direction;
      confidence: Confidence;
      /** true when direction or visibility differs from the previous snapshot */
      changed: boolean;
      /** the first time Masar read this area; there was nothing to compare with */
      first: boolean;
      /** why the interpretation was stored: first | inputs | time (null for older entries) */
      reason: string | null;
    }
  | {
      kind: "observation";
      id: string;
      at: string;
      domain: Domain;
      code: ObsCode;
      valueNum: number | null;
      valueText: string | null;
      unit: string | null;
      source: DataSourceId;
      /** added to the record in the last 7 days */
      isNew: boolean;
      /** older than the staleness window for its kind of reading */
      isOutdated: boolean;
    };

const NEW_WINDOW_DAYS = 7;

/**
 * One merged, date-ordered story for a domain: assessment snapshots (what
 * Masar said at each moment) interleaved with the readings that arrived.
 * Only readings from sources the person has switched on are included,
 * because that is all the engine ever saw.
 */
export async function timelineFor(userId: string, domain: Domain, now = new Date()): Promise<TimelineEvent[]> {
  const codes = DOMAIN_CODES[domain];
  const sourcesOn = await prisma.consentGrant.findMany({
    where: { subjectId: userId, recipientRole: "Self", purpose: "PersonalView", status: "active", source: { not: null } },
    select: { source: true },
  });
  const allowed = sourcesOn.map((s) => s.source as DataSourceId);
  const [snapshots, observations] = await Promise.all([
    prisma.domainAssessment.findMany({ where: { userId, domain }, orderBy: { computedAt: "asc" } }),
    prisma.observation.findMany({
      where: { userId, code: { in: codes }, dataSourceId: { in: allowed } },
      orderBy: { effectiveAt: "asc" },
    }),
  ]);

  const events: TimelineEvent[] = [];
  let prev: { direction: string; confidence: string } | null = null;
  for (const s of snapshots) {
    const first = prev === null;
    const sameReading = prev !== null && prev.direction === s.direction && prev.confidence === s.confidence;
    // "Not enough information" and "Unknown / limited data" are the same
    // situation; flipping between them is a recalc, not a health event.
    const bothEmpty =
      prev !== null &&
      ((prev.confidence === "InsufficientData" && s.direction === "Unknown") ||
        (s.confidence === "InsufficientData" && prev.direction === "Unknown"));
    if (sameReading || bothEmpty) continue;
    const changed = prev !== null;
    events.push({
      kind: "snapshot",
      id: s.id,
      at: s.computedAt.toISOString(),
      domain,
      direction: s.direction as Direction,
      confidence: s.confidence as Confidence,
      changed,
      first,
      reason: s.reason ?? null,
    });
    prev = { direction: s.direction, confidence: s.confidence };
  }
  const newCutoff = now.getTime() - NEW_WINDOW_DAYS * 86_400_000;
  for (const o of observations) {
    const code = o.code as ObsCode;
    const ageMonths = (now.getTime() - o.effectiveAt.getTime()) / (30.44 * 86_400_000);
    events.push({
      kind: "observation",
      id: o.id,
      at: o.effectiveAt.toISOString(),
      domain,
      code,
      valueNum: o.valueNum,
      valueText: o.valueText,
      unit: o.unit,
      source: o.dataSourceId as DataSourceId,
      isNew: o.importedAt.getTime() >= newCutoff,
      isOutdated: ageMonths > stalenessFor(code),
    });
  }
  events.sort((a, b) => a.at.localeCompare(b.at));
  return events;
}

/** Clinician reviews recorded about this person, newest first. Written only by clinicians. */
export async function reviewsForPatient(userId: string) {
  const rows = await prisma.clinicianReview.findMany({
    where: { patientId: userId },
    orderBy: { createdAt: "desc" },
    include: { clinician: { select: { name: true, nameAr: true } } },
    take: 3,
  });
  return rows.map((r) => ({
    id: r.id,
    decision: r.decision,
    at: r.createdAt.toISOString(),
    clinicianName: r.clinician.name,
    clinicianNameAr: r.clinician.nameAr,
  }));
}
