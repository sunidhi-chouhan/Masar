import "server-only";
import { prisma } from "@/lib/db/prisma";
import {
  parseJsonArray,
  type DataSourceId,
  type Domain,
  type Purpose,
  type Role,
} from "@/lib/domain/types";
import { logAudit } from "@/server/audit";

export interface Actor {
  userId: string | null;
  role: Role | "anonymous";
}

export interface AccessRequest {
  actor: Actor;
  subjectId: string;
  purpose: Purpose;
  /** what is being read, for the audit trail, e.g. "trajectory", "observations:LabMock" */
  resource: string;
  /** if set, the partner-share scope must include this domain */
  domain?: Domain;
  /** skip writing a View audit row (use for secondary reads inside one page) */
  silent?: boolean;
}

export interface AccessDecision {
  allowed: boolean;
  reasonKey: string; // i18n key under access.*
  /** domains visible to a partner, when purpose is PartnerShare */
  scopes?: Domain[];
  /** sources the subject has switched on for their own view */
  sources: DataSourceId[];
}

/**
 * The single gate. Every repository function that reads another person's
 * data must call this. UI never decides access; it only reflects the answer.
 *
 * Purposes are a closed list (see domain/types.ts). There is no code path for
 * employment, insurance or marketing access: the firewall is structural.
 */
export async function authorize(req: AccessRequest): Promise<AccessDecision> {
  const sources = await activeSources(req.subjectId);
  const decision = await decide(req, sources);
  const isSelf = req.actor.userId === req.subjectId;
  if (!decision.allowed) {
    await logAudit({
      actorId: req.actor.userId,
      actorRole: req.actor.role,
      subjectId: req.subjectId,
      type: "BlockedAccess",
      purpose: req.purpose,
      resource: req.resource,
      allowed: false,
      detail: decision.reasonKey,
    });
  } else if (!isSelf && !req.silent) {
    await logAudit({
      actorId: req.actor.userId,
      actorRole: req.actor.role,
      subjectId: req.subjectId,
      type: "View",
      purpose: req.purpose,
      resource: req.resource,
      allowed: true,
    });
  }
  return decision;
}

async function decide(req: AccessRequest, sources: DataSourceId[]): Promise<AccessDecision> {
  const { actor, subjectId, purpose } = req;
  if (!actor.userId) return { allowed: false, reasonKey: "unauthenticated", sources };

  switch (purpose) {
    case "PersonalView":
      return actor.userId === subjectId
        ? { allowed: true, reasonKey: "self", sources }
        : { allowed: false, reasonKey: "not_self", sources };

    case "ClinicianReview": {
      if (actor.role !== "clinician") return { allowed: false, reasonKey: "not_clinician", sources };
      const grant = await prisma.consentGrant.findFirst({
        where: { subjectId, recipientRole: "Clinician", purpose: "ClinicianReview", status: "active" },
      });
      return grant
        ? { allowed: true, reasonKey: "consented", sources }
        : { allowed: false, reasonKey: "consent_revoked", sources };
    }

    case "PartnerShare": {
      const link = await prisma.coupleLink.findFirst({
        where: {
          OR: [
            { partnerAId: subjectId, partnerBId: actor.userId },
            { partnerAId: actor.userId, partnerBId: subjectId },
          ],
        },
      });
      if (!link) return { allowed: false, reasonKey: "not_linked", sources };
      const grant = await prisma.consentGrant.findFirst({
        where: { subjectId, recipientRole: "Partner", purpose: "PartnerShare", status: "active" },
      });
      if (!grant) return { allowed: false, reasonKey: "consent_revoked", sources };
      const scopes = parseJsonArray<Domain>(
        link.partnerAId === subjectId ? link.scopesA : link.scopesB,
      );
      if (req.domain && !scopes.includes(req.domain)) {
        return { allowed: false, reasonKey: "domain_not_shared", sources, scopes };
      }
      return { allowed: true, reasonKey: "consented", sources, scopes };
    }

    case "PopulationAnalytics": {
      if (actor.role !== "admin" && actor.role !== "clinician") {
        return { allowed: false, reasonKey: "not_admin", sources };
      }
      const grant = await prisma.consentGrant.findFirst({
        where: { subjectId, recipientRole: "Analytics", purpose: "PopulationAnalytics", status: "active" },
      });
      return grant
        ? { allowed: true, reasonKey: "consented", sources }
        : { allowed: false, reasonKey: "consent_revoked", sources };
    }

    // AiExplanation is a paraphrase consent flag only — never a data-access purpose.
    case "AiExplanation":
      return { allowed: false, reasonKey: "purpose_not_for_data", sources };
  }
}

/** Sources the subject currently includes in their own view. */
export async function activeSources(subjectId: string): Promise<DataSourceId[]> {
  const grants = await prisma.consentGrant.findMany({
    where: { subjectId, recipientRole: "Self", purpose: "PersonalView", status: "active", source: { not: null } },
    select: { source: true },
  });
  return grants.map((g) => g.source as DataSourceId);
}

export class AccessDeniedError extends Error {
  constructor(public readonly reasonKey: string) {
    super(`ACCESS_DENIED:${reasonKey}`);
  }
}

export async function authorizeOrThrow(req: AccessRequest): Promise<AccessDecision> {
  const d = await authorize(req);
  if (!d.allowed) throw new AccessDeniedError(d.reasonKey);
  return d;
}
