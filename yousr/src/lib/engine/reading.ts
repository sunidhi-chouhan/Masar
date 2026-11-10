// How a DomainResult is *read* on screen. The engine's `direction` mixes two
// questions: "how is this moving over time?" and "is this worth a clinical
// conversation?". People need those answered separately, so this module splits
// them without changing what the engine computes or stores.

import type { DomainResult } from "@/lib/domain/types";
import type { MeasureRow } from "./trajectory";
import { THRESHOLDS } from "./rules";

/** Movement over time only. Never a judgement about whether it matters. */
export type Trend = "Improving" | "Steady" | "Changing" | "NotEnough" | "NotTracked";

/**
 * When the engine says "Discuss", the trend underneath is still knowable from
 * what the rules observed. Keys not listed here have no trend to report.
 */
const TREND_BY_OBSERVED: Record<string, Trend> = {
  cycle_absent: "Changing",
  cycle_persistent_irregular: "Steady",
  cycle_newly_irregular: "Changing",
  cycle_regularising: "Improving",
  cycle_regular: "Steady",
  reserve_amh_falling: "Changing",
  reserve_amh_typical: "Steady",
  metabolic_bmi_down: "Improving",
  metabolic_bmi_up: "Changing",
  metabolic_bmi_steady: "Steady",
  metabolic_hba1c_down: "Improving",
  male_quit_smoking: "Improving",
  male_lifestyle_shifting: "Changing",
  lifestyle_more_supportive: "Improving",
  lifestyle_fewer_supportive: "Changing",
  lifestyle_steady: "Steady",
};

export function trendOf(r: DomainResult): Trend {
  // History and conditions are background, not something that moves.
  if (r.domain === "conditions") return "NotTracked";
  if (r.confidence === "InsufficientData") return "NotEnough";
  switch (r.direction) {
    case "Improving":
      return "Improving";
    case "Stable":
      return "Steady";
    case "Shifting":
      return "Changing";
    case "Unknown":
      return "NotEnough";
    case "Discuss":
      return TREND_BY_OBSERVED[r.observedKey] ?? "NotEnough";
  }
}

export interface ClinicalFlag {
  /** trigger ids, each an i18n key under triggers.* */
  reasons: string[];
}

/** "Worth discussing" with its reasons, or null when nothing is flagged. */
export function flagOf(r: DomainResult): ClinicalFlag | null {
  if (r.direction !== "Discuss") return null;
  return { reasons: [...new Set(r.triggers)] };
}

/** Whether a difference between two readings is beyond normal variation. */
export type Variation = "normal" | "meaningful";

/**
 * Smallest change treated as meaningful, per measure. Taken from the rule
 * registry where a rule exists; measures without a rule get no verdict.
 */
const MEANINGFUL: Partial<Record<string, (prev: number, next: number) => boolean>> = {
  amh: (p, n) => p > 0 && (p - n) / p >= THRESHOLDS.reserve.amhDropForShifting,
  bmi: (p, n) => Math.abs(n - p) >= THRESHOLDS.metabolic.bmiChangeForDirection,
  hba1c: (p, n) => Math.abs(n - p) >= THRESHOLDS.metabolic.hba1cImprovement,
  sleep_hours: (p, n) => Math.abs(n - p) >= 1,
  activity_minutes_week: (p, n) => Math.abs(n - p) >= 60,
  stress_level: (p, n) => Math.abs(n - p) >= 2,
};

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function variationOf(row: MeasureRow): Variation | null {
  if (row.cycleSets) {
    const { recent, earlier } = row.cycleSets;
    if (recent.length < 3 || earlier.length < 3) return null;
    const t = THRESHOLDS.cycle;
    const outside = recent.some((v) => v < t.shortDays || v > t.longDays);
    const shift = Math.abs(mean(recent) - mean(earlier));
    return outside || shift >= t.irregularStdDays ? "meaningful" : "normal";
  }
  if (!row.comparable || !row.previous || row.previous.value === null || row.latest.value === null) return null;
  const rule = MEANINGFUL[row.code];
  if (!rule) return null;
  return rule(row.previous.value, row.latest.value) ? "meaningful" : "normal";
}
