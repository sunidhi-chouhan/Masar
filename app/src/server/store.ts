import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { OptionKind, ReadingCode, SourceId } from "@/lib/model";
import type { Answers } from "@/lib/profile";

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

const FILE = path.join(process.cwd(), ".data", "state.json");
const UPLOADS = path.join(process.cwd(), ".data", "uploads");

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
    answers: null,
    beliefsBefore: null,
    beliefsAfter: null,
    worryBefore: null,
    worryAfter: null,
    sure: null,
    request: null,
    reports: [],
    remindAt: null,
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
  fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
}

export function person(id: string): PersonState {
  const p = read().persons[id];
  return p ? { ...freshPerson(), ...p } : freshPerson();
}

export function updatePerson(id: string, change: (p: PersonState) => PersonState) {
  const state = read();
  state.persons[id] = change({ ...freshPerson(), ...state.persons[id] });
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
