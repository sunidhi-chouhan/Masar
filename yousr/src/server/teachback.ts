import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { Domain } from "@/lib/domain/types";
import { TRIGGERS } from "@/lib/engine/rules";
import { logAudit } from "./audit";

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

export type TeachBackRecordResult = {
  correct: boolean;
  /** Trigger T9: two incorrect answers on the fertility-prediction question. */
  escalated: boolean;
};

export async function recordTeachBack(
  userId: string,
  domain: Domain,
  questionId: string,
  answer: "yes" | "no",
): Promise<TeachBackRecordResult> {
  const q = TEACH_BACK.find((x) => x.id === questionId);
  if (!q) throw new Error("UNKNOWN_QUESTION");
  const correct = q.correct === answer;
  await prisma.teachBackResponse.create({ data: { userId, domain, questionId, answer, correct } });

  let escalated = false;
  if (questionId === "q_predict" && !correct) {
    const wrongs = await prisma.teachBackResponse.count({
      where: { userId, domain, questionId: "q_predict", correct: false },
    });
    if (wrongs >= 2) {
      escalated = await ensureTeachBackCounsel(userId, domain);
    }
  }

  return { correct, escalated };
}

async function ensureTeachBackCounsel(userId: string, domain: Domain): Promise<boolean> {
  const existing = await prisma.careAction.findFirst({
    where: {
      userId,
      type: "Counsel",
      titleKey: "counsel_teachback",
      state: { notIn: ["Declined", "Expired", "OutcomeRecorded"] },
    },
  });
  if (existing) return false;

  await prisma.careAction.create({
    data: {
      userId,
      type: "Counsel",
      domain,
      titleKey: "counsel_teachback",
      reasonKey: "t9_teachback",
      triggerCode: TRIGGERS.T9_teachback,
    },
  });
  await logAudit({
    actorId: userId,
    actorRole: "patient",
    subjectId: userId,
    type: "ActionTransition",
    resource: `action:Counsel:${domain}`,
    detail: "Suggested via T9_teachback",
  });
  return true;
}

export async function teachBackFor(userId: string, domain: Domain) {
  return prisma.teachBackResponse.findMany({
    where: { userId, domain },
    orderBy: { createdAt: "desc" },
  });
}
