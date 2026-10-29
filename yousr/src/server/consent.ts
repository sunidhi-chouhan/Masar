import "server-only";
import { prisma } from "@/lib/db/prisma";
import {
  DATA_SOURCES,
  type DataSourceId,
  type Purpose,
  type RecipientRole,
} from "@/lib/domain/types";
import { logAudit } from "./audit";

export interface ConsentState {
  sources: Record<DataSourceId, boolean>;
  recipients: {
    Clinician: boolean;
    Partner: boolean;
    Analytics: boolean;
  };
}

const RECIPIENT_PURPOSE: Record<"Clinician" | "Partner" | "Analytics", Purpose> = {
  Clinician: "ClinicianReview",
  Partner: "PartnerShare",
  Analytics: "PopulationAnalytics",
};

export async function getConsentState(subjectId: string): Promise<ConsentState> {
  const grants = await prisma.consentGrant.findMany({ where: { subjectId, status: "active" } });
  const sources = Object.fromEntries(
    DATA_SOURCES.map((s) => [
      s,
      grants.some((g) => g.recipientRole === "Self" && g.purpose === "PersonalView" && g.source === s),
    ]),
  ) as Record<DataSourceId, boolean>;
  return {
    sources,
    recipients: {
      Clinician: grants.some((g) => g.recipientRole === "Clinician" && g.purpose === "ClinicianReview"),
      Partner: grants.some((g) => g.recipientRole === "Partner" && g.purpose === "PartnerShare"),
      Analytics: grants.some((g) => g.recipientRole === "Analytics" && g.purpose === "PopulationAnalytics"),
    },
  };
}

export async function setSourceConsent(subjectId: string, source: DataSourceId, on: boolean) {
  await setGrant(subjectId, { recipientRole: "Self", purpose: "PersonalView", source }, on);
}

export async function setRecipientConsent(
  subjectId: string,
  recipient: "Clinician" | "Partner" | "Analytics",
  on: boolean,
) {
  await setGrant(subjectId, { recipientRole: recipient, purpose: RECIPIENT_PURPOSE[recipient], source: null }, on);
}

export async function setAiExplanationConsent(subjectId: string, on: boolean) {
  await setGrant(
    subjectId,
    { recipientRole: "AiExplanation", purpose: "AiExplanation", source: null },
    on,
  );
}

export async function hasAiExplanationConsent(subjectId: string): Promise<boolean> {
  const g = await prisma.consentGrant.findFirst({
    where: {
      subjectId,
      recipientRole: "AiExplanation",
      purpose: "AiExplanation",
      status: "active",
    },
  });
  return Boolean(g);
}

async function setGrant(
  subjectId: string,
  key: { recipientRole: RecipientRole; purpose: Purpose; source: DataSourceId | null },
  on: boolean,
) {
  const active = await prisma.consentGrant.findFirst({
    where: { subjectId, recipientRole: key.recipientRole, purpose: key.purpose, source: key.source, status: "active" },
  });
  if (on && !active) {
    await prisma.consentGrant.create({
      data: { subjectId, recipientRole: key.recipientRole, purpose: key.purpose, source: key.source },
    });
  } else if (!on && active) {
    // Revocation is recorded, never deleted: the ledger must show it happened.
    await prisma.consentGrant.update({
      where: { id: active.id },
      data: { status: "revoked", revokedAt: new Date() },
    });
  } else {
    return;
  }
  await logAudit({
    actorId: subjectId,
    actorRole: "patient",
    subjectId,
    type: "ConsentChange",
    purpose: key.purpose,
    resource: key.source ? `source:${key.source}` : `recipient:${key.recipientRole}`,
    detail: on ? "granted" : "revoked",
  });
}
