import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { authorize } from "@/lib/consent/authorize";
import { prisma } from "@/lib/db/prisma";
import { toFhirObservation } from "@/server/integrations";
import { logAudit } from "@/server/audit";

/**
 * Synthetic FHIR R4 Bundle of the subject's observations, restricted to the
 * sources they have switched on. Self (PersonalView) or a consented clinician
 * (ClinicianReview). Every export is written to the subject's ledger.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/fhir/[userId]">) {
  const { userId } = await ctx.params;
  const session = await getSession();
  const actor = session ? { userId: session.userId, role: session.role } : { userId: null, role: "anonymous" as const };
  const purpose = session?.userId === userId ? "PersonalView" : "ClinicianReview";
  const decision = await authorize({ actor, subjectId: userId, purpose, resource: "fhir-export", silent: true });
  if (!decision.allowed) {
    return NextResponse.json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "forbidden", details: { text: decision.reasonKey } }] }, { status: 403 });
  }
  const rows = await prisma.observation.findMany({
    where: { userId, dataSourceId: { in: decision.sources } },
    orderBy: { effectiveAt: "asc" },
  });
  await logAudit({ actorId: actor.userId, actorRole: actor.role, subjectId: userId, type: "Export", purpose, resource: "fhir-export", detail: `${rows.length} observations` });
  return NextResponse.json({
    resourceType: "Bundle",
    type: "collection",
    meta: { tag: [{ code: "SYNTHETIC", display: "Masar prototype: synthetic data" }] },
    total: rows.length,
    entry: rows.map((r) => ({ resource: toFhirObservation(r) })),
  });
}