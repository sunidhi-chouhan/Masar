import type { Confidence, Direction, Domain, DomainResult } from "@/lib/domain/types";

/** Directions-only payload for PartnerShare. Never includes observations. */
export interface PartnerShareView {
  domain: Domain;
  direction: Direction;
  confidence: Confidence;
}

/**
 * Map engine results + consented scopes to the couple UI contract.
 * Callers must not attach observations or driver values to this shape.
 */
export function toPartnerShareViews(
  results: Pick<DomainResult, "domain" | "direction" | "confidence">[],
  scopes: Domain[],
): PartnerShareView[] {
  const allowed = new Set(scopes);
  return results
    .filter((r) => allowed.has(r.domain))
    .map((r) => ({
      domain: r.domain,
      direction: r.direction,
      confidence: r.confidence,
    }));
}

/** Contract guard: a PartnerShare JSON payload must not contain observation fields. */
export function assertPartnerShareSafe(payload: unknown): asserts payload is PartnerShareView[] {
  if (!Array.isArray(payload)) throw new Error("PARTNER_SHARE_NOT_ARRAY");
  for (const row of payload) {
    if (!row || typeof row !== "object") throw new Error("PARTNER_SHARE_BAD_ROW");
    const keys = Object.keys(row as object).sort();
    if (keys.join(",") !== "confidence,direction,domain") {
      throw new Error(`PARTNER_SHARE_EXTRA_KEYS:${keys.join(",")}`);
    }
    if ("observations" in (row as object) || "drivers" in (row as object) || "value" in (row as object)) {
      throw new Error("PARTNER_SHARE_LEAK");
    }
  }
}
