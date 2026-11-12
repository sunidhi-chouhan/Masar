// Plain-language descriptions of when each rule fires, for the public
// "How Masar decides" page. Each one restates the condition coded in
// signalsFor() (lib/signals.ts) and adds nothing. If a rule changes there,
// change its sentence here; scripts/check-path.ts checks every rule has one.

import type { ReadingCode } from "./model";
import type { SignalCode } from "./signals";

export const TRIGGER: Record<SignalCode, string> = {
  FAMILY_EARLY_MENOPAUSE:
    "Women aged 28 or over whose mother or sister went through menopause before 45, and who are not trying for children soon.",
  AMH_FALL: "Women whose egg-reserve hormone (AMH) fell by 25% or more between their last two results, taken at least six months apart.",
  AMH_LOW: "Women whose latest egg-reserve hormone (AMH) result is below 1.0 ng/mL.",
  AGE35_LATER: "Women aged 35 or over who may want children later and have no egg-reserve test on record.",
  UNDERWEIGHT_PLANS: "Women whose latest weight for height (BMI) is below 18.5 and who may want children.",
  CYCLE_IRREGULAR:
    "Women who tell Masar their periods are irregular or have stopped for 3 months or more, or when at least 2 of their last 6 recorded cycles were outside 21–35 days.",
  PERIOD_SYMPTOMS: "Women who tell Masar their periods are very painful or very heavy.",
  CONDITION_PLANS:
    "Anyone with PCOS, an underactive thyroid, endometriosis or diabetes on record who may want children within the next few years.",
  CANCER_BEFORE_TREATMENT: "Anyone aged 18 to 42 with a new cancer diagnosis on record, before treatment has started.",
  MALE_LIFESTYLE: "Men who smoke, whose weight for height (BMI) is 30 or more, and who are trying for children now or soon.",
  MALE_STEROIDS: "Men who tell Masar they use, or have used, testosterone or steroids.",
  MALE_HISTORY: "Men who tell Masar about a past problem that can affect sperm, unless they are not planning children.",
  SEMEN_BELOW_REFERENCE: "Men whose latest sperm count is below 16 million per mL.",
};

/** Where each "meaningful change" threshold comes from. Uncited ones say so. */
export const MEASURE_BASIS: Record<ReadingCode, string> = {
  amh: "The same threshold as the AMH rule above, which cites ASRM (2020).",
  cycle_length: "The 21–35 day range follows FIGO (2018). The 7-day shift is Masar's own rule, waiting for clinical review.",
  bmi: "Masar's own rule, waiting for clinical review.",
  hba1c: "Masar's own rule, waiting for clinical review. Masar draws no conclusion about fertility from HbA1c.",
  semen_concentration: "Follows the WHO laboratory manual (2021): one result is never enough to describe a change.",
  sleep_hours: "Masar's own rule, waiting for clinical review. Shown for wellbeing only.",
  tsh: "Shown only against the range printed by the lab. Masar applies no threshold of its own.",
};
