// The simulated pilot behind the evidence and safety report. Every number here
// comes from synthetic residents and stated assumptions; it shows the shape of
// the evaluation a real pilot would run, not a result.

import type { Group, Language, Resident, Sex } from "./model";
import { population } from "./population";
import { chance, logNormal, normal, rng, seedFrom, type Rng } from "./random";
import { ALL_SOURCES, RULES, signalsFor, visibleRecord, type SignalCode } from "./signals";

/** Groups smaller than this are never shown. */
export const MIN_GROUP = 10;

export type Decision = "Accept" | "Modify" | "Override";

interface Outcome {
  group: Group;
  sex: Sex;
  language: Language;
  ageBand: string;
  /** "YYYY-MM" of the check where the signal was raised */
  month: string;
  codes: SignalCode[];
  viewed: boolean;
  requested: boolean;
  attended: boolean;
  /** days from signal to counselling with Masar; null if it never happened */
  masarDays: number | null;
  /** days from the same moment to first counselling under usual care; null = not within five years */
  usualDays: number | null;
  decision: Decision | null;
  knowledgeBefore: number;
  knowledgeAfter: number;
  sure: number | null;
  anxietyBefore: number;
  anxietyAfter: number;
}

const AGREE: Record<SignalCode, number> = {
  PERIOD_SYMPTOMS: 0.84,
  MALE_STEROIDS: 0.9,
  MALE_HISTORY: 0.8,
  CANCER_BEFORE_TREATMENT: 0.97,
  SEMEN_BELOW_REFERENCE: 0.9,
  AMH_FALL: 0.85,
  CONDITION_PLANS: 0.82,
  FAMILY_EARLY_MENOPAUSE: 0.8,
  AMH_LOW: 0.8,
  AGE35_LATER: 0.78,
  CYCLE_IRREGULAR: 0.74,
  MALE_LIFESTYLE: 0.7,
  UNDERWEIGHT_PLANS: 0.76,
};

function ageBand(age: number): string {
  if (age < 25) return "18–24";
  if (age < 30) return "25–29";
  if (age < 35) return "30–34";
  if (age < 40) return "35–39";
  return "40–45";
}

function usualCare(r: Rng, p: Resident, urgent: boolean): number | null {
  if (urgent) return chance(r, 0.4) ? null : Math.round(logNormal(r, 14, 0.5));
  // A minority seek advice early on their own, more often the closer they are to trying.
  const early = { TryingNow: 0.25, TryingSoon: 0.15, MaybeLater: 0.05 }[p.intention as string] ?? 0.02;
  if (chance(r, early)) return Math.round(logNormal(r, 180, 0.5));
  switch (p.intention) {
    case "TryingNow":
      return Math.round(365 + logNormal(r, 60, 0.6)); // after a year of trying
    case "TryingSoon":
      return Math.round(545 + logNormal(r, 60, 0.6));
    case "MaybeLater":
      return Math.round(365 * (2 + r() * 4) + 365);
    default:
      return chance(r, 0.7) ? null : Math.round(365 * (5 + r()));
  }
}

function binomial(r: Rng, n: number, p: number): number {
  let k = 0;
  for (let i = 0; i < n; i++) if (r() < p) k++;
  return k;
}

function simulate(p: Resident): Outcome | null {
  const signals = signalsFor(visibleRecord(p, ALL_SOURCES));
  if (!signals.length) return null;
  const r = rng(seedFrom(p.id));
  const codes = signals.map((s) => s.code);
  const urgent = codes.some((c) => RULES[c].urgency === "urgent");
  // Assumed barriers: languages Masar does not yet speak, and men, request less and later.
  const unsupported = p.language !== "ar" && p.language !== "en";
  const barrier = (unsupported ? 1.8 : 1) * (p.sex === "male" ? 1.3 : 1);
  const viewed = chance(r, unsupported ? 0.7 : 0.88);
  const requested = viewed && chance(r, urgent ? 0.95 : (unsupported ? 0.5 : 0.74) * (p.sex === "male" ? 0.8 : 1));
  const attended = requested && chance(r, urgent ? 0.95 : 0.82);
  const masarDays = attended
    ? Math.round(urgent ? logNormal(r, 2, 0.4) + logNormal(r, 4, 0.4) : logNormal(r, 7 * barrier, 0.6) + logNormal(r, 16, 0.5))
    : null;
  const agree = AGREE[codes[0]];
  const decision: Decision | null = requested ? (chance(r, agree) ? "Accept" : chance(r, 0.6) ? "Modify" : "Override") : null;
  const anxietyBefore = Math.round(Math.min(80, Math.max(20, normal(r, 38, 8))));
  return {
    group: p.group,
    month: p.touchpoint.at.slice(0, 7),
    sex: p.sex,
    language: p.language,
    ageBand: ageBand(p.age),
    codes,
    viewed,
    requested,
    attended,
    masarDays,
    usualDays: usualCare(r, p, urgent),
    decision,
    knowledgeBefore: binomial(r, 3, 0.45),
    knowledgeAfter: binomial(r, 3, attended ? 0.82 : viewed ? 0.55 : 0.45),
    sure: attended ? (chance(r, 0.8) ? 4 : 3) : null,
    anxietyBefore,
    anxietyAfter: Math.round(Math.min(80, Math.max(20, normal(r, anxietyBefore + (attended ? -1.5 : 0.5), 4)))),
  };
}

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export interface GroupRow {
  label: string;
  n: number;
  requestedPct: number;
  medianDays: number | null;
  suppressed: boolean;
}

export interface Report {
  population: number;
  optedIn: number;
  signalled: number;
  funnel: { label: string; n: number }[];
  withinDays: { label: string; masar: number; usual: number }[];
  medianMasarDays: number | null;
  medianUsualDays: number | null;
  rules: { code: SignalCode; title: string; n: number; agreePct: number; acceptPct: number; modifyPct: number; overridePct: number; medianDays: number | null }[];
  /** share counselled by each day after the signal, with Masar and under usual care */
  curve: { day: number; masar: number; usual: number }[];
  /** signals raised per month */
  monthly: { month: string; signals: number; asked: number }[];
  equity: { dimension: string; rows: GroupRow[] }[];
  knowledge: { before: number; after: number };
  surePct: number;
  anxiety: { before: number; after: number };
  falseReassurance: { pct: number; ofN: number };
  referralCompletionPct: number;
  /** groups who may benefit from earlier advice, one per reason Masar gives */
  cohorts: Cohort[];
}

export interface Cohort {
  code: SignalCode;
  title: string;
  /** people with this reason (any position) */
  n: number;
  /** of them, how many have not yet had a conversation */
  notYet: number;
  askedPct: number;
  /** the largest group within it that asks least, or null when every group is small */
  leastReached: { label: string; askedPct: number; n: number } | null;
}

function groupRows<K extends string>(outcomes: Outcome[], keyOf: (o: Outcome) => K, label: (k: K) => string): GroupRow[] {
  const by = new Map<K, Outcome[]>();
  for (const o of outcomes) by.set(keyOf(o), [...(by.get(keyOf(o)) ?? []), o]);
  return [...by.entries()]
    .map(([k, os]) => {
      const suppressed = os.length < MIN_GROUP;
      return {
        label: label(k),
        n: os.length,
        requestedPct: suppressed ? 0 : pct(os.filter((o) => o.requested).length, os.length),
        medianDays: suppressed ? null : median(os.flatMap((o) => (o.masarDays === null ? [] : [o.masarDays]))),
        suppressed,
      };
    })
    .sort((a, b) => b.n - a.n);
}

let cached: Report | null = null;

export function report(labels: {
  group: (g: Group) => string;
  language: (l: Language) => string;
}): Report {
  if (cached) return cached;
  const people = population().filter((p) => !p.hero);
  const opted = people.filter((p) => p.optedIn);
  const outcomes = opted.map(simulate).filter((o): o is Outcome => o !== null);
  const signalledIds = new Set(opted.filter((p) => signalsFor(visibleRecord(p, ALL_SOURCES)).length).map((p) => p.id));

  const within = (days: number) => ({
    masar: pct(outcomes.filter((o) => o.masarDays !== null && o.masarDays <= days).length, outcomes.length),
    usual: pct(outcomes.filter((o) => o.usualDays !== null && o.usualDays <= days).length, outcomes.length),
  });

  const ruleCodes = Object.keys(RULES) as SignalCode[];
  const quiet = opted.filter((p) => !signalledIds.has(p.id));
  const laterNeeded = quiet.filter((p) => {
    const r = rng(seedFrom(`fr-${p.id}`));
    return chance(r, p.readings.length < 3 ? 0.016 : 0.006);
  }).length;

  cached = {
    population: people.length,
    optedIn: opted.length,
    signalled: outcomes.length,
    funnel: [
      { label: "Signal raised", n: outcomes.length },
      { label: "Opened and read", n: outcomes.filter((o) => o.viewed).length },
      { label: "Asked for a conversation", n: outcomes.filter((o) => o.requested).length },
      { label: "Counselling attended", n: outcomes.filter((o) => o.attended).length },
    ],
    withinDays: [
      { label: "Within 30 days", ...within(30) },
      { label: "Within 90 days", ...within(90) },
      { label: "Within 1 year", ...within(365) },
    ],
    medianMasarDays: median(outcomes.flatMap((o) => (o.masarDays === null ? [] : [o.masarDays]))),
    medianUsualDays: median(outcomes.flatMap((o) => (o.usualDays === null ? [] : [o.usualDays]))),
    rules: ruleCodes
      .map((code) => {
        const os = outcomes.filter((o) => o.codes[0] === code);
        const decided = os.filter((o) => o.decision);
        return {
          code,
          title: RULES[code].title,
          n: os.length,
          agreePct: pct(decided.filter((o) => o.decision !== "Override").length, decided.length),
          acceptPct: pct(decided.filter((o) => o.decision === "Accept").length, decided.length),
          modifyPct: pct(decided.filter((o) => o.decision === "Modify").length, decided.length),
          overridePct: pct(decided.filter((o) => o.decision === "Override").length, decided.length),
          medianDays: median(os.flatMap((o) => (o.masarDays === null ? [] : [o.masarDays]))),
        };
      })
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n),
    equity: [
      { dimension: "Nationality group", rows: groupRows(outcomes, (o) => o.group, labels.group) },
      { dimension: "Sex", rows: groupRows(outcomes, (o) => o.sex, (s) => (s === "female" ? "Women" : "Men")) },
      { dimension: "Language", rows: groupRows(outcomes, (o) => o.language, labels.language) },
      { dimension: "Age", rows: groupRows(outcomes, (o) => o.ageBand, (a) => a).sort((a, b) => a.label.localeCompare(b.label)) },
    ],
    knowledge: {
      before: Math.round((avg(outcomes.map((o) => o.knowledgeBefore)) / 3) * 100),
      after: Math.round((avg(outcomes.filter((o) => o.attended).map((o) => o.knowledgeAfter)) / 3) * 100),
    },
    surePct: pct(outcomes.filter((o) => o.sure === 4).length, outcomes.filter((o) => o.sure !== null).length),
    anxiety: {
      before: Math.round(avg(outcomes.filter((o) => o.attended).map((o) => o.anxietyBefore))),
      after: Math.round(avg(outcomes.filter((o) => o.attended).map((o) => o.anxietyAfter))),
    },
    falseReassurance: { pct: Math.round((laterNeeded / Math.max(1, quiet.length)) * 1000) / 10, ofN: quiet.length },
    curve: [0, 7, 14, 30, 45, 60, 90, 120, 180, 270, 365, 545, 730].map((day) => ({
      day,
      masar: pct(outcomes.filter((o) => o.masarDays !== null && o.masarDays <= day).length, outcomes.length),
      usual: pct(outcomes.filter((o) => o.usualDays !== null && o.usualDays <= day).length, outcomes.length),
    })),
    monthly: [...new Set(outcomes.map((o) => o.month))]
      .sort()
      .slice(-11)
      .map((month) => ({
        month,
        signals: outcomes.filter((o) => o.month === month).length,
        asked: outcomes.filter((o) => o.month === month && o.requested).length,
      })),
    referralCompletionPct: pct(outcomes.filter((o) => o.attended).length, outcomes.filter((o) => o.requested).length),
    cohorts: ruleCodes
      .map((code) => {
        const os = outcomes.filter((o) => o.codes.includes(code));
        const groups = [
          ...groupRows(os, (o) => o.group, (g) => `${labels.group(g)} residents`),
          ...groupRows(os, (o) => o.language, (l) => `${labels.language(l)} speakers`),
          ...groupRows(os, (o) => o.sex, (s) => (s === "female" ? "Women" : "Men")),
        ].filter((g) => !g.suppressed);
        const least = groups.sort((a, b) => a.requestedPct - b.requestedPct)[0];
        return {
          code,
          title: RULES[code].title,
          n: os.length,
          notYet: os.filter((o) => !o.attended).length,
          askedPct: pct(os.filter((o) => o.requested).length, os.length),
          leastReached: least ? { label: least.label, askedPct: least.requestedPct, n: least.n } : null,
        };
      })
      .filter((c) => c.n >= MIN_GROUP)
      .sort((a, b) => b.notYet - a.notYet),
  };
  return cached;
}
