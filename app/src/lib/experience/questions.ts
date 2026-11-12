import { questionsFor, type Answers, type Question } from "@/lib/profile";

// The live questionnaire, in the order a presenter walks with Noura.
// Reasons are the same sentences as the resident questions screen.

export const WHY: Record<string, string> = {
  plans: "So the options Masar shows match what you want, and when.",
  partner: "Context only: it shapes how things are worded. It doesn't raise any finding.",
  pregnantBefore: "Context only, for you and your doctor. It doesn't raise any finding.",
  fatheredBefore: "Context only, for you and your doctor. It doesn't raise any finding.",
  cycles: "Cycles that are often irregular are worth a routine check.",
  symptoms: "Very painful or heavy periods are worth checking; some causes are easier to manage when found early.",
  familyMenopause: "Early menopause in a mother or sister can make timing worth discussing earlier.",
  conditions: "Some conditions are best managed before trying for a pregnancy.",
  maleHistory: "Some past problems can affect sperm; a simple test can give an early start.",
  steroids: "Testosterone and steroids can switch off sperm production, often for months.",
  heat: "Sperm are made best a little below body temperature.",
  smoking: "Smoking affects eggs and sperm, and stopping helps.",
  sleep: "Everyday context you can change. It doesn't raise any finding.",
  stress: "Everyday context you can change. It doesn't raise any finding.",
  activity: "Everyday context you can change. It doesn't raise any finding.",
};

export const AREAS: Record<string, string> = {
  plans: "Family-planning intentions",
  history: "Personal and reproductive history",
  medical: "Relevant medical and family history",
  lifestyle: "Lifestyle and metabolic context",
};

/** Answers that match Noura's synthetic record and do not fire an extra rule. */
export const STORY_ANSWERS: Answers = {
  plans: "MaybeLater",
  partner: "yes",
  cycles: "regular",
  symptoms: "none",
  pregnantBefore: "no",
  familyMenopause: "yes",
  conditions: [],
  smoking: "never",
  sleep: "7to9",
  stress: "some",
  activity: "weekly",
};

export type Step =
  | { kind: "note"; id: "age" | "labs" | "other" }
  | { kind: "ask"; id: string; area: string; question: Question; why: string };

const AREA_OF: Record<string, string> = {
  plans: "plans",
  partner: "plans",
  cycles: "history",
  symptoms: "history",
  pregnantBefore: "history",
  familyMenopause: "medical",
  conditions: "medical",
  smoking: "lifestyle",
  sleep: "lifestyle",
  stress: "lifestyle",
  activity: "lifestyle",
};

export function stepsFor(answers: Answers): Step[] {
  const byId = new Map(questionsFor("female").map((q) => [q.id, q]));
  const ask = (id: string): Step => {
    const question = byId.get(id);
    if (!question) throw new Error(`Missing question ${id}`);
    return { kind: "ask", id, area: AREA_OF[id] ?? "history", question, why: WHY[id] ?? "" };
  };
  const steps: Step[] = [{ kind: "note", id: "age" }, ask("plans"), ask("partner"), ask("cycles")];
  if (answers.cycles !== "absent") steps.push(ask("symptoms"));
  steps.push(
    ask("pregnantBefore"),
    ask("familyMenopause"),
    ask("conditions"),
    ask("smoking"),
    ask("sleep"),
    ask("stress"),
    ask("activity"),
    { kind: "note", id: "labs" },
    { kind: "note", id: "other" },
  );
  return steps;
}
