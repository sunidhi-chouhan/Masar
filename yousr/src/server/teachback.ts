import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { Domain } from "@/lib/domain/types";

export interface TeachBackQuestion {
  id: string;
  /** i18n key under teachback.questions.* */
  key: string;
  correct: "yes" | "no";
}

/** Two gentle questions shown after every insight. Correct answers are fixed by design. */
export const TEACH_BACK: TeachBackQuestion[] = [
  { id: "q_predict", key: "q_predict", correct: "no" }, // Does this tell you whether you can get pregnant?
  { id: "q_change", key: "q_change", correct: "yes" }, // Is this about how things are changing, not a verdict?
];

export async function recordTeachBack(userId: string, domain: Domain, questionId: string, answer: "yes" | "no") {
  const q = TEACH_BACK.find((x) => x.id === questionId);
  if (!q) throw new Error("UNKNOWN_QUESTION");
  const correct = q.correct === answer;
  await prisma.teachBackResponse.create({ data: { userId, domain, questionId, answer, correct } });
  return correct;
}

export async function teachBackFor(userId: string, domain: Domain) {
  return prisma.teachBackResponse.findMany({
    where: { userId, domain },
    orderBy: { createdAt: "desc" },
  });
}
