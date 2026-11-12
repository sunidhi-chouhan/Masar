import "server-only";
import type { Sex } from "@/lib/model";
import {
  SUMMARY_KEYS,
  deterministicSummary,
  fallbackFollowUps,
  type FollowUp,
  type FollowUpSource,
  type JAnswers,
  type JourneySummary,
  type SummaryInput,
} from "@/lib/journey";
import { person } from "@/server/store";
import { aiMode, callGemini, consentAllows, generateJson, modelName, type Schema } from "./gemini";
import { checkOutput, prohibited } from "./guard";

// Gemini in the onboarding journey: two personalised final questions, and a
// structured summary of what the person shared. Both run only with the
// person's assistant consent (checked here and again inside generateJson),
// send the minimum needed, are validated before use, and fall back to
// Masar's own deterministic version on any failure. Neither ever decides a
// finding: Masar's rules do that.

/** Is the assistant allowed and available for this person right now? */
export function journeyAI(personId: string): boolean {
  return aiMode() !== "off" && consentAllows(person(personId), "assistant");
}

// ---------- the two final questions ----------

const TOO_SENSITIVE = /\b(sex|sexual|intercourse|miscarri|abortion|termination|stillbirth|religio|income|salary|weight in|how much do you weigh|address|phone number|email|emirates id|passport)/i;

const QUESTION_SCHEMA: Schema = {
  type: "OBJECT",
  properties: {
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          text: { type: "STRING" },
          why: { type: "STRING" },
          options: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["text", "why", "options"],
      },
    },
  },
  required: ["questions"],
};

const QUESTION_SYSTEM = (lang: "en" | "ar") => `You help Masar, a reproductive-health awareness service, ask a person two short follow-up questions at the end of a questionnaire.

Rules:
- Return exactly two questions. Each is relevant to reproductive health and fills an important gap or ambiguity in what the person already said.
- Never repeat a question already answered. Never ask about sex life, pregnancy loss, termination, religion, money, identity documents or contact details.
- Never suggest a diagnosis, never imply an answer confirms a condition, never lead the person towards an answer.
- Never mention scores, chances, probabilities or predictions.
- Each question: one plain sentence ("text"), one short sentence on why it matters ("why"), and 3 to 5 short answer options. Include "Prefer not to say" or "Unsure" as an option.
- Do not ask about anyone other than the person themselves.
${lang === "ar" ? "- Write everything in clear Modern Standard Arabic, gender-neutral where possible." : "- Write in plain English."}`;

const slug = (i: number) => `o${i + 1}`;

function validQuestions(raw: { questions?: { text: string; why: string; options: string[] }[] }, lang: "en" | "ar"): FollowUp[] | null {
  const qs = raw.questions ?? [];
  if (qs.length !== 2) return null;
  const out: FollowUp[] = [];
  for (const [i, q] of qs.entries()) {
    const text = q.text?.trim();
    const why = q.why?.trim();
    const options = (q.options ?? []).map((o) => o.trim()).filter(Boolean);
    if (!text || !why || text.length > 220 || why.length > 220) return null;
    if (options.length < 2 || options.length > 6 || options.some((o) => o.length > 70)) return null;
    for (const s of [text, why, ...options]) if (prohibited(s) || TOO_SENSITIVE.test(s)) return null;
    const preferLabel = lang === "ar" ? "أفضّل عدم الإجابة" : "Prefer not to say";
    const hasOptOut = options.some((o) => /prefer not|unsure|not sure|أفضّل|لست متأكد|غير متأكد/i.test(o));
    const finalOptions = hasOptOut ? options : [...options, preferLabel];
    out.push({ id: `ai-${i + 1}`, text, why, options: finalOptions.map((label, j) => ({ value: slug(j), label })) });
  }
  return out;
}

/** The minimum the assistant needs: the person's own answers as plain lines, sex and an age band. */
function questionContext(sex: Sex, ageBand: string, answered: string[]) {
  return [`Sex: ${sex}. Age band: ${ageBand}.`, "What the person has answered so far (self-reported):", ...answered.map((a) => `- ${a}`)].join("\n");
}

export async function makeFollowUps(opts: {
  personId: string;
  sex: Sex;
  ageBand: string;
  answers: JAnswers;
  /** answered questions as "question: answer" lines, in English */
  answered: string[];
  lang: "en" | "ar";
}): Promise<{ source: FollowUpSource; model: string | null; questions: FollowUp[] }> {
  const fallback = { source: "fallback" as const, model: null, questions: fallbackFollowUps(opts.sex, opts.answers) };
  const state = person(opts.personId);
  // Answers are "What you tell us": without that source, they aren't Masar's to send anywhere.
  if (!journeyAI(opts.personId) || !state.sources.self) return fallback;
  try {
    const raw = await generateJson<{ questions: { text: string; why: string; options: string[] }[] }>({
      personId: opts.personId,
      purpose: "assistant",
      activity: "Read your answers to choose two final questions",
      system: QUESTION_SYSTEM(opts.lang),
      turns: [{ role: "user", parts: [{ text: questionContext(opts.sex, opts.ageBand, opts.answered) }] }],
      schema: QUESTION_SCHEMA,
      temperature: 0.3,
      // The demo stand-in: Masar's own two questions, in the assistant's output shape.
      mock: () => ({ questions: fallback.questions.map((q) => ({ text: q.text, why: q.why, options: q.options.map((o) => o.label) })) }),
    });
    if (aiMode() === "mock") {
      // In mock mode the questions are Masar's own reviewed wording; keep their ids and values so they translate.
      return { source: "mock", model: modelName(), questions: fallback.questions };
    }
    const questions = validQuestions(raw, opts.lang);
    if (!questions) {
      console.warn("[journey] follow-up questions withheld: failed validation");
      return fallback;
    }
    return { source: "ai", model: modelName(), questions };
  } catch (e) {
    console.error("[journey] follow-ups", e instanceof Error ? e.message : e);
    return fallback;
  }
}

// ---------- the summary ----------

const SUMMARY_SCHEMA: Schema = {
  type: "OBJECT",
  properties: Object.fromEntries(SUMMARY_KEYS.map((k) => [k, { type: "ARRAY", items: { type: "STRING" } } as Schema])),
  required: [...SUMMARY_KEYS],
};

const SUMMARY_SYSTEM = (lang: "en" | "ar") => `You compact what a person shared with Masar, a reproductive-health awareness service, into a short structured summary.

You summarise; you never diagnose. Rules:
- Use only the facts given. Never add a value, diagnosis, test, history or recommendation that isn't there.
- Keep self-reported answers marked as self-reported, and record facts as from records.
- Never turn missing information into a negative finding. Missing stays "not known".
- Never give a fertility score, a chance or probability of pregnancy, or a prediction.
- "areas_to_explore" may only restate the findings given; if none are given, say nothing needs a conversation right now and that this isn't a guarantee.
- "suggested_discussion_topics" are questions the person could ask a qualified healthcare professional; never prescribe a test or treatment.
- Each list has at most 6 short items, one plain sentence each.
${lang === "ar" ? "- Write every item in clear Modern Standard Arabic." : "- Write in plain English."}`;

function summaryContext(i: SummaryInput): string {
  const block = (title: string, xs: string[]) => [title, ...(xs.length ? xs.map((x) => `- ${x}`) : ["- (none)"])].join("\n");
  return [
    block("Goals (self-reported):", i.goals),
    block("Reproductive-health history (self-reported):", i.history),
    block("Reported changes (self-reported):", i.changes),
    block("Lifestyle (self-reported):", i.lifestyle),
    block("Additional answers (self-reported):", [...i.followUps, ...i.help]),
    block("From consented records:", i.records),
    block("Findings from Masar's published rules:", i.findings),
    block("Not known or not shared:", i.missing),
    block("Questions Masar's rules suggest:", i.ruleQuestions),
    `Wants help preparing questions: ${i.wantsQuestions ? "yes" : "no"}.`,
  ].join("\n\n");
}

function validSummary(raw: Record<string, unknown>, context: string): JourneySummary | null {
  const out = {} as JourneySummary;
  for (const k of SUMMARY_KEYS) {
    const v = raw[k];
    if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) return null;
    out[k] = (v as string[]).map((x) => x.trim()).filter(Boolean).slice(0, 8);
    if (out[k].some((x) => x.length > 260)) return null;
  }
  const problem = checkOutput(SUMMARY_KEYS.flatMap((k) => out[k]), [context]);
  if (problem) {
    console.warn("[journey] summary withheld:", problem);
    return null;
  }
  return out;
}

export async function makeSummary(opts: {
  personId: string;
  input: SummaryInput;
  lang: "en" | "ar";
  tr: (s: string) => string;
}): Promise<{ source: "ai" | "mock" | "masar"; model: string | null; data: JourneySummary }> {
  const masar = { source: "masar" as const, model: null, data: deterministicSummary(opts.input, opts.tr) };
  if (!journeyAI(opts.personId)) return masar;
  const context = summaryContext(opts.input);
  try {
    const raw = await generateJson<Record<string, unknown>>({
      personId: opts.personId,
      purpose: "assistant",
      activity: "Read what you shared to write your summary",
      system: SUMMARY_SYSTEM(opts.lang),
      turns: [{ role: "user", parts: [{ text: context }] }],
      schema: SUMMARY_SCHEMA,
      temperature: 0.2,
      mock: () => deterministicSummary(opts.input, opts.tr),
    });
    const data = validSummary(raw, context);
    if (!data) return masar;
    return { source: aiMode() === "mock" ? "mock" : "ai", model: modelName(), data };
  } catch (e) {
    console.error("[journey] summary", e instanceof Error ? e.message : e);
    return masar;
  }
}

// ---------- the prototype (/prototype): synthetic people, the same prompts and checks ----------
// Consent comes from the prototype's own state (passed as `allowed`); nothing
// is read from or written to the real store. Same validation, same fallbacks.

export async function prototypeFollowUps(o: {
  allowed: boolean;
  sex: Sex;
  ageBand: string;
  answers: JAnswers;
  answered: string[];
  lang: "en" | "ar";
}): Promise<{ source: FollowUpSource; questions: FollowUp[] }> {
  const own = fallbackFollowUps(o.sex, o.answers);
  const mode = aiMode();
  if (!o.allowed || mode === "off") return { source: "fallback", questions: own };
  if (mode === "mock") return { source: "mock", questions: own };
  try {
    const raw = await callGemini<{ questions: { text: string; why: string; options: string[] }[] }>({
      system: QUESTION_SYSTEM(o.lang),
      turns: [{ role: "user", parts: [{ text: questionContext(o.sex, o.ageBand, o.answered) }] }],
      schema: QUESTION_SCHEMA,
      temperature: 0.3,
    });
    const questions = validQuestions(raw, o.lang);
    return questions ? { source: "ai", questions } : { source: "fallback", questions: own };
  } catch (e) {
    console.error("[prototype] follow-ups", e instanceof Error ? e.message : e);
    return { source: "fallback", questions: own };
  }
}

export async function prototypeSummary(o: {
  allowed: boolean;
  input: SummaryInput;
  lang: "en" | "ar";
  tr: (s: string) => string;
}): Promise<{ source: "ai" | "mock" | "masar"; data: JourneySummary }> {
  const own = deterministicSummary(o.input, o.tr);
  const mode = aiMode();
  if (!o.allowed || mode === "off") return { source: "masar", data: own };
  if (mode === "mock") return { source: "mock", data: own };
  const context = summaryContext(o.input);
  try {
    const raw = await callGemini<Record<string, unknown>>({ system: SUMMARY_SYSTEM(o.lang), turns: [{ role: "user", parts: [{ text: context }] }], schema: SUMMARY_SCHEMA, temperature: 0.2 });
    const data = validSummary(raw, context);
    return data ? { source: "ai", data } : { source: "masar", data: own };
  } catch (e) {
    console.error("[prototype] summary", e instanceof Error ? e.message : e);
    return { source: "masar", data: own };
  }
}
