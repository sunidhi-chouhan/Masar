import "server-only";
import { CHAPTERS, labelOf, questionById, toRuleAnswers, visibleQuestions, type JAnswers, type SummaryInput } from "@/lib/journey";
import { beliefItems } from "@/lib/checks";
import type { Belief, PersonState } from "./store";
import { coverage } from "@/lib/path";
import { MEASURES } from "@/lib/trajectory";
import { CONDITION_LABEL, type Sex } from "@/lib/model";
import { RULES } from "@/lib/signals";
import type { PersonView } from "./views";

// Builds what the journey's summary is made from, from the person's own view
// (already limited to the sources they switched on).

export function ageBand(age: number): string {
  if (age < 25) return "18–24";
  if (age < 30) return "25–29";
  if (age < 35) return "30–34";
  if (age < 40) return "35–39";
  return "40–45";
}

/** "Question: answer" for every visible, answered question in a chapter (or all). */
export function answeredLines(sex: Sex, a: JAnswers, tr: (s: string) => string, chapter?: string): string[] {
  return visibleQuestions(sex, a)
    .filter((q) => !chapter || q.chapter === chapter)
    .flatMap((q) => {
      const v = a[q.id];
      if (v === undefined || (Array.isArray(v) && !v.length)) return [];
      const values = Array.isArray(v) ? v : [v];
      const label = values.map((x) => tr(q.options.find((o) => o.value === x)?.label ?? x)).join(", ");
      return [`${tr(q.text)} ${label}`];
    });
}

const CHANGE_IDS = ["cycleChange", "cycleSince", "periodPain"];

export function buildSummaryInput(v: PersonView, tr: (s: string) => string): SummaryInput {
  const sex = v.resident.sex;
  const j = v.state.journey;
  // Answers are "What you tell us": without that source they are not used, here or anywhere.
  const a: JAnswers = v.state.sources.self ? j.answers : {};
  const lines = (chapter: string, exclude: string[] = []) =>
    visibleQuestions(sex, a)
      .filter((q) => q.chapter === chapter && !exclude.includes(q.id))
      .flatMap((q) => {
        const l = labelOf(q, a[q.id]);
        return l ? [`${tr(q.text)} ${l.split(", ").map(tr).join(", ")}`] : [];
      });
  const changes = CHANGE_IDS.flatMap((id) => {
    const q = questionById(id);
    const l = q ? labelOf(q, a[id]) : null;
    return q && l ? [`${tr(q.text)} ${tr(l)}`] : [];
  });

  const followUps = v.state.sources.self
    ? (j.followUps?.questions ?? []).flatMap((q) => {
        const ans = j.followUpAnswers[q.id];
        const label = q.options.find((o) => o.value === ans)?.label;
        return label ? [`${tr(q.text)} ${tr(label)}`] : [];
      })
    : [];

  const records = [
    ...v.measures.map((m) => {
      const last = m.readings.at(-1)!;
      return `${tr(MEASURES.find((x) => x.code === m.def.code)?.label ?? m.def.label)}: ${last.value} ${last.unit} (${last.at})`;
    }),
    ...v.record.conditions.map((c) => `${tr(CONDITION_LABEL[c])} (${tr("from your clinic records")})`),
  ];

  const cover = coverage({
    record: v.record,
    signals: v.signals,
    measures: v.measures,
    factors: v.factors,
    sources: v.state.sources,
    confirmedValues: [],
    scanning: v.state.scanning,
  })
    .filter((c) => c.status !== "on")
    .map((c) => `${tr(c.label)}: ${c.status === "off" ? tr("Not shared") : tr("Not on record yet")}`);
  if (v.state.sources.self && !a.goal) cover.unshift(tr("Your plans for children"));

  return {
    goals: lines("goals"),
    history: lines("history", CHANGE_IDS),
    changes,
    lifestyle: lines("life"),
    help: lines("help"),
    followUps,
    records,
    findings: v.state.scanning ? v.signals.map((s) => tr(RULES[s.code].title)) : [],
    missing: cover,
    ruleQuestions: [...new Set(v.signals.flatMap((s) => RULES[s.code].questions))].slice(0, 4).map(tr),
    wantsQuestions: a.prepareQuestions === "yes",
  };
}

export const CHAPTER_IDS = CHAPTERS.map((c) => c.id);

// ---------- committing the journey: the consent rule, in one testable place ----------

export interface JourneyDraft {
  answers: JAnswers;
  /** the quick check: the evaluation statements, then the educational one */
  knowledge: (string | null)[];
  worry: number | null;
}

const BELIEF_VALUES: Belief[] = ["true", "false", "unsure"];

/** Keeps only real options of questions that are visible given the other answers. */
export function cleanAnswers(sex: Sex, raw: JAnswers): JAnswers {
  const out: JAnswers = {};
  for (const [id, v] of Object.entries(raw ?? {})) {
    const q = questionById(id);
    if (!q || (q.sex && q.sex !== sex)) continue;
    const allowed = new Set(q.options.map((o) => o.value));
    if (Array.isArray(v)) {
      const kept = q.multi ? v.filter((x) => typeof x === "string" && allowed.has(x)) : [];
      if (kept.length) out[id] = kept;
    } else if (typeof v === "string" && allowed.has(v) && !q.multi) out[id] = v;
  }
  // Follow-ups that no longer apply are dropped, so nothing hidden lingers.
  const visible = new Set(visibleQuestions(sex, out).map((x) => x.id));
  for (const k of Object.keys(out)) if (!visible.has(k)) delete out[k];
  return out;
}

/**
 * What is stored when the person leaves the permissions step. Answers (About
 * you and the quick check) are stored only if "Your answers" is switched on;
 * otherwise anything stored from an earlier pass is removed, with the final
 * questions that were chosen from it.
 */
export function applyJourneyCommit(p: PersonState, sex: Sex, draft: JourneyDraft): { next: PersonState; stored: boolean; count: number } {
  if (!p.sources.self) {
    return {
      next: { ...p, answers: null, beliefsBefore: null, worryBefore: null, journey: { ...p.journey, answers: {}, followUps: null, followUpAnswers: {}, knowledgeExtra: null } },
      stored: false,
      count: 0,
    };
  }
  const answers = cleanAnswers(sex, draft.answers);
  const statements = beliefItems(sex).length;
  const k = Array.isArray(draft.knowledge) ? draft.knowledge : [];
  const belief = (x: unknown): Belief | null => (BELIEF_VALUES.includes(x as Belief) ? (x as Belief) : null);
  const beliefs = Array.from({ length: statements }, (_, i) => belief(k[i]) ?? "unsure");
  const answeredKnowledge = k.slice(0, statements).some((x) => belief(x));
  const worry = typeof draft.worry === "number" && draft.worry >= 1 && draft.worry <= 4 ? Math.round(draft.worry) : null;
  return {
    next: {
      ...p,
      answers: toRuleAnswers(sex, answers),
      beliefsBefore: answeredKnowledge ? beliefs : p.beliefsBefore,
      worryBefore: worry ?? p.worryBefore,
      journey: { ...p.journey, answers, knowledgeExtra: belief(k[statements]) },
    },
    stored: true,
    count: Object.keys(answers).length,
  };
}
