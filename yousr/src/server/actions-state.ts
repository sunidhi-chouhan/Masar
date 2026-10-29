import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { ActionState } from "@/lib/domain/types";
import { logAudit } from "./audit";

const NEXT: Partial<Record<ActionState, ActionState[]>> = {
  Suggested: ["Requested", "Declined"],
  Requested: ["Confirmed", "Declined"],
  Confirmed: ["Attended", "Declined"],
  Attended: ["OutcomeRecorded"],
};

export function canTransition(from: ActionState, to: ActionState): boolean {
  return (NEXT[from] ?? []).includes(to);
}

const STAMP: Partial<Record<ActionState, "requestedAt" | "confirmedAt" | "attendedAt" | "outcomeAt" | "declinedAt">> = {
  Requested: "requestedAt",
  Confirmed: "confirmedAt",
  Attended: "attendedAt",
  OutcomeRecorded: "outcomeAt",
  Declined: "declinedAt",
};

export async function transitionAction(
  actionId: string,
  to: ActionState,
  actor: { userId: string; role: string },
  extra?: { scheduledFor?: Date; outcomeNote?: string; clinicianId?: string },
) {
  const action = await prisma.careAction.findUniqueOrThrow({ where: { id: actionId } });
  if (!canTransition(action.state as ActionState, to)) {
    throw new Error(`INVALID_TRANSITION:${action.state}->${to}`);
  }
  const stamp = STAMP[to];
  await prisma.careAction.update({
    where: { id: actionId },
    data: {
      state: to,
      ...(stamp ? { [stamp]: new Date() } : {}),
      ...(extra?.scheduledFor ? { scheduledFor: extra.scheduledFor } : {}),
      ...(extra?.outcomeNote ? { outcomeNote: extra.outcomeNote } : {}),
      ...(extra?.clinicianId ? { clinicianId: extra.clinicianId } : {}),
    },
  });
  await logAudit({
    actorId: actor.userId,
    actorRole: actor.role,
    subjectId: action.userId,
    type: "ActionTransition",
    resource: `action:${action.type}:${action.domain}`,
    detail: `${action.state}->${to}`,
  });
}
