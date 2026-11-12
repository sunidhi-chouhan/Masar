import type { ReadingCode } from "./model";
import { RULES } from "./signals";

// What each measurement is, and what it can't tell, in plain words. Shown
// next to a person's own results so a number never appears without its
// limits. Where Masar's rules already say this, their words are reused; the
// rest are short, general definitions (no thresholds of their own) and are
// listed in the implementation report for clinical review.

export interface MeasureInfo {
  what: string;
  limits: string;
}

export const MEASURE_INFO: Record<ReadingCode, MeasureInfo> = {
  amh: {
    what: "A hormone made in the ovaries. It gives a rough idea of how many eggs are left.",
    limits: RULES.AMH_FALL.cannotTell,
  },
  cycle_length: {
    what: "The days from the start of one period to the start of the next. 21 to 35 days is the usual range.",
    limits: "Cycle patterns alone never confirm ovulation or a diagnosis.",
  },
  bmi: {
    what: "Weight for height. 18.5 to 25 is the usual range.",
    limits: "It doesn't measure body fat, fitness or health on its own.",
  },
  hba1c: {
    what: "Average blood sugar over roughly the past three months.",
    limits: "Masar records blood sugar (HbA1c) and how it changes, but draws no conclusion about fertility from it.",
  },
  semen_concentration: {
    what: "How many sperm are in each millilitre of semen. The usual is 16 million or more.",
    limits: "Results vary a lot between tests; a repeat is needed before calling any change.",
  },
  sleep_hours: {
    what: "Average hours of sleep, from your phone or wearable.",
    limits: "Device estimates are approximate.",
  },
  tsh: {
    what: "A hormone that shows how hard the thyroid is being asked to work.",
    limits: "Masar doesn't interpret thyroid results. Your doctor will go through this one with you.",
  },
};
