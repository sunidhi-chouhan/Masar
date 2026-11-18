// Masar's longitudinal layer: observations that accumulate over time, the
// consent scope each one belongs to, and an explainable change-detection step
// that compares recent observations with the person's own earlier ones.
//
// Pure and shared: the browser (My Trajectory, the clinician's timeline) and
// the server (the Gemini adapter) build exactly the same view from the same
// inputs, so what the AI is told is what the person sees.
//
// What this never does: score fertility, label a person, invent a reference
// range or claim that a lifestyle observation determines reproductive
// potential. A detected change is an observation about the person's own
// records, explained with its evidence, limits and missing data.

import type { Reading, Resident } from "./model";
import type { Line } from "./path";
import { normal, rng, seedFrom, round } from "./random";

// ---------- time ----------

/** The synthetic journey's first day, and the demo's "today" (matches the population's TODAY). */
export const JOURNEY_START = "2025-11-02";
export const JOURNEY_END = "2026-11-02";

/** Where the demo's clock stands. Advancing the timeline is a Demo Control. */
export const STAGES = [
  { id: 0, label: "Baseline", asOf: "2025-12-02" },
  { id: 1, label: "Month 3", asOf: "2026-02-02" },
  { id: 2, label: "Month 6", asOf: "2026-05-02" },
  { id: 3, label: "Month 9", asOf: "2026-08-02" },
  { id: 4, label: "Month 12", asOf: "2026-11-02" },
] as const;
export type StageId = (typeof STAGES)[number]["id"];

const DAY = 86_400_000;
export const addDays = (iso: string, n: number) => new Date(Date.parse(iso) + n * DAY).toISOString().slice(0, 10);
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);
const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

// ---------- the observation model ----------

export type Domain = "cycle" | "lifestyle" | "clinical" | "device";
/** Who put the observation there. AI interpretations are never observations. */
export type Provenance = "user" | "device" | "imported" | "clinician";
/** The permission an observation needs before Masar may use it. */
export type Scope = "cycles" | "lifestyle" | "device" | "labs" | "clinical";
export type ObsType = "cycle_start" | "symptom" | "sleep_self" | "stress" | "activity_self" | "nutrition" | "exposure" | "sleep" | "steps" | "resting_hr" | "lab" | "condition";

export interface Obs {
  id: string;
  domain: Domain;
  type: ObsType;
  /** ISO date */
  at: string;
  value: number | string;
  unit: string;
  /** English label; translated where shown */
  label: string;
  /** where it came from, in words */
  source: string;
  provenance: Provenance;
  scope: Scope;
  quality: "complete" | "partial" | "estimated";
  /** every observation in this prototype is synthetic, and says so */
  synthetic: boolean;
  /** a reference range only as printed on the source report; never made up */
  ref: string | null;
  /** lab test code, for comparing results of the same test */
  code?: string;
  /** the person may edit or remove it (their own entries only) */
  editable: boolean;
}

/** The person's own changes, kept in the prototype's state. */
export interface JourneyEdits {
  /** observations the person added */
  entries: Obs[];
  /** new values for the person's own observations */
  edits: Record<string, number | string>;
  /** the person's own observations they removed */
  hidden: string[];
  /** lab results Dr Layla confirmed */
  confirmed: string[];
}

export const NO_EDITS: JourneyEdits = { entries: [], edits: {}, hidden: [], confirmed: [] };

export interface JourneyConsent {
  cycles: boolean;
  lifestyle: boolean;
  device: boolean;
  labs: boolean;
  clinical: boolean;
}

export interface JourneySim {
  stage: StageId;
  /** the wearable stops syncing for the last four weeks */
  wearableGap: boolean;
  /** one simulated new self-logged observation set (Demo Controls) */
  extraObs: boolean;
  /** the existing "a new lab result arrives" control */
  extraLab: boolean;
  labs: "available" | "missing";
  clinical: "available" | "missing";
}

export const SOURCE_LABEL: Record<Provenance, string> = {
  user: "You logged it in Masar",
  device: "Wearable feed (synthetic)",
  imported: "Imported record (simulated)",
  clinician: "Confirmed by Dr Layla",
};

export const SCOPE_LABEL: Record<Scope, string> = {
  cycles: "Cycle tracking",
  lifestyle: "Lifestyle check-ins",
  device: "Wearable data",
  labs: "Laboratory results",
  clinical: "Clinic records",
};

export const SYMPTOMS = ["cramps", "heavy", "spotting", "headache", "tired", "bloating"] as const;
export const SYMPTOM_LABEL: Record<string, string> = {
  cramps: "Period pain",
  heavy: "Heavier bleeding than usual",
  spotting: "Spotting between periods",
  headache: "Headache",
  tired: "Feeling very tired",
  bloating: "Bloating",
};
export const LEVEL_LABEL: Record<string, string> = { low: "Low", some: "Some", high: "High", regular: "Regular meals", mixed: "Some skipped meals", irregular: "Often skipped meals", active: "Active day", some_activity: "Some activity", rest: "Rest day", smoked: "Smoked", none: "None" };

const LAB_LABEL: Record<string, string> = {
  amh: "Egg-reserve hormone (AMH)",
  hba1c: "Average blood sugar (HbA1c)",
  tsh: "Thyroid hormone (TSH)",
  semen_concentration: "Sperm concentration",
};

// ---------- the synthetic journey ----------

/** Cycle lengths for each demo character's year, chosen to tell their story. */
function cycleLengths(r: Resident): number[] | null {
  if (r.sex !== "female") return null;
  if (r.id === "noura") return [28, 29, 28, 30, 29, 28, 29, 28, 34, 25, 37, 26];
  if (r.conditions.includes("pcos")) return [38, 41, 33, 45, 36, 40, 39, 44, 35];
  const g = rng(seedFrom(`${r.id}-cycles`));
  return Array.from({ length: 12 }, () => Math.round(normal(g, 29, 1.2)));
}

/** A whole synthetic year for one resident, before consent or the demo clock are applied. */
export function baseJourney(r: Resident): Obs[] {
  const g = rng(seedFrom(`${r.id}-journey`));
  const out: Obs[] = [];
  const push = (o: Omit<Obs, "synthetic" | "ref" | "editable"> & Partial<Pick<Obs, "ref" | "editable">>) => out.push({ synthetic: true, ref: null, editable: false, ...o });
  const story = r.id === "noura" ? "noura" : r.id === "arjun" ? "arjun" : "steady";
  const changeFrom = story === "noura" ? "2026-06-20" : story === "arjun" ? "2026-06-01" : "9999-12-31";

  // Cycle starts, logged by the person (a tap on "my period started").
  const lengths = cycleLengths(r);
  if (lengths) {
    let at = "2025-10-20";
    lengths.forEach((len, i) => {
      const heavy = story === "noura" && i === 10;
      push({ id: `c${i}`, domain: "cycle", type: "cycle_start", at, value: heavy ? "heavy" : "medium", unit: "", label: "Period started", source: SOURCE_LABEL.user, provenance: "user", scope: "cycles", quality: "complete", editable: true });
      if (g() < 0.45 || (story === "noura" && i >= 8)) {
        push({ id: `s${i}`, domain: "cycle", type: "symptom", at: addDays(at, 1), value: story === "noura" && i >= 9 ? (i === 10 ? "heavy" : "tired") : "cramps", unit: "", label: "Symptom", source: SOURCE_LABEL.user, provenance: "user", scope: "cycles", quality: "complete", editable: true });
      }
      at = addDays(at, len);
    });
    // the start that closes the last cycle
    push({ id: `c${lengths.length}`, domain: "cycle", type: "cycle_start", at, value: "medium", unit: "", label: "Period started", source: SOURCE_LABEL.user, provenance: "user", scope: "cycles", quality: "complete", editable: true });
  }

  // Lifestyle check-ins: two or three short ones a week, skippable.
  for (let d = 0, n = 0; addDays(JOURNEY_START, d) <= JOURNEY_END; d += g() < 0.5 ? 2 : 3, n++) {
    const at = addDays(JOURNEY_START, d);
    const late = at >= changeFrom;
    if (g() < 0.18) continue; // skipped days are normal, and never counted against anyone
    const stressHigh = late ? 0.55 : 0.12;
    const x = g();
    push({ id: `w${n}`, domain: "lifestyle", type: "stress", at, value: x < stressHigh ? "high" : x < stressHigh + 0.4 ? "some" : "low", unit: "", label: "Stress and wellbeing", source: SOURCE_LABEL.user, provenance: "user", scope: "lifestyle", quality: "complete", editable: true });
    if (n % 3 === 0) {
      const hrs = late ? round(normal(g, 6.0, 0.4), 1) : round(normal(g, 7.3, 0.35), 1);
      push({ id: `ss${n}`, domain: "lifestyle", type: "sleep_self", at, value: hrs, unit: "h", label: "Sleep (your estimate)", source: SOURCE_LABEL.user, provenance: "user", scope: "lifestyle", quality: "estimated", editable: true });
    }
    if (n % 4 === 0) {
      const y = g();
      push({ id: `nu${n}`, domain: "lifestyle", type: "nutrition", at, value: late && y < 0.45 ? "mixed" : y < 0.1 ? "mixed" : "regular", unit: "", label: "Meals", source: SOURCE_LABEL.user, provenance: "user", scope: "lifestyle", quality: "complete", editable: true });
    }
    if (r.smoker && n % 10 === 0) {
      push({ id: `ex${n}`, domain: "lifestyle", type: "exposure", at, value: "smoked", unit: "", label: "Smoking", source: SOURCE_LABEL.user, provenance: "user", scope: "lifestyle", quality: "complete", editable: true });
    }
  }

  // Wearable: nightly sleep, daily steps, weekly resting heart rate. One gap
  // when the watch wasn't worn, which the timeline shows as missing.
  const gap = (at: string) => at >= "2026-03-09" && at <= "2026-04-12";
  for (let d = 0; addDays(JOURNEY_START, d) <= JOURNEY_END; d++) {
    const at = addDays(JOURNEY_START, d);
    if (gap(at) || g() < 0.06) continue;
    const late = at >= changeFrom;
    const base = story === "arjun" ? (late ? 5.8 : 6.8) : late ? 6.1 : 7.3;
    push({ id: `ws${d}`, domain: "device", type: "sleep", at, value: round(normal(g, base, 0.45), 1), unit: "h", label: "Sleep", source: SOURCE_LABEL.device, provenance: "device", scope: "device", quality: "complete" });
    push({ id: `wk${d}`, domain: "device", type: "steps", at, value: Math.max(1200, Math.round(normal(g, story === "arjun" ? 5200 : 7600, 1600))), unit: "steps", label: "Steps", source: SOURCE_LABEL.device, provenance: "device", scope: "device", quality: "complete" });
    if (d % 7 === 0) {
      push({ id: `wh${d}`, domain: "device", type: "resting_hr", at, value: Math.round(normal(g, late ? 65 : 62, 1.2)), unit: "bpm", label: "Resting heart rate", source: SOURCE_LABEL.device, provenance: "device", scope: "device", quality: "complete" });
    }
  }

  // Clinical evidence already in the person's record (synthetic), unchanged.
  r.readings
    .filter((x) => x.source === "lab")
    .forEach((x, i) =>
      push({ id: `lab${i}`, domain: "clinical", type: "lab", code: x.code, at: x.at, value: x.value, unit: x.unit, label: LAB_LABEL[x.code] ?? x.code, source: "Lab system (simulated)", provenance: "imported", scope: "labs", quality: "complete", ref: null }),
    );
  r.conditions.forEach((c, i) =>
    push({ id: `dx${i}`, domain: "clinical", type: "condition", at: JOURNEY_START, value: c, unit: "", label: "Diagnosis on record", source: "Clinic records (simulated)", provenance: "imported", scope: "clinical", quality: "complete" }),
  );
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

/** The simulated lab result the Demo Controls can add: routine and in range, so it never manufactures a finding. */
export function simulatedLab(r: Resident): Obs {
  return r.sex === "female"
    ? { id: "lab-sim", domain: "clinical", type: "lab", code: "hba1c", at: "2026-11-02", value: 5.3, unit: "%", label: LAB_LABEL.hba1c, source: "Lab system (simulated)", provenance: "imported", scope: "labs", quality: "complete", synthetic: true, ref: null, editable: false }
    : { id: "lab-sim", domain: "clinical", type: "lab", code: "semen_concentration", at: "2026-11-02", value: 22, unit: "M/mL", label: LAB_LABEL.semen_concentration, source: "Lab system (simulated)", provenance: "imported", scope: "labs", quality: "complete", synthetic: true, ref: null, editable: false };
}

/** A small set of self-logged observations for "Simulate new observation". */
function simulatedEntries(r: Resident, asOf: string): Obs[] {
  const base = { synthetic: true, ref: null, editable: true, provenance: "user" as const, source: SOURCE_LABEL.user, quality: "complete" as const };
  return [
    { ...base, id: "sim-stress", domain: "lifestyle", type: "stress", at: asOf, value: "high", unit: "", label: "Stress and wellbeing", scope: "lifestyle" },
    ...(r.sex === "female" ? [{ ...base, id: "sim-sym", domain: "cycle" as const, type: "symptom" as const, at: asOf, value: "spotting", unit: "", label: "Symptom", scope: "cycles" as const }] : []),
  ];
}

// ---------- the view: consent and the demo clock applied ----------

export interface Lane {
  id: "cycle" | "lifestyle" | "clinical" | "device";
  scope: Scope[];
  allowed: boolean;
  count: number;
  /** observations withheld because their permission is off */
  withheld: number;
}

export interface Gap {
  scope: Scope;
  from: string;
  to: string;
  days: number;
}

export interface CycleLen {
  from: string;
  to: string;
  days: number;
  /** ids of the two cycle starts it was measured between */
  ids: [string, string];
}

export interface JourneyView {
  asOf: string;
  stage: StageId;
  start: string;
  /** authorised observations up to the demo's today */
  obs: Obs[];
  lanes: Lane[];
  cycles: CycleLen[];
  gaps: Gap[];
  changes: Change[];
  baseline: Baseline;
  /** permissions that are off, so nothing from them is used */
  withheld: Scope[];
}

export function journeyView(r: Resident, consent: JourneyConsent, sim: JourneySim, edits: JourneyEdits = NO_EDITS): JourneyView {
  const asOf = STAGES[sim.stage]?.asOf ?? JOURNEY_END;
  let all = baseJourney(r);
  if (sim.labs === "missing") all = all.filter((o) => o.scope !== "labs");
  if (sim.clinical === "missing") all = all.filter((o) => o.scope !== "clinical");
  if (sim.extraLab && sim.labs === "available") all.push({ ...simulatedLab(r), at: asOf });
  if (sim.extraObs) all.push(...simulatedEntries(r, asOf));
  if (sim.wearableGap) all = all.filter((o) => !(o.scope === "device" && o.at > addDays(asOf, -28)));
  all.push(...edits.entries);
  const hidden = new Set(edits.hidden);
  all = all
    .filter((o) => !hidden.has(o.id) && o.at <= asOf)
    .map((o) => {
      let x = o;
      if (edits.edits[o.id] !== undefined && o.editable) x = { ...x, value: edits.edits[o.id] };
      if (edits.confirmed.includes(o.id) && o.domain === "clinical") x = { ...x, provenance: "clinician", source: SOURCE_LABEL.clinician };
      return x;
    })
    .sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));

  const ok = (s: Scope) => consent[s];
  const obs = all.filter((o) => ok(o.scope));
  const laneDefs: { id: Lane["id"]; scope: Scope[] }[] = [
    { id: "cycle", scope: ["cycles"] },
    { id: "lifestyle", scope: ["lifestyle"] },
    { id: "clinical", scope: ["labs", "clinical"] },
    { id: "device", scope: ["device"] },
  ];
  const lanes = laneDefs.map((l) => ({
    ...l,
    allowed: l.scope.some(ok),
    count: obs.filter((o) => l.scope.includes(o.scope)).length,
    withheld: all.filter((o) => l.scope.includes(o.scope) && !ok(o.scope)).length,
  }));
  const starts = obs.filter((o) => o.type === "cycle_start");
  const cycles: CycleLen[] = starts.slice(1).map((c, i) => ({ from: starts[i].at, to: c.at, days: daysBetween(starts[i].at, c.at), ids: [starts[i].id, c.id] }));
  const start = JOURNEY_START;
  const gaps = findGaps(obs, start, asOf, consent);
  const v: JourneyView = { asOf, stage: sim.stage, start, obs, lanes, cycles, gaps, changes: [], baseline: { available: [], missing: [], cannot: [] }, withheld: (Object.keys(SCOPE_LABEL) as Scope[]).filter((s) => !ok(s)) };
  v.changes = detectChanges(r, v);
  v.baseline = baselineOf(r, v);
  return v;
}

/** Stretches of three weeks or more with no observations from a permitted, regular source. */
function findGaps(obs: Obs[], start: string, asOf: string, consent: JourneyConsent): Gap[] {
  const out: Gap[] = [];
  const check = (scope: Scope, min: number) => {
    if (!consent[scope]) return;
    const dates = [...new Set(obs.filter((o) => o.scope === scope).map((o) => o.at))].sort();
    if (!dates.length) return;
    let prev = dates[0] < start ? dates[0] : start;
    for (const d of [...dates, asOf]) {
      const days = daysBetween(prev, d);
      if (days >= min) out.push({ scope, from: addDays(prev, 1), to: d === asOf ? asOf : addDays(d, -1), days });
      prev = d;
    }
  };
  check("device", 21);
  check("lifestyle", 30);
  return out;
}

// ---------- the baseline ----------

export interface Baseline {
  available: Line[];
  missing: Line[];
  cannot: Line[];
}

function baselineOf(r: Resident, v: JourneyView): Baseline {
  const count = (s: Scope) => v.obs.filter((o) => o.scope === s).length;
  const available: Line[] = [];
  const missing: Line[] = [];
  for (const s of Object.keys(SCOPE_LABEL) as Scope[]) {
    if (s === "cycles" && r.sex !== "female") continue;
    if (!v.lanes.find((l) => l.scope.includes(s))?.allowed || v.withheld.includes(s)) missing.push({ text: "{what}: not shared, so not used", vars: { what: SCOPE_LABEL[s] } });
    else if (count(s)) available.push({ text: "{what}: {n} recorded", vars: { what: SCOPE_LABEL[s], n: count(s) } });
    else missing.push({ text: "{what}: nothing recorded yet", vars: { what: SCOPE_LABEL[s] } });
  }
  const cannot: Line[] = [];
  if (r.sex === "female" && v.cycles.length < 6) cannot.push({ text: "Whether your cycles are changing: Masar compares your latest 4 cycles with at least 3 earlier ones, and has {n} so far.", vars: { n: v.cycles.length } });
  if (daysBetween(v.start, v.asOf) < 120) cannot.push({ text: "Whether your sleep or stress pattern has shifted: that needs about four months of check-ins or wearable data to compare." });
  cannot.push({ text: "Your fertility or chance of pregnancy: no tracking data can tell you that, and Masar never estimates it." });
  return { available, missing, cannot };
}

// ---------- change detection ----------

export type ChangeId = "cycle_variation" | "sleep_shift" | "stress_shift" | "new_lab" | "gap_device" | "gap_cycle";

export interface Change {
  id: ChangeId;
  /** the permission (and guide section) its data comes from */
  scope: Scope;
  kind: "pattern" | "lifestyle" | "clinical" | "data";
  title: Line;
  /** what changed, plainly */
  what: Line;
  from: string;
  to: string;
  /** the specific observations behind it */
  supports: string[];
  supportLines: Line[];
  /** context that may be relevant, carefully */
  relevant: Line[];
  /** what this cannot determine */
  cannot: Line[];
  missing: Line[];
  next: Line[];
  evidence: { citation: string; strength: "Moderate" | "Limited" | "No published threshold"; rule: Line };
  confidence: { level: "Moderate" | "Limited"; why: Line };
  /** which factors here may be modifiable */
  modifiable: Line;
}

function detectChanges(r: Resident, v: JourneyView): Change[] {
  const out: Change[] = [];
  // The person's own baseline: their first months of tracking (up to six),
  // ending at least three months before today; compared with the last 8 weeks.
  const recentFrom = addDays(v.asOf, -56);
  const baseEnd = [addDays(v.start, 180), addDays(v.asOf, -90)].sort()[0];
  const enough = daysBetween(v.start, baseEnd) >= 60;
  const before = (o: Obs) => enough && o.at >= v.start && o.at < baseEnd;
  const recent = (o: Obs) => o.at >= recentFrom;
  const sleepObs = v.obs.filter((o) => o.type === "sleep");
  const sRecent = sleepObs.filter(recent).map((o) => Number(o.value));
  const sBefore = sleepObs.filter(before).map((o) => Number(o.value));
  const sleepShift = sRecent.length >= 14 && sBefore.length >= 30 && Math.abs(mean(sRecent) - mean(sBefore)) >= 0.75;

  // 1. Cycle-to-cycle variation (FIGO 2018: shortest-to-longest variation of
  // up to 7 days is regular at 26–41, up to 9 days at other ages).
  if (r.sex === "female" && v.cycles.length >= 7) {
    const limit = r.age >= 26 && r.age <= 41 ? 7 : 9;
    const last = v.cycles.slice(-4);
    const earlier = v.cycles.slice(0, -4);
    const span = (c: CycleLen[]) => Math.max(...c.map((x) => x.days)) - Math.min(...c.map((x) => x.days));
    const now = span(last);
    const then = span(earlier);
    if (now > limit && then <= limit) {
      const ids = last.flatMap((c) => c.ids);
      const symptoms = v.obs.filter((o) => o.type === "symptom" && o.at >= last[0].from);
      out.push({
        id: "cycle_variation",
        scope: "cycles",
        kind: "pattern",
        title: { text: "Your recent cycles vary more than your earlier ones" },
        what: { text: "Your last {n} recorded cycles ranged from {min} to {max} days, a spread of {now} days. Your {m} earlier cycles stayed within {then} days of each other.", vars: { n: last.length, min: Math.min(...last.map((c) => c.days)), max: Math.max(...last.map((c) => c.days)), now, m: earlier.length, then } },
        from: last[0].from,
        to: last.at(-1)!.to,
        supports: [...new Set(ids)],
        supportLines: last.map((c) => ({ text: "A cycle of {days} days", vars: { days: c.days } })),
        relevant: [
          { text: "Cycles often vary with stress, illness, travel, sleep changes or weight change, and sometimes for no clear reason." },
          ...(symptoms.length ? [{ text: "You also logged {n} symptoms around these cycles.", vars: { n: symptoms.length } }] : []),
          ...(sleepShift ? [{ text: "Your sleep also changed over the same months. That may or may not be connected." }] : []),
        ],
        cannot: [
          { text: "It cannot tell whether you ovulate, or anything about egg number or quality." },
          { text: "It is not a diagnosis, and it does not mean something is wrong." },
          { text: "Four cycles is a short window: the pattern may settle again." },
        ],
        missing: [
          ...(v.obs.some((o) => o.type === "lab") ? [] : [{ text: "No recent blood tests are shared, so hormones such as thyroid can't be considered." }]),
          { text: "Ovulation tests or temperature records aren't tracked in Masar." },
        ],
        next: [
          { text: "Keep logging when your period starts: a few more cycles show whether this settles." },
          { text: "If it continues, or your cycles go beyond 35 days, a routine conversation with your family doctor is reasonable." },
          { text: "Add it to your preparation guide so you have the dates with you." },
        ],
        evidence: { citation: "FIGO normal limits of menstruation (2018)", strength: "Moderate", rule: { text: "A shortest-to-longest spread of more than {limit} days across your latest 4 cycles, when your earlier cycles stayed within it.", vars: { limit } } },
        confidence: { level: v.cycles.length >= 10 ? "Moderate" : "Limited", why: { text: "Based on {n} cycles you logged yourself. Logging dates is reliable; the pattern is still short.", vars: { n: v.cycles.length } } },
        modifiable: { text: "Cycle length itself isn't something to change directly. Some things that can affect it, such as sleep, stress and weight, can change." },
      });
    }
  }

  // 2. Sleep: the last four weeks against the three months before.
  if (sleepShift) {
    const a = round(mean(sBefore), 1);
    const b = round(mean(sRecent), 1);
    out.push({
      id: "sleep_shift",
      scope: "device",
      kind: "lifestyle",
      title: { text: b < a ? "You've been sleeping less than before" : "You've been sleeping more than before" },
      what: { text: "Your wearable recorded an average of {b} hours a night over the last 8 weeks, against {a} hours in your first months of tracking.", vars: { a: fmt(a), b: fmt(b) } },
      from: recentFrom,
      to: v.asOf,
      supports: sleepObs.filter(recent).map((o) => o.id),
      supportLines: [{ text: "{n} nights recorded recently, {m} nights before", vars: { n: sRecent.length, m: sBefore.length } }],
      relevant: [{ text: "Adults are generally advised to sleep 7 hours or more. Sleep is context for your wellbeing, not a measure of reproductive potential." }],
      cannot: [
        { text: "It cannot tell why your sleep changed, or whether it affects your cycles." },
        { text: "Wearable sleep estimates can differ from actual sleep by a fair amount." },
      ],
      missing: v.lanes.find((l) => l.id === "lifestyle")?.allowed ? [] : [{ text: "Your lifestyle check-ins aren't shared, so how you feel isn't part of this." }],
      next: [
        { text: "If you'd like to, small, steady changes to your sleep routine are a reasonable place to start." },
        { text: "Mention it if you see a doctor: it is useful context alongside your cycle dates." },
      ],
      evidence: { citation: "AASM and Sleep Research Society consensus on adult sleep (2015)", strength: "Moderate", rule: { text: "An average difference of 45 minutes or more between the last 8 weeks and your first months of tracking, with at least 14 recent nights." } },
      confidence: { level: "Moderate", why: { text: "Based on {n} recent nights from your wearable.", vars: { n: sRecent.length } } },
      modifiable: { text: "Sleep is often modifiable, though not always easily. Changing it is your choice, not an instruction." },
    });
  }

  // 3. Stress check-ins: more "high" days recently than before.
  const st = v.obs.filter((o) => o.type === "stress");
  const stRecent = st.filter(recent);
  const stBefore = st.filter(before);
  const share = (xs: Obs[]) => (xs.length ? xs.filter((o) => o.value === "high").length / xs.length : 0);
  if (stRecent.length >= 4 && stBefore.length >= 8 && share(stRecent) >= 0.45 && share(stBefore) <= 0.3) {
    const hi = stRecent.filter((o) => o.value === "high").length;
    out.push({
      id: "stress_shift",
      scope: "lifestyle",
      kind: "lifestyle",
      title: { text: "More of your recent check-ins mention high stress" },
      what: { text: "{hi} of your last {n} check-ins said stress was high, more often than in your first months of tracking.", vars: { hi, n: stRecent.length } },
      from: recentFrom,
      to: v.asOf,
      supports: stRecent.map((o) => o.id),
      supportLines: [{ text: "{hi} of {n} recent check-ins", vars: { hi, n: stRecent.length } }],
      relevant: [{ text: "Stress is hard on sleep, wellbeing and sometimes cycles. It is shown as context, not as a cause." }],
      cannot: [{ text: "Check-ins describe how you felt; they can't measure stress hormones or say what stress is doing." }],
      missing: [],
      next: [
        { text: "Support for stress is worth having for its own sake. Your family doctor can point you to it." },
        { text: "If you ever feel unable to cope, please talk to someone today. In an emergency, call 999." },
      ],
      evidence: { citation: "Your own check-ins; no published threshold", strength: "No published threshold", rule: { text: "Shown when at least 45% of the last 8 weeks' check-ins say high, against 30% or fewer in your first months." } },
      confidence: { level: "Limited", why: { text: "Based on {n} short check-ins. Feelings vary day to day.", vars: { n: stRecent.length } } },
      modifiable: { text: "Some causes of stress can change and some can't. Support can help either way." },
    });
  }

  // 4. New clinical evidence in the last 60 days, compared with the same test before.
  const labs = v.obs.filter((o) => o.type === "lab");
  for (const l of labs.filter((o) => o.at >= addDays(v.asOf, -60))) {
    const prev = labs.filter((o) => o.code === l.code && o.at < l.at).at(-1);
    const amhFall = prev && l.code === "amh" && daysBetween(prev.at, l.at) >= 180 && (Number(prev.value) - Number(l.value)) / Number(prev.value) >= 0.25;
    out.push({
      id: "new_lab",
      scope: "labs",
      kind: "clinical",
      title: { text: "A new result was added: {test}", vars: { test: l.label } },
      what: prev
        ? { text: "Your {test} result on this date was {value} {unit}. Your previous one was {prev} {unit}.", vars: { test: l.label, value: fmt(Number(l.value)), unit: l.unit, prev: fmt(Number(prev.value)) } }
        : { text: "Your {test} result was {value} {unit}. There is no earlier result to compare it with.", vars: { test: l.label, value: fmt(Number(l.value)), unit: l.unit } },
      from: l.at,
      to: l.at,
      supports: [l.id, ...(prev ? [prev.id] : [])],
      supportLines: [{ text: "{source}, {unit}", vars: { source: l.source, unit: l.unit } }],
      relevant: amhFall
        ? [{ text: "This fall passes Masar's published rule for a real change in AMH, which is why it also appears in What stood out." }]
        : [{ text: "One result is a snapshot. Masar only calls something a trend when two results, far enough apart, differ by more than the usual ups and downs." }],
      cannot: [
        { text: "Masar doesn't interpret the value: no reference range was printed with this synthetic result, and Masar never makes one up." },
        ...(l.code === "amh" ? [{ text: "AMH reflects egg number, not egg quality, and does not predict your chance of pregnancy." }] : []),
      ],
      missing: l.provenance === "clinician" ? [] : [{ text: "A clinician hasn't confirmed this result in Masar yet." }],
      next: [{ text: "Ask the doctor who ordered it what it means for you; bring the original report." }],
      evidence: { citation: amhFall ? "ESHRE ovarian stimulation guideline (2019); Masar's AMH rule" : "The lab report itself", strength: amhFall ? "Moderate" : "Limited", rule: { text: amhFall ? "A fall of 25% or more between two results at least six months apart." : "New results are shown as recorded; no rule is applied to a single value." } },
      confidence: { level: prev ? "Moderate" : "Limited", why: prev ? { text: "Two lab results of the same test." } : { text: "One result only." } },
      modifiable: { text: l.code === "amh" ? "AMH is not something lifestyle changes are known to raise." : "Whether this can change depends on the test; your doctor can explain." },
    });
  }

  // 5. Missing data that limits interpretation.
  for (const gp of v.gaps.filter((x) => x.scope === "device" && x.to >= addDays(v.asOf, -120))) {
    out.push({
      id: "gap_device",
      scope: "device",
      kind: "data",
      title: { text: "Your wearable has a gap of {days} days", vars: { days: gp.days } },
      what: { text: "No wearable data was received for {days} days. Masar doesn't fill gaps in or guess what happened.", vars: { days: gp.days } },
      from: gp.from,
      to: gp.to,
      supports: [],
      supportLines: [],
      relevant: [{ text: "Gaps are normal: watches get forgotten, charged or taken off. Nothing missing is ever held against you." }],
      cannot: [{ text: "Sleep and activity during the gap are unknown, so comparisons around it are weaker." }],
      missing: [{ text: "Wearable data from {from} to {to}.", vars: { from: gp.from, to: gp.to } }],
      next: [{ text: "Nothing to do unless you want to: syncing again simply fills the picture from now on." }],
      evidence: { citation: "Data coverage check", strength: "No published threshold", rule: { text: "Shown when a permitted daily source has no data for 21 days or more." } },
      confidence: { level: "Moderate", why: { text: "A simple count of days with data." } },
      modifiable: { text: "Data coverage is entirely up to you." },
    });
  }
  const lastStart = v.obs.filter((o) => o.type === "cycle_start").at(-1);
  if (r.sex === "female" && v.lanes[0].allowed && lastStart && daysBetween(lastStart.at, v.asOf) > 45) {
    out.push({
      id: "gap_cycle",
      scope: "cycles",
      kind: "data",
      title: { text: "No period start logged for {days} days", vars: { days: daysBetween(lastStart.at, v.asOf) } },
      what: { text: "Your last logged period started {days} days ago. It may simply not have been logged.", vars: { days: daysBetween(lastStart.at, v.asOf) } },
      from: lastStart.at,
      to: v.asOf,
      supports: [lastStart.id],
      supportLines: [],
      relevant: [{ text: "A long gap can be a missed log, a long cycle, pregnancy, or other changes." }],
      cannot: [{ text: "Masar can't tell a missed log from a long cycle." }],
      missing: [{ text: "Period starts after {date}.", vars: { date: lastStart.at } }],
      next: [{ text: "If your period did start, add the date. If it hasn't for three months or more, it is worth talking to a doctor." }],
      evidence: { citation: "Data coverage check", strength: "No published threshold", rule: { text: "Shown when no period start has been logged for more than 45 days." } },
      confidence: { level: "Limited", why: { text: "Depends on whether every start was logged." } },
      modifiable: { text: "Logging is up to you, and skipping is fine." },
    });
  }
  // Order: patterns and new evidence first, then context, then data gaps.
  const order: Change["kind"][] = ["pattern", "clinical", "lifestyle", "data"];
  return out.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
}

// ---------- readings for Masar's existing rules ----------

/** Cycle lengths and recent sleep from the journey, in the shape Masar's rules already read. */
export function journeyReadings(v: JourneyView): Reading[] {
  const cycles: Reading[] = v.cycles.map((c) => ({ code: "cycle_length", value: c.days, unit: "days", at: c.to, source: "device" }));
  const sleep = v.obs.filter((o) => o.type === "sleep" && o.at >= addDays(v.asOf, -14)).map((o) => Number(o.value));
  return [...cycles, ...(sleep.length >= 5 ? [{ code: "sleep_hours" as const, value: round(mean(sleep), 1), unit: "hours", at: v.asOf, source: "device" as const }] : [])];
}

// ---------- summaries per lane, in plain words ----------

export function laneSentence(v: JourneyView, lane: Lane["id"], from: string): Line {
  const o = v.obs.filter((x) => x.at >= from);
  if (lane === "cycle") {
    const c = v.cycles.filter((x) => x.to >= from);
    if (!c.length) return { text: "No complete cycles in this period yet. Each period start you log adds one." };
    const min = Math.min(...c.map((x) => x.days));
    const max = Math.max(...c.map((x) => x.days));
    if (c.length === 1) return { text: "One cycle of {days} days in this period.", vars: { days: min } };
    return { text: "{n} cycles between {min} and {max} days in this period.", vars: { n: c.length, min, max } };
  }
  if (lane === "lifestyle") {
    const st = o.filter((x) => x.type === "stress");
    if (!st.length) return { text: "No check-ins in this period. They are optional." };
    return { text: "{n} check-ins; stress was high on {hi} of them.", vars: { n: st.length, hi: st.filter((x) => x.value === "high").length } };
  }
  if (lane === "device") {
    const sl = o.filter((x) => x.type === "sleep").map((x) => Number(x.value));
    const days = Math.max(1, daysBetween(from < v.start ? v.start : from, v.asOf));
    if (!sl.length) return { text: "No wearable data in this period." };
    return { text: "Average sleep {h} hours, on {n} of {days} nights.", vars: { h: fmt(round(mean(sl), 1)), n: sl.length, days } };
  }
  const labs = o.filter((x) => x.domain === "clinical");
  if (labs.length === 1) return { text: "One clinical record in this period." };
  return labs.length ? { text: "{n} clinical records in this period.", vars: { n: labs.length } } : { text: "No new clinical records in this period." };
}

// ---------- the preparation guide ----------

export type ShareKey = "cycles" | "symptoms" | "lifestyle" | "wearable" | "labs" | "history" | "goals" | "changes" | "questions" | "notes";

export const SHARE_LABEL: Record<ShareKey, string> = {
  goals: "Your reproductive goals",
  changes: "Changes Masar noticed",
  cycles: "Cycle history",
  symptoms: "Symptoms you logged",
  lifestyle: "Lifestyle check-ins",
  wearable: "Wearable summary",
  labs: "Laboratory results",
  history: "Relevant medical history",
  questions: "Your questions",
  notes: "Your personal notes",
};

/** The permission each guide section needs before it can even be offered for sharing. */
export const SHARE_SCOPE: Partial<Record<ShareKey, Scope>> = { cycles: "cycles", symptoms: "cycles", lifestyle: "lifestyle", wearable: "device", labs: "labs", history: "clinical" };

/** The guide section that must also be shared before a change can be shown to a clinician. */
export const CHANGE_SHARE: Record<Scope, ShareKey> = { cycles: "cycles", lifestyle: "lifestyle", device: "wearable", labs: "labs", clinical: "history" };

/** The changes a clinician may see, given exactly what the person shared. */
export function changesForClinician(changes: Change[], shared: ShareKey[]): Change[] {
  return shared.includes("changes") ? changes.filter((c) => shared.includes(CHANGE_SHARE[c.scope])) : [];
}

export interface GuideDraft {
  why: Line[];
  timeline: { at: string; text: Line }[];
  shared: { key: ShareKey; available: boolean; detail: Line }[];
  unknown: Line[];
  questions: Line[];
  bring: Line[];
  discussion: Line[];
}

export function guideDraft(sex: Resident["sex"], v: JourneyView, extra: { goal: string | null; insightTitles: string[]; ruleQuestions: string[]; conditions: string[] }): GuideDraft {
  const why: Line[] = [];
  if (extra.goal) why.push({ text: "You told Masar your plans: {goal}.", vars: { goal: extra.goal } });
  for (const c of v.changes.filter((x) => x.kind !== "data")) why.push(c.title);
  for (const t of extra.insightTitles) why.push({ text: "Masar's published rules found: {title}.", vars: { title: t } });
  if (!why.length) why.push({ text: "You asked for a guide. Nothing in what you shared needs a conversation right now, and that isn't a guarantee." });

  const timeline: GuideDraft["timeline"] = [{ at: v.start, text: { text: "You started tracking in Masar" } }];
  for (const c of v.changes) timeline.push({ at: c.from, text: c.title });
  const announced = new Set(v.changes.filter((c) => c.id === "new_lab").map((c) => c.supports[0]));
  for (const l of v.obs.filter((o) => o.type === "lab" && !announced.has(o.id))) timeline.push({ at: l.at, text: { text: "{test}: {value} {unit}", vars: { test: l.label, value: fmt(Number(l.value)), unit: l.unit } } });
  timeline.sort((a, b) => a.at.localeCompare(b.at));

  const count = (f: (o: Obs) => boolean) => v.obs.filter(f).length;
  const allowed = (s: Scope) => !v.withheld.includes(s);
  const shared: GuideDraft["shared"] = [
    { key: "goals", available: !!extra.goal, detail: extra.goal ? { text: extra.goal } : { text: "Not shared" } },
    { key: "changes", available: v.changes.length > 0, detail: { text: "{n} observations, with their evidence and limits", vars: { n: v.changes.length } } },
    ...(sex === "female" ? [{ key: "cycles" as const, available: allowed("cycles") && v.cycles.length > 0, detail: { text: "{n} cycles with dates", vars: { n: v.cycles.length } } }] : []),
    { key: "symptoms", available: allowed("cycles") && count((o) => o.type === "symptom") > 0, detail: { text: "{n} symptoms logged", vars: { n: count((o) => o.type === "symptom") } } },
    { key: "lifestyle", available: allowed("lifestyle") && count((o) => o.domain === "lifestyle") > 0, detail: { text: "{n} check-ins", vars: { n: count((o) => o.domain === "lifestyle") } } },
    { key: "wearable", available: allowed("device") && count((o) => o.domain === "device") > 0, detail: { text: "Weekly averages, not raw data" } },
    { key: "labs", available: allowed("labs") && count((o) => o.type === "lab") > 0, detail: { text: "{n} results with dates and sources", vars: { n: count((o) => o.type === "lab") } } },
    { key: "history", available: allowed("clinical") && extra.conditions.length > 0, detail: extra.conditions.length ? { text: extra.conditions.join(", ") } : { text: "Nothing on record" } },
    { key: "questions", available: true, detail: { text: "The questions below, as you edit them" } },
    { key: "notes", available: true, detail: { text: "Only if you write some" } },
  ];

  const unknown: Line[] = [...v.baseline.missing, ...v.changes.flatMap((c) => c.missing)].filter((l, i, a) => a.findIndex((x) => x.text === l.text && JSON.stringify(x.vars) === JSON.stringify(l.vars)) === i).slice(0, 6);

  const questions: Line[] = [];
  if (v.changes.some((c) => c.id === "cycle_variation")) questions.push({ text: "My cycles have varied more over the last few months. Is that worth looking into, and what would help tell?" });
  if (v.changes.some((c) => c.id === "new_lab")) questions.push({ text: "What does my latest result mean for me, and should it be repeated at some point?" });
  if (v.changes.some((c) => c.id === "sleep_shift" || c.id === "stress_shift")) questions.push({ text: "Could the changes in my sleep or stress be connected to what I've noticed, or is that unlikely?" });
  if (extra.goal) questions.push({ text: "Given my plans, is there anything I should think about now rather than later?" });
  for (const q of extra.ruleQuestions) if (questions.length < 6) questions.push({ text: q });
  questions.push({ text: "Is there anything I should keep tracking, or stop tracking?" });

  const bring: Line[] = [
    ...(v.cycles.length ? [{ text: "Your cycle dates for the last {n} cycles (included in this guide)", vars: { n: Math.min(12, v.cycles.length) } }] : []),
    ...(count((o) => o.type === "lab") ? [{ text: "The original lab reports, not just the numbers" }] : []),
    { text: "A list of any medicines or supplements you take" },
    { text: "Any previous pregnancies or relevant history you're comfortable sharing" },
  ];
  const discussion: Line[] = [
    ...(v.changes.some((c) => c.kind === "pattern") ? [{ text: "Whether the change in your cycles needs any tests, or just more time" }] : []),
    ...(extra.goal ? [{ text: "Your plans and timing, and what information would help you decide" }] : []),
    { text: "What, if anything, you might choose to change, and what isn't in your control" },
    { text: "Whether a referral to a specialist would help, and when" },
  ];
  return { why, timeline, shared, unknown, questions, bring, discussion };
}

// ---------- the assistant: intents, context and Masar's own structured answer ----------

export type Intent = "changes" | "relevant" | "missing" | "why" | "evidence" | "cannot" | "specialist" | "prepare" | "lab" | "track";

export const INTENT_QUESTION: Record<Intent, string> = {
  changes: "What has changed over the last six months?",
  relevant: "Which observations are relevant to my reproductive goals?",
  missing: "What information is missing?",
  why: "Why did Masar surface this observation?",
  evidence: "What does the available evidence support?",
  cannot: "What cannot be concluded from my information?",
  specialist: "What should I discuss with a specialist?",
  prepare: "Help me prepare for an appointment.",
  lab: "Explain my latest laboratory result in the context of my history.",
  track: "What information should I continue tracking?",
};

export function intentOf(q: string): Intent {
  const t = q.toLowerCase();
  if (/miss|gap|unknown|ناقص|مفقود|غير معروف/.test(t)) return "missing";
  if (/cannot|can't|conclud|لا يمكن|استنتاج/.test(t)) return "cannot";
  if (/lab|result|amh|test|نتيجة|تحليل|مختبر/.test(t)) return "lab";
  if (/specialist|اختصاص|أخصائي/.test(t)) return "specialist";
  if (/prepare|appointment|visit|موعد|تحضير|أستعد/.test(t)) return "prepare";
  if (/track|log|keep|تتبع|تسجيل/.test(t)) return "track";
  if (/evidence|support|دليل|أدلة/.test(t)) return "evidence";
  if (/why|surface|لماذا/.test(t)) return "why";
  if (/goal|plan|relevant|هدف|خطط/.test(t)) return "relevant";
  return "changes";
}

export interface Answer {
  observation: string;
  context: string;
  evidence: string[];
  uncertainty: string;
  options: string[];
  preparation: string[];
  pathway: string;
  /** ids of the observations or changes it is about */
  references: string[];
}

type Say = (l: Line) => string;

/** Lines joined into one paragraph, each ending as a sentence. */
export const sentences = (xs: string[]) => xs.map((x) => (/[.!?؟]$/.test(x.trim()) ? x.trim() : `${x.trim()}.`)).join(" ");

/** Masar's own answer, written from the same structured view the AI receives. */
export function masarAnswer(intent: Intent, v: JourneyView, say: Say, extra: { goal: string | null; insightTitles: string[] }): Answer {
  const real = v.changes.filter((c) => c.kind !== "data");
  const gaps = v.changes.filter((c) => c.kind === "data");
  const top = intent === "lab" ? v.changes.find((c) => c.id === "new_lab") : real[0];
  const pathway = say({ text: "A family doctor is a good first step for any of this. If a change continues, or you're planning a pregnancy soon, they can refer you to a specialist. In an emergency, call 999." });
  const ev = (cs: Change[]) => cs.map((c) => `${say(c.title)}: ${say({ text: c.evidence.citation })} · ${say({ text: c.evidence.strength })}`);
  const shared = v.lanes.filter((l) => l.allowed).length;
  const ctx = say({ text: "Based on {n} observations you allowed Masar to use, up to {date}. Withheld: {withheld}.", vars: { n: v.obs.length, date: v.asOf, withheld: v.withheld.length ? v.withheld.map((s) => say({ text: SCOPE_LABEL[s] })).join(", ") : say({ text: "nothing" }) } });
  const missing = [...v.baseline.missing, ...v.changes.flatMap((c) => c.missing)].map(say);
  const base: Answer = {
    observation: "",
    context: ctx,
    evidence: ev(real),
    uncertainty: [...new Set(real.flatMap((c) => c.cannot.map(say)))].slice(0, 3).join(" ") || v.baseline.cannot.map(say).join(" "),
    options: [...new Set(real.flatMap((c) => c.next.map(say)))].slice(0, 3),
    preparation: guideDraft(v.cycles.length ? "female" : "male", v, { goal: extra.goal, insightTitles: extra.insightTitles, ruleQuestions: [], conditions: [] }).questions.slice(0, 3).map(say),
    pathway,
    references: real.map((c) => c.id),
  };
  switch (intent) {
    case "missing":
      return { ...base, observation: missing.length ? say({ text: "{n} things are missing or not shared.", vars: { n: missing.length } }) : say({ text: "Nothing Masar looks at is missing right now." }), context: [ctx, ...missing].join(" "), evidence: ev(gaps), references: gaps.map((c) => c.id), options: [say({ text: "Fill a gap only if you want to: nothing missing is held against you." })] };
    case "cannot":
      return { ...base, observation: say({ text: "What your information cannot show" }), uncertainty: [...v.baseline.cannot.map(say), ...real.flatMap((c) => c.cannot.map(say))].join(" ") };
    case "lab":
      return top ? { ...base, observation: `${say(top.title)}. ${say(top.what)}`, evidence: ev([top]), uncertainty: top.cannot.map(say).join(" "), options: top.next.map(say), references: [top.id, ...top.supports] } : { ...base, observation: say({ text: "There is no recent lab result in what you've shared." }) };
    case "track":
      return { ...base, observation: say({ text: "What is most useful to keep tracking" }), options: [...(v.cycles.length ? [say({ text: "When each period starts: it is what shows whether your cycles settle." })] : []), say({ text: "Short check-ins on sleep and stress, when you feel like it." }), say({ text: "Nothing else is needed. Tracking is optional and skipping is fine." })] };
    case "prepare":
    case "specialist":
      return { ...base, observation: say({ text: "What you could bring to the conversation" }), options: base.preparation };
    default:
      return {
        ...base,
        observation: real.length ? sentences(real.flatMap((c) => [say(c.title), say(c.what)])) : say({ text: "Masar hasn't noticed a change in what you've shared over this period. That only covers what is shared, and isn't a guarantee." }),
        context: shared ? ctx : say({ text: "You haven't shared any tracking data yet." }),
      };
  }
}

/** The structured, authorised context Gemini receives: only permitted data, with ids it may cite. */
export function aiContext(r: Resident, v: JourneyView, extra: { goal: string | null; insightTitles: string[]; ageBand: string }): string {
  const lines: string[] = [];
  lines.push(`Person: ${r.sex === "female" ? "woman" : "man"}, aged ${extra.ageBand}. Data up to ${v.asOf}. All data is synthetic.`);
  lines.push(`Reproductive goals: ${extra.goal ?? "not shared"}`);
  lines.push(`Permissions off (do not ask about or guess this data): ${v.withheld.length ? v.withheld.map((s) => SCOPE_LABEL[s]).join(", ") : "none"}`);
  if (v.cycles.length) lines.push(`Cycle lengths in days, oldest first: ${v.cycles.map((c) => c.days).join(", ")} (logged by the person)`);
  const sym = v.obs.filter((o) => o.type === "symptom");
  if (sym.length) lines.push(`Symptoms logged: ${sym.slice(-6).map((o) => `${o.at} ${SYMPTOM_LABEL[String(o.value)] ?? o.value}`).join("; ")}`);
  for (const l of v.obs.filter((o) => o.type === "lab")) lines.push(`Lab [${l.id}] ${l.label}: ${l.value} ${l.unit} on ${l.at}, ${l.source}, reference range: ${l.ref ?? "not printed"}`);
  for (const c of v.obs.filter((o) => o.type === "condition")) lines.push(`Diagnosis on record [${c.id}]: ${c.value}`);
  lines.push("Changes Masar's rules detected:");
  if (!v.changes.length) lines.push("- none");
  for (const c of v.changes) {
    const s = (l: Line) => Object.entries(l.vars ?? {}).reduce((t, [k, x]) => t.split(`{${k}}`).join(String(x)), l.text);
    lines.push(`- [${c.id}] ${s(c.title)}. ${s(c.what)} Evidence: ${c.evidence.citation} (${c.evidence.strength}). Rule: ${s(c.evidence.rule)} Cannot tell: ${c.cannot.map(s).join(" ")} Missing: ${c.missing.map(s).join(" ") || "nothing noted"}`);
  }
  if (extra.insightTitles.length) lines.push(`Findings from Masar's published rules: ${extra.insightTitles.join("; ")}`);
  lines.push(`Not known: ${v.baseline.missing.map((l) => Object.entries(l.vars ?? {}).reduce((t, [k, x]) => t.split(`{${k}}`).join(String(x)), l.text)).join("; ") || "nothing listed"}`);
  return lines.join("\n");
}
