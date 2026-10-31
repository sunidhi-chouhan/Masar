import "server-only";
import { prisma } from "@/lib/db/prisma";
import { ageFromBirthYear, parseJsonArray } from "@/lib/domain/types";

export const K_ANONYMITY = 10;

export interface Funnel {
  signal: number;
  counselSuggested: number;
  counselRequested: number;
  counselAttended: number;
  referralCompleted: number;
}

export interface HeatCell {
  ageBand: string;
  condition: string;
  total: number | null; // null = suppressed
  counselled: number | null;
}

export interface EquityRow {
  group: string;
  value: string;
  total: number | null;
  signalRate: number | null;
  counselledRate: number | null;
  medianDaysToCounsel: number | null;
}

export interface PopulationReport {
  consentedCount: number;
  excludedCount: number;
  funnel: Funnel;
  heatmap: HeatCell[];
  equity: EquityRow[];
  falseReassurance: {
    /** Domain was Stable in software then later Discuss (trajectory drift). */
    stableThenDiscuss: number;
    evaluated: number;
    /** Software showed Stable and a clinician later Override/Modify — stronger brief definition. */
    stableThenClinicianOverride: number;
    overrideEvaluated: number;
  };
  medianDaysSignalToRequest: number | null;
  medianDaysSignalToAttend: number | null;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function ageBand(age: number): string {
  if (age < 25) return "18-24";
  if (age < 30) return "25-29";
  if (age < 35) return "30-34";
  if (age < 40) return "35-39";
  return "40+";
}

/** Coarse buckets keep heatmap cells above the k threshold without losing the story. */
export const CONDITION_BUCKETS = ["pcos", "thyroid", "metabolic", "other", "none"] as const;
function conditionBucket(code: string): (typeof CONDITION_BUCKETS)[number] {
  if (code === "pcos") return "pcos";
  if (code === "hypothyroidism" || code === "hyperthyroidism") return "thyroid";
  if (code === "prediabetes" || code === "type2_diabetes" || code === "hypertension") return "metabolic";
  return "other";
}

function suppress(n: number): number | null {
  return n < K_ANONYMITY ? null : n;
}

/**
 * Aggregates only over people with an active PopulationAnalytics grant.
 * Cells smaller than K_ANONYMITY are suppressed; no identifiers leave here.
 */
export async function populationReport(actor: { userId: string; role: string }): Promise<PopulationReport> {
  // Aggregate workspace: administrators only, enforced here as well as on the page.
  if (actor.role !== "admin") throw new Error("FORBIDDEN");
  const consented = await prisma.consentGrant.findMany({
    where: { recipientRole: "Analytics", purpose: "PopulationAnalytics", status: "active" },
    select: { subjectId: true },
  });
  const ids = [...new Set(consented.map((c) => c.subjectId))];
  const totalPeople = await prisma.user.count({ where: { role: { in: ["patient", "cohort"] } } });
  const users = await prisma.user.findMany({
    where: { id: { in: ids }, role: { in: ["patient", "cohort"] } },
    include: {
      profile: true,
      assessments: { orderBy: { computedAt: "asc" } },
      careActions: true,
      reviewsAsPatient: { orderBy: { createdAt: "asc" } },
    },
  });

  const funnel: Funnel = { signal: 0, counselSuggested: 0, counselRequested: 0, counselAttended: 0, referralCompleted: 0 };
  const daysToRequest: number[] = [];
  const daysToAttend: number[] = [];
  let stableThenDiscuss = 0;
  let evaluated = 0;
  let stableThenClinicianOverride = 0;
  let overrideEvaluated = 0;
  const heat = new Map<string, { total: number; counselled: number }>();
  const equityBuckets = new Map<string, { total: number; signal: number; counselled: number; days: number[] }>();

  for (const u of users) {
    const latestByDomain = new Map<string, (typeof u.assessments)[number]>();
    for (const a of u.assessments) latestByDomain.set(a.domain, a);
    const latest = [...latestByDomain.values()];
    const hasSignal = latest.some((a) => a.direction === "Discuss" || a.direction === "Shifting");
    const firstSignal = u.assessments.find((a) => a.direction === "Discuss" || a.direction === "Shifting");
    const counsel = u.careActions.filter((a) => a.type === "Counsel" || a.type === "PreserveDiscuss");
    const refer = u.careActions.filter((a) => a.type === "Refer" || a.type === "TestDiscuss");
    const requested = counsel.find((a) => a.requestedAt);
    const attended = counsel.find((a) => a.attendedAt);

    if (hasSignal) funnel.signal++;
    if (counsel.length) funnel.counselSuggested++;
    if (requested) funnel.counselRequested++;
    if (attended) funnel.counselAttended++;
    if (refer.some((a) => a.state === "Attended" || a.state === "OutcomeRecorded")) funnel.referralCompleted++;

    if (firstSignal && requested?.requestedAt) {
      daysToRequest.push(Math.max(0, Math.round((requested.requestedAt.getTime() - firstSignal.computedAt.getTime()) / 86_400_000)));
    }
    if (firstSignal && attended?.attendedAt) {
      daysToAttend.push(Math.max(0, Math.round((attended.attendedAt.getTime() - firstSignal.computedAt.getTime()) / 86_400_000)));
    }

    // false reassurance (trajectory): Stable later contradicted by Discuss
    for (const domain of latestByDomain.keys()) {
      const seq = u.assessments.filter((a) => a.domain === domain);
      if (seq.length >= 2) {
        evaluated++;
        if (seq.some((a, i) => a.direction === "Stable" && seq.slice(i + 1).some((b) => b.direction === "Discuss"))) {
          stableThenDiscuss++;
        }
      }
    }

    // false reassurance (clinician): software Stable then clinician Override/Modify
    const hadStable = u.assessments.some((a) => a.direction === "Stable");
    if (hadStable && u.reviewsAsPatient.length) {
      overrideEvaluated++;
      if (u.reviewsAsPatient.some((r) => r.decision === "Override" || r.decision === "Modify")) {
        stableThenClinicianOverride++;
      }
    }

    const age = ageFromBirthYear(u.birthYear);
    const conditions = parseJsonArray<string>(u.profile?.conditions);
    const condKeys = conditions.length ? [...new Set(conditions.map(conditionBucket))] : ["none"];
    for (const c of condKeys) {
      const key = `${ageBand(age)}|${c}`;
      const cell = heat.get(key) ?? { total: 0, counselled: 0 };
      cell.total++;
      if (attended) cell.counselled++;
      heat.set(key, cell);
    }

    const groups: [string, string][] = [
      ["nationality", u.nationality],
      ["language", u.language],
      ["sex", u.sex],
      ["intention", u.intention],
      ["ageBand", ageBand(age)],
    ];
    for (const [g, v] of groups) {
      const key = `${g}|${v}`;
      const b = equityBuckets.get(key) ?? { total: 0, signal: 0, counselled: 0, days: [] };
      b.total++;
      if (hasSignal) b.signal++;
      if (attended) b.counselled++;
      if (firstSignal && requested?.requestedAt) {
        b.days.push(Math.round((requested.requestedAt.getTime() - firstSignal.computedAt.getTime()) / 86_400_000));
      }
      equityBuckets.set(key, b);
    }
  }

  const heatmap: HeatCell[] = [...heat.entries()].map(([key, cell]) => {
    const [ageBandKey, condition] = key.split("|");
    const total = suppress(cell.total);
    return { ageBand: ageBandKey, condition, total, counselled: total === null ? null : cell.counselled };
  });

  const equity: EquityRow[] = [...equityBuckets.entries()].map(([key, b]) => {
    const [group, value] = key.split("|");
    const total = suppress(b.total);
    return {
      group,
      value,
      total,
      signalRate: total === null ? null : Math.round((b.signal / b.total) * 100),
      counselledRate: total === null || b.signal === 0 ? null : Math.round((b.counselled / b.signal) * 100),
      medianDaysToCounsel: total === null ? null : median(b.days),
    };
  });

  return {
    consentedCount: users.length,
    excludedCount: totalPeople - users.length,
    funnel,
    heatmap,
    equity,
    falseReassurance: {
      stableThenDiscuss,
      evaluated,
      stableThenClinicianOverride,
      overrideEvaluated,
    },
    medianDaysSignalToRequest: median(daysToRequest),
    medianDaysSignalToAttend: median(daysToAttend),
  };
}
