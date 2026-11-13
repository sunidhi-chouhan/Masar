// The resident's dashboard, built from what Masar already knows. Pure and
// deterministic: every finding comes from signals.ts, every change over time
// from trajectory.ts, every gap from path.ts's coverage, every limit from the
// rules' own "cannot tell" text. It reorganises; it never adds a finding, a
// number, a risk or a recommendation of its own. Sections are empty (and so
// not shown) when the person's information doesn't support them.
//
// Text is English with {placeholders}; screens translate it.

import { CONDITION_LABEL, INTENTION_LABEL, SOURCES, TOUCHPOINT_LABEL, type Condition, type OptionKind, type ReadingCode, type SourceId, type Touchpoint, type Urgency } from "./model";
import { RULES, type SignalCode } from "./signals";
import { MEASURES, missingFor } from "./trajectory";
import { CHAPTER_TITLE, MEASURE_CHAPTER, SIGNAL_CHAPTER, SIGNAL_MEASURE, coverage, headline, reasonKind, type ChapterId, type Line, type PathInput } from "./path";
import type { Certainty } from "./certainty";
import { beliefItems } from "./checks";
import { EXTRA_STATEMENT } from "./journey";
import { MEASURE_INFO } from "./measure-info";

export type Topic = ChapterId;
export const TOPIC_TITLE = CHAPTER_TITLE;

const SOURCE_LABEL = Object.fromEntries(SOURCES.map((s) => [s.id, s.label])) as Record<SourceId, string>;

/** Where a statement comes from, always named. */
export interface Fact {
  text: Line;
  kind: Certainty;
  /** "What you told Masar", a source label, "Masar's rule", or a citation */
  source: string;
  date?: string;
  canChange?: boolean;
}

export interface Insight {
  code: SignalCode;
  topic: Topic;
  title: string;
  urgency: Urgency;
  because: Fact[];
  why: string;
  cannot: string;
  evidence: { citation: string; strength: "Strong" | "Moderate" };
  questions: string[];
  options: OptionKind[];
  measure?: ReadingCode;
}

/** Context Masar can explain from its own rules, without raising a finding. */
export interface ContextNote {
  id: string;
  topic: Topic;
  title: Line;
  body: Fact[];
}

export interface Series {
  code: ReadingCode;
  topic: Topic;
  label: string;
  unit: string;
  band?: [number, number];
  /** "noRule": shown as recorded (e.g. thyroid), Masar describes no change */
  verdict: "meaningful" | "normal" | "single" | "too_close" | "noRule";
  /** what the comparison says, in words (translatable: values are placeholders) */
  sentence: Line;
  rule: string;
  points: { at: string; value: number; source: string }[];
  refRange?: [number, number];
  info: { what: string; limits: string };
}

export interface TimelineEvent {
  at: string;
  kind: "lab" | "device" | "healthAge" | "malaffi" | "self" | "check" | "request" | "report";
  title: Line;
  detail?: Line;
}

export interface Action {
  id: string;
  group: "understand" | "missing" | "records" | "discuss" | "learn";
  title: Line;
  why: Line;
  href?: string;
  ask?: string;
}

export interface Dashboard {
  name: string;
  headline: { line: Line; emphasis: Line };
  urgency: Urgency | null;
  scanning: boolean;
  sourcesShared: number;
  picture: { on: number; missing: number; off: number; items: { label: string; status: "on" | "missing" | "off"; why: string }[] };
  insights: Insight[];
  context: ContextNote[];
  known: Fact[];
  unknown: Fact[];
  explore: Fact[];
  series: Series[];
  timeline: TimelineEvent[];
  actions: Action[];
  prepare: { questions: string[]; generic: boolean; bring: Line[]; reason: Line; uncertainties: string[] };
}

export interface DashboardInput extends PathInput {
  name: string;
  /** conditions that come from clinic records (the rest in the record were told by the person) */
  recordConditions: Condition[];
  touchpoint: { kind: Touchpoint; at: string };
  /** quick-check answers: the evaluation statements, then the educational one */
  beliefs: (string | null)[] | null;
  request: { at: string; status: string; attendedAt?: string; bookedFor?: string } | null;
  reports: { test: string; requestedAt: string; uploadedAt?: string; status: string }[];
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function buildDashboard(input: DashboardInput): Dashboard {
  const { record, signals, measures, factors, sources } = input;

  // ---------- findings, from the rules only ----------
  const insights: Insight[] = signals.map((s) => {
    const rule = RULES[s.code];
    const recorded = s.sources.find((x) => x !== "self");
    const measure = SIGNAL_MEASURE[s.code] as ReadingCode | undefined;
    const date = measure ? record.readings.filter((r) => r.code === measure).sort((a, b) => a.at.localeCompare(b.at)).at(-1)?.at : undefined;
    return {
      code: s.code,
      topic: SIGNAL_CHAPTER[s.code],
      title: rule.title,
      urgency: rule.urgency,
      because: s.reasons.map((r) => {
        const kind = reasonKind(r);
        return {
          text: { text: r },
          kind,
          source: kind === "said" ? "What you told Masar" : kind === "trend" ? "Compared with your earlier results" : recorded ? SOURCE_LABEL[recorded] : "Your record",
          date: kind === "said" ? undefined : date,
        };
      }),
      why: rule.whyItMatters,
      cannot: rule.cannotTell,
      evidence: rule.evidence,
      questions: rule.questions,
      options: rule.options,
      measure,
    };
  });
  const codes = new Set(signals.map((s) => s.code));

  // ---------- context the rules can explain without raising a finding ----------
  const context: ContextNote[] = [];
  const planningConditions = record.conditions.filter((c) => c !== "cancer_new");
  if (planningConditions.length && !codes.has("CONDITION_PLANS")) {
    for (const c of planningConditions) {
      const fromRecords = input.recordConditions.includes(c);
      context.push({
        id: `condition-${c}`,
        topic: "conditions",
        title: { text: "{condition}", vars: { condition: CONDITION_LABEL[c] } },
        body: [
          { text: { text: "{condition} is on record.", vars: { condition: CONDITION_LABEL[c] } }, kind: fromRecords ? "fact" : "said", source: fromRecords ? SOURCE_LABEL.malaffi : "What you told Masar" },
          { text: { text: RULES.CONDITION_PLANS.whyItMatters }, kind: "evidence", source: RULES.CONDITION_PLANS.evidence.citation },
          {
            text: { text: "We haven't raised this as something to discuss now, because you're not planning a pregnancy in the next few years. If your plans change, we will." },
            kind: "unknown",
            source: "Masar's rule",
          },
          { text: { text: RULES.CONDITION_PLANS.cannotTell }, kind: "unknown", source: "What this can't tell you" },
        ],
      });
    }
  }

  // ---------- results over time, from the meaningful-change rules only ----------
  const series: Series[] = measures.map((m) => ({
    code: m.def.code,
    topic: (MEASURE_CHAPTER[m.def.code] ?? "life") as Topic,
    label: m.def.label,
    unit: m.def.unit,
    band: m.def.band,
    verdict: m.verdict,
    sentence: sentenceFor(m),
    rule: m.def.rule,
    points: m.readings.map((r) => ({ at: r.at, value: r.value, source: SOURCE_LABEL[r.source] })),
    info: MEASURE_INFO[m.def.code],
  }));
  // Thyroid from confirmed reports: shown as recorded, against the lab's own printed range. No rule.
  const tsh = input.confirmedValues.filter((x) => x.code === "tsh");
  if (tsh.length) {
    const withRange = tsh.find((x) => x.refLow != null && x.refHigh != null);
    series.push({
      code: "tsh",
      topic: "metabolic",
      label: "Thyroid (TSH)",
      unit: tsh[0].unit,
      verdict: "noRule",
      sentence: tsh.length === 1 ? { text: "One result, from the report you uploaded." } : { text: "{n} results, from your uploaded reports.", vars: { n: tsh.length } },
      rule: "Masar doesn't judge thyroid results. Your doctor can explain what yours mean.",
      points: tsh.map((x) => ({ at: x.date ?? x.uploadedAt?.slice(0, 10) ?? "", value: x.value, source: "Your uploaded report" })).filter((p) => p.at),
      refRange: withRange ? [withRange.refLow!, withRange.refHigh!] : undefined,
      info: MEASURE_INFO.tsh,
    });
  }

  // ---------- known, unknown, worth exploring ----------
  const known: Fact[] = [];
  if (record.intention) known.push({ text: { text: "Plans for children: {plans}.", vars: { plans: INTENTION_LABEL[record.intention] } }, kind: "said", source: "What you told Masar" });
  for (const c of record.conditions) {
    const fromRecords = input.recordConditions.includes(c);
    known.push({ text: { text: "{condition}.", vars: { condition: CONDITION_LABEL[c] } }, kind: fromRecords ? "fact" : "said", source: fromRecords ? SOURCE_LABEL.malaffi : "What you told Masar" });
  }
  for (const f of factors) {
    if (f.label === "Condition") continue; // listed above, with where it came from
    const said = f.label === "Family history" || f.label === "Stress" || f.label === "Activity" || f.label === "Heat" || (f.label === "Sleep" && !record.readings.some((r) => r.code === "sleep_hours"));
    known.push({ text: { text: "{label}: {value}.", vars: { label: f.label, value: f.value } }, kind: said ? "said" : "fact", source: said ? "What you told Masar" : f.label === "Age" ? "Your record" : sourceOfFactor(f.label, record.readings), canChange: f.canChange });
  }
  const r = record.reported;
  if (r?.cycles) {
    const text = ({ regular: "You told us your periods are regular.", irregular: "You told us your periods are irregular.", absent: "You told us you haven't had a period for 3 months or more." } as Record<string, string>)[r.cycles];
    if (text) known.push({ text: { text }, kind: "said", source: "What you told Masar" });
  }
  for (const s of series) {
    const last = s.points.at(-1);
    if (last) known.push({ text: { text: "{label}: {value} {unit}.", vars: { label: s.label, value: fmt(last.value), unit: s.unit } }, kind: "fact", source: last.source, date: last.at });
  }

  const pic = coverage(input);
  const unknown: Fact[] = [];
  if (!input.scanning) unknown.push({ text: { text: "You've paused Masar, so it isn't looking for anything new." }, kind: "unknown", source: "Your choice in My data" });
  for (const c of pic.filter((x) => x.status !== "on")) {
    unknown.push({
      text: { text: c.status === "off" ? "{label}: you haven't shared this." : "{label}: we don't have this yet.", vars: { label: c.label } },
      kind: "unknown",
      source: c.why,
    });
  }
  for (const s of series.filter((x) => x.verdict === "single" || x.verdict === "too_close")) {
    unknown.push({ text: { text: "{label}: we need more results before we can see a change.", vars: { label: s.label } }, kind: "unknown", source: "How Masar compares results" });
  }

  const explore: Fact[] = insights.map((i) => ({ text: { text: i.title }, kind: "evidence" as Certainty, source: i.evidence.citation }));
  for (const m of missingFor(record)) {
    if (/if a doctor thinks it would help/.test(m)) explore.push({ text: { text: m }, kind: "unknown", source: "Only a doctor can decide whether it's needed" });
  }

  // ---------- a timeline of what's on record ----------
  const timeline: TimelineEvent[] = [];
  const byDay = new Map<string, TimelineEvent>();
  for (const rd of record.readings) {
    const def = MEASURES.find((m) => m.code === rd.code);
    const label = def?.label ?? rd.code;
    // Cycles come in many entries; one event per month keeps the line readable.
    const key = rd.code === "cycle_length" ? `${rd.at.slice(0, 7)}-cycles` : `${rd.at}-${rd.code}`;
    if (byDay.has(key)) continue;
    const ev: TimelineEvent = {
      at: rd.at,
      kind: rd.source,
      title: rd.code === "cycle_length" ? { text: "Cycle recorded" } : { text: "{label}: {value} {unit}", vars: { label, value: fmt(rd.value), unit: rd.unit } },
      detail: { text: SOURCE_LABEL[rd.source] },
    };
    byDay.set(key, ev);
    timeline.push(ev);
  }
  for (const p of series.filter((s) => s.code === "tsh").flatMap((s) => s.points)) {
    timeline.push({ at: p.at, kind: "report", title: { text: "Thyroid (TSH): {value}", vars: { value: fmt(p.value) } }, detail: { text: "Your uploaded report" } });
  }
  timeline.push({ at: input.touchpoint.at, kind: "check", title: { text: TOUCHPOINT_LABEL[input.touchpoint.kind] }, detail: { text: "Where your path started" } });
  if (input.request) {
    timeline.push({ at: input.request.at, kind: "request", title: { text: "You asked for a conversation" } });
    if (input.request.attendedAt) timeline.push({ at: input.request.attendedAt, kind: "request", title: { text: "Conversation held" } });
  }
  for (const rep of input.reports) {
    if (rep.uploadedAt) timeline.push({ at: rep.uploadedAt.slice(0, 10), kind: "report", title: { text: "Report uploaded: {test}", vars: { test: rep.test } } });
  }
  timeline.sort((a, b) => a.at.localeCompare(b.at));

  // ---------- what could come next: suggestions, each with its reason ----------
  const actions: Action[] = [];
  for (const i of insights) {
    actions.push({ id: `understand-${i.code}`, group: "understand", title: { text: i.title }, why: { text: i.why }, href: `#insight-${i.code}`, ask: i.questions[0] });
  }
  for (const c of pic.filter((x) => x.status !== "on")) {
    actions.push(
      c.status === "off"
        ? { id: `off-${c.label}`, group: "missing", title: { text: "Share: {label}", vars: { label: c.label } }, why: { text: c.why }, href: "/me/privacy" }
        : { id: `missing-${c.label}`, group: "missing", title: { text: c.label }, why: { text: c.why } },
    );
  }
  for (const m of missingFor(record)) {
    if (/if a doctor thinks it would help/.test(m)) {
      actions.push({ id: `records-${m}`, group: "records", title: { text: m }, why: { text: "It could narrow the uncertainty. Only a doctor can decide whether it's needed." } });
    }
  }
  const questions = [...new Set(insights.flatMap((i) => i.questions))];
  const generic = !questions.length;
  const prepareQuestions = generic ? ["Is there anything I should check now, given my plans?", "What can I do to look after my fertility?", "When should I come back?"] : questions;
  actions.push({
    id: "discuss",
    group: "discuss",
    title: { text: "{n} questions you could bring to a doctor", vars: { n: prepareQuestions.length } },
    why: { text: generic ? "Nothing needs a conversation now, but these are good to ask at any check-up." : "They're based on what we noticed in your record." },
    href: "#prepare",
  });
  // Learning, matched to the quick check: what the evidence says where the person answered differently or wasn't sure.
  const items = [...beliefItems(record.sex), EXTRA_STATEMENT];
  input.beliefs?.forEach((b, i) => {
    const item = items[i];
    if (!item || !b || b === item.correct) return;
    actions.push({
      id: `learn-${i}`,
      group: "learn",
      title: { text: item.text },
      why: { text: b === "unsure" ? "You weren't sure about this in the quick check. What the evidence says: {answer}. {explain}" : "You answered differently in the quick check. What the evidence says: {answer}. {explain}", vars: { answer: item.correct === "true" ? "True" : "False", explain: item.explain } },
    });
  });

  // ---------- preparing for a doctor ----------
  const bring: Line[] = [];
  if (record.readings.some((x) => x.code === "cycle_length")) bring.push({ text: "Your recent cycle dates" });
  for (const s of series) {
    const last = s.points.at(-1);
    if (last && s.code !== "cycle_length" && s.code !== "sleep_hours") bring.push({ text: "Your latest {label} result ({value} {unit})", vars: { label: s.label, value: fmt(last.value), unit: s.unit } });
  }
  if (record.conditions.length) bring.push({ text: "A list of your conditions and current medicines" });
  for (const rep of input.reports.filter((x) => x.uploadedAt)) bring.push({ text: "Your uploaded report: {test}", vars: { test: rep.test } });
  bring.push({ text: "Your plans for children, and how soon" });

  const uncertainties = [...new Set([...insights.map((i) => i.cannot), ...pic.filter((x) => x.status !== "on").map((x) => x.label)])];
  const reason: Line = insights.length
    ? { text: insights.length === 1 ? "Masar suggested a conversation about one thing in my record." : "Masar suggested a conversation about {n} things in my record.", vars: { n: insights.length } }
    : { text: "I'd like to talk about my plans for children and what I should know now." };

  const rank = { urgent: 0, soon: 1, routine: 2 } as const;
  const urgency = insights.length ? insights.map((i) => i.urgency).sort((a, b) => rank[a] - rank[b])[0] : null;
  return {
    name: input.name,
    headline: headline(signals, urgency, input.scanning),
    urgency,
    scanning: input.scanning,
    sourcesShared: Object.values(sources).filter(Boolean).length,
    picture: { on: pic.filter((x) => x.status === "on").length, missing: pic.filter((x) => x.status === "missing").length, off: pic.filter((x) => x.status === "off").length, items: pic },
    insights,
    context,
    known,
    unknown,
    explore,
    series,
    timeline,
    actions,
    prepare: { questions: prepareQuestions, generic, bring, reason, uncertainties },
  };
}

const DAY = 86_400_000;

/** The comparison Masar's change rule made, as a translatable line. Same wording as trajectory.ts. */
function sentenceFor(m: PathInput["measures"][number]): Line {
  const s = m.readings;
  const w = m.def.windowSize;
  if (m.verdict === "single") {
    return w > 1
      ? { text: "{n} recorded so far. We need {need} to compare your recent ones with earlier ones.", vars: { n: s.length, need: w * 2 } }
      : { text: "Only one result so far. We need at least two, about six months apart, to see a trend." };
  }
  if (m.verdict === "too_close") return { text: "Your last two results were taken too close together to compare." };
  const prev = s.slice(-2 * w, -w).map((x) => x.value);
  const next = s.slice(-w).map((x) => x.value);
  if (w > 1) return { text: "Your last {w}: {latest} {unit}. The {w} before: {before}.", vars: { w, latest: next.join(", "), unit: m.def.unit, before: prev.join(", ") } };
  const months = Math.max(1, Math.round((Date.parse(s.at(-1)!.at) - Date.parse(s.at(-2)!.at)) / DAY / 30));
  return { text: "Went from {from} to {to} {unit} over {months} months.", vars: { from: fmt(prev[0]), to: fmt(next[0]), unit: m.def.unit, months } };
}

function sourceOfFactor(label: string, readings: PathInput["record"]["readings"]): string {
  const code = label === "Weight for height (BMI)" ? "bmi" : label === "Sleep" ? "sleep_hours" : null;
  if (code) {
    const last = readings.filter((r) => r.code === code).sort((a, b) => a.at.localeCompare(b.at)).at(-1);
    if (last) return SOURCE_LABEL[last.source];
  }
  if (label === "Smoking") return "What you told Masar or your Health Age check";
  return "Your record";
}

/** Every number a dashboard shows, for checking that none is invented. */
export function dashboardNumbers(d: Dashboard): number[] {
  const out: number[] = [];
  const scan = (l: Line) => {
    for (const v of Object.values(l.vars ?? {})) if (typeof v === "number") out.push(v);
    for (const m of `${l.text} ${Object.values(l.vars ?? {}).join(" ")}`.matchAll(/\d+(?:\.\d+)?/g)) out.push(Number(m[0]));
  };
  for (const f of [...d.known, ...d.insights.flatMap((i) => i.because), ...d.context.flatMap((c) => c.body)]) scan(f.text);
  for (const s of d.series) for (const p of s.points) out.push(p.value);
  return out;
}
