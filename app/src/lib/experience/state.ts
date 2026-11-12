import type { Lang } from "@/lib/i18n";
import type { OptionKind, SourceId } from "@/lib/model";
import type { Answers } from "@/lib/profile";
import { SCENES } from "./copy";
import { STORY_ANSWERS } from "./questions";

export type ReviewDecision = "Accept" | "Modify" | "Override";

export interface SimState {
  scene: number;
  beat: number;
  playing: boolean;
  notes: boolean;
  lang: Lang;
  sources: Record<SourceId, boolean>;
  scanning: boolean;
  shareClinician: boolean;
  assistant: boolean;
  reportReading: boolean;
  population: boolean;
  answers: Answers;
  qIndex: number;
  reviewing: boolean;
  request: { option: OptionKind | null; question: string } | null;
  decision: { kind: ReviewDecision; note: string } | null;
  consulted: boolean;
  teach: "yes" | "no" | null;
}

export const EMPTY_SOURCES: Record<SourceId, boolean> = {
  self: false,
  malaffi: false,
  lab: false,
  healthAge: false,
  device: false,
};

export function initialState(lang: Lang = "en"): SimState {
  return {
    scene: 0,
    beat: 0,
    playing: false,
    notes: false,
    lang,
    sources: { ...EMPTY_SOURCES },
    scanning: false,
    shareClinician: false,
    assistant: false,
    reportReading: false,
    population: false,
    answers: {},
    qIndex: 0,
    reviewing: false,
    request: null,
    decision: null,
    consulted: false,
    teach: null,
  };
}

export type Action =
  | { type: "scene"; index: number }
  | { type: "next-scene" }
  | { type: "prev-scene" }
  | { type: "reveal" }
  | { type: "hide" }
  | { type: "play" }
  | { type: "pause" }
  | { type: "toggle-notes" }
  | { type: "restart" }
  | { type: "lang"; lang: Lang }
  | { type: "source"; id: SourceId; on: boolean }
  | { type: "flag"; key: "scanning" | "shareClinician" | "assistant" | "reportReading" | "population"; on: boolean }
  | { type: "answer"; id: string; value: string | string[] }
  | { type: "skip"; id: string }
  | { type: "q"; index: number }
  | { type: "review"; on: boolean }
  | { type: "fill-story" }
  | { type: "share-story" }
  | { type: "request"; option: OptionKind | null; question: string }
  | { type: "clear-request" }
  | { type: "decide"; kind: ReviewDecision; note: string }
  | { type: "clear-decision" }
  | { type: "consult" }
  | { type: "teach"; answer: "yes" | "no" }
  | { type: "hydrate"; state: SimState };

const maxBeat = (scene: number) => Math.max(0, SCENES[scene]?.beats ?? 1) - 1;

function move(state: SimState, scene: number): SimState {
  const index = Math.min(SCENES.length - 1, Math.max(0, scene));
  return { ...state, scene: index, beat: 0, playing: false };
}

export function reducer(state: SimState, action: Action): SimState {
  switch (action.type) {
    case "scene":
      return move(state, action.index);
    case "next-scene":
      return move(state, state.scene + 1);
    case "prev-scene":
      return move(state, state.scene - 1);
    case "reveal": {
      const max = maxBeat(state.scene);
      if (state.beat < max) return { ...state, beat: state.beat + 1 };
      return { ...state, playing: false };
    }
    case "hide":
      return { ...state, beat: Math.max(0, state.beat - 1), playing: false };
    case "play":
      return state.beat >= maxBeat(state.scene) ? state : { ...state, playing: true };
    case "pause":
      return { ...state, playing: false };
    case "toggle-notes":
      return { ...state, notes: !state.notes };
    case "restart":
      return { ...initialState(state.lang), notes: state.notes };
    case "lang":
      return { ...state, lang: action.lang };
    case "source":
      return { ...state, sources: { ...state.sources, [action.id]: action.on } };
    case "flag":
      return { ...state, [action.key]: action.on };
    case "answer": {
      const answers = { ...state.answers, [action.id]: action.value };
      return { ...state, answers };
    }
    case "skip": {
      const answers = { ...state.answers };
      delete answers[action.id];
      return { ...state, answers };
    }
    case "q":
      return { ...state, qIndex: Math.max(0, action.index), reviewing: false };
    case "review":
      return { ...state, reviewing: action.on };
    case "fill-story":
      return { ...state, answers: { ...STORY_ANSWERS }, reviewing: true };
    case "share-story":
      return {
        ...state,
        scanning: true,
        sources: { self: true, malaffi: true, lab: true, healthAge: true, device: true },
      };
    case "request":
      return { ...state, request: { option: action.option, question: action.question }, decision: null, consulted: false };
    case "clear-request":
      return { ...state, request: null, decision: null, consulted: false };
    case "decide": {
      if (action.kind === "Override" && !action.note.trim()) return state;
      return { ...state, decision: { kind: action.kind, note: action.note.trim() }, consulted: false };
    }
    case "clear-decision":
      return { ...state, decision: null, consulted: false };
    case "consult":
      return state.decision ? { ...state, consulted: true } : state;
    case "teach":
      return { ...state, teach: action.answer };
    case "hydrate":
      return sanitize(action.state) ?? state;
    default:
      return state;
  }
}

const SOURCES: SourceId[] = ["self", "malaffi", "lab", "healthAge", "device"];

export function sanitize(value: unknown): SimState | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<SimState>;
  const base = initialState(raw.lang === "ar" ? "ar" : "en");
  const scene = typeof raw.scene === "number" ? Math.min(SCENES.length - 1, Math.max(0, raw.scene)) : 0;
  const beat = typeof raw.beat === "number" ? Math.min(maxBeat(scene), Math.max(0, raw.beat)) : 0;
  const sources = { ...EMPTY_SOURCES };
  for (const id of SOURCES) sources[id] = Boolean(raw.sources?.[id]);
  return {
    ...base,
    scene,
    beat,
    playing: false,
    notes: Boolean(raw.notes),
    sources,
    scanning: Boolean(raw.scanning),
    shareClinician: Boolean(raw.shareClinician),
    assistant: Boolean(raw.assistant),
    reportReading: Boolean(raw.reportReading),
    population: Boolean(raw.population),
    answers: raw.answers && typeof raw.answers === "object" ? raw.answers : {},
    qIndex: typeof raw.qIndex === "number" ? raw.qIndex : 0,
    reviewing: Boolean(raw.reviewing),
    request: raw.request ?? null,
    decision: raw.decision ?? null,
    consulted: Boolean(raw.consulted),
    teach: raw.teach === "yes" || raw.teach === "no" ? raw.teach : null,
  };
}
