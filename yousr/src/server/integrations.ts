import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { DataSourceId, ObsCode } from "@/lib/domain/types";
import { logAudit } from "./audit";

export interface SyntheticObservation {
  code: ObsCode;
  valueNum?: number;
  valueText?: string;
  unit?: string;
  effectiveAt: Date;
}

/**
 * Simulated connector. Writes FHIR-shaped synthetic observations as if they
 * arrived from Malaffi / a lab / Health Age / a device. Blocked when the
 * person has not switched that source on, and the block is audited.
 */
export async function importSynthetic(
  userId: string,
  source: DataSourceId,
  items: SyntheticObservation[],
) {
  const grant = await prisma.consentGrant.findFirst({
    where: { subjectId: userId, recipientRole: "Self", purpose: "PersonalView", source, status: "active" },
  });
  if (!grant) {
    await prisma.integrationEvent.create({ data: { userId, dataSourceId: source, status: "blocked" } });
    await logAudit({
      actorId: null,
      actorRole: "system",
      subjectId: userId,
      type: "BlockedAccess",
      purpose: "PersonalView",
      resource: `import:${source}`,
      allowed: false,
      detail: "source_off",
    });
    return { status: "blocked" as const, added: 0, skipped: 0 };
  }
  if (items.length === 0) {
    await prisma.integrationEvent.create({ data: { userId, dataSourceId: source, status: "empty" } });
    return { status: "empty" as const, added: 0, skipped: 0 };
  }

  // Idempotent: the same reading (code, value, source) on the same calendar
  // day is never written twice, so a repeated demo click adds nothing.
  const fresh: SyntheticObservation[] = [];
  for (const i of items) {
    const dayStart = new Date(i.effectiveAt);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);
    const dup = await prisma.observation.findFirst({
      where: {
        userId,
        dataSourceId: source,
        code: i.code,
        valueNum: i.valueNum ?? null,
        valueText: i.valueText ?? null,
        effectiveAt: { gte: dayStart, lt: dayEnd },
      },
      select: { id: true },
    });
    if (!dup) fresh.push(i);
  }
  const skipped = items.length - fresh.length;
  if (fresh.length === 0) {
    return { status: "duplicate" as const, added: 0, skipped };
  }

  await prisma.observation.createMany({
    data: fresh.map((i) => ({
      userId,
      dataSourceId: source,
      code: i.code,
      valueNum: i.valueNum,
      valueText: i.valueText,
      unit: i.unit,
      effectiveAt: i.effectiveAt,
    })),
  });
  await prisma.dataSource.update({ where: { id: source }, data: { lastSyncAt: new Date() } });
  await prisma.integrationEvent.create({
    data: { userId, dataSourceId: source, status: "ok", observationsAdded: fresh.length },
  });
  await logAudit({
    actorId: null,
    actorRole: "system",
    subjectId: userId,
    type: "Import",
    purpose: "PersonalView",
    resource: `import:${source}`,
    detail: `${fresh.length} observations`,
  });
  return { status: "ok" as const, added: fresh.length, skipped };
}

/** Converts stored observations to FHIR R4 Observation resources (synthetic). */
export function toFhirObservation(o: {
  id: string;
  code: string;
  valueNum: number | null;
  valueText: string | null;
  unit: string | null;
  effectiveAt: Date;
  dataSourceId: string;
}) {
  return {
    resourceType: "Observation",
    id: o.id,
    status: "final",
    code: { text: o.code },
    effectiveDateTime: o.effectiveAt.toISOString(),
    ...(o.valueNum !== null
      ? { valueQuantity: { value: o.valueNum, unit: o.unit ?? undefined } }
      : { valueString: o.valueText ?? undefined }),
    meta: { source: `urn:masar:simulated:${o.dataSourceId}`, tag: [{ code: "SYNTHETIC" }] },
  };
}
