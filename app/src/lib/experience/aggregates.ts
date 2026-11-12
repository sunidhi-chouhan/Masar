import { MIN_GROUP } from "@/lib/evidence";
import type { Resident } from "@/lib/model";
import { population } from "@/lib/population";
import { ALL_SOURCES, RULES, signalsFor, visibleRecord, type SignalCode } from "@/lib/signals";

// Counts only. Named residents are excluded. Groups under MIN_GROUP lose their
// exact size. This is not an attendance rate and not an improvement.

export interface CohortCount {
  code: SignalCode;
  n: number;
}

export interface GapCount {
  id: "women30-no-amh" | "men-trying-no-semen";
  /** null when 1–9 people would have been shown */
  n: number | null;
}

export interface EquityCell {
  dimension: "sex" | "language" | "nationality" | "age";
  key: string;
  n: number | null;
}

export interface Aggregates {
  residents: number;
  optedIn: number;
  withSignal: number;
  cohorts: CohortCount[];
  hiddenReasons: number;
  gaps: GapCount[];
  equity: EquityCell[];
  minGroup: number;
}

function shown(n: number): number | null {
  if (n === 0 || n >= MIN_GROUP) return n;
  return null;
}

function ageBand(age: number): string {
  if (age < 25) return "18–24";
  if (age < 30) return "25–29";
  if (age < 35) return "30–34";
  if (age < 40) return "35–39";
  return "40–45";
}

function cells(dimension: EquityCell["dimension"], pairs: [string, number][]): EquityCell[] {
  return pairs
    .map(([key, n]) => ({ dimension, key, n: shown(n) }))
    .sort((a, b) => (b.n ?? -1) - (a.n ?? -1));
}

let cached: Aggregates | null = null;

export function experienceAggregates(): Aggregates {
  if (cached) return cached;
  const people = population().filter((p) => !p.hero);
  const opted = people.filter((p) => p.optedIn);
  const coded = opted.map((p) => ({
    p,
    codes: signalsFor(visibleRecord(p, ALL_SOURCES)).map((s) => s.code),
  }));
  const signalled = coded.filter((row) => row.codes.length).map((row) => row.p);

  const cohorts: CohortCount[] = [];
  let hiddenReasons = 0;
  for (const code of Object.keys(RULES) as SignalCode[]) {
    const n = coded.filter((row) => row.codes.includes(code)).length;
    if (n === 0) continue;
    if (n < MIN_GROUP) hiddenReasons += 1;
    else cohorts.push({ code, n });
  }
  cohorts.sort((a, b) => b.n - a.n);

  const women = opted.filter((p) => p.sex === "female" && p.age >= 30 && !p.readings.some((r) => r.code === "amh"));
  const men = opted.filter(
    (p) => p.sex === "male" && (p.intention === "TryingSoon" || p.intention === "TryingNow") && !p.readings.some((r) => r.code === "semen_concentration"),
  );

  const tally = (list: Resident[], keyOf: (p: Resident) => string) => {
    const map = new Map<string, number>();
    for (const p of list) map.set(keyOf(p), (map.get(keyOf(p)) ?? 0) + 1);
    return [...map.entries()];
  };

  cached = {
    residents: people.length,
    optedIn: opted.length,
    withSignal: signalled.length,
    cohorts,
    hiddenReasons,
    gaps: [
      { id: "women30-no-amh", n: shown(women.length) },
      { id: "men-trying-no-semen", n: shown(men.length) },
    ],
    equity: [
      ...cells("sex", tally(signalled, (p) => p.sex)),
      ...cells("language", tally(signalled, (p) => p.language)),
      ...cells("nationality", tally(signalled, (p) => p.group)),
      ...cells("age", tally(signalled, (p) => ageBand(p.age))),
    ],
    minGroup: MIN_GROUP,
  };
  return cached;
}
