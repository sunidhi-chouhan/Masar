import {
  ageFromBirthYear,
  domainsFor,
  type Direction,
  type Domain,
  type DomainResult,
  type Driver,
  type ObservationLite,
  type ProfileLite,
  type Unknown,
} from "@/lib/domain/types";
import {
  confidenceFrom,
  earlierNum,
  fmtDate,
  fmtVal,
  isFresh,
  latest,
  latestNum,
  latestText,
  monthsBetween,
  series,
  stddev,
} from "./helpers";
import { STALENESS_MONTHS, THRESHOLDS, TRIGGERS } from "./rules";

export interface AssessInput extends ProfileLite {
  /** profile steps the person completed, e.g. ["conditions", "lifestyle"] */
  completedSteps: string[];
}

export interface AssessOptions {
  now?: Date;
}

/** Entry point: returns one DomainResult per applicable domain. */
export function assessAll(
  profile: AssessInput,
  obs: ObservationLite[],
  options: AssessOptions = {},
): DomainResult[] {
  const now = options.now ?? new Date();
  return domainsFor(profile.sex).map((domain) => assessDomain(domain, profile, obs, now));
}

export function assessDomain(
  domain: Domain,
  profile: AssessInput,
  obs: ObservationLite[],
  now: Date,
): DomainResult {
  switch (domain) {
    case "cycle":
      return assessCycle(profile, obs, now);
    case "reserve":
      return assessReserve(profile, obs, now);
    case "metabolic":
      return assessMetabolic(profile, obs, now);
    case "male":
      return assessMale(profile, obs, now);
    case "conditions":
      return assessConditions(profile, obs, now);
    case "lifestyle":
      return assessLifestyle(profile, obs, now);
  }
}

// ---------- shared driver builders ----------

function driverFromObs(
  obs: ObservationLite[],
  code: Parameters<typeof latest>[1],
  factor: string,
  modifiability: Driver["modifiability"],
  evidenceId: string,
  strength: Driver["strength"],
  note?: string,
): Driver | undefined {
  const o = latest(obs, code);
  if (!o) return undefined;
  const valueLabel =
    o.valueNum !== null && o.valueNum !== undefined
      ? fmtVal(o.valueNum, o.unit)
      : (o.valueText ?? undefined);
  return {
    factor,
    modifiability,
    evidenceId,
    strength,
    valueLabel,
    effectiveAt: fmtDate(o.effectiveAt),
    source: o.dataSourceId,
    note,
  };
}

function ageDriver(profile: ProfileLite, evidenceId = "ev-acog-age-2014"): Driver {
  return {
    factor: "age",
    modifiability: "NonModifiable",
    evidenceId,
    strength: "Strong",
    valueLabel: String(ageFromBirthYear(profile.birthYear)),
  };
}

function intentionWantsReview(p: ProfileLite): boolean {
  return p.intention === "TryingNow" || p.intention === "MaybeLater" || p.intention === "Pregnant";
}

/** R2: InsufficientData can never render Stable. Applied to every result. */
function guard(result: DomainResult): DomainResult {
  if (result.confidence === "InsufficientData" && result.direction === "Stable") {
    return { ...result, direction: "Unknown" };
  }
  return result;
}

function cycleIsIrregular(values: number[]): boolean {
  const t = THRESHOLDS.cycle;
  if (values.length === 0) return false;
  if (values.some((v) => v < t.shortDays || v > t.longDays)) return true;
  return stddev(values) > t.irregularStdDays;
}

// ---------- cycle ----------

function assessCycle(p: AssessInput, obs: ObservationLite[], now: Date): DomainResult {
  const lengths = series(obs, "cycle_length").filter((o) => o.valueNum !== null);
  const fresh = lengths.filter((o) => isFresh(o.effectiveAt, now, STALENESS_MONTHS.cycle));
  const recent = fresh.slice(-3).map((o) => o.valueNum as number);
  const previous = lengths.slice(0, Math.max(0, lengths.length - 3)).slice(-3).map((o) => o.valueNum as number);
  const absent = latestNum(obs, "period_absent_days");
  const triggers: string[] = [];
  const drivers: Driver[] = [];
  const unknowns: Unknown[] = [];

  let direction: Direction = "Unknown";
  let observedKey = "cycle_insufficient";

  if (absent !== undefined && absent >= THRESHOLDS.cycle.amenorrhoeaDays) {
    direction = "Discuss";
    triggers.push(TRIGGERS.T1b_amenorrhoea);
    observedKey = "cycle_absent";
  } else if (recent.length >= THRESHOLDS.cycle.minCyclesForDirection) {
    const recentIrregular = cycleIsIrregular(recent);
    const previousIrregular = previous.length >= 3 ? cycleIsIrregular(previous) : undefined;
    if (recentIrregular && previousIrregular === true) {
      direction = "Discuss";
      triggers.push(TRIGGERS.T1_cycle_persistent);
      observedKey = "cycle_persistent_irregular";
    } else if (recentIrregular) {
      direction = "Shifting";
      observedKey = "cycle_newly_irregular";
    } else if (previousIrregular === true) {
      direction = "Improving";
      observedKey = "cycle_regularising";
    } else {
      direction = "Stable";
      observedKey = "cycle_regular";
    }
  } else if (recent.length > 0) {
    observedKey = "cycle_few";
    // One or two dates are recorded, but not enough to name a direction.
    direction = "Unknown";
  }

  const hasCycleCondition = p.conditions.some((c) =>
    ["pcos", "endometriosis", "hypothyroidism", "hyperthyroidism"].includes(c),
  );
  if (hasCycleCondition && intentionWantsReview(p) && direction !== "Discuss") {
    direction = "Discuss";
    triggers.push(TRIGGERS.T2_condition_intention);
  }

  if (p.conditions.includes("pcos")) {
    drivers.push({ factor: "pcos", modifiability: "NonModifiable", evidenceId: "ev-pcos-guideline-2023", strength: "Strong", note: "pcos_features_modifiable" });
  }
  if (p.conditions.includes("endometriosis")) {
    drivers.push({ factor: "endometriosis", modifiability: "NonModifiable", evidenceId: "ev-nice-cg156", strength: "Strong" });
  }
  const tsh = driverFromObs(obs, "tsh", "thyroid", "Unknown", "ev-ata-thyroid-2017", "Strong");
  if (tsh) drivers.push({ ...tsh, modifiability: "NonModifiable" });
  else unknowns.push({ missing: "tsh", wouldNarrow: "cycle", code: "tsh" });
  const stress = driverFromObs(obs, "stress_level", "stress", "Modifiable", "ev-stress-ttp-2014", "Moderate");
  if (stress) drivers.push(stress);
  const sleep = driverFromObs(obs, "sleep_hours", "sleep", "Modifiable", "ev-sleep-reproduction-2015", "Moderate");
  if (sleep) drivers.push(sleep);
  const bmi = driverFromObs(obs, "bmi", "weight_trend", "Modifiable", "ev-asrm-obesity-2021", "Strong");
  if (bmi) drivers.push(bmi);
  drivers.push(ageDriver(p));
  if (recent.length < THRESHOLDS.cycle.minCyclesForDirection) {
    unknowns.push({ missing: "cycle_dates", wouldNarrow: "cycle", code: "cycle_length" });
  }

  // A trend needs three recent cycle dates. Fewer than that is not a faint
  // view of a pattern — it is not enough information to identify one.
  const canNameDirection = recent.length >= THRESHOLDS.cycle.minCyclesForDirection || direction === "Discuss";
  const confidence = canNameDirection ? confidenceFrom(lengths.length, fresh.length, true) : "InsufficientData";
  return guard({
    domain: "cycle",
    direction,
    confidence,
    drivers,
    unknowns,
    triggers,
    tier: "DecisionSupport",
    summaryKey: `cycle_${direction.toLowerCase()}`,
    observedKey,
  });
}

// ---------- ovarian reserve context ----------

function assessReserve(p: AssessInput, obs: ObservationLite[], now: Date): DomainResult {
  const amhSeries = series(obs, "amh").filter((o) => o.valueNum !== null);
  const amh = amhSeries[amhSeries.length - 1];
  const afc = latest(obs, "afc");
  const fsh = latest(obs, "fsh");
  const labs = [...amhSeries, afc, fsh].filter(Boolean) as ObservationLite[];
  const freshLabs = labs.filter((o) => isFresh(o.effectiveAt, now, STALENESS_MONTHS.lab));
  const age = ageFromBirthYear(p.birthYear, now);
  const triggers: string[] = [];
  const drivers: Driver[] = [ageDriver(p)];
  const unknowns: Unknown[] = [];
  let direction: Direction = "Unknown";
  let observedKey = "reserve_age_only";

  if (amh) {
    const value = amh.valueNum as number;
    drivers.push({
      factor: "amh",
      modifiability: "NonModifiable",
      evidenceId: "ev-asrm-ovarian-reserve-2020",
      strength: "Strong",
      valueLabel: fmtVal(value, amh.unit, 2),
      effectiveAt: fmtDate(amh.effectiveAt),
      source: amh.dataSourceId,
      note: "amh_quantity_not_quality",
    });
    const earlier = amhSeries.length >= 2 ? amhSeries[amhSeries.length - 2] : undefined;
    if (value < THRESHOLDS.reserve.amhLowerReference) {
      direction = "Discuss";
      triggers.push(TRIGGERS.TR_amh_low);
      observedKey = "reserve_amh_lower";
    } else if (
      earlier &&
      monthsBetween(earlier.effectiveAt, amh.effectiveAt) <= 24 &&
      (earlier.valueNum as number) > 0 &&
      ((earlier.valueNum as number) - value) / (earlier.valueNum as number) >=
        THRESHOLDS.reserve.amhDropForShifting
    ) {
      direction = "Shifting";
      observedKey = "reserve_amh_falling";
    } else {
      // A typical value is reported as observed, but "Stable" needs a
      // comparison: one reading cannot establish a direction.
      direction = earlier ? "Stable" : "Unknown";
      observedKey = "reserve_amh_typical";
    }
  } else {
    unknowns.push({ missing: "amh", wouldNarrow: "reserve", code: "amh" });
  }
  if (!afc) unknowns.push({ missing: "afc", wouldNarrow: "reserve", code: "afc" });

  if (
    age >= THRESHOLDS.reserve.ageForPreserveDiscussion &&
    p.intention === "MaybeLater" &&
    labs.length === 0
  ) {
    direction = "Discuss";
    triggers.push(TRIGGERS.T3_age35_no_reserve);
    observedKey = "reserve_age35_no_data";
  }
  if (p.familyHistory.includes("early_menopause")) {
    drivers.push({ factor: "family_early_menopause", modifiability: "NonModifiable", evidenceId: "ev-acog-age-2014", strength: "Moderate" });
    if (direction !== "Discuss") {
      direction = "Discuss";
      triggers.push(TRIGGERS.T5_family_history);
    }
  }
  const smoking = driverFromObs(obs, "smoking", "smoking", "Modifiable", "ev-asrm-smoking-2018", "Strong");
  if (smoking) drivers.push(smoking);

  const confidence = confidenceFrom(labs.length, freshLabs.length, !!amh);
  return guard({
    domain: "reserve",
    direction,
    confidence,
    drivers,
    unknowns,
    triggers,
    tier: "DecisionSupport",
    summaryKey:
      direction === "Unknown" && amh ? "reserve_single_lab" : `reserve_${direction.toLowerCase()}`,
    observedKey,
  });
}

// ---------- metabolic ----------

function assessMetabolic(p: AssessInput, obs: ObservationLite[], now: Date): DomainResult {
  const t = THRESHOLDS.metabolic;
  const points = [
    ...series(obs, "bmi"),
    ...series(obs, "hba1c"),
    ...series(obs, "fasting_glucose"),
    ...series(obs, "bp_systolic"),
    ...series(obs, "health_age"),
  ];
  const fresh = points.filter((o) => isFresh(o.effectiveAt, now, STALENESS_MONTHS.lab));
  const bmiNow = latestNum(obs, "bmi");
  const bmiBefore = earlierNum(obs, "bmi", now, 6);
  const hba1cNow = latestNum(obs, "hba1c");
  const hba1cBefore = earlierNum(obs, "hba1c", now, 6);
  const triggers: string[] = [];
  const drivers: Driver[] = [];
  const unknowns: Unknown[] = [];
  let direction: Direction = "Unknown";
  let observedKey = "metabolic_insufficient";

  if (bmiNow !== undefined && bmiBefore !== undefined) {
    const delta = bmiNow - bmiBefore;
    if (delta <= -t.bmiChangeForDirection && bmiBefore >= 25) {
      direction = "Improving";
      observedKey = "metabolic_bmi_down";
    } else if (delta >= t.bmiChangeForDirection) {
      direction = "Shifting";
      observedKey = "metabolic_bmi_up";
    } else {
      direction = "Stable";
      observedKey = "metabolic_bmi_steady";
    }
  } else if (bmiNow !== undefined || hba1cNow !== undefined) {
    observedKey = "metabolic_single";
  }

  if (hba1cNow !== undefined && hba1cBefore !== undefined && hba1cBefore - hba1cNow >= t.hba1cImprovement && direction !== "Shifting") {
    direction = "Improving";
    observedKey = "metabolic_hba1c_down";
  }
  if (hba1cNow !== undefined && (hba1cNow >= t.hba1cDiscuss || (hba1cNow >= t.hba1cRaised && intentionWantsReview(p)))) {
    direction = "Discuss";
    triggers.push(TRIGGERS.TM_hba1c);
    observedKey = "metabolic_hba1c_raised";
  }
  if (bmiNow !== undefined && bmiNow >= t.bmiDiscuss && direction !== "Discuss") {
    direction = "Discuss";
    triggers.push(TRIGGERS.TM_bmi);
  }

  const bmiD = driverFromObs(obs, "bmi", "weight_trend", "Modifiable", "ev-asrm-obesity-2021", "Strong");
  if (bmiD) drivers.push(bmiD);
  const hbD = driverFromObs(obs, "hba1c", "glycaemic", "Modifiable", p.conditions.includes("pcos") ? "ev-pcos-guideline-2023" : "ev-nice-cg156", "Strong");
  if (hbD) drivers.push(hbD);
  else unknowns.push({ missing: "hba1c", wouldNarrow: "metabolic", code: "hba1c" });
  const bpD = driverFromObs(obs, "bp_systolic", "blood_pressure", "Modifiable", "ev-who-preconception-2013", "Moderate");
  if (bpD) drivers.push(bpD);
  else unknowns.push({ missing: "bp", wouldNarrow: "metabolic", code: "bp_systolic" });
  const actD = driverFromObs(obs, "activity_minutes_week", "activity", "Modifiable", "ev-who-physical-activity-2020", "Strong");
  if (actD) drivers.push(actD);
  const sleepD = driverFromObs(obs, "sleep_hours", "sleep", "Modifiable", "ev-sleep-reproduction-2015", "Moderate");
  if (sleepD) drivers.push(sleepD);
  const haD = driverFromObs(obs, "health_age", "health_age", "Modifiable", "ev-who-preconception-2013", "Moderate", "health_age_simulated");
  if (haD) drivers.push(haD);
  if (p.conditions.includes("pcos")) {
    drivers.push({ factor: "pcos", modifiability: "NonModifiable", evidenceId: "ev-pcos-guideline-2023", strength: "Strong", note: "pcos_features_modifiable" });
  }
  drivers.push(ageDriver(p, "ev-nice-cg156"));

  const confidence = confidenceFrom(points.length, fresh.length, bmiNow !== undefined);
  return guard({
    domain: "metabolic",
    direction,
    confidence,
    drivers,
    unknowns,
    triggers,
    tier: "DecisionSupport",
    summaryKey: `metabolic_${direction.toLowerCase()}`,
    observedKey,
  });
}

// ---------- male factor context ----------

function assessMale(p: AssessInput, obs: ObservationLite[], now: Date): DomainResult {
  const t = THRESHOLDS.male;
  const conc = latest(obs, "semen_concentration");
  const mot = latest(obs, "semen_motility");
  const vol = latest(obs, "semen_volume");
  const semen = [conc, mot, vol].filter(Boolean) as ObservationLite[];
  const smokingSeries = series(obs, "smoking");
  const smokingNow = latestText(obs, "smoking");
  const smokingBefore = smokingSeries.length >= 2 ? smokingSeries[smokingSeries.length - 2].valueText : undefined;
  const bmiNow = latestNum(obs, "bmi");
  const points = [...semen, ...smokingSeries, ...series(obs, "heat_exposure"), ...series(obs, "alcohol_units_week")];
  const fresh = points.filter((o) => isFresh(o.effectiveAt, now, STALENESS_MONTHS.lab));
  const triggers: string[] = [];
  const drivers: Driver[] = [];
  const unknowns: Unknown[] = [];
  let direction: Direction = "Unknown";
  let observedKey = "male_insufficient";

  if (semen.length > 0) {
    const below =
      (conc?.valueNum !== null && conc?.valueNum !== undefined && conc.valueNum < t.concentration) ||
      (mot?.valueNum !== null && mot?.valueNum !== undefined && mot.valueNum < t.motility) ||
      (vol?.valueNum !== null && vol?.valueNum !== undefined && vol.valueNum < t.volume);
    if (below) {
      direction = "Discuss";
      triggers.push(TRIGGERS.T4_semen_below_reference);
      observedKey = "male_semen_below";
    } else {
      direction = "Stable";
      observedKey = "male_semen_within";
    }
    for (const [o, factor] of [
      [conc, "semen_concentration"],
      [mot, "semen_motility"],
      [vol, "semen_volume"],
    ] as const) {
      if (o) {
        drivers.push({
          factor,
          modifiability: "Unknown",
          evidenceId: "ev-who-semen-2021",
          strength: "Strong",
          valueLabel: fmtVal(o.valueNum ?? undefined, o.unit),
          effectiveAt: fmtDate(o.effectiveAt),
          source: o.dataSourceId,
          note: "semen_varies_between_samples",
        });
      }
    }
  } else {
    unknowns.push({ missing: "semen_analysis", wouldNarrow: "male", code: "semen_concentration" });
    if (smokingNow === "former" && smokingBefore === "current") {
      direction = "Improving";
      observedKey = "male_quit_smoking";
    } else if (smokingNow === "current" && bmiNow !== undefined && bmiNow >= t.bmiForLifestyleFlag) {
      direction = "Shifting";
      observedKey = "male_lifestyle_shifting";
    } else if (smokingSeries.length > 0 || bmiNow !== undefined) {
      direction = "Unknown";
      observedKey = "male_lifestyle_only";
    }
  }
  if (smokingNow === "current" && bmiNow !== undefined && bmiNow >= t.bmiForLifestyleFlag) {
    triggers.push(TRIGGERS.T4b_male_metabolic_smoking);
    if (direction === "Unknown") direction = "Shifting";
  }
  if (p.conditions.includes("varicocele")) {
    drivers.push({ factor: "varicocele", modifiability: "NonModifiable", evidenceId: "ev-nice-cg156", strength: "Moderate" });
    if (direction !== "Discuss" && intentionWantsReview(p)) {
      direction = "Discuss";
      triggers.push(TRIGGERS.T2_condition_intention);
    }
  }

  const smokeD = driverFromObs(obs, "smoking", "smoking", "Modifiable", "ev-asrm-smoking-2018", "Strong");
  if (smokeD) drivers.push(smokeD);
  const heatD = driverFromObs(obs, "heat_exposure", "heat", "Modifiable", "ev-heat-semen-2013", "Moderate");
  if (heatD) drivers.push(heatD);
  else unknowns.push({ missing: "heat_exposure", wouldNarrow: "male", code: "heat_exposure" });
  const alcD = driverFromObs(obs, "alcohol_units_week", "alcohol", "Modifiable", "ev-alcohol-semen-2017", "Moderate");
  if (alcD) drivers.push(alcD);
  const bmiD = driverFromObs(obs, "bmi", "weight_trend", "Modifiable", "ev-asrm-obesity-2021", "Strong");
  if (bmiD) drivers.push(bmiD);
  drivers.push({ factor: "diet_pattern", modifiability: "Modifiable", evidenceId: "ev-antioxidants-male-2022", strength: "Emerging" });
  drivers.push(ageDriver(p, "ev-nice-cg156"));

  const confidence = confidenceFrom(points.length, fresh.length, semen.length > 0);
  return guard({
    domain: "male",
    direction,
    confidence,
    drivers,
    unknowns,
    triggers,
    tier: "DecisionSupport",
    summaryKey: `male_${direction.toLowerCase()}`,
    observedKey,
  });
}

// ---------- conditions and history ----------

function assessConditions(p: AssessInput, obs: ObservationLite[], now: Date): DomainResult {
  void obs;
  void now;
  const completed = p.completedSteps.includes("conditions");
  const triggers: string[] = [];
  const drivers: Driver[] = [];
  const unknowns: Unknown[] = [];
  let direction: Direction = "Unknown";
  let observedKey = "conditions_not_completed";

  const evidenceFor: Record<string, string> = {
    pcos: "ev-pcos-guideline-2023",
    hypothyroidism: "ev-ata-thyroid-2017",
    hyperthyroidism: "ev-ata-thyroid-2017",
    endometriosis: "ev-nice-cg156",
    varicocele: "ev-nice-cg156",
    type2_diabetes: "ev-who-preconception-2013",
    prediabetes: "ev-who-preconception-2013",
    hypertension: "ev-who-preconception-2013",
    sti_history: "ev-nice-cg156",
    pelvic_surgery: "ev-nice-cg156",
    oncology_history: "ev-asrm-planned-oocyte-2018",
  };

  if (completed) {
    for (const c of p.conditions) {
      drivers.push({ factor: c, modifiability: "NonModifiable", evidenceId: evidenceFor[c] ?? "ev-nice-cg156", strength: "Strong" });
    }
    for (const f of p.familyHistory) {
      drivers.push({ factor: `family_${f}`, modifiability: "NonModifiable", evidenceId: "ev-nice-cg156", strength: "Moderate" });
    }
    if (p.conditions.length === 0 && p.familyHistory.length === 0) {
      direction = "Stable";
      observedKey = "conditions_none";
    } else if (p.intention === "Pregnant" && p.conditions.length > 0) {
      direction = "Discuss";
      triggers.push(TRIGGERS.T6_pregnant_concern);
      observedKey = "conditions_pregnant";
    } else if (intentionWantsReview(p) && p.conditions.length > 0) {
      direction = "Discuss";
      triggers.push(TRIGGERS.T2_condition_intention);
      observedKey = "conditions_review";
    } else if (p.familyHistory.includes("early_menopause") || p.familyHistory.includes("genetic_condition")) {
      direction = "Discuss";
      triggers.push(TRIGGERS.T5_family_history);
      observedKey = "conditions_family";
    } else {
      direction = "Stable";
      observedKey = "conditions_recorded";
    }
  } else {
    unknowns.push({ missing: "conditions_step", wouldNarrow: "conditions" });
  }
  if (!p.completedSteps.includes("medications")) {
    unknowns.push({ missing: "medications", wouldNarrow: "conditions" });
  }

  const confidence = completed ? (p.completedSteps.includes("medications") ? "High" : "Moderate") : "InsufficientData";
  return guard({
    domain: "conditions",
    direction,
    confidence,
    drivers,
    unknowns,
    triggers,
    tier: "DecisionSupport",
    summaryKey: `conditions_${direction.toLowerCase()}`,
    observedKey,
  });
}

// ---------- lifestyle and recovery ----------

interface Checkin {
  at: Date;
  supportive: number;
  stress?: number;
}

function buildCheckins(obs: ObservationLite[], sex: ProfileLite["sex"]): Checkin[] {
  const t = THRESHOLDS.lifestyle;
  const codes = ["sleep_hours", "activity_minutes_week", "smoking", "alcohol_units_week", "stress_level", "laughter_days_week"] as const;
  const byDay = new Map<string, ObservationLite[]>();
  for (const code of codes) {
    for (const o of series(obs, code)) {
      const key = o.effectiveAt.toISOString().slice(0, 10);
      byDay.set(key, [...(byDay.get(key) ?? []), o]);
    }
  }
  const alcoholMax = sex === "male" ? t.alcoholUnitsMax * 2 : t.alcoholUnitsMax;
  return [...byDay.entries()]
    .map(([day, items]) => {
      let supportive = 0;
      let stress: number | undefined;
      for (const o of items) {
        const v = o.valueNum ?? undefined;
        switch (o.code) {
          case "sleep_hours":
            if (v !== undefined && v >= t.sleepMin && v <= t.sleepMax) supportive++;
            break;
          case "activity_minutes_week":
            if (v !== undefined && v >= t.activityMinutes) supportive++;
            break;
          case "smoking":
            if (o.valueText && o.valueText !== "current") supportive++;
            break;
          case "alcohol_units_week":
            if (v !== undefined && v <= alcoholMax) supportive++;
            break;
          case "stress_level":
            stress = v;
            if (v !== undefined && v < t.stressHigh) supportive++;
            break;
          case "laughter_days_week":
            if (v !== undefined && v >= t.laughterDaysMin) supportive++;
            break;
        }
      }
      return { at: new Date(day), supportive, stress };
    })
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}

function assessLifestyle(p: AssessInput, obs: ObservationLite[], now: Date): DomainResult {
  const t = THRESHOLDS.lifestyle;
  const checkins = buildCheckins(obs, p.sex);
  const fresh = checkins.filter((c) => isFresh(c.at, now, STALENESS_MONTHS.checkin));
  const last = checkins[checkins.length - 1];
  const prev = checkins
    .slice(0, -1)
    .reverse()
    .find((c) => (last.at.getTime() - c.at.getTime()) / 86_400_000 >= t.minGapDaysBetweenCheckins);
  const triggers: string[] = [];
  const drivers: Driver[] = [];
  const unknowns: Unknown[] = [];
  let direction: Direction = "Unknown";
  let observedKey = "lifestyle_insufficient";

  if (last && prev) {
    const delta = last.supportive - prev.supportive;
    if (delta >= 1) {
      direction = "Improving";
      observedKey = "lifestyle_more_supportive";
    } else if (delta <= -1) {
      direction = "Shifting";
      observedKey = "lifestyle_fewer_supportive";
    } else {
      direction = "Stable";
      observedKey = "lifestyle_steady";
    }
  } else if (last) {
    observedKey = "lifestyle_single_checkin";
  }
  if (last?.stress !== undefined && last.stress >= t.stressDistress) {
    direction = "Discuss";
    triggers.push(TRIGGERS.T7_distress);
    observedKey = "lifestyle_distress";
  }

  const add = (d: Driver | undefined, missing: Unknown["missing"], code: Unknown["code"]) => {
    if (d) drivers.push(d);
    else unknowns.push({ missing, wouldNarrow: "lifestyle", code });
  };
  add(driverFromObs(obs, "sleep_hours", "sleep", "Modifiable", "ev-sleep-reproduction-2015", "Moderate"), "sleep", "sleep_hours");
  add(driverFromObs(obs, "activity_minutes_week", "activity", "Modifiable", "ev-who-physical-activity-2020", "Strong"), "activity", "activity_minutes_week");
  add(driverFromObs(obs, "smoking", "smoking", "Modifiable", "ev-asrm-smoking-2018", "Strong"), "smoking", "smoking");
  add(driverFromObs(obs, "stress_level", "stress", "Modifiable", "ev-stress-ttp-2014", "Moderate"), "stress", "stress_level");
  add(driverFromObs(obs, "laughter_days_week", "laughter", "Modifiable", "ev-laughter-2010", "Emerging"), "laughter", "laughter_days_week");
  const alc = driverFromObs(obs, "alcohol_units_week", "alcohol", "Modifiable", "ev-alcohol-semen-2017", "Moderate");
  if (alc) drivers.push(alc);

  const confidence = confidenceFrom(checkins.length, fresh.length, true);
  return guard({
    domain: "lifestyle",
    direction,
    confidence,
    drivers,
    unknowns,
    triggers,
    tier: "Education",
    summaryKey: `lifestyle_${direction.toLowerCase()}`,
    observedKey,
  });
}
