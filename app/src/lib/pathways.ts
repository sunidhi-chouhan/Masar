// Aggregate, privacy-preserving pathway measures for the health system's
// longitudinal view. Computed from the simulated pilot (lib/evidence) and a
// fixed set of stated, simulated assumptions about tracking behaviour; the
// demo's own resident is added as one anonymous count at the steps they
// reached. No individual appears, groups under MIN_GROUP are hidden, and
// none of this is for employment, insurance or eligibility decisions.

import { MIN_GROUP, type Report } from "./evidence";
import { rng, seedFrom } from "./random";

export interface DemoProgress {
  baseline: boolean;
  tracked3m: boolean;
  changeSurfaced: boolean;
  guide: boolean;
  shared: boolean;
  conversation: boolean;
}

export interface PathwayMetrics {
  funnel: { id: keyof DemoProgress | "referral"; label: string; n: number; you: boolean }[];
  /** the step with the largest proportional drop */
  dropAt: string;
  engagement: { label: string; value: string; note: string }[];
  quality: { label: string; pct: number; note: string }[];
  calibration: { label: string; agreePct: number; n: number }[];
  equity: { label: string; n: number; sharedPct: number; suppressed: boolean }[];
  timing: { masar: number | null; usual: number | null };
  falseReassurance: { pct: number; ofN: number };
}

/** Simulated pilot assumptions, fixed so every run shows the same numbers. */
const RATES = { tracked3m: 0.64, change: 0.31, guide: 0.58, shared: 0.71, conversation: 0.66, referral: 0.82 };

export function pathwayMetrics(r: Report, you: DemoProgress): PathwayMetrics {
  const g = rng(seedFrom("pathways"));
  const base = Math.round(r.optedIn * 0.78);
  const steps: { id: PathwayMetrics["funnel"][number]["id"]; label: string; rate: number }[] = [
    { id: "baseline", label: "Set a baseline", rate: 1 },
    { id: "tracked3m", label: "Tracked for 3 months or more", rate: RATES.tracked3m },
    { id: "changeSurfaced", label: "A change was surfaced", rate: RATES.change },
    { id: "guide", label: "Prepared a consultation guide", rate: RATES.guide },
    { id: "shared", label: "Chose to share it with a clinician", rate: RATES.shared },
    { id: "conversation", label: "Had the conversation", rate: RATES.conversation },
    { id: "referral", label: "Referral completed, where one was made", rate: RATES.referral },
  ];
  let n = base;
  const funnel = steps.map((s) => {
    n = Math.round(n * s.rate);
    const mine = s.id !== "referral" && you[s.id];
    return { id: s.id, label: s.label, n: n + (mine ? 1 : 0), you: !!mine };
  });
  let dropAt = funnel[1].label;
  let worst = 1;
  for (let i = 1; i < funnel.length; i++) {
    const kept = funnel[i].n / Math.max(1, funnel[i - 1].n);
    if (kept < worst) {
      worst = kept;
      dropAt = funnel[i].label;
    }
  }
  const lang = r.equity.find((e) => e.dimension === "Language")?.rows ?? [];
  const equity = lang.map((row) => {
    const sharedPct = Math.round(40 + g() * 25 - (/^(tl|ur|Tagalog|Urdu)$/.test(row.label) ? 12 : 0));
    return { label: row.label, n: row.n, sharedPct, suppressed: row.n < MIN_GROUP };
  });
  return {
    funnel,
    dropAt,
    engagement: [
      { label: "Residents tracking at least one category", value: `${Math.round((base / Math.max(1, r.optedIn)) * 100)}%`, note: "Of those who opted in" },
      { label: "Median check-ins a month", value: "7", note: "Optional; no streaks or reminders by default" },
      { label: "Completed an educational journey", value: "61%", note: "Quick check finished" },
      { label: "Explored counselling", value: `${Math.round(RATES.guide * RATES.change * 100)}%`, note: "Prepared a guide after a change" },
    ],
    quality: [
      { label: "With a gap of 3 weeks or more in a permitted source", pct: 38, note: "Shown to residents as missing, never filled in" },
      { label: "Women with fewer than 6 logged cycles", pct: 27, note: "Too few to compare cycle patterns" },
      { label: "Lab results confirmed by a clinician", pct: 44, note: "The rest are imported and labelled as such" },
      { label: "Observations that are self-reported", pct: 52, note: "Device 39%, imported records 9%" },
    ],
    calibration: [
      { label: "Cycle variation", agreePct: 78, n: 412 },
      { label: "New clinical evidence", agreePct: 84, n: 655 },
      { label: "Sleep shift (context)", agreePct: 49, n: 903 },
      { label: "Stress check-ins (context)", agreePct: 46, n: 588 },
    ],
    equity,
    timing: { masar: r.medianMasarDays, usual: r.medianUsualDays },
    falseReassurance: r.falseReassurance,
  };
}
