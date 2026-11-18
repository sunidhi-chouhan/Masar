// Validation for longitudinal state that arrives from a browser: the demo
// clock, the person's own entries and edits, the guide and the assistant
// conversation. Only known fields of known shapes survive; everything else is
// dropped. Shared by the prototype's adapter and the signed-in accounts.

import { NO_EDITS, SHARE_LABEL, SOURCE_LABEL, STAGES, type Answer, type Obs, type ObsType, type Scope, type ShareKey, type StageId } from "./longitudinal";
import type { ProtoJourney } from "./prototype";

const USER_TYPES: Partial<Record<ObsType, { domain: Obs["domain"]; scope: Scope; numeric: boolean }>> = {
  cycle_start: { domain: "cycle", scope: "cycles", numeric: false },
  symptom: { domain: "cycle", scope: "cycles", numeric: false },
  sleep_self: { domain: "lifestyle", scope: "lifestyle", numeric: true },
  stress: { domain: "lifestyle", scope: "lifestyle", numeric: false },
  activity_self: { domain: "lifestyle", scope: "lifestyle", numeric: false },
  nutrition: { domain: "lifestyle", scope: "lifestyle", numeric: false },
};
const ID = /^[\w-]{1,40}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/** The demo clock and the person's own entries, rebuilt from validated fields only. */
export function parseJourney(raw: unknown, fallbackStage: StageId = 0): ProtoJourney {
  const j = (raw ?? {}) as Record<string, unknown>;
  const stage = (STAGES.some((x) => x.id === j.stage) ? j.stage : fallbackStage) as StageId;
  const e = (j.edits ?? {}) as Record<string, unknown>;
  const entries: Obs[] = [];
  for (const x of Array.isArray(e.entries) ? (e.entries as Record<string, unknown>[]).slice(0, 200) : []) {
    const def = USER_TYPES[x?.type as ObsType];
    if (!def || typeof x.id !== "string" || !ID.test(x.id) || typeof x.at !== "string" || !DATE.test(x.at)) continue;
    const value = def.numeric ? Number(x.value) : typeof x.value === "string" ? x.value.slice(0, 30) : null;
    if (value === null || (typeof value === "number" && !(value >= 0 && value <= 24))) continue;
    entries.push({ id: x.id, domain: def.domain, type: x.type as ObsType, at: x.at, value, unit: def.numeric ? "h" : "", label: str(x.label, 60), source: SOURCE_LABEL.user, provenance: "user", scope: def.scope, quality: def.numeric ? "estimated" : "complete", synthetic: true, ref: null, editable: true });
  }
  const ids = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && ID.test(x)).slice(0, 500) : []);
  const edits: Record<string, number | string> = {};
  for (const [k, v] of Object.entries((e.edits ?? {}) as Record<string, unknown>).slice(0, 200)) if (ID.test(k) && (typeof v === "string" || typeof v === "number")) edits[k] = typeof v === "string" ? v.slice(0, 30) : v;
  return { stage, wearableGap: j.wearableGap === true, extraObs: j.extraObs === true, edits: { ...NO_EDITS, entries, edits, hidden: ids(e.hidden), confirmed: ids(e.confirmed) } };
}

export interface StoredGuide {
  source: "ai" | "mock" | "masar";
  at: string;
  intro: string;
  questions: string[];
  notes: string;
  share: Record<ShareKey, boolean>;
  sharedAt: string | null;
  sharedKeys: ShareKey[];
}

const KEYS = Object.keys(SHARE_LABEL) as ShareKey[];

export function parseGuide(raw: unknown): StoredGuide | null {
  if (!raw || typeof raw !== "object") return null;
  const g = raw as Record<string, unknown>;
  const share = Object.fromEntries(KEYS.map((k) => [k, (g.share as Record<string, unknown> | undefined)?.[k] === true])) as Record<ShareKey, boolean>;
  return {
    source: g.source === "ai" || g.source === "mock" ? g.source : "masar",
    at: str(g.at, 40) || new Date().toISOString(),
    intro: str(g.intro, 800),
    questions: Array.isArray(g.questions) ? g.questions.filter((q): q is string => typeof q === "string").map((q) => q.slice(0, 300)).slice(0, 12) : [],
    notes: str(g.notes, 1500),
    share,
    sharedAt: typeof g.sharedAt === "string" ? g.sharedAt.slice(0, 40) : null,
    sharedKeys: Array.isArray(g.sharedKeys) ? g.sharedKeys.filter((k): k is ShareKey => KEYS.includes(k as ShareKey)) : [],
  };
}

export interface StoredTurn {
  q: string;
  a: Answer;
  source: "ai" | "mock" | "masar" | "urgent";
  used: string[];
  withheld: string[];
  at: string;
}

const list = (v: unknown, n: number, max = 400) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.slice(0, max)).slice(0, n) : []);

export function parseChat(raw: unknown): StoredTurn[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(-12).flatMap((t) => {
    if (!t || typeof t !== "object") return [];
    const x = t as Record<string, unknown>;
    const a = (x.a ?? {}) as Record<string, unknown>;
    const source = x.source === "ai" || x.source === "mock" || x.source === "urgent" ? x.source : "masar";
    return [{ q: str(x.q, 300), source, used: list(x.used, 8, 60), withheld: list(x.withheld, 8, 60), at: str(x.at, 40), a: { observation: str(a.observation, 900), context: str(a.context, 600), evidence: list(a.evidence, 4), uncertainty: str(a.uncertainty, 800), options: list(a.options, 4), preparation: list(a.preparation, 4), pathway: str(a.pathway, 500), references: list(a.references, 12, 40) } }];
  });
}
