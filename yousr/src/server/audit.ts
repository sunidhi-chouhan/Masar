import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { AuditType, Purpose } from "@/lib/domain/types";

export interface AuditInput {
  actorId: string | null;
  actorRole: string;
  subjectId: string;
  type: AuditType;
  purpose?: Purpose;
  resource: string;
  detail?: string;
  allowed?: boolean;
}

/** Append-only. No reproductive values are ever written here, only resource names. */
export async function logAudit(input: AuditInput) {
  await prisma.auditEvent.create({
    data: {
      actorId: input.actorId,
      actorRole: input.actorRole,
      subjectId: input.subjectId,
      type: input.type,
      purpose: input.purpose,
      resource: input.resource,
      detail: input.detail,
      allowed: input.allowed ?? true,
    },
  });
}

export async function listAuditForSubject(subjectId: string, limit = 40) {
  return prisma.auditEvent.findMany({
    where: { subjectId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: { select: { name: true, nameAr: true, role: true } } },
  });
}
