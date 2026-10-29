import type { Confidence, ObsCode, ObservationLite } from "@/lib/domain/types";

export const MONTH_MS = 1000 * 60 * 60 * 24 * 30.44;

export function monthsBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / MONTH_MS;
}

export function isFresh(date: Date, now: Date, months: number): boolean {
  return monthsBetween(date, now) <= months;
}

export function series(obs: ObservationLite[], code: ObsCode): ObservationLite[] {
  return obs
    .filter((o) => o.code === code)
    .slice()
    .sort((a, b) => a.effectiveAt.getTime() - b.effectiveAt.getTime());
}

export function latest(obs: ObservationLite[], code: ObsCode): ObservationLite | undefined {
  const s = series(obs, code);
  return s[s.length - 1];
}

export function latestNum(obs: ObservationLite[], code: ObsCode): number | undefined {
  const v = latest(obs, code)?.valueNum;
  return v === null || v === undefined ? undefined : v;
}

export function latestText(obs: ObservationLite[], code: ObsCode): string | undefined {
  return latest(obs, code)?.valueText ?? undefined;
}

/** Value closest to `monthsAgo` months before `now`, at least `minGapMonths` older than the latest. */
export function earlierNum(
  obs: ObservationLite[],
  code: ObsCode,
  now: Date,
  minGapMonths: number,
): number | undefined {
  const s = series(obs, code).filter((o) => o.valueNum !== null);
  if (s.length < 2) return undefined;
  const last = s[s.length - 1];
  const candidates = s.filter(
    (o) => monthsBetween(o.effectiveAt, last.effectiveAt) >= minGapMonths && o !== last,
  );
  const pick = candidates[candidates.length - 1];
  void now;
  return pick?.valueNum ?? undefined;
}

export function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Confidence is about how much we can see, never about how "good" things are.
 * - no data points at all -> InsufficientData
 * - data but nothing fresh -> Low
 * - fresh points >= 4 (and a key measurement present where relevant) -> High
 * - fresh points >= 2 -> Moderate
 */
export function confidenceFrom(points: number, freshPoints: number, keyPresent = true): Confidence {
  if (points === 0) return "InsufficientData";
  if (freshPoints === 0) return "Low";
  if (keyPresent && freshPoints >= 4) return "High";
  if (freshPoints >= 2) return "Moderate";
  return "Low";
}

export function fmtDate(d: Date | string | undefined): string | undefined {
  if (!d) return undefined;
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export function fmtVal(v: number | undefined, unit: string | null | undefined, digits = 1): string | undefined {
  if (v === undefined) return undefined;
  const n = Number.isInteger(v) ? String(v) : v.toFixed(digits);
  return unit && unit !== "text" ? `${n} ${unit}` : n;
}
