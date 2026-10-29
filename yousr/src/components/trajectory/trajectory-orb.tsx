"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";
import type { Confidence, Direction, DomainResult } from "@/lib/domain/types";
import { DirectionBadge } from "@/components/ui/atoms";

export const DIRECTION_VAR: Record<Direction, string> = {
  Improving: "var(--state-improving)",
  Stable: "var(--state-stable)",
  Shifting: "var(--state-shifting)",
  Discuss: "var(--state-discuss)",
  Unknown: "var(--state-unknown)",
};

export const CONFIDENCE_ALPHA: Record<Confidence, number> = {
  High: 1,
  Moderate: 0.75,
  Low: 0.5,
  InsufficientData: 0.28,
};

/**
 * Clean tabular summary strip per domain (replaces the abstract floating
 * constellation). Each domain shows its status badge, driver count, and
 * remaining unknowns.
 */
export function TrajectoryOrb({ results }: { results: DomainResult[] }) {
  const { t, locale } = useI18n();
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5" role="region" aria-label={t("trajectory.title")}>
      {results.map((r) => (
        <Link
          key={r.domain}
          href={`/${locale}/trajectory/${r.domain}`}
          className="surface-paper lift flex flex-col justify-between p-3 text-sm"
        >
          <span className="font-semibold text-ink-900">{t(`domains.${r.domain}`)}</span>
          <div className="mt-2">
            <DirectionBadge direction={r.direction} confidence={r.confidence} />
          </div>
        </Link>
      ))}
    </div>
  );
}
