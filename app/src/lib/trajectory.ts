// How change over time is described. A difference between readings is only
// called meaningful when it passes a published threshold; anything smaller is
// normal variation. One reading is never a trend.

import { CONDITION_LABEL, type Reading, type ReadingCode } from "./model";
import { series, type VisibleRecord } from "./signals";

export type Verdict = "meaningful" | "normal" | "single" | "too_close";

export interface MeasureDef {
  code: ReadingCode;
  label: string;
  unit: string;
  /** the usual range shown as a shaded band, when one exists */
  band?: [number, number];
  canChange: boolean;
  /** what decides "meaningful", in words shown to people */
  rule: string;
  meaningful: (prev: number[], next: number[]) => boolean;
  /** compare sets of readings (cycles) instead of single readings */
  windowSize: number;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export const MEASURES: MeasureDef[] = [
  {
    code: "amh",
    label: "Egg-reserve hormone (AMH)",
    unit: "ng/mL",
    canChange: false,
    rule: "A fall of 25% or more between two results at least six months apart.",
    meaningful: ([p], [n]) => (p - n) / p >= 0.25,
    windowSize: 1,
  },
  {
    code: "cycle_length",
    label: "Cycle length",
    unit: "days",
    band: [21, 35],
    canChange: false,
    rule: "Recent cycles outside 21–35 days, or an average shift of 7 days or more.",
    meaningful: (p, n) => n.some((x) => x < 21 || x > 35) || Math.abs(mean(n) - mean(p)) >= 7,
    windowSize: 3,
  },
  {
    code: "bmi",
    label: "Weight for height (BMI)",
    unit: "kg/m²",
    band: [18.5, 25],
    canChange: true,
    rule: "A change of 1.0 or more between readings.",
    meaningful: ([p], [n]) => Math.abs(n - p) >= 1,
    windowSize: 1,
  },
  {
    code: "hba1c",
    label: "Blood sugar (HbA1c)",
    unit: "%",
    band: [4, 5.7],
    canChange: true,
    rule: "A change of 0.3 or more between results.",
    meaningful: ([p], [n]) => Math.abs(n - p) >= 0.3,
    windowSize: 1,
  },
  {
    code: "semen_concentration",
    label: "Sperm count",
    unit: "M/mL",
    canChange: true,
    rule: "Results vary a lot between tests; a repeat is needed before calling any change.",
    meaningful: () => false,
    windowSize: 1,
  },
  {
    code: "sleep_hours",
    label: "Sleep",
    unit: "hours",
    band: [7, 9],
    canChange: true,
    rule: "A change of one hour or more on average.",
    meaningful: ([p], [n]) => Math.abs(n - p) >= 1,
    windowSize: 1,
  },
];

export interface MeasureView {
  def: MeasureDef;
  readings: Reading[];
  verdict: Verdict;
  /** plain sentence describing the comparison */
  sentence: string;
}

const DAY = 86_400_000;
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function measureViews(v: VisibleRecord): MeasureView[] {
  const out: MeasureView[] = [];
  for (const def of MEASURES) {
    const s = series(v.readings, def.code);
    if (!s.length) continue;
    const w = def.windowSize;
    if (s.length < w * 2) {
      out.push({
        def,
        readings: s,
        verdict: "single",
        sentence:
          w > 1
            ? `${s.length} recorded. Masar needs ${w * 2} to compare recent ones with earlier ones.`
            : `One reading, ${fmt(s[0].value)} ${def.unit}. A trend needs at least two, six months apart.`,
      });
      continue;
    }
    const prev = s.slice(-2 * w, -w);
    const next = s.slice(-w);
    const gapDays = (Date.parse(next[next.length - 1].at) - Date.parse(prev[prev.length - 1].at)) / DAY;
    if (w === 1 && gapDays < 30) {
      out.push({ def, readings: s, verdict: "too_close", sentence: "The last two readings are too close together to compare." });
      continue;
    }
    const pv = prev.map((x) => x.value);
    const nv = next.map((x) => x.value);
    const meaningful = def.meaningful(pv, nv);
    const sentence =
      w > 1
        ? `Latest ${w}: ${nv.join(", ")} ${def.unit}. Before that: ${pv.join(", ")}.`
        : `${fmt(pv[0])} → ${fmt(nv[0])} ${def.unit} over ${Math.max(1, Math.round(gapDays / 30))} months.`;
    out.push({ def, readings: s, verdict: meaningful ? "meaningful" : "normal", sentence });
  }
  return out;
}

export interface Factor {
  label: string;
  value: string;
  canChange: boolean;
  note: string;
}

/** The "what do we know" list: recorded factors, tagged can or can't change. */
export function factorsFor(v: VisibleRecord): Factor[] {
  const f: Factor[] = [{ label: "Age", value: String(v.age), canChange: false, note: "Fertility changes gradually with age for everyone." }];
  if (v.familyEarlyMenopause) {
    f.push({ label: "Family history", value: "Early menopause", canChange: false, note: "Worth knowing about; it does not decide your own timing." });
  }
  for (const c of v.conditions) {
    f.push({ label: "Condition", value: CONDITION_LABEL[c], canChange: false, note: "Cannot be undone, but can often be managed well before a pregnancy." });
  }
  if (v.smoker !== null) {
    f.push({
      label: "Smoking",
      value: v.smoker ? "Smokes" : "Does not smoke",
      canChange: true,
      note: v.smoker ? "Stopping helps, and support is available." : "Keep it that way.",
    });
  }
  const bmi = series(v.readings, "bmi").at(-1);
  if (bmi) {
    const ok = bmi.value >= 18.5 && bmi.value < 25;
    const note = ok
      ? "In the usual range. Keep it there."
      : bmi.value < 18.5
        ? "Below the usual range. Being underweight can affect ovulation and sperm, and gaining a little often helps."
        : "Above the usual range. Losing a little often helps.";
    f.push({ label: "Weight for height (BMI)", value: fmt(bmi.value), canChange: true, note });
  }
  const sleep = series(v.readings, "sleep_hours").at(-1);
  if (sleep) {
    const ok = sleep.value >= 7 && sleep.value <= 9;
    f.push({ label: "Sleep", value: `${fmt(sleep.value)} h`, canChange: true, note: ok ? "In a healthy range." : "Worth improving if you can." });
  }
  const r = v.reported;
  if (r?.sleep && !sleep) {
    const label = { lt6: "Under 6 hours", "6to7": "6 to 7 hours", "7to9": "7 to 9 hours", gt9: "Over 9 hours" }[r.sleep] ?? r.sleep;
    f.push({ label: "Sleep", value: label, canChange: true, note: r.sleep === "7to9" ? "A healthy amount." : "7 to 9 hours is best for hormones and mood." });
  }
  if (r?.stress) {
    const label = { low: "Mostly calm", some: "Some stress", high: "Very stressed" }[r.stress] ?? r.stress;
    f.push({ label: "Stress", value: label, canChange: true, note: r.stress === "high" ? "Worth support. Stress is hard on sleep, cycles and wellbeing." : "Keep looking after it." });
  }
  if (r?.activity) {
    const label = { rarely: "Rarely active", weekly: "Once or twice a week", often: "Three times a week or more" }[r.activity] ?? r.activity;
    f.push({ label: "Activity", value: label, canChange: true, note: r.activity === "often" ? "Great. Keep it up." : "A little more movement helps weight, mood and blood sugar." });
  }
  if (r?.heat && r.heat !== "rarely") {
    f.push({ label: "Heat", value: r.heat === "often" ? "Often kept hot" : "Sometimes kept hot", canChange: true, note: "Sperm prefer it a little cooler. Fewer hot baths and no laptop on the lap can help." });
  }
  return f;
}

/** Useful information that is not on record yet. */
export function missingFor(v: VisibleRecord): string[] {
  const m: string[] = [];
  if (v.intention === null) m.push("Your plans for children (switch on “What you tell us”)");
  if (v.sex === "female" && !series(v.readings, "cycle_length").length) m.push("Cycle dates");
  if (v.sex === "female" && !series(v.readings, "amh").length && v.age >= 30) m.push("An egg-reserve test, if a doctor thinks it would help");
  if (v.sex === "male" && !series(v.readings, "semen_concentration").length && (v.intention === "TryingSoon" || v.intention === "TryingNow"))
    m.push("A semen analysis, if a doctor thinks it would help");
  if (!series(v.readings, "bmi").length) m.push("A recent weight measurement");
  return m;
}
