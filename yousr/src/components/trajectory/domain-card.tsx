"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n/format";
import type { DomainResult } from "@/lib/domain/types";
import type { MetabolicCategory } from "@/lib/engine/breakdown";
import type { DomainFacts } from "@/lib/engine/trajectory";
import type { ChartPoint } from "@/components/charts/confidence-band";
import { Sparkline } from "@/components/charts/sparkline";
import { DirectionBadge } from "@/components/ui/atoms";
import { useJourneyMotion } from "@/components/journey/journey-loaders";
import { MetabolicMiniGrid } from "./metabolic-breakdown";
import { DomainSphere } from "./section-figures";

const SPARK_TONE: Record<DomainResult["direction"], "mist" | "peach" | "amber" | "slate"> = {
  Improving: "mist",
  Stable: "mist",
  Shifting: "peach",
  Discuss: "amber",
  Unknown: "slate",
};

/**
 * One area as a personalised sphere-led card: recorded facts, meaning, sparkline.
 */
export function DomainCard({
  result,
  facts,
  next,
  breakdown,
  sparkPoints = [],
}: {
  result: DomainResult;
  facts: DomainFacts;
  next: { label: string; href: string };
  breakdown?: MetabolicCategory[] | null;
  sparkPoints?: ChartPoint[];
}) {
  const { t, locale } = useI18n();
  const { animate } = useJourneyMotion();
  const r = result;
  const insufficient = r.confidence === "InsufficientData";
  const noReserveLab = r.domain === "reserve" && !facts.hasLab;

  return (
    <motion.article
      whileHover={animate ? { y: -4 } : undefined}
      className={`group relative flex h-full flex-col overflow-hidden rounded-[18px] bg-white/90 p-4 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lift)] ${
        insufficient ? "border border-dashed border-slate-400/50" : "ring-1 ring-dawn-200/60"
      }`}
    >

      <div className="relative flex items-start gap-3">
        <DomainSphere domain={r.domain} direction={insufficient ? "Unknown" : r.direction} size={64} />
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="font-display text-lg leading-snug tracking-tight text-ink-900">
            {t(`domains.${r.domain}`)}
          </h3>
          <div className="mt-1.5">
            <DirectionBadge direction={r.direction} confidence={r.confidence} compact />
          </div>
        </div>
      </div>

      <div className="relative mt-3 flex justify-end">
        <Sparkline
          points={sparkPoints}
          tone={insufficient ? "slate" : SPARK_TONE[r.direction]}
          className="opacity-90"
        />
      </div>

      <div className="relative mt-3">
        <p className="label-caps">{t("dashboard.card.recorded")}</p>
        {r.domain === "cycle" ? (
          <p className="mt-1 text-xs text-ink-600">
            {t("dashboard.card.cycleDates", { n: facts.total, recent: facts.fresh })}
          </p>
        ) : null}
        {noReserveLab ? (
          <p className="mt-1 text-sm text-ink-900">{t("dashboard.card.noLabs")}</p>
        ) : facts.items.length === 0 ? (
          <p className="mt-1 text-sm text-ink-900">{t("dashboard.card.nothingRecorded")}</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {facts.items.slice(0, 4).map((f, i) => (
              <li
                key={`${f.code}-${i}`}
                className="flex items-start gap-2 rounded-full bg-dawn-50/90 px-3 py-1.5 text-xs text-ink-600"
              >
                <span
                  aria-hidden
                  className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-mist-500"
                />
                <span>
                  <span className="font-medium text-ink-900">{t(`factors.${f.factor}`)}</span>
                  {f.value !== null || f.text ? (
                    <>
                      {": "}
                      <span className="text-ink-900">
                        {f.value !== null
                          ? `${f.value}${f.unit ? ` ${f.unit}` : ""}`
                          : t(`timeline.values.${f.text}`)}
                      </span>
                    </>
                  ) : null}
                  {f.at ? (
                    <span className="text-ink-400"> · {formatDate(f.at, locale)}</span>
                  ) : (
                    <span className="text-ink-400"> · {t("dashboard.card.profileRecorded")}</span>
                  )}
                  {f.outdated ? (
                    <span className="text-amber-700"> · {t("timeline.tags.outdated")}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
        {r.domain === "cycle" && facts.fresh < 3 ? (
          <p className="mt-2 rounded-2xl border border-dashed border-slate-400/70 bg-dawn-50/70 px-2.5 py-1.5 text-xs text-ink-600">
            {t("dashboard.card.cycleFew")}
          </p>
        ) : null}
        {breakdown ? <MetabolicMiniGrid categories={breakdown} /> : null}
      </div>

      <div className="relative mt-3 rounded-2xl bg-dawn-50/70 p-3">
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
        <p className="mt-2 text-xs text-ink-400">
          {t(`dashboard.insights.cannotByDomain.${r.domain}`)}
        </p>
      </div>

      <div className="relative mt-auto border-t border-dawn-200/80 pt-3">
        <p className="label-caps">{t("dashboard.card.next")}</p>
        <Link
          href={next.href}
          className="mt-1 block text-sm font-semibold text-mist-700 underline-offset-4 hover:underline"
        >
          {next.label} →
        </Link>
        <Link
          href={`/${locale}/trajectory/${r.domain}`}
          className="mt-1 block text-xs text-ink-600 underline-offset-4 hover:underline"
        >
          {t("dashboard.card.open")}
        </Link>
      </div>
    </motion.article>
  );
}
