import "server-only";
import { prisma } from "@/lib/db/prisma";

export interface MetricsSnapshot {
  teachBackCorrectRate: number | null;
  teachBackCount: number;
  uncertaintyDisclosureRate: number | null; // assessments with >=1 unknown / total
  blockedAttempts: number;
  revocationsHonoured: number;
  consentChanges: number;
  insufficientShownAsUnknown: number; // guard activations visible in snapshots
}

/** Prototype-level evaluation metrics. These are not clinical outcomes. */
export async function metricsSnapshot(): Promise<MetricsSnapshot> {
  const [teachBacks, assessments, blocked, revocations, consentChanges] = await Promise.all([
    prisma.teachBackResponse.findMany({ select: { correct: true } }),
    prisma.domainAssessment.findMany({ select: { unknowns: true, confidence: true, direction: true } }),
    prisma.auditEvent.count({ where: { type: "BlockedAccess" } }),
    prisma.consentGrant.count({ where: { status: "revoked" } }),
    prisma.auditEvent.count({ where: { type: "ConsentChange" } }),
  ]);
  const withUnknowns = assessments.filter((a) => {
    try {
      return (JSON.parse(a.unknowns) as unknown[]).length > 0;
    } catch {
      return false;
    }
  }).length;
  return {
    teachBackCorrectRate: teachBacks.length
      ? Math.round((teachBacks.filter((t) => t.correct).length / teachBacks.length) * 100)
      : null,
    teachBackCount: teachBacks.length,
    uncertaintyDisclosureRate: assessments.length ? Math.round((withUnknowns / assessments.length) * 100) : null,
    blockedAttempts: blocked,
    revocationsHonoured: revocations,
    consentChanges,
    insufficientShownAsUnknown: assessments.filter((a) => a.confidence === "InsufficientData" && a.direction === "Unknown").length,
  };
}
