"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n/format";
import type { DomainResult } from "@/lib/domain/types";
import type { MetabolicCategory } from "@/lib/engine/breakdown";
import type { DomainFacts } from "@/lib/engine/trajectory";
import { DirectionBadge } from "@/components/ui/atoms";
import { MetabolicMiniGrid } from "./metabolic-breakdown";

const LEFT_ACCENT: Record<DomainResult["direction"], string> = {
  Improving: "border-s-4 border-s-mist-500",
  Stable: "border-s-4 border-s-mist-300",
  Shifting: "border-s-4 border-s-peach-500",
  Discuss: "border-s-4 border-s-amber-400",
  Unknown: "border-s-4 border-s-slate-400",
};

/**
 * One area, answering three plain questions: what is recorded (with dates),
 * what that does and does not mean, and what to do about it.
 */
export function DomainCard({
  result,
  facts,
  next,
  breakdown,
}: {
  result: DomainResult;
  facts: DomainFacts;
  next: { label: string; href: string };
  breakdown?: MetabolicCategory[] | null;
}) {
  const { t, locale } = useI18n();
  const r = result;
  const insufficient = r.confidence === "InsufficientData";
  const accent = insufficient ? "border-dashed border-slate-400/80" : LEFT_ACCENT[r.direction];
  const noReserveLab = r.domain === "reserve" && !facts.hasLab;

  return (
    <article className={`surface-paper flex h-full flex-col p-4 ${accent}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-ink-900">{t(`domains.${r.domain}`)}</h3>
        <DirectionBadge direction={r.direction} confidence={r.confidence} compact />
      </div>

      {/* 1. Current information */}
      <div className="mt-3">
        <p className="label-caps">{t("dashboard.card.recorded")}</p>
        {r.domain === "cycle" ? (
          <p className="mt-1 text-xs text-ink-600">{t("dashboard.card.cycleDates", { n: facts.total, recent: facts.fresh })}</p>
        ) : null}
        {noReserveLab ? (
          <p className="mt-1 text-sm text-ink-900">{t("dashboard.card.noLabs")}</p>
        ) : facts.items.length === 0 ? (
          <p className="mt-1 text-sm text-ink-900">{t("dashboard.card.nothingRecorded")}</p>
        ) : (
          <ul className="mt-1 space-y-1 text-xs text-ink-600">
            {facts.items.slice(0, 5).map((f, i) => (
              <li key={`${f.code}-${i}`}>
                <span className="font-medium text-ink-900">{t(`factors.${f.factor}`)}</span>
                {f.value !== null || f.text ? (
                  <>
                    {": "}
                    <span className="text-ink-900">
                      {f.value !== null ? `${f.value}${f.unit ? ` ${f.unit}` : ""}` : t(`timeline.values.${f.text}`)}
                    </span>
                  </>
                ) : null}
                {f.at ? <span> · {formatDate(f.at, locale)}</span> : <span> · {t("dashboard.card.profileRecorded")}</span>}
                {f.outdated ? <span className="text-amber-700"> · {t("timeline.tags.outdated")}</span> : null}
              </li>
            ))}
          </ul>
        )}
        {r.domain === "cycle" && facts.fresh < 3 ? (
          <p className="mt-2 rounded-md border border-dashed border-slate-400 bg-dawn-50/70 px-2.5 py-1.5 text-xs text-ink-600">
            {t("dashboard.card.cycleFew")}
          </p>
        ) : null}
        {breakdown ? <MetabolicMiniGrid categories={breakdown} /> : null}
      </div>

      {/* 2. Interpretation */}
      <div className="mt-3 border-t border-dawn-200 pt-3">
        <p className="label-caps">{t("dashboard.card.meaning")}</p>
        {noReserveLab ? (
          <p className="mt-2 text-xs text-ink-600">{t("dashboard.card.reserveNotAssessed")}</p>
        ) : insufficient ? (
          <p className="mt-2 text-xs text-ink-600">{t("emptyState.cardBody")}</p>
        ) : (
          <>
            <p className="mt-2 text-sm font-medium text-ink-900">{t(`observed.${r.observedKey}`)}</p>
            <p className="mt-1 text-xs text-ink-600">{t(`summaries.${r.summaryKey}`)}</p>
          </>
        )}
        <p className="mt-2 text-xs text-ink-400">{t(`dashboard.insights.cannotByDomain.${r.domain}`)}</p>
      </div>

      {/* 3. Next step */}
      <div className="mt-auto border-t border-dawn-200 pt-3">
        <p className="label-caps">{t("dashboard.card.next")}</p>
        <Link href={next.href} className="mt-1 block text-sm font-semibold text-mist-700 underline-offset-4 hover:underline">
          {next.label} →
        </Link>
        <Link href={`/${locale}/trajectory/${r.domain}`} className="mt-1 block text-xs text-ink-600 underline-offset-4 hover:underline">
          {t("dashboard.card.open")}
        </Link>
      </div>
    </article>
  );
}
