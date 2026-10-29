import "server-only";
import { prisma } from "@/lib/db/prisma";
import { parseJsonArray, type Domain } from "@/lib/domain/types";
import { logAudit } from "./audit";

export async function coupleFor(userId: string) {
  const link = await prisma.coupleLink.findFirst({
    where: { OR: [{ partnerAId: userId }, { partnerBId: userId }] },
    include: {
      partnerA: { select: { id: true, name: true, nameAr: true, sex: true, hue: true } },
      partnerB: { select: { id: true, name: true, nameAr: true, sex: true, hue: true } },
    },
  });
  if (!link) return null;
  const isA = link.partnerAId === userId;
  return {
    linkId: link.id,
    me: isA ? link.partnerA : link.partnerB,
    partner: isA ? link.partnerB : link.partnerA,
    myScopes: parseJsonArray<Domain>(isA ? link.scopesA : link.scopesB),
    partnerScopes: parseJsonArray<Domain>(isA ? link.scopesB : link.scopesA),
  };
}

export async function setMyScopes(userId: string, scopes: Domain[]) {
  const link = await prisma.coupleLink.findFirst({
    where: { OR: [{ partnerAId: userId }, { partnerBId: userId }] },
  });
  if (!link) throw new Error("NOT_LINKED");
  const isA = link.partnerAId === userId;
  await prisma.coupleLink.update({
    where: { id: link.id },
    data: isA ? { scopesA: JSON.stringify(scopes) } : { scopesB: JSON.stringify(scopes) },
  });
  await logAudit({
    actorId: userId,
    actorRole: "patient",
    subjectId: userId,
    type: "Share",
    purpose: "PartnerShare",
    resource: "couple:scopes",
    detail: scopes.join(","),
  });
}
