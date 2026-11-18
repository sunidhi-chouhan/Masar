import "server-only";
import { aiContext, guideDraft, masarAnswer, sentences, type Answer, type Intent, type JourneyView } from "@/lib/longitudinal";
import type { Line } from "@/lib/path";
import type { Resident } from "@/lib/model";
import { aiMode, callGemini, type Schema } from "./gemini";
import { checkOutput, needsUrgentCare } from "./guard";

// Gemini over the person's longitudinal record, in the prototype. The route
// rebuilds the authorised view on the server from the profile, permissions,
// demo clock and the person's own entries, so a switched-off permission is
// gone from the very next request. Gemini receives a structured context of
// permitted data only, must answer in a fixed structure that separates
// observation, context, evidence, uncertainty, options, preparation and the
// professional pathway, may cite only ids it was given, and may use no number
// that isn't already in the context. Anything else falls back to Masar's own
// answer, labelled as such.

const ANSWER_SCHEMA: Schema = {
  type: "OBJECT",
  properties: {
    observation: { type: "STRING", description: "What changed, or what information is being discussed, from the context only." },
    context: { type: "STRING", description: "What relevant information is available, and what was withheld." },
    evidence: { type: "ARRAY", items: { type: "STRING" }, description: "What supports this, naming the citation given in the context." },
    uncertainty: { type: "STRING", description: "What cannot be determined from this information." },
    options: { type: "ARRAY", items: { type: "STRING" }, description: "Educational or informed-choice options, never instructions." },
    preparation: { type: "ARRAY", items: { type: "STRING" }, description: "Questions or information useful for a healthcare conversation." },
    pathway: { type: "STRING", description: "When a qualified healthcare professional may be appropriate." },
    references: { type: "ARRAY", items: { type: "STRING" }, description: "Ids in square brackets from the context that this answer is about." },
  },
  required: ["observation", "context", "evidence", "uncertainty", "options", "preparation", "pathway", "references"],
};

const SYSTEM = (lang: "en" | "ar") => `You are Masar's assistant. Masar is an educational reproductive-health service in Abu Dhabi; it supports decisions and never replaces a clinician.

You receive a structured context: only the data this person has allowed Masar to use, the changes Masar's published rules detected (with their evidence, limits and missing data), and the categories they withheld.

Answer the person's question in the required structure. Rules:
- Use only the context. Never invent observations, values, evidence, reference ranges or interpretations of a lab value.
- Every number you write must appear in the context. Refer to observations and changes by the ids in square brackets, in "references".
- Distinguish what was observed, what the cited evidence supports, possible explanations, what is unknown, and general education.
- Never diagnose. Never label the person (fertile, infertile, high or low fertility, healthy or unhealthy). Never give a fertility score, a risk score, or a chance or prediction of pregnancy.
- Never say a lifestyle change will improve fertility, and never treat a correlation between two changes as a cause.
- Never prescribe a test or treatment: say what may be worth discussing with a doctor.
- Do not reassure falsely: when nothing changed, say it covers only what was shared.
- Withheld categories: you may say they were not shared; never guess their contents.
- Keep it calm and short: each string at most two sentences, lists at most four items.
${lang === "ar" ? "- Write everything in clear Modern Standard Arabic, addressing the reader in the polite plural." : "- Write in plain English, second person."}`;

const GUIDE_SCHEMA: Schema = {
  type: "OBJECT",
  properties: {
    intro: { type: "STRING", description: "Two sentences on why this guide was prepared, from the context only." },
    questions: { type: "ARRAY", items: { type: "STRING" }, description: "Four to six personal questions the person may want to ask a doctor." },
  },
  required: ["intro", "questions"],
};

const GUIDE_SYSTEM = (lang: "en" | "ar") => `You help a person prepare for a conversation with their doctor about reproductive health, using Masar's structured context of the data they allowed.
Write a two-sentence introduction on why this guide was prepared, and four to six questions they may want to ask.
Same rules as always: only the context, no new numbers, no diagnosis, no labels, no scores or predictions, no claims that lifestyle changes improve fertility, no prescriptions. Questions are open and invite the doctor's judgement.
${lang === "ar" ? "Write in clear Modern Standard Arabic, polite plural." : "Write in plain English, first person for the questions."}`;

export interface AskResult {
  source: "ai" | "mock" | "masar" | "urgent";
  answer: Answer;
}

const clean = (xs: unknown, max: number) => (Array.isArray(xs) ? xs.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim().slice(0, 400)).slice(0, max) : []);

export function validAnswer(raw: Record<string, unknown>, context: string, allowedIds: Set<string>): Answer | null {
  const a: Answer = {
    observation: String(raw.observation ?? "").trim().slice(0, 600),
    context: String(raw.context ?? "").trim().slice(0, 600),
    evidence: clean(raw.evidence, 4),
    uncertainty: String(raw.uncertainty ?? "").trim().slice(0, 600),
    options: clean(raw.options, 4),
    preparation: clean(raw.preparation, 4),
    pathway: String(raw.pathway ?? "").trim().slice(0, 400),
    references: clean(raw.references, 12),
  };
  if (!a.observation || !a.uncertainty || !a.pathway) return null;
  // Only ids that were in the context; an invented reference fails the answer.
  if (a.references.some((r) => !allowedIds.has(r.replace(/^\[|\]$/g, "")))) return null;
  const texts = [a.observation, a.context, ...a.evidence, a.uncertainty, ...a.options, ...a.preparation, a.pathway];
  if (checkOutput(texts, [context])) return null;
  return a;
}

export async function prototypeAsk(o: {
  allowed: boolean;
  question: string;
  intent: Intent;
  resident: Resident;
  view: JourneyView;
  goal: string | null;
  insightTitles: string[];
  ageBand: string;
  lang: "en" | "ar";
  say: (l: Line) => string;
}): Promise<AskResult> {
  const own = masarAnswer(o.intent, o.view, o.say, { goal: o.goal, insightTitles: o.insightTitles });
  // Urgent messages get fixed text and never reach the model.
  if (needsUrgentCare(o.question)) {
    return {
      source: "urgent",
      answer: {
        observation: o.say({ text: "What you describe may need care today, not an assistant." }),
        context: o.say({ text: "Masar did not send this message to the AI." }),
        evidence: [],
        uncertainty: o.say({ text: "Masar can't assess symptoms like these." }),
        options: [o.say({ text: "Call 999 in an emergency, or go to the nearest emergency department." })],
        preparation: [],
        pathway: o.say({ text: "Please contact a doctor or emergency services now." }),
        references: [],
      },
    };
  }
  const mode = aiMode();
  if (!o.allowed || mode === "off") return { source: "masar", answer: own };
  if (mode === "mock") return { source: "mock", answer: own };
  const context = aiContext(o.resident, o.view, { goal: o.goal, insightTitles: o.insightTitles, ageBand: o.ageBand });
  const ids = new Set([...o.view.obs.map((x) => x.id), ...o.view.changes.map((c) => c.id)]);
  try {
    const raw = await callGemini<Record<string, unknown>>({
      system: SYSTEM(o.lang),
      turns: [{ role: "user", parts: [{ text: `${context}\n\nThe person's question: ${o.question.slice(0, 300)}` }] }],
      schema: ANSWER_SCHEMA,
      temperature: 0.2,
    });
    const a = validAnswer(raw, context, ids);
    return a ? { source: "ai", answer: a } : { source: "masar", answer: own };
  } catch (e) {
    console.error("[prototype] ask", e instanceof Error ? e.message : e);
    return { source: "masar", answer: own };
  }
}

export async function prototypeGuide(o: {
  allowed: boolean;
  resident: Resident;
  view: JourneyView;
  goal: string | null;
  insightTitles: string[];
  ruleQuestions: string[];
  conditions: string[];
  ageBand: string;
  lang: "en" | "ar";
  say: (l: Line) => string;
}): Promise<{ source: "ai" | "mock" | "masar"; intro: string; questions: string[] }> {
  const d = guideDraft(o.resident.sex, o.view, { goal: o.goal, insightTitles: o.insightTitles, ruleQuestions: o.ruleQuestions, conditions: o.conditions });
  const own = { intro: sentences(d.why.map(o.say)), questions: d.questions.map(o.say) };
  const mode = aiMode();
  if (!o.allowed || mode === "off") return { source: "masar", ...own };
  if (mode === "mock") return { source: "mock", ...own };
  const context = aiContext(o.resident, o.view, { goal: o.goal, insightTitles: o.insightTitles, ageBand: o.ageBand });
  try {
    const raw = await callGemini<{ intro?: string; questions?: string[] }>({ system: GUIDE_SYSTEM(o.lang), turns: [{ role: "user", parts: [{ text: context }] }], schema: GUIDE_SCHEMA, temperature: 0.3 });
    const intro = String(raw.intro ?? "").trim().slice(0, 500);
    const questions = clean(raw.questions, 6);
    if (!intro || questions.length < 3 || checkOutput([intro, ...questions], [context])) return { source: "masar", ...own };
    return { source: "ai", intro, questions };
  } catch (e) {
    console.error("[prototype] guide", e instanceof Error ? e.message : e);
    return { source: "masar", ...own };
  }
}
