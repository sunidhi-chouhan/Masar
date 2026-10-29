import type { Domain, ObsCode } from "@/lib/domain/types";
import { THRESHOLDS } from "./rules";

export interface Band {
  code: ObsCode;
  unit: string;
  low?: number;
  high?: number;
}

/** Which numeric reading we chart per domain, and the reference band we shade. */
export function bandFor(domain: Domain): Band | null {
  switch (domain) {
    case "cycle":
      return { code: "cycle_length", unit: "days", low: THRESHOLDS.cycle.shortDays, high: THRESHOLDS.cycle.longDays };
    case "reserve":
      return { code: "amh", unit: "ng/mL", low: THRESHOLDS.reserve.amhLowerReference };
    case "metabolic":
      return { code: "bmi", unit: "kg/m2", low: 18.5, high: 25 };
    case "male":
      return { code: "semen_concentration", unit: "M/mL", low: THRESHOLDS.male.concentration };
    case "lifestyle":
      return { code: "sleep_hours", unit: "hours", low: THRESHOLDS.lifestyle.sleepMin, high: THRESHOLDS.lifestyle.sleepMax };
    default:
      return null;
  }
}
