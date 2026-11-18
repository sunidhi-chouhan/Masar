import { fallbackFollowUps, deterministicSummary, type FollowUp, type FollowUpSource, type JourneySummary } from "@/lib/journey";
import type { Resident } from "@/lib/model";
import { journeyFor, protoSummaryInput, protoView } from "@/lib/prototype";
import { guideDraft, intentOf, masarAnswer, sentences, SCOPE_LABEL, type Answer, type Intent } from "@/lib/longitudinal";
import { INTENTION_LABEL } from "@/lib/model";
import { RULES } from "@/lib/signals";
import type { Line } from "@/lib/path";
import { sayIn, t } from "@/lib/i18n";
import type { ProtoState } from "./state";

// Integration adapters. UAE PASS and the clinical systems are simulated in
// the browser and say so; Gemini goes to the server adapter, which decides
// what may be sent and validates what comes back. If the server can't be
// reached, Masar's own deterministic version is used and labelled as such.

/** Simulated UAE PASS: waits for the "phone approval", then succeeds, fails or is cancelled as the Demo Controls say. */
export function uaePassSignIn(outcome: ProtoState["uaePassOutcome"], ms = 2200): Promise<"success" | "fail" | "cancel"> {
  return new Promise((resolve) => setTimeout(() => resolve(outcome), ms));
}

const endpoint = (key: string | null) => `/api/prototype/ai${key ? `?key=${encodeURIComponent(key)}` : ""}`;

function body(s: ProtoState, extra: Record<string, unknown>) {
  return JSON.stringify({ profileId: s.profileId, lang: s.lang, consent: s.consent, sim: s.sim, geminiOn: s.geminiOn, answers: s.answers, journey: s.journey, ...extra });
}

export async function geminiFollowUps(s: ProtoState, base: Resident, key: string | null): Promise<{ source: FollowUpSource; questions: FollowUp[] }> {
  try {
    const res = await fetch(endpoint(key), { method: "POST", headers: { "content-type": "application/json" }, body: body(s, { task: "followups" }) });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as { source: FollowUpSource; questions: FollowUp[] };
  } catch {
    return { source: "fallback", questions: fallbackFollowUps(base.sex, s.consent.answers ? s.answers : {}) };
  }
}

export async function geminiSummary(s: ProtoState, base: Resident, key: string | null, finalAnswered: string[]): Promise<{ source: "ai" | "mock" | "masar"; data: JourneySummary }> {
  try {
    const res = await fetch(endpoint(key), { method: "POST", headers: { "content-type": "application/json" }, body: body(s, { task: "summary", finalAnswered }) });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as { source: "ai" | "mock" | "masar"; data: JourneySummary };
  } catch {
    const tr = (x: string) => t(s.lang, x);
    const view = protoView(base, s.sim, s.consent, s.answers, null, { journey: journeyFor(base, s.sim, s.consent, s.journey) });
    return { source: "masar", data: deterministicSummary(protoSummaryInput(view, s.consent, s.answers, finalAnswered, tr), tr) };
  }
}

export interface AskOut {
  source: "ai" | "mock" | "masar" | "urgent";
  answer: Answer;
  used: string[];
  withheld: string[];
}

/** Ask about the longitudinal record. Offline, Masar answers itself from the same view. */
export async function geminiAsk(s: ProtoState, base: Resident, key: string | null, question: string, intent?: Intent, live?: string): Promise<AskOut> {
  try {
    // A signed-in account sends only the question: the server rebuilds everything else from the stored record.
    const res = await fetch(live ?? endpoint(key), { method: "POST", headers: { "content-type": "application/json" }, body: live ? JSON.stringify({ task: "ask", question, intent }) : body(s, { task: "ask", question, intent }) });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as AskOut;
  } catch {
    const say = (l: Line) => sayIn(s.lang, l);
    const jv = journeyFor(base, s.sim, s.consent, s.journey);
    const view = protoView(base, s.sim, s.consent, s.answers, null, { journey: jv });
    const goal = view.record.intention ? t(s.lang, INTENTION_LABEL[view.record.intention]) : null;
    return { source: "masar", answer: masarAnswer(intent ?? intentOf(question), jv, say, { goal, insightTitles: view.dashboard.insights.map((i) => t(s.lang, RULES[i.code].title)) }), used: [], withheld: jv.withheld.map((x) => SCOPE_LABEL[x]) };
  }
}

export async function geminiGuide(s: ProtoState, base: Resident, key: string | null, live?: string): Promise<{ source: "ai" | "mock" | "masar"; intro: string; questions: string[] }> {
  try {
    const res = await fetch(live ?? endpoint(key), { method: "POST", headers: { "content-type": "application/json" }, body: live ? JSON.stringify({ task: "guide" }) : body(s, { task: "guide" }) });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as { source: "ai" | "mock" | "masar"; intro: string; questions: string[] };
  } catch {
    const say = (l: Line) => sayIn(s.lang, l);
    const jv = journeyFor(base, s.sim, s.consent, s.journey);
    const view = protoView(base, s.sim, s.consent, s.answers, null, { journey: jv });
    const goal = view.record.intention ? t(s.lang, INTENTION_LABEL[view.record.intention]) : null;
    const d = guideDraft(base.sex, jv, { goal, insightTitles: view.dashboard.insights.map((i) => t(s.lang, RULES[i.code].title)), ruleQuestions: [], conditions: [] });
    return { source: "masar", intro: sentences(d.why.map(say)), questions: d.questions.map(say) };
  }
}
