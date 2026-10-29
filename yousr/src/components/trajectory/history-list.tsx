"use client";

import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n/format";
import type { Confidence, Direction, Domain } from "@/lib/domain/types";
import { DirectionBadge } from "@/components/ui/atoms";

export interface HistoryRow {
  id: string;
  domain: Domain;
  direction: Direction;
  confidence: Confidence;
  computedAt: string;
}

export function HistoryList({ rows }: { rows: HistoryRow[] }) {
  const { t, locale } = useI18n();
  if (!rows.length) return <p className="text-sm text-ink-400">{t("trajectory.noHistory")}</p>;
  return (
    <ol className="relative ms-2 border-s border-dawn-300 ps-5">
      {rows.map((r) => (
        <li key={r.id} className="relative pb-4 last:pb-0">
          <span aria-hidden className="absolute -start-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-pill border border-dawn-50 bg-peach-300" />
          <p className="text-xs text-ink-400">{formatDate(r.computedAt, locale)}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-ink-900">
            <span className="font-medium">{t(`domains.${r.domain}`)}</span>
            <DirectionBadge direction={r.direction} confidence={r.confidence} />
          </p>
        </li>
      ))}
    </ol>
  );
}
