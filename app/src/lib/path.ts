// Turns what Masar already knows about a person into the resident's path:
// a headline, chapters of labelled statements, and a picture of what's
// missing. Pure and deterministic. It adds no rule, threshold or
// interpretation of its own: every finding comes from signals.ts, every
// change from trajectory.ts, every limit from the rules' own "cannot tell"
// text. Values without a Masar rule (thyroid, blood sugar) are shown as
// recorded, against the lab's own printed range where there is one.
//
// Text is English with {placeholders}; screens translate it.

import { CONDITION_LABEL, INTENTION_LABEL, SOURCES, type OptionKind, type Reading, type SourceId, type Urgency } from "./model";
import { RULES, type Signal, type SignalCode, type VisibleRecord } from "./signals";
import type { Factor, MeasureView } from "./trajectory";
import type { Certainty } from "./certainty";

export interface Line {
  text: string;
  vars?: Record<string, string | number>;
}

export interface PathStatement {
  kind: Certainty;
  line: Line;
  /** where it comes from: source, rule or citation */
  meta?: Line;
  /** when the fact was recorded (ISO date) */
  date?: string;
  /** for things the person can or can't change */
  canChange?: boolean;
}

export interface ChapterSignal {
  code: SignalCode;
  title: string;
  urgency: Urgency;
  statements: PathStatement[];
  options: OptionKind[];
  /** a question the person can ask the assistant about this finding */
  ask: string;
}

export type ChapterId = "plans" | "cycles" | "reserve" | "sperm" | "metabolic" | "conditions" | "family" | "life";

export interface Chapter {
  id: ChapterId;
  title: string;
  summary: Line;
  signals: ChapterSignal[];
  measures: { view: MeasureView; statement: PathStatement }[];
  statements: PathStatement[];
}

/** A value from a confirmed report, with the range the lab printed. */
export interface ReportedValue {
  code: string | null;
  name: string;
  value: number;
  unit: string;
  date: string | null;
  refLow?: number | null;
  refHigh?: number | null;
  uploadedAt?: string;
}

export interface PathInput {
  record: VisibleRecord;
  signals: Signal[];
  measures: MeasureView[];
  factors: Factor[];
  sources: Record<SourceId, boolean>;
  /** values from reports the person confirmed; only passed while Lab results is on */
  confirmedValues: ReportedValue[];
  scanning: boolean;
}

const SOURCE_LABEL = Object.fromEntries(SOURCES.map((s) => [s.id, s.label])) as Record<SourceId, string>;

export const CHAPTER_TITLE: Record<ChapterId, string> = {
  plans: "Your plans and timing",
  cycles: "Cycles",
  reserve: "Egg reserve",
  sperm: "Sperm health",
  metabolic: "Metabolic health",
  conditions: "Conditions and treatment",
  family: "Family history",
  life: "Everyday life",
};

export const SIGNAL_CHAPTER: Record<SignalCode, ChapterId> = {
  FAMILY_EARLY_MENOPAUSE: "family",
  AMH_FALL: "reserve",
  AMH_LOW: "reserve",
  CONDITION_PLANS: "conditions",
  AGE35_LATER: "plans",
  CANCER_BEFORE_TREATMENT: "conditions",
  CYCLE_IRREGULAR: "cycles",
  MALE_LIFESTYLE: "life",
  SEMEN_BELOW_REFERENCE: "sperm",
  PERIOD_SYMPTOMS: "cycles",
  MALE_STEROIDS: "sperm",
  MALE_HISTORY: "sperm",
  UNDERWEIGHT_PLANS: "metabolic",
};

export const MEASURE_CHAPTER: Record<string, ChapterId> = {
  amh: "reserve",
  cycle_length: "cycles",
  bmi: "metabolic",
  hba1c: "metabolic",
  semen_concentration: "sperm",
  sleep_hours: "life",
};

const FACTOR_CHAPTER: Record<string, ChapterId> = {
  Age: "plans",
  "Family history": "family",
  Condition: "conditions",
  Smoking: "life",
  "Weight for height (BMI)": "metabolic",
  Sleep: "life",
  Stress: "life",
  Activity: "life",
  Heat: "sperm",
};

/** How a rule's stated reason should be labelled. */
export function reasonKind(reason: string): Certainty {
  if (/^No .* on record$/.test(reason)) return "unknown";
  if (/ fell from .* over \d+ months$/.test(reason)) return "trend";
  if (/^You told us|^Your mother or sister|plan children later|may want children|^You may want children$|^Planning children soon$|^Pregnancy possible/.test(reason)) return "said";
  return "fact";
}

const latest = (readings: Reading[], code: string) => readings.filter((r) => r.code === code).sort((a, b) => a.at.localeCompare(b.at)).at(-1);

/** The measure a finding is about, so its statements can carry the reading's date. */
export const SIGNAL_MEASURE: Partial<Record<SignalCode, string>> = {
  AMH_FALL: "amh",
  AMH_LOW: "amh",
  SEMEN_BELOW_REFERENCE: "semen_concentration",
  UNDERWEIGHT_PLANS: "bmi",
  MALE_LIFESTYLE: "bmi",
  CYCLE_IRREGULAR: "cycle_length",
};
const signalDate = (code: SignalCode, readings: Reading[]) => {
  const measure = SIGNAL_MEASURE[code];
  return measure ? latest(readings, measure)?.at : undefined;
};

/** One finding, laid out as: why it was raised, what the evidence says, what it can't tell. */
function signalStatements(s: Signal, readings: Reading[]): PathStatement[] {
  const rule = RULES[s.code];
  const recorded = s.sources.find((x) => x !== "self");
  const date = signalDate(s.code, readings);
  const reasons: PathStatement[] = s.reasons.map((r) => {
    const kind = reasonKind(r);
    return {
      kind,
      line: { text: r },
      meta:
        kind === "said"
          ? { text: "What you told Masar" }
          : kind === "trend"
            ? { text: "Masar's rule for a real change" }
            : recorded
              ? { text: SOURCE_LABEL[recorded] }
              : undefined,
      date: kind === "said" ? undefined : date,
    };
  });
  return [
    ...reasons,
    {
      kind: "evidence",
      line: { text: rule.whyItMatters },
      meta: { text: "{citation} · {strength} evidence", vars: { citation: rule.evidence.citation, strength: rule.evidence.strength } },
    },
    { kind: "unknown", line: { text: rule.cannotTell }, meta: { text: "What this can't tell you" } },
  ];
}

const VERDICT_KIND: Record<MeasureView["verdict"], Certainty> = { meaningful: "trend", normal: "steady", single: "unknown", too_close: "unknown" };
const VERDICT_TEXT: Record<MeasureView["verdict"], string> = {
  meaningful: "A real change: bigger than the normal ups and downs between tests.",
  normal: "Within the normal ups and downs between tests.",
  single: "Only one result so far, so Masar can't describe a change yet.",
  too_close: "The last two results are too close together to compare.",
};

function measureStatement(view: MeasureView): PathStatement {
  return {
    kind: VERDICT_KIND[view.verdict],
    line: { text: VERDICT_TEXT[view.verdict] },
    meta: { text: "Masar's rule: {rule}", vars: { rule: view.def.rule } },
    date: view.readings.at(-1)?.at,
  };
}

const ANSWER: Record<string, Record<string, string>> = {
  partner: { yes: "You have a partner.", no: "You don't have a partner at the moment." },
  pregnantBefore: { yes: "You have been pregnant before.", no: "You haven't been pregnant before." },
  fatheredBefore: { yes: "You have fathered a pregnancy before.", no: "You haven't fathered a pregnancy before." },
  stress: { low: "You've felt mostly calm lately.", some: "You've felt some stress lately.", high: "You've felt very stressed lately." },
  activity: { rarely: "You're rarely active enough to get out of breath.", weekly: "You're active once or twice a week.", often: "You're active three times a week or more." },
};

/** Builds the chapters that have something to say. */
export function buildChapters(input: PathInput): Chapter[] {
  const { record, signals, measures, factors, sources } = input;
  const sex = record.sex;
  const ids: ChapterId[] =
    sex === "female" ? ["plans", "cycles", "reserve", "family", "conditions", "metabolic", "life"] : ["plans", "sperm", "conditions", "metabolic", "life"];
  const chapters = new Map<ChapterId, Chapter>(
    ids.map((id) => [id, { id, title: CHAPTER_TITLE[id], summary: { text: "" }, signals: [], measures: [], statements: [] }]),
  );
  const add = (id: ChapterId, s: PathStatement) => chapters.get(id)?.statements.push(s);

  // Findings, from the rules only.
  for (const s of signals) {
    const id = SIGNAL_CHAPTER[s.code];
    const rule = RULES[s.code];
    chapters.get(id)?.signals.push({
      code: s.code,
      title: rule.title,
      urgency: rule.urgency,
      statements: signalStatements(s, record.readings),
      options: rule.options,
      ask: rule.questions[0],
    });
  }

  // Changes over time, from the meaningful-change rules only.
  for (const view of measures) {
    const id = MEASURE_CHAPTER[view.def.code];
    if (id) chapters.get(id)?.measures.push({ view, statement: measureStatement(view) });
  }

  // Plans and context the person gave. Shown as context; none of it raises a finding here.
  if (record.intention) {
    add("plans", { kind: "said", line: { text: "Plans for children: {plans}.", vars: { plans: INTENTION_LABEL[record.intention] } }, meta: { text: "What you told Masar" } });
  } else {
    add("plans", { kind: "unknown", line: { text: "Masar doesn't know your plans for children, so it can't match options to them." }, meta: { text: "Not shared" } });
  }
  const r = record.reported;
  for (const key of ["partner", sex === "female" ? "pregnantBefore" : "fatheredBefore"]) {
    const answer = r?.[key as "partner"];
    const text = answer ? ANSWER[key]?.[answer] : undefined;
    if (text) add("plans", { kind: "said", line: { text }, meta: { text: "Context only" } });
  }
  for (const key of ["stress", "activity"] as const) {
    const answer = r?.[key];
    const text = answer ? ANSWER[key]?.[answer] : undefined;
    if (text) add("life", { kind: "said", line: { text }, meta: { text: "Context only" }, canChange: true });
  }

  // Factors: what can and can't change. The age, smoking, BMI and sleep notes are Masar's existing copy.
  for (const f of factors) {
    const id = FACTOR_CHAPTER[f.label];
    if (!id) continue;
    if (f.label === "Stress" || f.label === "Activity") continue; // already stated above in the person's words
    const kind: Certainty = f.label === "Family history" || f.label === "Heat" || (f.label === "Sleep" && !latest(record.readings, "sleep_hours")) ? "said" : "fact";
    add(id, {
      kind,
      line: { text: "{label}: {value}. {note}", vars: { label: f.label, value: f.value, note: f.note } },
      meta: kind === "said" ? { text: "What you told Masar" } : undefined,
      canChange: f.canChange,
    });
  }

  // Thyroid: shown only against the range the lab printed. Masar has no thyroid rule.
  for (const v of input.confirmedValues.filter((x) => x.code === "tsh")) {
    const lo = v.refLow ?? null;
    const hi = v.refHigh ?? null;
    const printed = lo !== null && hi !== null;
    add("metabolic", {
      kind: "fact",
      line: printed
        ? {
            text:
              v.value < lo! || v.value > hi!
                ? "Thyroid (TSH): {value} {unit}. Outside the range the lab printed on your report ({lo}–{hi})."
                : "Thyroid (TSH): {value} {unit}. Within the range the lab printed on your report ({lo}–{hi}).",
            vars: { value: v.value, unit: v.unit, lo: lo!, hi: hi! },
          }
        : { text: "Thyroid (TSH): {value} {unit}. Your report didn't print a reference range, so Masar shows the value only.", vars: { value: v.value, unit: v.unit } },
      meta: { text: "Your uploaded report" },
      date: v.date ?? v.uploadedAt?.slice(0, 10),
    });
    add("metabolic", { kind: "unknown", line: { text: "Masar doesn't interpret thyroid results. Your doctor will go through this one with you." } });
  }

  // Blood sugar: the recorded values and their trend, with no reproductive interpretation.
  if (measures.some((m) => m.def.code === "hba1c")) {
    add("metabolic", { kind: "unknown", line: { text: "Masar records blood sugar (HbA1c) and how it changes, but draws no conclusion about fertility from it." } });
  }

  // Sources that are switched off: say what is hidden rather than hiding it silently.
  const off = (src: SourceId, id: ChapterId, text: string) => {
    if (!sources[src] && chapters.has(id)) add(id, { kind: "unknown", line: { text }, meta: { text: "Not shared" } });
  };
  if (sex === "female") {
    off("device", "cycles", "Phone and wearable is off, so Masar can't see your cycle dates.");
    off("lab", "reserve", "Lab results is off, so Masar can't see any egg-reserve (AMH) results.");
    off("self", "family", "What you tell us is off, so Masar can't use your family history.");
  } else {
    off("lab", "sperm", "Lab results is off, so Masar can't see any sperm test results.");
  }
  off("malaffi", "conditions", "Clinic records is off, so Masar can't see diagnoses from your clinic visits.");
  if (record.conditions.length === 0 && sources.malaffi) {
    add("conditions", { kind: "fact", line: { text: "No relevant condition in your clinic records." }, meta: { text: SOURCE_LABEL.malaffi } });
  }

  const out = [...chapters.values()].filter((c) => c.signals.length || c.measures.length || c.statements.length);
  for (const c of out) {
    c.summary = !input.scanning
      ? { text: "Masar isn't looking for anything new." }
      : c.signals.length === 1
        ? { text: "One thing worth a conversation." }
        : c.signals.length > 1
          ? { text: "{n} things worth a conversation.", vars: { n: c.signals.length } }
          : c.statements.every((s) => s.kind === "unknown") && !c.measures.length
            ? { text: "Not enough shared to say anything yet." }
            : { text: "Nothing here needs a conversation right now." };
  }
  // Chapters with findings first, keeping their natural order otherwise.
  return out.sort((a, b) => Number(b.signals.length > 0) - Number(a.signals.length > 0));
}

const COUNT = ["", "One thing", "Two things", "Three things", "Four things", "Five things"];

/** The opening sentence of the path, decided by the rules' timing alone. */
export function headline(signals: Signal[], urgency: Urgency | null, scanning: boolean): { line: Line; emphasis: Line } {
  if (!scanning) return { line: { text: "{name}, Masar is paused." }, emphasis: { text: "You asked it not to look for anything new." } };
  if (!signals.length || !urgency) {
    return { line: { text: "{name}, nothing in what you've shared needs a conversation right now." }, emphasis: { text: "That isn't a guarantee: it only covers what Masar can see." } };
  }
  const count = COUNT[signals.length] ?? "{n} things";
  return {
    line: { text: `{name}, ${count.toLowerCase()} in your record ${signals.length === 1 ? "is" : "are"} worth a conversation`, vars: { n: signals.length } },
    emphasis: {
      text: { urgent: "before treatment starts.", soon: "soon, not someday.", routine: "at your next routine visit." }[urgency],
    },
  };
}

export interface CoverageItem {
  label: string;
  status: "on" | "missing" | "off";
  /** what having it would let Masar describe */
  why: string;
}

/** What Masar has, what it doesn't, and what is switched off. A list, never a score. */
export function coverage(input: PathInput): CoverageItem[] {
  const { record, sources } = input;
  const has = (code: string) => record.readings.some((r) => r.code === code);
  const planning = record.intention === "TryingSoon" || record.intention === "TryingNow" || record.intention === "MaybeLater";
  const items: CoverageItem[] = [
    { label: "Your plans for children", status: !sources.self ? "off" : record.intention ? "on" : "missing", why: "So options match what you want, and when." },
  ];
  if (record.sex === "female") {
    items.push({ label: "Cycle dates", status: !sources.device ? "off" : has("cycle_length") ? "on" : "missing", why: "So Masar can describe whether your cycles are changing." });
    items.push({
      label: "An egg-reserve (AMH) result",
      status: !sources.lab ? "off" : has("amh") ? "on" : "missing",
      why: "Only if a doctor thinks it would help. It can narrow uncertainty about timing; it can't measure egg quality.",
    });
  } else {
    items.push({
      label: "A semen analysis",
      status: !sources.lab ? "off" : has("semen_concentration") ? "on" : "missing",
      why: planning ? "Only if a doctor thinks it would help. One result needs a repeat before any change is called." : "Only relevant if you are planning children.",
    });
  }
  items.push({ label: "A recent weight measurement", status: !sources.healthAge && !has("bmi") ? "off" : has("bmi") ? "on" : "missing", why: "Weight is one of the things you can change." });
  items.push({ label: "Clinic records", status: sources.malaffi ? "on" : "off", why: "So conditions worth planning around are included." });
  return items;
}

export const CONDITION_NAMES = CONDITION_LABEL;
