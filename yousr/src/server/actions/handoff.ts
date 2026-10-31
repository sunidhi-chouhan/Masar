"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { detectHandoff, needsClinicianHandoff, type HandoffKind } from "@/lib/handoff/detect";
import { logAudit } from "@/server/audit";

export type HandoffResult = {
  kind: HandoffKind;
  handedOff: boolean;
  actionCreated: boolean;
};

/**
 * Ask Masar never answers personal medical questions. It classifies the text
 * and, when needed, creates a Counsel (or Refer for distress) care action.
 */
export async function submitAskMasar(raw: string): Promise<HandoffResult> {
  const s = await requireSession();
  if (s.role !== "patient") throw new Error("FORBIDDEN");
  const text = raw.trim().slice(0, 500);
  const kind = detectHandoff(text);
  const handoff = needsClinicianHandoff(kind);

  await logAudit({
    actorId: s.userId,
    actorRole: s.role,
    subjectId: s.userId,
    type: "ActionTransition",
    purpose: "PersonalView",
    resource: "ask-masar",
    detail: `kind=${kind};handoff=${handoff}`,
  });

  if (!handoff) {
    return { kind, handedOff: false, actionCreated: false };
  }

  const type = kind === "distress" ? "Refer" : "Counsel";
  const titleKey = kind === "distress" ? "refer_support" : "counsel_should_i";
  const reasonKey = kind === "distress" ? "t8_distress" : "t8_should_i";
  const triggerCode = kind === "distress" ? "T8_distress_chat" : "T8_should_i";

  const existing = await prisma.careAction.findFirst({
    where: {
      userId: s.userId,
      type,
      titleKey,
      state: { notIn: ["Declined", "Expired", "OutcomeRecorded"] },
    },
  });

  let actionCreated = false;
  if (!existing) {
    await prisma.careAction.create({
      data: {
        userId: s.userId,
        type,
        domain: "lifestyle",
        titleKey,
        reasonKey,
        triggerCode,
      },
    });
    actionCreated = true;
  }

  revalidatePath("/", "layout");
  return { kind, handedOff: true, actionCreated };
}
