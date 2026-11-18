import "server-only";
import { parseChat, parseGuide, parseJourney, type StoredGuide, type StoredTurn } from "@/lib/journey-input";
import type { ProtoJourney } from "@/lib/prototype";
import fs from "node:fs";
import path from "node:path";
import type { OptionKind, ReadingCode, SourceId } from "@/lib/model";
import type { Answers } from "@/lib/profile";
import type { FollowUp, FollowUpSource, JAnswers, JourneySummary } from "@/lib/journey";

/**
 * The onboarding journey: where the person is, what they answered, and what
 * was generated for them. Kept apart from consent (sources, sharing and the
 * assistant switches above), which is never stored here.
 */
export interface JourneyState {
  /** the stage reached: 0 welcome, 1 about you, 2 quick check, 3 permissions, 4 your path. Never which question, which could reveal an answer. */
  step: number;
  /** when the person began this journey; names the browser-only draft, so a reset journey never picks up an old draft */
  startedAt: string | null;
  /** the journey's own answers, stored only once "Your answers" is switched on; the rule inputs are derived from them into `answers` */
  answers: JAnswers;
  /** the two final questions, with where they came from */
  followUps: { source: FollowUpSource; model: string | null; at: string; basis: string; questions: FollowUp[] } | null;
  followUpAnswers: Record<string, string>;
  /** answer to the fourth quick-check statement (educational only) */
  knowledgeExtra: string | null;
  /** the assistant's summary, only ever stored with assistant consent; deleted when it is withdrawn */
  summary: { source: "ai" | "mock"; model: string; at: string; lang: "en" | "ar"; data: JourneySummary } | null;
}

/** A stored journey, keeping only today's fields (older records carried question positions and drafts). */
function journeyFrom(j: Partial<JourneyState> | undefined): JourneyState {
  const f = freshJourney();
  if (!j) return f;
  return {
    step: typeof j.step === "number" ? j.step : f.step,
    startedAt: j.startedAt ?? null,
    answers: j.answers ?? {},
    followUps: j.followUps ?? null,
    followUpAnswers: j.followUpAnswers ?? {},
    knowledgeExtra: j.knowledgeExtra ?? null,
    summary: j.summary ?? null,
  };
}

export function freshJourney(): JourneyState {
  return { step: 0, startedAt: null, answers: {}, followUps: null, followUpAnswers: {}, knowledgeExtra: null, summary: null };
}

// Demo state for the three named characters, kept in one JSON file so it
// survives restarts. The generated population never changes and lives in code.
// A pilot would replace this module with a database behind the same functions.

export type Belief = "true" | "false" | "unsure";
export type Decision = "Accept" | "Modify" | "Override";

export interface ConversationRequest {
  at: string;
  option: OptionKind;
  questions: string[];
  status: "requested" | "reviewed" | "booked" | "attended";
  decision?: Decision;
  addTest?: boolean;
  reason?: string;
  note?: string;
  decidedAt?: string;
  bookedFor?: string;
  attendedAt?: string;
}

/** One value read from an uploaded report. */
export interface ReportValue {
  name: string;
  value: number;
  unit: string;
  /** ISO date of the test, when the report shows one */
  date: string | null;
  /** the Masar measure this maps to, if any */
  code: ReadingCode | null;
  /** the reference range exactly as the lab printed it, when it printed one */
  refLow?: number | null;
  refHigh?: number | null;
}

/** A test result the doctor asked for, uploaded by the person. */
export interface ReportRequest {
  id: string;
  test: string;
  note: string;
  requestedAt: string;
  status: "requested" | "uploaded" | "confirmed";
  file?: { name: string; mime: string; stored: string; size: number };
  uploadedAt?: string;
  values?: ReportValue[];
  /** plain-language explanation for the person */
  forPerson?: string;
  /** short clinical summary for the doctor */
  forDoctor?: string;
  /** "ai" when Gemini read the report, "none" when it could not */
  readBy?: "ai" | "none";
  confirmedAt?: string;
}

export interface PersonState {
  onboarded: boolean;
  sources: Record<SourceId, boolean>;
  shareWithClinician: boolean;
  /** may Masar keep looking for signals */
  scanning: boolean;
  /** may Masar's assistant (Google Gemini) read this person's summary to explain it. Off unless switched on. */
  assistantConsent: boolean;
  /** may Masar's assistant (Google Gemini) read uploaded reports. Off unless switched on; also needs Lab results on. */
  reportReadingConsent: boolean;
  /** the person's own answers to the health questions */
  answers: Answers | null;
  beliefsBefore: Belief[] | null;
  beliefsAfter: Belief[] | null;
  /** 1 (calm) to 4 (very worried) */
  worryBefore: number | null;
  worryAfter: number | null;
  /** the four SURE answers after counselling */
  sure: boolean[] | null;
  request: ConversationRequest | null;
  /** test results the doctor asked for */
  reports: ReportRequest[];
  /** when to nudge someone who read what Masar found but hasn't asked yet */
  remindAt: string | null;
  journey: JourneyState;
  /** the latest resident experience: tracking permissions, the demo clock, own entries, guide and assistant turns */
  longitudinal: LongitudinalState;
}

/**
 * The longitudinal layer, kept per account. Cycle tracking and lifestyle
 * check-ins are new permissions: until the person chooses (null), cycle
 * tracking follows "Phone and wearable", which used to carry cycle dates, and
 * lifestyle check-ins follow "Your answers". Live accounts sit at month 12,
 * the demo's today.
 */
export interface LongitudinalState {
  cycles: boolean | null;
  lifestyle: boolean | null;
  journey: ProtoJourney;
  guide: StoredGuide | null;
  chat: StoredTurn[];
}

export function freshLongitudinal(): LongitudinalState {
  return { cycles: null, lifestyle: null, journey: parseJourney(null, 4), guide: null, chat: [] };
}

function longitudinalFrom(l: Partial<LongitudinalState> | undefined): LongitudinalState {
  if (!l) return freshLongitudinal();
  return {
    cycles: typeof l.cycles === "boolean" ? l.cycles : null,
    lifestyle: typeof l.lifestyle === "boolean" ? l.lifestyle : null,
    journey: parseJourney(l.journey, 4),
    guide: parseGuide(l.guide),
    chat: parseChat(l.chat),
  };
}

/** The tracking permissions as they apply now, with their defaults. */
export function trackingConsent(p: PersonState): { cycles: boolean; lifestyle: boolean } {
  return { cycles: p.longitudinal.cycles ?? p.sources.device, lifestyle: p.longitudinal.lifestyle ?? p.sources.self };
}

export interface AccessEntry {
  at: string;
  personId: string;
  who: string;
  what: string;
  allowed: boolean;
}

interface State {
  persons: Record<string, PersonState>;
  access: AccessEntry[];
}

// MASAR_DATA_DIR lets the checks run against a throwaway folder instead of the dev data.
const ROOT = process.env.MASAR_DATA_DIR || path.join(process.cwd(), ".data");
const FILE = path.join(ROOT, "state.json");
const UPLOADS = path.join(ROOT, "uploads");

/** Uploaded files live outside the web root and are only served after a session check. */
export function saveUpload(personId: string, name: string, bytes: Buffer): string {
  const dir = path.join(UPLOADS, personId);
  fs.mkdirSync(dir, { recursive: true });
  const stored = `${Date.now()}-${name.replace(/[^\w.-]+/g, "_").slice(-80)}`;
  fs.writeFileSync(path.join(dir, stored), bytes);
  return stored;
}

export function readUpload(personId: string, stored: string): Buffer | null {
  if (stored.includes("/") || stored.includes("\\") || stored.includes("..")) return null;
  try {
    return fs.readFileSync(path.join(UPLOADS, personId, stored));
  } catch {
    return null;
  }
}

export const NO_SOURCES: Record<SourceId, boolean> = { self: false, malaffi: false, lab: false, healthAge: false, device: false };

export function freshPerson(): PersonState {
  return {
    onboarded: false,
    sources: { ...NO_SOURCES },
    shareWithClinician: false,
    scanning: true,
    assistantConsent: false,
    reportReadingConsent: false,
    answers: null,
    beliefsBefore: null,
    beliefsAfter: null,
    worryBefore: null,
    worryAfter: null,
    sure: null,
    request: null,
    reports: [],
    remindAt: null,
    journey: freshJourney(),
    longitudinal: freshLongitudinal(),
  };
}

function read(): State {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as State;
  } catch {
    return { persons: {}, access: [] };
  }
}

function write(state: State) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  // Write to a temporary file, then rename: a crash or restart mid-write
  // (for example during a deploy) never leaves a half-written state file.
  const tmp = `${FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, FILE);
}

/**
 * Fills fields a saved record from an older version doesn't have. The AI
 * consents only count when they are literally true: anything missing or
 * malformed reads as off.
 */
function normalise(p: Partial<PersonState> | undefined): PersonState {
  const merged = { ...freshPerson(), ...p };
  return {
    ...merged,
    sources: { ...NO_SOURCES, ...merged.sources },
    assistantConsent: p?.assistantConsent === true,
    reportReadingConsent: p?.reportReadingConsent === true,
    reports: Array.isArray(merged.reports) ? merged.reports : [],
    journey: journeyFrom(p?.journey),
    longitudinal: longitudinalFrom(p?.longitudinal),
  };
}

export function person(id: string): PersonState {
  return normalise(read().persons[id]);
}

export function updatePerson(id: string, change: (p: PersonState) => PersonState) {
  const state = read();
  state.persons[id] = change(normalise(state.persons[id]));
  write(state);
}

export function logAccess(entry: Omit<AccessEntry, "at">) {
  const state = read();
  state.access.unshift({ at: new Date().toISOString(), ...entry });
  state.access = state.access.slice(0, 200);
  write(state);
}

export function accessLog(personId: string): AccessEntry[] {
  return read().access.filter((a) => a.personId === personId);
}

/** Back to a first-time user: no consents, no request, no access history. */
export function resetPerson(id: string) {
  const state = read();
  fs.rmSync(path.join(UPLOADS, id), { recursive: true, force: true });
  delete state.persons[id];
  state.access = state.access.filter((a) => a.personId !== id);
  write(state);
}

export function resetState() {
  fs.rmSync(UPLOADS, { recursive: true, force: true });
  write({ persons: {}, access: [] });
}
