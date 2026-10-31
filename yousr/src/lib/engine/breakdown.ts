// Plain-language breakdown of the metabolic domain into the four things a
// person can actually check. Pure: it only reports what is recorded and how
// recent it is. It never combines categories into a score.
import type { DataSourceId, Domain, ObsCode, ObservationLite } from "@/lib/domain/types";
import { STALENESS_MONTHS } from "./rules";

/** Which readings belong to which area of the trajectory. */
export const DOMAIN_CODES: Record<Domain, ObsCode[]> = {
  cycle: ["cycle_length", "cycle_regular", "period_absent_days"],
  reserve: ["amh", "afc", "fsh"],
  metabolic: ["bmi", "hba1c", "fasting_glucose", "bp_systolic", "activity_minutes_week", "health_age"],
  male: ["semen_concentration", "semen_motility", "semen_volume", "heat_exposure", "bmi"],
  conditions: ["tsh"],
  lifestyle: ["sleep_hours", "activity_minutes_week", "smoking", "alcohol_units_week", "stress_level", "laughter_days_week"],
};

/** Where a person can add the thing an "unknown" says is missing. Only real screens. */
export const MISSING_ADD_PATH: Record<string, string> = {
  cycle_dates: "/profile?step=cycle",
  amh: "/profile?step=labs",
  afc: "/profile?step=labs",
  hba1c: "/profile?step=labs",
  bp: "/profile?step=labs",
  tsh: "/profile?step=labs",
  semen_analysis: "/profile?step=labs",
  heat_exposure: "/profile?step=lifestyle",
  sleep: "/profile?step=lifestyle",
  activity: "/profile?step=lifestyle",
  smoking: "/profile?step=lifestyle",
  stress: "/profile?step=lifestyle",
  laughter: "/profile?step=lifestyle",
  conditions_step: "/profile?step=conditions",
  conditions_detail: "/profile?step=conditions",
  medications: "/profile?step=medications",
};

export type CategoryStatus = "available" | "outdated" | "single" | "missing";
export type MetabolicCategoryId = "weight" | "sugar" | "pressure" | "activity";

export interface MetabolicCategory {
  id: MetabolicCategoryId;
  code: ObsCode;
  status: CategoryStatus;
  /** number of numeric readings for this code, regardless of age */
  count: number;
  latest: { value: number; unit: string | null; at: string; source: DataSourceId } | null;
  staleMonths: number;
  /** where a person can add this themselves */
  addHref: "/profile?step=labs" | "/profile?step=lifestyle";
}

const SPEC: { id: MetabolicCategoryId; code: ObsCode; staleMonths: number; addHref: MetabolicCategory["addHref"] }[] = [
  { id: "weight", code: "bmi", staleMonths: STALENESS_MONTHS.lab, addHref: "/profile?step=labs" },
  { id: "sugar", code: "hba1c", staleMonths: STALENESS_MONTHS.lab, addHref: "/profile?step=labs" },
  { id: "pressure", code: "bp_systolic", staleMonths: STALENESS_MONTHS.lab, addHref: "/profile?step=labs" },
  { id: "activity", code: "activity_minutes_week", staleMonths: STALENESS_MONTHS.checkin, addHref: "/profile?step=lifestyle" },
];

function monthsBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (30.44 * 86_400_000);
}

export function metabolicBreakdown(obs: ObservationLite[], now: Date): MetabolicCategory[] {
  return SPEC.map((s) => {
    const rows = obs
      .filter((o) => o.code === s.code && o.valueNum !== null)
      .sort((a, b) => b.effectiveAt.getTime() - a.effectiveAt.getTime());
    const latestRow = rows[0];
    const latest = latestRow
      ? { value: latestRow.valueNum as number, unit: latestRow.unit, at: latestRow.effectiveAt.toISOString(), source: latestRow.dataSourceId }
      : null;
    let status: CategoryStatus;
    if (!latestRow) status = "missing";
    else if (monthsBetween(latestRow.effectiveAt, now) > s.staleMonths) status = "outdated";
    else if (rows.length < 2) status = "single";
    else status = "available";
    return { id: s.id, code: s.code, status, count: rows.length, latest, staleMonths: s.staleMonths, addHref: s.addHref };
  });
}
