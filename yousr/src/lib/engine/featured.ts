import type { DomainResult } from "@/lib/domain/types";

export const INSIGHT_ORDER = ["Discuss", "Shifting", "Improving", "Stable", "Unknown"];

/**
 * The one area to show first: flagged areas ahead of the rest, then whichever
 * has the most recorded information behind it. Areas with no usable
 * information are never featured.
 */
export function pickFeatured<T extends { result: DomainResult }>(items: T[]): T | null {
  const withInfo = items.filter((i) => i.result.confidence !== "InsufficientData");
  if (withInfo.length === 0) return null;
  return [...withInfo].sort(
    (a, b) =>
      INSIGHT_ORDER.indexOf(a.result.direction) - INSIGHT_ORDER.indexOf(b.result.direction) ||
      b.result.drivers.length - a.result.drivers.length,
  )[0];
}
