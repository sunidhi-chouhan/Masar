// Human-readable rule registry. Every threshold the engine uses is declared
// here so clinicians and judges can read it at /about/how-it-works.
// Values are reference points for *conversation*, never diagnostic cut-offs.

import type { Domain } from "@/lib/domain/types";

export const STALENESS_MONTHS = {
  lab: 12,
  cycle: 6,
  checkin: 3,
} as const;

export const THRESHOLDS = {
  cycle: {
    shortDays: 21,
    longDays: 35,
    irregularStdDays: 7,
    amenorrhoeaDays: 90,
    minCyclesForDirection: 3,
  },
  reserve: {
    amhLowerReference: 1.0, // ng/mL — "lower than typical, worth discussing", not a diagnosis
    amhDropForShifting: 0.25, // 25% fall between two results within 24 months
    ageForPreserveDiscussion: 35,
  },
  metabolic: {
    bmiChangeForDirection: 1.0, // kg/m2 between two readings 6+ months apart
    bmiDiscuss: 35,
    hba1cDiscuss: 6.5, // %
    hba1cRaised: 5.7,
    hba1cImprovement: 0.3,
  },
  male: {
    // WHO 2021 6th edition lower reference limits (5th centile)
    concentration: 16, // M/mL
    motility: 42, // % total motility
    volume: 1.4, // mL
    bmiForLifestyleFlag: 30,
  },
  lifestyle: {
    sleepMin: 7,
    sleepMax: 9,
    activityMinutes: 150,
    alcoholUnitsMax: 7,
    stressHigh: 6, // > 5 counts as not supportive
    stressDistress: 8,
    laughterDaysMin: 3,
    minGapDaysBetweenCheckins: 45,
  },
} as const;

export interface RuleDoc {
  id: string;
  domain: Domain | "all";
  /** Dictionary path under rules.* */
  i18nKey: string;
}

export const RULE_DOCS: RuleDoc[] = [
  { id: "R0", domain: "all", i18nKey: "r0_no_score" },
  { id: "R1", domain: "all", i18nKey: "r1_confidence" },
  { id: "R2", domain: "all", i18nKey: "r2_guard" },
  { id: "C1", domain: "cycle", i18nKey: "c1_regularity" },
  { id: "C2", domain: "cycle", i18nKey: "c2_persistent" },
  { id: "C3", domain: "cycle", i18nKey: "c3_amenorrhoea" },
  { id: "C4", domain: "cycle", i18nKey: "c4_conditions" },
  { id: "O1", domain: "reserve", i18nKey: "o1_age_only" },
  { id: "O2", domain: "reserve", i18nKey: "o2_amh" },
  { id: "O3", domain: "reserve", i18nKey: "o3_preserve" },
  { id: "M1", domain: "metabolic", i18nKey: "m1_bmi_trend" },
  { id: "M2", domain: "metabolic", i18nKey: "m2_hba1c" },
  { id: "A1", domain: "male", i18nKey: "a1_semen" },
  { id: "A2", domain: "male", i18nKey: "a2_lifestyle" },
  { id: "K1", domain: "conditions", i18nKey: "k1_intention" },
  { id: "K2", domain: "conditions", i18nKey: "k2_pregnant" },
  { id: "L1", domain: "lifestyle", i18nKey: "l1_supportive" },
  { id: "L2", domain: "lifestyle", i18nKey: "l2_distress" },
];

export const TRIGGERS = {
  T1_cycle_persistent: "T1_cycle_persistent",
  T1b_amenorrhoea: "T1b_amenorrhoea",
  T2_condition_intention: "T2_condition_intention",
  T3_age35_no_reserve: "T3_age35_no_reserve",
  T4_semen_below_reference: "T4_semen_below_reference",
  T4b_male_metabolic_smoking: "T4b_male_metabolic_smoking",
  T5_family_history: "T5_family_history",
  T6_pregnant_concern: "T6_pregnant_concern",
  T7_distress: "T7_distress",
  TR_amh_low: "TR_amh_low",
  TM_hba1c: "TM_hba1c",
  TM_bmi: "TM_bmi",
} as const;
export type TriggerId = (typeof TRIGGERS)[keyof typeof TRIGGERS];
