import "server-only";
import { logAccess, person, type PersonState } from "@/server/store";
import { schemaProblems } from "./guard";

// A thin client for Google's Gemini API (REST, no SDK). The key stays on the
// server. Without GEMINI_API_KEY every caller falls back to Masar's own text,
// so the app works the same, just without the conversational layer.
//
// Nothing about a person reaches Gemini unless that person has switched on the
// matching consent. The check happens here, at the last step before the
// request, against the stored state (not a screen's copy of it), so switching
// a consent off stops the very next request. Every request that does go out is
// written to the person's access log.

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export function aiEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * "live" with a key; "mock" when GEMINI_MOCK=1 and there is no key (a demo
 * stand-in that returns a schema-shaped, deterministic result for features that
 * provide one, still behind consent, logging and validation); otherwise "off".
 */
export function aiMode(): "live" | "mock" | "off" {
  if (process.env.GEMINI_API_KEY) return "live";
  return process.env.GEMINI_MOCK === "1" || process.env.GEMINI_MOCK === "true" ? "mock" : "off";
}

/** The model name recorded with anything generated. */
export function modelName(): string {
  return aiMode() === "live" ? process.env.GEMINI_MODEL || "gemini-2.5-flash" : "mock";
}

/** Why a request is being made, and so which consent it needs. */
export type AiPurpose = "assistant" | "reportReading";

/** Does this stored state allow this kind of processing right now? */
export function consentAllows(state: PersonState, purpose: AiPurpose): boolean {
  if (purpose === "assistant") return state.assistantConsent === true;
  // Reading a report is processing a lab result, so "Lab results" must be on too.
  return state.reportReadingConsent === true && state.sources.lab === true;
}

/** Would a request for this person and purpose be allowed to go out? */
export function aiAllowedFor(personId: string, purpose: AiPurpose): boolean {
  return aiEnabled() && consentAllows(person(personId), purpose);
}

export type Part = { text: string } | { inlineData: { mimeType: string; data: string } };
export interface Turn {
  role: "user" | "model";
  parts: Part[];
}

/** A JSON schema in the subset Gemini accepts for structured output. */
export type Schema = {
  type: "OBJECT" | "ARRAY" | "STRING" | "NUMBER" | "BOOLEAN";
  description?: string;
  properties?: Record<string, Schema>;
  required?: string[];
  items?: Schema;
  enum?: string[];
  nullable?: boolean;
};

export class AiRefused extends Error {}

export async function generateJson<T>(opts: {
  /** whose data is in this request */
  personId: string;
  purpose: AiPurpose;
  /** what the person reads in their access log */
  activity: string;
  system: string;
  turns: Turn[];
  schema: Schema;
  temperature?: number;
  /** a deterministic stand-in used only in mock mode; features without one stay off in mock mode */
  mock?: () => unknown;
}): Promise<T> {
  const mode = aiMode();
  if (mode === "off" || (mode === "mock" && !opts.mock)) throw new AiRefused("AI_DISABLED");
  if (!consentAllows(person(opts.personId), opts.purpose)) throw new AiRefused("NO_CONSENT");
  logAccess({
    personId: opts.personId,
    who: "Masar's assistant (Google Gemini)",
    what: mode === "mock" ? `${opts.activity} (demo mock, no live model call)` : opts.activity,
    allowed: true,
  });

  if (mode === "mock") {
    const parsed = opts.mock!();
    const problems = schemaProblems(opts.schema, parsed);
    if (problems.length) throw new AiRefused(`INVALID_SHAPE: ${problems.slice(0, 3).join("; ")}`);
    return parsed as T;
  }

  return callGemini<T>(opts);
}

/**
 * The HTTP call itself, shape-checked. Used by generateJson (after its consent
 * check and logging) and by the prototype, whose people are synthetic and whose
 * consent lives in the prototype's own state.
 */
export async function callGemini<T>(opts: { system: string; turns: Turn[]; schema: Schema; temperature?: number }): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AiRefused("AI_DISABLED");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key! },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: opts.turns,
      generationConfig: {
        temperature: opts.temperature ?? 0.4,
        responseMimeType: "application/json",
        responseSchema: opts.schema,
      },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`GEMINI_${res.status}: ${detail.slice(0, 300)}`);
  }
  const body = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new AiRefused("NOT_JSON");
  }
  // The shape must match what was asked for before any caller looks at it.
  const problems = schemaProblems(opts.schema, parsed);
  if (problems.length) throw new AiRefused(`INVALID_SHAPE: ${problems.slice(0, 3).join("; ")}`);
  return parsed as T;
}
