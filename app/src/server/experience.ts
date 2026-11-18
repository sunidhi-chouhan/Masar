import "server-only";
import { fromRuleAnswers, type JAnswers } from "@/lib/journey";
import { HEROES } from "@/lib/population";
import { journeyFor, protoView, type ProtoConsent, type ProtoSim } from "@/lib/prototype";
import type { Lang } from "@/lib/i18n";
import { initialState, type ProtoState } from "@/components/prototype/state";
import { person, trackingConsent, type PersonState } from "./store";
import { withUploads } from "./views";

// The bridge between a signed-in demo account's stored record and the latest
// resident experience. The experience's components are shared with
// /prototype; only the data comes from here: this account's resident record,
// its stored consent, answers, request and longitudinal state. Nothing from
// another account is ever read.

/** Live accounts use their real stored records; nothing is switched off or simulated. */
export const LIVE_SIM: ProtoSim = { clinical: "available", labs: "available", extraLab: false };

export function consentOf(p: PersonState): ProtoConsent {
  const t = trackingConsent(p);
  return {
    answers: p.sources.self,
    cycles: t.cycles,
    lifestyle: t.lifestyle,
    clinical: p.sources.malaffi,
    labs: p.sources.lab,
    device: p.sources.device,
    healthAge: p.sources.healthAge,
    ai: p.assistantConsent,
    shareClinician: p.shareWithClinician,
  };
}

/** The account's answers in the journey's shape: the journey's own, then whatever the rule answers add. */
export function answersOf(id: string, p: PersonState): JAnswers {
  const r = HEROES.find((h) => h.id === id)!;
  if (!p.sources.self) return {};
  return { ...(p.answers ? fromRuleAnswers(r.sex, p.answers) : {}), ...p.journey.answers };
}

/** The resident record as Masar's rules see it, including results the person uploaded and confirmed. */
export function residentOf(id: string) {
  const r = HEROES.find((h) => h.id === id);
  if (!r) throw new Error("UNKNOWN_PERSON");
  return withUploads(r, person(id));
}

export function liveExtras(p: PersonState) {
  return {
    confirmedValues: p.reports.filter((r) => r.status === "confirmed").flatMap((r) => (r.values ?? []).map((x) => ({ ...x, uploadedAt: r.uploadedAt }))),
    reports: p.reports.map((r) => ({ test: r.test, requestedAt: r.requestedAt, uploadedAt: r.uploadedAt, status: r.status })),
    scanning: p.scanning,
    request: p.request ? { at: p.request.at, status: p.request.status, attendedAt: p.request.attendedAt ?? undefined, bookedFor: p.request.bookedFor ?? undefined } : null,
  };
}

/** Everything the shared experience needs for this account, rebuilt from the store. */
export function liveView(id: string) {
  const p = person(id);
  const resident = residentOf(id);
  const consent = consentOf(p);
  const answers = answersOf(id, p);
  const jv = journeyFor(resident, LIVE_SIM, consent, p.longitudinal.journey);
  const view = protoView(resident, LIVE_SIM, consent, answers, null, { ...liveExtras(p), journey: jv });
  return { p, resident, consent, answers, jv, view };
}

/** The experience's starting state for this account and language. */
export function liveState(id: string, lang: Lang): ProtoState {
  const p = person(id);
  const base = initialState(id, [], lang);
  const summary = p.assistantConsent && p.journey.summary?.lang === lang ? p.journey.summary : null;
  return {
    ...base,
    role: "patient",
    auth: { status: "in", method: "uaepass" },
    account: { ...base.account, created: true },
    stage: "dashboard",
    consent: consentOf(p),
    sim: LIVE_SIM,
    answers: answersOf(id, p),
    knowledge: p.sources.self && p.beliefsBefore ? [...p.beliefsBefore, p.journey.knowledgeExtra] : base.knowledge,
    summary: summary ? { source: summary.source, data: summary.data, at: summary.at } : null,
    analysedAt: p.journey.summary?.at ?? new Date().toISOString(),
    request: p.request ? { at: p.request.at, status: p.request.status, questions: p.request.questions, decision: p.request.decision, reason: p.request.reason } : null,
    journey: p.longitudinal.journey,
    guide: p.longitudinal.guide,
    chat: p.longitudinal.chat,
    referrals: [],
    audit: [],
    notices: [],
    controlsOpen: false,
  };
}
