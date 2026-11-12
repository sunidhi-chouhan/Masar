import { fallbackFollowUps, deterministicSummary, type FollowUp, type FollowUpSource, type JourneySummary } from "@/lib/journey";
import type { Resident } from "@/lib/model";
import { protoSummaryInput, protoView } from "@/lib/prototype";
import { t } from "@/lib/i18n";
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
  return JSON.stringify({ profileId: s.profileId, lang: s.lang, consent: s.consent, sim: s.sim, geminiOn: s.geminiOn, answers: s.answers, ...extra });
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
    const view = protoView(base, s.sim, s.consent, s.answers, null);
    return { source: "masar", data: deterministicSummary(protoSummaryInput(view, s.consent, s.answers, finalAnswered, tr), tr) };
  }
}
