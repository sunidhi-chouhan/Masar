import type { Resident } from "@/lib/model";
import type { FollowUp, FollowUpSource, JAnswers, JourneySummary } from "@/lib/journey";
import { NO_CONSENT, type ProtoConsent, type ProtoSim } from "@/lib/prototype";
import type { Lang } from "@/lib/i18n";

// The prototype's one shared state: every role reads and changes the same
// story, so what the patient allows is exactly what the clinician sees, and
// the health system only ever counts. Kept in this tab's sessionStorage.

export type Role = "patient" | "clinician" | "system";
export type Stage = "landing" | "uaepass" | "create" | "consent" | "about" | "quick" | "final" | "analysis" | "dashboard";
export type Vars = Record<string, string | number>;

export interface Notice {
  id: string;
  to: Role;
  text: string;
  vars?: Vars;
  at: string;
  read: boolean;
  tone: "info" | "success" | "warning";
  /** an action the recipient can take from the notice */
  action?: "allowAccess";
}

export interface AuditEntry {
  at: string;
  role: Role | "system";
  who: string;
  what: string;
  vars?: Vars;
  allowed: boolean;
}

export interface Referral {
  id: string;
  /** the synthetic resident's id, or the prototype patient's */
  patientId: string;
  reason: string;
  clinic: string;
  status: "new" | "accepted" | "booked" | "completed";
  at: string;
}

export interface ProtoState {
  v: 3;
  lang: Lang;
  role: Role;
  profileId: string;
  auth: { status: "out" | "pending" | "failed" | "cancelled" | "in"; method: "uaepass" | "email" | null };
  uaePassOutcome: "success" | "fail" | "cancel";
  account: { created: boolean; email: string; phone: string };
  stage: Stage;
  consent: ProtoConsent;
  geminiOn: boolean;
  sim: ProtoSim;
  answers: JAnswers;
  qpos: string | null;
  knowledge: (string | null)[];
  final: { source: FollowUpSource; questions: FollowUp[]; answers: Record<string, string> } | null;
  summary: { source: "ai" | "mock" | "masar"; data: JourneySummary; at: string } | null;
  analysedAt: string | null;
  request: { at: string; status: "requested" | "reviewed" | "booked" | "attended"; questions: string[]; decision?: "Accept" | "Modify" | "Override"; reason?: string } | null;
  accessRequested: boolean;
  notes: Record<string, { at: string; text: string }[]>;
  messages: { at: string; from: "clinician" | "patient"; text: string }[];
  referrals: Referral[];
  clinics: { id: string; name: string; area: string; clinicians: number; accepting: boolean }[];
  notices: Notice[];
  audit: AuditEntry[];
  selected: string | null;
  controlsOpen: boolean;
}

export const STORAGE_KEY = "masar-prototype-v3";

export const CLINICS: ProtoState["clinics"] = [
  { id: "c1", name: "Al Bateen Family Health Centre", area: "Abu Dhabi", clinicians: 6, accepting: true },
  { id: "c2", name: "Khalifa City Primary Care", area: "Abu Dhabi", clinicians: 4, accepting: true },
  { id: "c3", name: "Al Ain Women's Health Clinic", area: "Al Ain", clinicians: 5, accepting: true },
  { id: "c4", name: "Ruwais Community Clinic", area: "Al Dhafra", clinicians: 2, accepting: false },
];

export function initialState(profileId: string, inbox: Resident[], lang: Lang = "en"): ProtoState {
  const now = new Date().toISOString();
  return {
    v: 3,
    lang,
    role: "patient",
    profileId,
    auth: { status: "out", method: null },
    uaePassOutcome: "success",
    account: { created: false, email: "", phone: "" },
    stage: "landing",
    consent: { ...NO_CONSENT },
    geminiOn: true,
    sim: { clinical: "available", labs: "available", extraLab: false },
    answers: {},
    qpos: null,
    knowledge: [null, null, null, null],
    final: null,
    summary: null,
    analysedAt: null,
    request: null,
    accessRequested: false,
    notes: {},
    messages: [],
    // Synthetic referrals already in the system, so the workflow isn't empty.
    referrals: inbox.slice(0, 4).map((r, i) => ({
      id: `r${i + 1}`,
      patientId: r.id,
      reason: "",
      clinic: CLINICS[i % 3].name,
      status: (["new", "accepted", "booked", "completed"] as const)[i % 4],
      at: new Date(Date.parse(now) - (i + 1) * 86_400_000 * 2).toISOString(),
    })),
    clinics: CLINICS.map((c) => ({ ...c })),
    notices: [],
    audit: [{ at: now, role: "system", who: "Masar", what: "Demo started with synthetic data only", allowed: true }],
    selected: null,
    controlsOpen: false,
  };
}

let seq = 0;
export const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export function withAudit(s: ProtoState, e: Omit<AuditEntry, "at">): ProtoState {
  return { ...s, audit: [{ ...e, at: new Date().toISOString() }, ...s.audit].slice(0, 200) };
}

export function withNotice(s: ProtoState, n: Omit<Notice, "id" | "at" | "read">): ProtoState {
  return { ...s, notices: [{ ...n, id: uid("n"), at: new Date().toISOString(), read: false }, ...s.notices].slice(0, 50) };
}
