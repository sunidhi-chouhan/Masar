import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { Actor } from "@/lib/consent/authorize";
import { authorize } from "@/lib/consent/authorize";
import { logAudit } from "./audit";

export interface QueueRow {
  userId: string;
  name: string;
  nameAr: string;
  sex: string;
  birthYear: number;
  intention: string;
  consented: boolean;
  discussDomains: string[];
  oldestSignalAt: Date | null;
  counselState: string | null;
  lastReviewAt: Date | null;
}

/**
 * Patients with a Discuss domain and no attended counselling, oldest signal
 * first. Patients who have revoked clinician access still appear as a row
 * (so nobody is "lost") but with no data beyond their name and a lock.
 */
export async function clinicianQueue(actor: Actor): Promise<QueueRow[]> {
  const patients = await prisma.user.findMany({
    where: { role: "patient" },
    include: {
      assessments: { orderBy: { computedAt: "desc" } },
      careActions: true,
      reviewsAsPatient: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  const rows: QueueRow[] = [];
  for (const p of patients) {
    const decision = await authorize({
      actor,
      subjectId: p.id,
      purpose: "ClinicianReview",
      resource: "queue",
      silent: true,
    });
    const latestByDomain = new Map<string, (typeof p.assessments)[number]>();
    for (const a of p.assessments) if (!latestByDomain.has(a.domain)) latestByDomain.set(a.domain, a);
    const discuss = [...latestByDomain.values()].filter((a) => a.direction === "Discuss");
    const counsel = p.careActions
      .filter((a) => a.type === "Counsel" || a.type === "Refer")
      .sort((a, b) => a.suggestedAt.getTime() - b.suggestedAt.getTime())[0];
    rows.push({
      userId: p.id,
      name: p.name,
      nameAr: p.nameAr,
      sex: p.sex,
      birthYear: p.birthYear,
      intention: p.intention,
      consented: decision.allowed,
      discussDomains: decision.allowed ? discuss.map((d) => d.domain) : [],
      oldestSignalAt: decision.allowed && discuss.length ? discuss[discuss.length - 1].computedAt : null,
      counselState: decision.allowed ? (counsel?.state ?? null) : null,
      lastReviewAt: p.reviewsAsPatient[0]?.createdAt ?? null,
    });
  }
  return rows.sort((a, b) => {
    if (a.consented !== b.consented) return a.consented ? -1 : 1;
    const ta = a.oldestSignalAt?.getTime() ?? Infinity;
    const tb = b.oldestSignalAt?.getTime() ?? Infinity;
    return ta - tb;
  });
}

export async function recordReview(
  clinicianId: string,
  patientId: string,
  decision: "Accept" | "Modify" | "Override",
  reason?: string,
  note?: string,
) {
  await prisma.clinicianReview.create({ data: { clinicianId, patientId, decision, reason, note } });
  await logAudit({
    actorId: clinicianId,
    actorRole: "clinician",
    subjectId: patientId,
    type: "Review",
    purpose: "ClinicianReview",
    resource: "one-pager",
    detail: decision,
  });
}

export async function listReviews(patientId: string) {
  return prisma.clinicianReview.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: { clinician: { select: { name: true, nameAr: true } } },
  });
}
