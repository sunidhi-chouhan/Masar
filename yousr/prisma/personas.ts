// Synthetic people only. Nothing here is derived from a real person.
// Shared by `prisma/seed.ts` and the in-app "Reset demo data" action so the
// four story personas always come back to exactly the same starting point.
import type { PrismaClient } from "../src/generated/prisma/client";
import { assessAll } from "../src/lib/engine/assess";
import { routeActions } from "../src/lib/router/care-router";
import type { DataSourceId, Domain, ObsCode, ObservationLite, Sex } from "../src/lib/domain/types";
import { DATA_SOURCES, JOURNEY_USER_ID, OBS_CODES } from "../src/lib/domain/types";

export const PERSONA_IDS = ["u_mariam", "u_omar", "u_fatima", "u_sara"] as const;

export interface ObsSeed {
  code: ObsCode;
  source: DataSourceId;
  at: Date;
  num?: number;
  text?: string;
}

export interface PersonaSpec {
  id: string;
  name: string;
  nameAr: string;
  sex: "female" | "male";
  birthYear: number;
  nationality: string;
  language: string;
  intention: string;
  hue: number;
  conditions: string[];
  familyHistory: string[];
  medications: string[];
  completed: string[];
  sourcesOn: DataSourceId[];
  clinician: boolean;
  partner: boolean;
  analytics: boolean;
  observations: ObsSeed[];
}

export function clock(now: Date) {
  const monthsAgo = (m: number, day = 12) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - m);
    d.setDate(day);
    d.setHours(9, 0, 0, 0);
    return d;
  };
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);
  return { monthsAgo, daysAgo };
}

export function obsRow(userId: string, o: ObsSeed) {
  return {
    userId,
    dataSourceId: o.source,
    code: o.code,
    valueNum: o.num,
    valueText: o.text,
    unit: OBS_CODES[o.code] === "text" ? null : OBS_CODES[o.code],
    effectiveAt: o.at,
    // Seeded readings "arrived" when they were taken, so only readings that
    // really arrive during the demo are tagged as newly added.
    importedAt: o.at,
  };
}

export function personaSpecs(now: Date): PersonaSpec[] {
  const { monthsAgo } = clock(now);
  return [
    {
      id: "u_mariam",
      name: "Mariam",
      nameAr: "مريم",
      sex: "female",
      birthYear: now.getFullYear() - 33,
      nationality: "Emirati",
      language: "en",
      intention: "MaybeLater",
      hue: 22,
      conditions: ["pcos"],
      familyHistory: [],
      medications: [],
      completed: ["intention", "cycle", "conditions", "lifestyle"],
      sourcesOn: ["SelfReport", "MalaffiMock", "LabMock", "HealthAgeMock"],
      clinician: true,
      partner: true,
      analytics: true,
      observations: [
        // 18 months of cycles: regular, then progressively irregular
        ...[18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8].map((m, i) => ({
          code: "cycle_length" as const,
          source: "SelfReport" as const,
          at: monthsAgo(m, 3 + (i % 4)),
          num: [29, 31, 30, 32, 29, 30, 31, 30, 33, 30, 31][i],
        })),
        { code: "cycle_length", source: "SelfReport", at: monthsAgo(7, 5), num: 38 },
        { code: "cycle_length", source: "SelfReport", at: monthsAgo(6, 12), num: 27 },
        { code: "cycle_length", source: "SelfReport", at: monthsAgo(5, 8), num: 41 },
        { code: "cycle_length", source: "SelfReport", at: monthsAgo(4, 18), num: 35 },
        { code: "cycle_length", source: "SelfReport", at: monthsAgo(3, 1), num: 44 },
        { code: "cycle_length", source: "SelfReport", at: monthsAgo(2, 1), num: 30 },
        { code: "cycle_length", source: "SelfReport", at: monthsAgo(1, 16), num: 47 },
        { code: "cycle_regular", source: "SelfReport", at: monthsAgo(1, 16), text: "irregular" },
        // metabolic from Malaffi
        { code: "bmi", source: "MalaffiMock", at: monthsAgo(20), num: 27.2 },
        { code: "bmi", source: "MalaffiMock", at: monthsAgo(14), num: 27.4 },
        { code: "bmi", source: "MalaffiMock", at: monthsAgo(8), num: 27.6 },
        { code: "bmi", source: "MalaffiMock", at: monthsAgo(2), num: 28.9 },
        { code: "bp_systolic", source: "MalaffiMock", at: monthsAgo(2), num: 118 },
        { code: "hba1c", source: "LabMock", at: monthsAgo(14), num: 5.5 },
        { code: "health_age", source: "HealthAgeMock", at: monthsAgo(3), num: 36 },
        // check-ins
        { code: "sleep_hours", source: "SelfReport", at: monthsAgo(4, 20), num: 6 },
        { code: "activity_minutes_week", source: "SelfReport", at: monthsAgo(4, 20), num: 60 },
        { code: "smoking", source: "SelfReport", at: monthsAgo(4, 20), text: "never" },
        { code: "stress_level", source: "SelfReport", at: monthsAgo(4, 20), num: 7 },
        { code: "laughter_days_week", source: "SelfReport", at: monthsAgo(4, 20), num: 2 },
        { code: "sleep_hours", source: "SelfReport", at: monthsAgo(1, 2), num: 6.5 },
        { code: "activity_minutes_week", source: "SelfReport", at: monthsAgo(1, 2), num: 90 },
        { code: "smoking", source: "SelfReport", at: monthsAgo(1, 2), text: "never" },
        { code: "stress_level", source: "SelfReport", at: monthsAgo(1, 2), num: 6 },
        { code: "laughter_days_week", source: "SelfReport", at: monthsAgo(1, 2), num: 2 },
      ],
    },
    {
      id: "u_omar",
      name: "Omar",
      nameAr: "عمر",
      sex: "male",
      birthYear: now.getFullYear() - 36,
      nationality: "Emirati",
      language: "en",
      intention: "MaybeLater",
      hue: 160,
      conditions: ["prediabetes"],
      familyHistory: ["diabetes_family"],
      medications: [],
      completed: ["intention", "conditions", "family", "lifestyle"],
      sourcesOn: ["SelfReport", "MalaffiMock", "LabMock", "DeviceMock"],
      clinician: true,
      partner: true,
      analytics: true,
      observations: [
        { code: "bmi", source: "MalaffiMock", at: monthsAgo(18), num: 29.6 },
        { code: "bmi", source: "MalaffiMock", at: monthsAgo(9), num: 30.0 },
        { code: "bmi", source: "MalaffiMock", at: monthsAgo(1), num: 31.4 },
        { code: "bp_systolic", source: "MalaffiMock", at: monthsAgo(1), num: 131 },
        { code: "hba1c", source: "LabMock", at: monthsAgo(10), num: 5.9 },
        { code: "smoking", source: "SelfReport", at: monthsAgo(12), text: "current" },
        { code: "heat_exposure", source: "SelfReport", at: monthsAgo(1, 6), text: "low" },
        { code: "sleep_hours", source: "SelfReport", at: monthsAgo(5, 9), num: 6 },
        { code: "activity_minutes_week", source: "SelfReport", at: monthsAgo(5, 9), num: 30 },
        { code: "smoking", source: "SelfReport", at: monthsAgo(5, 9), text: "current" },
        { code: "alcohol_units_week", source: "SelfReport", at: monthsAgo(5, 9), num: 0 },
        { code: "stress_level", source: "SelfReport", at: monthsAgo(5, 9), num: 5 },
        { code: "laughter_days_week", source: "SelfReport", at: monthsAgo(5, 9), num: 3 },
        { code: "sleep_hours", source: "DeviceMock", at: monthsAgo(1, 6), num: 6.4 },
        { code: "activity_minutes_week", source: "DeviceMock", at: monthsAgo(1, 6), num: 70 },
        { code: "smoking", source: "SelfReport", at: monthsAgo(1, 6), text: "current" },
        { code: "alcohol_units_week", source: "SelfReport", at: monthsAgo(1, 6), num: 0 },
        { code: "stress_level", source: "SelfReport", at: monthsAgo(1, 6), num: 4 },
        { code: "laughter_days_week", source: "SelfReport", at: monthsAgo(1, 6), num: 4 },
      ],
    },
    {
      id: "u_fatima",
      name: "Fatima",
      nameAr: "فاطمة",
      sex: "female",
      birthYear: now.getFullYear() - 28,
      nationality: "Indian",
      language: "en",
      intention: "NotPlanning",
      hue: 300,
      conditions: [],
      familyHistory: [],
      medications: [],
      completed: ["intention", "lifestyle"],
      sourcesOn: ["SelfReport"],
      clinician: false,
      partner: false,
      analytics: true,
      observations: [
        { code: "cycle_length", source: "SelfReport", at: monthsAgo(1, 9), num: 30 },
        { code: "sleep_hours", source: "SelfReport", at: monthsAgo(1, 9), num: 7 },
        { code: "activity_minutes_week", source: "SelfReport", at: monthsAgo(1, 9), num: 120 },
        { code: "smoking", source: "SelfReport", at: monthsAgo(1, 9), text: "never" },
        { code: "stress_level", source: "SelfReport", at: monthsAgo(1, 9), num: 4 },
        { code: "laughter_days_week", source: "SelfReport", at: monthsAgo(1, 9), num: 4 },
      ],
    },
    {
      id: "u_sara",
      name: "Sara",
      nameAr: "سارة",
      sex: "female",
      birthYear: now.getFullYear() - 38,
      nationality: "Egyptian",
      language: "ar",
      intention: "TryingNow",
      hue: 40,
      conditions: ["hypothyroidism"],
      familyHistory: [],
      medications: ["levothyroxine"],
      completed: ["intention", "cycle", "conditions", "family", "lifestyle", "labs", "medications"],
      sourcesOn: ["SelfReport", "MalaffiMock", "LabMock", "HealthAgeMock", "DeviceMock"],
      clinician: true,
      partner: false,
      analytics: true,
      observations: [
        ...[8, 7, 6, 5, 4, 3, 2, 1].map((m, i) => ({
          code: "cycle_length" as const,
          source: "SelfReport" as const,
          at: monthsAgo(m, 4 + i),
          num: [28, 29, 30, 28, 29, 30, 29, 28][i],
        })),
        { code: "amh", source: "LabMock", at: monthsAgo(16), num: 1.6 },
        { code: "amh", source: "LabMock", at: monthsAgo(2), num: 1.1 },
        { code: "tsh", source: "LabMock", at: monthsAgo(2), num: 3.1 },
        { code: "hba1c", source: "LabMock", at: monthsAgo(2), num: 5.3 },
        { code: "bmi", source: "MalaffiMock", at: monthsAgo(12), num: 24.1 },
        { code: "bmi", source: "MalaffiMock", at: monthsAgo(1), num: 23.8 },
        { code: "bp_systolic", source: "MalaffiMock", at: monthsAgo(1), num: 112 },
        { code: "health_age", source: "HealthAgeMock", at: monthsAgo(2), num: 37 },
        { code: "sleep_hours", source: "DeviceMock", at: monthsAgo(3, 14), num: 7.5 },
        { code: "activity_minutes_week", source: "DeviceMock", at: monthsAgo(3, 14), num: 150 },
        { code: "smoking", source: "SelfReport", at: monthsAgo(3, 14), text: "never" },
        { code: "stress_level", source: "SelfReport", at: monthsAgo(3, 14), num: 6 },
        { code: "laughter_days_week", source: "SelfReport", at: monthsAgo(3, 14), num: 3 },
        { code: "sleep_hours", source: "DeviceMock", at: monthsAgo(1, 3), num: 7 },
        { code: "activity_minutes_week", source: "DeviceMock", at: monthsAgo(1, 3), num: 180 },
        { code: "smoking", source: "SelfReport", at: monthsAgo(1, 3), text: "never" },
        { code: "stress_level", source: "SelfReport", at: monthsAgo(1, 3), num: 5 },
        { code: "laughter_days_week", source: "SelfReport", at: monthsAgo(1, 3), num: 4 },
      ],
    },
  ];
}

export async function seedSources(prisma: PrismaClient, now: Date) {
  const { monthsAgo } = clock(now);
  const rows: { id: DataSourceId; name: string; kind: string }[] = [
    { id: "SelfReport", name: "What you tell us", kind: "self" },
    { id: "MalaffiMock", name: "Malaffi (simulated)", kind: "hie" },
    { id: "LabMock", name: "Laboratory (simulated)", kind: "lab" },
    { id: "HealthAgeMock", name: "Health Age (simulated)", kind: "programme" },
    { id: "DeviceMock", name: "Device import (simulated)", kind: "device" },
  ];
  for (const r of rows) {
    await prisma.dataSource.create({ data: { ...r, simulated: true, lastSyncAt: monthsAgo(1) } });
  }
}

export async function seedPersona(prisma: PrismaClient, p: PersonaSpec, now: Date) {
  const { monthsAgo, daysAgo } = clock(now);
  await prisma.user.create({
    data: {
      id: p.id,
      role: "patient",
      name: p.name,
      nameAr: p.nameAr,
      sex: p.sex,
      birthYear: p.birthYear,
      nationality: p.nationality,
      language: p.language,
      intention: p.intention,
      hue: p.hue,
      profile: {
        create: {
          conditions: JSON.stringify(p.conditions),
          familyHistory: JSON.stringify(p.familyHistory),
          medications: JSON.stringify(p.medications),
          completed: JSON.stringify(p.completed),
        },
      },
    },
  });
  await prisma.observation.createMany({ data: p.observations.map((o) => obsRow(p.id, o)) });

  // Consents: sources + recipients. Revoked rows are kept so the ledger shows history.
  for (const s of DATA_SOURCES) {
    const on = p.sourcesOn.includes(s);
    await prisma.consentGrant.create({
      data: {
        subjectId: p.id,
        source: s,
        recipientRole: "Self",
        purpose: "PersonalView",
        status: on ? "active" : "revoked",
        grantedAt: monthsAgo(6),
        revokedAt: on ? null : monthsAgo(5),
      },
    });
  }
  const recipients: ["Clinician" | "Partner" | "Analytics", string, boolean][] = [
    ["Clinician", "ClinicianReview", p.clinician],
    ["Partner", "PartnerShare", p.partner],
    ["Analytics", "PopulationAnalytics", p.analytics],
  ];
  for (const [role, purpose, on] of recipients) {
    await prisma.consentGrant.create({
      data: {
        subjectId: p.id,
        recipientRole: role,
        purpose,
        status: on ? "active" : "revoked",
        grantedAt: monthsAgo(6),
        revokedAt: on ? null : monthsAgo(5),
      },
    });
  }

  // Current assessment via the real engine, then actions via the real router.
  const lite: ObservationLite[] = p.observations
    .filter((o) => p.sourcesOn.includes(o.source))
    .map((o) => ({
      code: o.code,
      valueNum: o.num ?? null,
      valueText: o.text ?? null,
      unit: OBS_CODES[o.code] === "text" ? null : OBS_CODES[o.code],
      effectiveAt: o.at,
      dataSourceId: o.source,
    }));
  const profile = {
    sex: p.sex,
    birthYear: p.birthYear,
    intention: p.intention as never,
    conditions: p.conditions as never,
    familyHistory: p.familyHistory as never,
    completedSteps: p.completed,
  };
  const results = assessAll(profile, lite, { now });
  for (const r of results) {
    await prisma.domainAssessment.create({
      data: {
        userId: p.id,
        domain: r.domain,
        direction: r.direction,
        confidence: r.confidence,
        drivers: JSON.stringify(r.drivers),
        unknowns: JSON.stringify(r.unknowns),
        computedAt: daysAgo(2),
      },
    });
  }
  const suggestions = routeActions(profile, results);
  for (const s of suggestions) {
    await prisma.careAction.create({
      data: {
        userId: p.id,
        type: s.type,
        domain: s.domain,
        titleKey: s.titleKey,
        reasonKey: s.reasonKey,
        triggerCode: s.triggerCode,
        suggestedAt: daysAgo(2),
      },
    });
  }
  return results;
}

export async function seedNarrativeHistory(prisma: PrismaClient, now: Date) {
  const { monthsAgo, daysAgo } = clock(now);
  // Mariam: a visible journey, Stable -> Shifting -> Discuss over 18 months.
  const mariamHistory = [
    { domain: "cycle", direction: "Stable", confidence: "High", at: monthsAgo(15) },
    { domain: "cycle", direction: "Shifting", confidence: "High", at: monthsAgo(6) },
    { domain: "metabolic", direction: "Stable", confidence: "Moderate", at: monthsAgo(14) },
    { domain: "lifestyle", direction: "Unknown", confidence: "Low", at: monthsAgo(4) },
    { domain: "reserve", direction: "Unknown", confidence: "InsufficientData", at: monthsAgo(15) },
    { domain: "conditions", direction: "Stable", confidence: "Moderate", at: monthsAgo(15) },
  ];
  for (const h of mariamHistory) {
    await prisma.domainAssessment.create({
      data: { userId: "u_mariam", domain: h.domain, direction: h.direction, confidence: h.confidence, computedAt: h.at },
    });
  }
  // Sara: counselling already requested and confirmed (shows the tracker mid-path).
  const saraCounsel = await prisma.careAction.findFirst({
    where: { userId: "u_sara", type: "Counsel" },
    orderBy: { suggestedAt: "asc" },
  });
  if (saraCounsel) {
    await prisma.careAction.update({
      where: { id: saraCounsel.id },
      data: {
        suggestedAt: daysAgo(21),
        state: "Confirmed",
        requestedAt: daysAgo(18),
        confirmedAt: daysAgo(15),
        scheduledFor: new Date(now.getTime() + 6 * 86_400_000),
      },
    });
  }
  // Omar: a previous clinician review exists.
  await prisma.clinicianReview.create({
    data: {
      patientId: "u_omar",
      clinicianId: "u_layla",
      decision: "Modify",
      reason: "Repeat HbA1c before metabolic referral",
      note: "Discussed smoking support; patient open to it.",
      createdAt: daysAgo(40),
    },
  });
  // Some prior audit so logs are not empty.
  await prisma.auditEvent.createMany({
    data: [
      { actorId: "u_layla", actorRole: "clinician", subjectId: "u_omar", type: "View", purpose: "ClinicianReview", resource: "one-pager", createdAt: daysAgo(40) },
      { actorId: "u_mariam", actorRole: "patient", subjectId: "u_mariam", type: "ConsentChange", purpose: "PersonalView", resource: "source:DeviceMock", detail: "revoked", createdAt: monthsAgo(5) },
      { actorId: null, actorRole: "system", subjectId: "u_mariam", type: "Import", purpose: "PersonalView", resource: "import:MalaffiMock", detail: "4 observations", createdAt: monthsAgo(2) },
      { actorId: "u_fatima", actorRole: "patient", subjectId: "u_fatima", type: "ConsentChange", purpose: "ClinicianReview", resource: "recipient:Clinician", detail: "revoked", createdAt: monthsAgo(5) },
    ],
  });
  await prisma.coupleLink.create({
    data: {
      partnerAId: "u_mariam",
      partnerBId: "u_omar",
      scopesA: JSON.stringify(["cycle", "lifestyle"] satisfies Domain[]),
      scopesB: JSON.stringify(["male", "lifestyle"] satisfies Domain[]),
    },
  });
}

export async function seedStaff(prisma: PrismaClient) {
  await prisma.user.create({
    data: {
      id: "u_layla",
      role: "clinician",
      name: "Dr Layla Al Mansoori",
      nameAr: "د. ليلى المنصوري",
      sex: "female",
      birthYear: 1980,
      nationality: "Emirati",
      language: "en",
      hue: 200,
    },
  });
  await prisma.user.create({
    data: {
      id: "u_admin",
      role: "admin",
      name: "Health-system view",
      nameAr: "عرض النظام الصحي",
      sex: "female",
      birthYear: 1985,
      nationality: "Emirati",
      language: "en",
      hue: 260,
    },
  });
  await seedJourneyUser(prisma, "female");
}

/** Blank synthetic person for the judge onboarding journey. */
export async function seedJourneyUser(prisma: PrismaClient, sex: Sex = "female") {
  const now = new Date();
  await prisma.user.upsert({
    where: { id: JOURNEY_USER_ID },
    create: {
      id: JOURNEY_USER_ID,
      role: "patient",
      name: "Guest",
      nameAr: "زائر",
      sex,
      birthYear: now.getFullYear() - 30,
      nationality: "Emirati",
      language: "en",
      intention: "PreferNotToSay",
      hue: 28,
      isDemo: true,
    },
    update: {
      sex,
      birthYear: now.getFullYear() - 30,
      intention: "PreferNotToSay",
      name: sex === "female" ? "Guest" : "Guest",
      nameAr: "زائر",
    },
  });
  await prisma.healthProfile.upsert({
    where: { userId: JOURNEY_USER_ID },
    create: {
      userId: JOURNEY_USER_ID,
      conditions: "[]",
      familyHistory: "[]",
      medications: "[]",
      completed: "[]",
    },
    update: {
      conditions: "[]",
      familyHistory: "[]",
      medications: "[]",
      completed: "[]",
    },
  });
}

/** Wipe journey patient data so a new demo run starts empty. */
export async function resetJourneyUser(prisma: PrismaClient, sex: Sex = "female") {
  await prisma.observation.deleteMany({ where: { userId: JOURNEY_USER_ID } });
  await prisma.domainAssessment.deleteMany({ where: { userId: JOURNEY_USER_ID } });
  await prisma.careAction.deleteMany({ where: { userId: JOURNEY_USER_ID } });
  await prisma.consentGrant.deleteMany({ where: { subjectId: JOURNEY_USER_ID } });
  await prisma.clinicianReview.deleteMany({ where: { patientId: JOURNEY_USER_ID } });
  await prisma.teachBackResponse.deleteMany({ where: { userId: JOURNEY_USER_ID } });
  await prisma.integrationEvent.deleteMany({ where: { userId: JOURNEY_USER_ID } });
  await seedJourneyUser(prisma, sex);
}

/**
 * Put the four story personas back to their seeded state. Everything that
 * hangs off a User cascades on delete; staff, data sources and the cohort
 * are untouched.
 */
export async function resetPersonas(prisma: PrismaClient, now: Date) {
  await prisma.user.deleteMany({ where: { id: { in: [...PERSONA_IDS] } } });
  for (const p of personaSpecs(now)) await seedPersona(prisma, p, now);
  await seedNarrativeHistory(prisma, now);
}
