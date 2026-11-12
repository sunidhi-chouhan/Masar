import "server-only";
import { applyAnswers } from "@/lib/profile";
import { HEROES, TODAY, population, resident } from "@/lib/population";
import type { Resident } from "@/lib/model";
import { clinicianLabel } from "@/lib/accounts";
import {
  ALL_SOURCES,
  RULES,
  optionsFor,
  signalsFor,
  topUrgency,
  visibleRecord,
  type Signal,
  type VisibleRecord,
} from "@/lib/signals";
import { factorsFor, measureViews, missingFor, type Factor, type MeasureView } from "@/lib/trajectory";
import { logAccess, person, type PersonState, type ReportRequest } from "./store";
import type { Session } from "./session";

// Everything a screen needs about one person, built only from what that
// person agreed to share. Screens never read residents or state directly.

export interface PersonView {
  resident: Resident;
  state: PersonState;
  record: VisibleRecord;
  signals: Signal[];
  urgency: ReturnType<typeof topUrgency>;
  measures: MeasureView[];
  factors: Factor[];
  missing: string[];
  options: ReturnType<typeof optionsFor>;
  /** the person asked to be reminded, and that day has come */
  reminderDue: boolean;
}

/**
 * The reports anyone other than the person may see: their doctor, the
 * assistant and the pre-visit brief. Nothing at all while "Lab results" is
 * off. While a report is waiting for the person to check it, only the fact
 * that it was requested (or is being checked) shows: no file, no values, no
 * summaries. Read values and summaries appear only once the person confirms.
 */
export function reportsForOthers(state: PersonState): ReportRequest[] {
  if (!state.sources.lab) return [];
  return state.reports.map((r) =>
    r.status === "confirmed"
      ? r
      : { id: r.id, test: r.test, note: r.note, requestedAt: r.requestedAt, status: r.status, uploadedAt: r.uploadedAt },
  );
}

/**
 * The reports the person's own assistant may read: none while "Lab results" is
 * off; otherwise the person's own reports, with values the person hasn't
 * checked yet marked as such by their status.
 */
export function reportsForAssistant(state: PersonState): ReportRequest[] {
  return state.sources.lab ? state.reports : [];
}

/** May this session open the original file of this report? */
export function reportFileAccess(
  session: Session | null,
  personId: string,
): { kind: "own" } | { kind: "doctor"; state: PersonState } | { kind: "none" } {
  if (!session) return { kind: "none" };
  if (session.role === "person" && session.id === personId) return { kind: "own" };
  if (session.role === "clinician") return { kind: "doctor", state: person(personId) };
  return { kind: "none" };
}

/** Results the person uploaded and confirmed count as lab results. */
function withUploads(r: Resident, state: PersonState): Resident {
  const extra = (state.reports ?? [])
    .filter((x) => x.status === "confirmed")
    .flatMap((x) =>
      (x.values ?? []).flatMap((v) =>
        v.code ? [{ code: v.code, value: v.value, unit: v.unit, at: v.date ?? x.uploadedAt!.slice(0, 10), source: "lab" as const }] : [],
      ),
    );
  return extra.length ? { ...r, readings: [...r.readings, ...extra] } : r;
}

function build(base: Resident, state: PersonState, sources: PersonState["sources"]): PersonView {
  const r = withUploads(base, state);
  // What the person told us sits on top of their records (only if they share it).
  const applied = state.answers && sources.self ? applyAnswers(r, state.answers) : { resident: r, reported: null };
  const record = visibleRecord(applied.resident, sources, applied.reported);
  const signals = state.scanning ? signalsFor(record) : [];
  return {
    resident: r,
    state,
    record,
    signals,
    urgency: topUrgency(signals),
    measures: measureViews(record),
    factors: factorsFor(record),
    missing: missingFor(record),
    options: optionsFor(signals),
    reminderDue: Boolean(state.remindAt && Date.parse(state.remindAt) <= Date.now()),
  };
}

export function personView(id: string): PersonView {
  const r = HEROES.find((h) => h.id === id);
  if (!r) throw new Error("UNKNOWN_PERSON");
  const state = person(id);
  return build(r, state, state.sources);
}

/** Generated residents are treated as having shared everything with their clinician. */
function syntheticView(r: Resident): PersonView {
  const state = { ...person(r.id), onboarded: true, sources: ALL_SOURCES, shareWithClinician: true };
  return build(r, state, ALL_SOURCES);
}

export interface InboxRow {
  id: string;
  name: string;
  age: number;
  sex: Resident["sex"];
  touchpoint: string;
  signalTitles: string[];
  urgency: NonNullable<PersonView["urgency"]>;
  status: string;
  live: boolean;
}

const URGENCY_ORDER = { urgent: 0, soon: 1, routine: 2 } as const;

export function clinicianInbox(): InboxRow[] {
  const rows: InboxRow[] = [];
  for (const h of HEROES) {
    const v = personView(h.id);
    if (!v.state.shareWithClinician || !v.signals.length || !v.urgency) continue;
    rows.push({
      id: h.id,
      name: h.name,
      age: h.age,
      sex: h.sex,
      touchpoint: h.touchpoint.at,
      signalTitles: v.signals.map((s) => RULES[s.code].clinicalTitle),
      urgency: v.urgency,
      status: v.state.request ? v.state.request.status : "new",
      live: true,
    });
  }
  // A dozen generated residents, so the inbox looks like a real morning: the
  // most recent ones, taken in turn across reasons so the list isn't one rule
  // repeated, with men and women both represented.
  const candidates = population()
    .filter((p) => !p.hero && p.optedIn)
    .map((p) => ({ p, v: syntheticView(p) }))
    .filter(({ v }) => v.signals.length && v.urgency)
    .sort((a, b) => b.p.touchpoint.at.localeCompare(a.p.touchpoint.at));
  const byReason = new Map<string, typeof candidates>();
  for (const c of candidates) {
    const key = c.v.signals[0].code;
    byReason.set(key, [...(byReason.get(key) ?? []), c]);
  }
  const recent: typeof candidates = [];
  const queues = [...byReason.values()];
  while (recent.length < 12 && queues.some((q) => q.length)) {
    for (const q of queues) {
      const next = q.shift();
      if (next && recent.length < 12) recent.push(next);
    }
  }
  for (const { p, v } of recent) {
    rows.push({
      id: p.id,
      name: p.name,
      age: p.age,
      sex: p.sex,
      touchpoint: p.touchpoint.at,
      signalTitles: v.signals.map((s) => RULES[s.code].clinicalTitle),
      urgency: v.urgency!,
      status: "new",
      live: false,
    });
  }
  return rows.sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency] || Number(b.live) - Number(a.live));
}

/**
 * A clinician's view of one person. For the named characters this is checked
 * against their sharing choice, and every look (allowed or blocked) is logged
 * where the person can see it.
 */
export function clinicianView(id: string, session: Session): PersonView | null {
  if (session.role !== "clinician") return null;
  const hero = HEROES.find((h) => h.id === id);
  if (hero) {
    const v = personView(id);
    const allowed = v.state.shareWithClinician;
    logAccess({ personId: id, who: clinicianLabel(session.id), what: "Opened your summary", allowed });
    return allowed ? forDoctor(v) : null;
  }
  const r = resident(id);
  return r ? forDoctor(syntheticView(r)) : null;
}

/**
 * What a doctor's screen and the pre-visit brief receive. The record itself is
 * already limited to shared sources; this also removes the person's raw
 * answers when "What you tell us" is off, and filters reports through
 * reportsForOthers().
 */
function forDoctor(v: PersonView): PersonView {
  return {
    ...v,
    state: {
      ...v.state,
      answers: v.state.sources.self ? v.state.answers : null,
      reports: reportsForOthers(v.state),
    },
  };
}

export const DEMO_TODAY = TODAY;
