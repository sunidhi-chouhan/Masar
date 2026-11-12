"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "./session";
import { logAccess, person, updatePerson } from "./store";
import { personView } from "./views";
import { getLang } from "./lang";
import { t } from "@/lib/i18n";
import { HEROES } from "@/lib/population";
import { coverage } from "@/lib/path";
import { questionById, toRuleAnswers, visibleQuestions, type FollowUpSource } from "@/lib/journey";
import { makeFollowUps, makeSummary } from "./ai/journey-ai";
import { ageBand, answeredLines, applyJourneyCommit, buildSummaryInput, type JourneyDraft } from "./journey";

// The onboarding journey's server side. About you and the quick check happen
// in the browser: nothing the person answers reaches the server until they
// leave the permissions step, and then only if "Your answers" is switched on.
// Every action checks the session and re-reads consent from the store; none
// of them changes consent (that stays with the existing consent actions and
// their logging).

const resident = (id: string) => HEROES.find((h) => h.id === id)!;

/** Starts the journey (once) and returns its start time, which names the browser-only draft. */
export async function beginJourney(): Promise<{ startedAt: string }> {
  const s = await requireRole("person");
  let startedAt = person(s.id).journey.startedAt;
  if (!startedAt) {
    startedAt = new Date().toISOString();
    const at = startedAt;
    updatePerson(s.id, (p) => (p.onboarded ? p : { ...p, journey: { ...p.journey, startedAt: p.journey.startedAt ?? at, step: Math.max(p.journey.step, 1) } }));
  }
  return { startedAt: person(s.id).journey.startedAt ?? startedAt };
}

/** Remembers which stage the person reached. Only the stage: never a question, which could reveal an answer. */
export async function saveJourneyStep(step: number) {
  const s = await requireRole("person");
  const st = Math.max(0, Math.min(4, Math.round(step)));
  updatePerson(s.id, (p) => (p.onboarded ? p : { ...p, journey: { ...p.journey, step: st } }));
}

/**
 * Leaving the permissions step: stores the journey's answers if, and only if,
 * "Your answers" is on at this moment (read from the store, not the browser).
 * Otherwise anything stored earlier is removed.
 */
export async function commitJourney(draft: JourneyDraft): Promise<{ stored: boolean; count: number }> {
  const s = await requireRole("person");
  const r = resident(s.id);
  let result = { stored: false, count: 0 };
  updatePerson(s.id, (p) => {
    const applied = applyJourneyCommit(p, r.sex, draft);
    result = { stored: applied.stored, count: applied.count };
    return { ...applied.next, journey: { ...applied.next.journey, step: Math.max(applied.next.journey.step, 4) } };
  });
  logAccess({
    personId: s.id,
    who: "You",
    what: result.stored ? "Saved your journey answers, with your permission" : "Kept your journey answers off Masar (Your answers is off)",
    allowed: true,
  });
  return result;
}

/** Saves one answer from About me. Refused unless "Your answers" is on. */
export async function saveJourneyAnswer(id: string, value: string | string[] | null): Promise<{ ok: boolean }> {
  const s = await requireRole("person");
  if (!person(s.id).sources.self) return { ok: false };
  const q = questionById(id);
  if (!q) return { ok: false };
  const allowed = new Set(q.options.map((o) => o.value));
  let v: string | string[] | null = value;
  if (Array.isArray(v)) v = v.filter((x) => allowed.has(x));
  else if (typeof v === "string" && !allowed.has(v)) v = null;
  const r = resident(s.id);
  updatePerson(s.id, (p) => {
    const answers = { ...p.journey.answers };
    if (v === null || (Array.isArray(v) && !v.length)) delete answers[id];
    else answers[id] = v;
    const visible = new Set(visibleQuestions(r.sex, answers).map((x) => x.id));
    for (const k of Object.keys(answers)) if (!visible.has(k)) delete answers[k];
    return { ...p, journey: { ...p.journey, answers }, answers: toRuleAnswers(r.sex, answers) };
  });
  return { ok: true };
}

export interface FollowUpResult {
  source: FollowUpSource;
  questions: { id: string; text: string; why: string; options: { value: string; label: string }[] }[];
  answers: Record<string, string>;
}

/**
 * The two final questions, after permissions. None without "Your answers";
 * by the assistant only with its own permission; otherwise Masar's own.
 * Generated once per set of answers; asking again returns the same two.
 */
export async function journeyFollowUps(): Promise<FollowUpResult> {
  const s = await requireRole("person");
  const lang = await getLang();
  const r = resident(s.id);
  const p = person(s.id);
  if (!p.sources.self) return { source: "fallback", questions: [], answers: {} };
  const basis = JSON.stringify([lang, p.sources.self, p.assistantConsent, p.journey.answers]);
  if (p.journey.followUps && p.journey.followUps.basis === basis) {
    return { source: p.journey.followUps.source, questions: p.journey.followUps.questions, answers: p.journey.followUpAnswers };
  }
  const made = await makeFollowUps({
    personId: s.id,
    sex: r.sex,
    ageBand: ageBand(r.age),
    answers: p.journey.answers,
    answered: answeredLines(r.sex, p.journey.answers, (x) => x),
    lang,
  });
  updatePerson(s.id, (x) => ({
    ...x,
    journey: { ...x.journey, followUps: { ...made, at: new Date().toISOString(), basis }, followUpAnswers: {} },
  }));
  return { source: made.source, questions: made.questions, answers: {} };
}

/** An answer to one of the final two. Refused unless "Your answers" is on. */
export async function saveFollowUpAnswer(id: string, value: string | null) {
  const s = await requireRole("person");
  updatePerson(s.id, (p) => {
    if (!p.sources.self) return p;
    const q = p.journey.followUps?.questions.find((x) => x.id === id);
    if (!q) return p;
    const answers = { ...p.journey.followUpAnswers };
    if (value && q.options.some((o) => o.value === value)) answers[id] = value;
    else delete answers[id];
    return { ...p, journey: { ...p.journey, followUpAnswers: answers } };
  });
}

// ---------- preparing the path: four real steps, run in order by the client ----------

/** 1. Bringing your information together: marks the journey complete; the rule inputs were stored (or not) with permission. */
export async function finishSave() {
  const s = await requireRole("person");
  const r = resident(s.id);
  const p = person(s.id);
  const answered = p.sources.self ? Object.keys(p.journey.answers).length : 0;
  updatePerson(s.id, (x) => ({
    ...x,
    onboarded: true,
    answers: x.sources.self ? toRuleAnswers(r.sex, x.journey.answers) : null,
    journey: { ...x.journey, step: 4 },
  }));
  logAccess({ personId: s.id, who: "You", what: "Completed your journey", allowed: true });
  return { answered, permitted: p.sources.self };
}

/** 2. Reviewing your reproductive-health context: runs Masar's published rules on what you allowed. */
export async function finishReview() {
  const s = await requireRole("person");
  const v = personView(s.id);
  return { findings: v.signals.length, measures: v.measures.length };
}

/** 3. Identifying what is known and what is still missing. */
export async function finishKnown() {
  const s = await requireRole("person");
  const v = personView(s.id);
  const items = coverage({ record: v.record, signals: v.signals, measures: v.measures, factors: v.factors, sources: v.state.sources, confirmedValues: [], scanning: v.state.scanning });
  return { known: items.filter((c) => c.status === "on").length, missing: items.filter((c) => c.status !== "on").length };
}

/** 4. Preparing your personalised next steps: the summary, by the assistant with consent, otherwise by Masar. */
export async function finishSummary() {
  const s = await requireRole("person");
  const lang = await getLang();
  const v = personView(s.id);
  const tr = (x: string) => t(lang, x);
  const made = await makeSummary({ personId: s.id, input: buildSummaryInput(v, tr), lang, tr });
  if (made.source !== "masar") {
    const stored = { source: made.source, model: made.model!, at: new Date().toISOString(), lang, data: made.data };
    updatePerson(s.id, (x) => ({ ...x, journey: { ...x.journey, summary: stored } }));
  } else {
    updatePerson(s.id, (x) => ({ ...x, journey: { ...x.journey, summary: null } }));
  }
  return { source: made.source };
}

/** About me: rewrite the summary after answers change. Only the assistant's summary needs this; it stays behind consent. */
export async function refreshSummary() {
  const r = await finishSummary();
  revalidatePath("/", "layout");
  return r;
}

/** Leaving About me after changes: logged once, and the path is rebuilt from the new answers. */
export async function finishEditing() {
  const s = await requireRole("person");
  logAccess({ personId: s.id, who: "You", what: "Updated your answers about your health", allowed: true });
  revalidatePath("/", "layout");
}
