"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import type { Confidence, Direction, Domain, Intention } from "@/lib/domain/types";
import { DIRECTION_DOT, DirectionBadge, SimulatedBadge } from "@/components/ui/atoms";
import { Sparkline } from "@/components/charts/sparkline";
import type { ChartPoint } from "@/components/charts/confidence-band";
import { IntentionPicker } from "@/components/trajectory/intention-picker";
import { useJourneyMotion } from "@/components/journey/journey-loaders";

const LUX = [0.16, 1, 0.3, 1] as const;

export interface AreaTile {
  domain: Domain;
  direction: Direction;
  confidence: Confidence;
  readings: number;
  points: ChartPoint[];
}

export interface HeroNextAction {
  title: string;
  typeLabel: string;
  state: string;
  stateLabel: string;
  stepIndex: number;
  stepTotal: number;
  scheduledLabel: string | null;
}

const CONFIDENCE_BARS: Record<Confidence, number> = {
  High: 3,
  Moderate: 2,
  Low: 1,
  InsufficientData: 0,
};

const SPARK_TONE: Record<Direction, "mist" | "peach" | "amber" | "slate"> = {
  Improving: "mist",
  Stable: "mist",
  Shifting: "peach",
  Discuss: "amber",
  Unknown: "slate",
};

function ConfidenceBars({ level }: { level: Confidence }) {
  const n = CONFIDENCE_BARS[level];
  return (
    <span className="inline-flex items-end gap-[3px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-[4px] rounded-full ${i < n ? "bg-ink-700" : "bg-dawn-300"}`}
          style={{ height: 6 + i * 4 }}
        />
      ))}
    </span>
  );
}

export function DashboardHero({
  name,
  age,
  intention,
  intentionLabel,
  conditionsLabel,
  latestLabel,
  readings,
  areasKnown,
  watch,
  nextAction,
  missing,
  tiles,
}: {
  name: string;
  age: number;
  intention: Intention;
  intentionLabel: string;
  conditionsLabel: string | null;
  latestLabel: string | null;
  readings: number;
  areasKnown: number;
  watch: { domain: Domain; direction: Direction }[];
  nextAction: HeroNextAction | null;
  missing: { label: string; href: string }[];
  tiles: AreaTile[];
}) {
  const { t, locale } = useI18n();
  const { animate, live, dur } = useJourneyMotion();
  const enter = (i: number) =>
    live && animate
      ? {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: dur(0.5), delay: 0.05 + i * 0.06, ease: LUX },
        }
      : {};

  const total = tiles.length;
  // Never reassure on thin data: "calm" only when every area has something recorded.
  const headline =
    areasKnown === 0
      ? t("dashboard.summary.readNone")
      : watch.length === 1
        ? t("dashboard.summary.readWatchOne")
        : watch.length > 1
          ? t("dashboard.summary.readWatch", { n: watch.length })
          : areasKnown < total
            ? t("dashboard.summary.readPartial")
            : t("dashboard.summary.readCalm");

  return (
    <div className="space-y-6">
      {/* ---------- identity row ---------- */}
      <motion.header {...enter(0)} className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="label-caps">{t("dashboard.summary.eyebrow")}</p>
            {latestLabel ? (
              <>
                <span className="text-ink-300">/</span>
                <p className="text-xs text-ink-500">{t("dashboard.summary.updated", { date: latestLabel })}</p>
              </>
            ) : null}
            <SimulatedBadge />
          </div>
          <h1 className="mt-2 text-[clamp(2rem,3.6vw,2.9rem)] leading-[1.05] text-ink-900">
            {t("dashboard.summary.greeting", { name })}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[13px]">
            {[t("common.age", { age }), intentionLabel, conditionsLabel].filter(Boolean).map((chip) => (
              <span key={chip} className="rounded-full border border-dawn-200 bg-white px-2.5 py-0.5 text-ink-600">
                {chip}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/${locale}/privacy`}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-dawn-300 bg-white px-4 text-sm font-medium text-ink-900 shadow-[var(--shadow-soft)] transition-colors hover:border-dawn-400"
          >
            <span aria-hidden className="dot bg-mist-500" />
            {t("dashboard.summary.consented")}
          </Link>
          <Link
            href={`/${locale}/profile`}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-mist-700 px-4 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_6px_16px_-8px_rgba(11,74,68,0.6)] transition-colors hover:bg-mist-600"
          >
            <span aria-hidden className="text-base leading-none">+</span>
            {t("trajectory.addData")}
          </Link>
        </div>
      </motion.header>

      {/* ---------- executive summary ---------- */}
      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <motion.section {...enter(1)} className="surface-pine overflow-hidden p-6 md:p-8" aria-labelledby="read-heading">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">{t("dashboard.summary.read")}</p>
          <h2 id="read-heading" className="mt-3 max-w-xl text-[clamp(1.6rem,2.6vw,2.2rem)] leading-[1.12] text-white">
            {headline}
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/70">{t("dashboard.summary.readBody")}</p>

          {watch.length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-2">
              {watch.map((w) => (
                <li key={w.domain}>
                  <Link
                    href={`/${locale}/trajectory/${w.domain}`}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-medium text-white ring-1 ring-inset ring-white/15 backdrop-blur transition-colors hover:bg-white/20"
                  >
                    <span aria-hidden className={`dot ${DIRECTION_DOT[w.direction]}`} />
                    {t(`domains.short.${w.domain}`)}
                    <span className="text-white/60">· {t(`directions.${w.direction}`)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-7 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
                {t("dashboard.summary.nextStep")}
              </p>
              {nextAction ? (
                <>
                  <p className="mt-1.5 text-lg font-semibold text-white">{nextAction.title}</p>
                  <p className="mt-0.5 text-sm text-white/70">
                    {nextAction.typeLabel} · {nextAction.stateLabel}
                    {nextAction.scheduledLabel ? ` · ${nextAction.scheduledLabel}` : ""}
                  </p>
                  <div className="mt-3 flex max-w-xs gap-1" aria-hidden>
                    {Array.from({ length: nextAction.stepTotal }).map((_, i) => (
                      <span
                        key={i}
                        className={`h-1 flex-1 rounded-full ${i < nextAction.stepIndex ? "bg-amber-400" : "bg-white/15"}`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-1.5 max-w-md text-sm text-white/75">{t("dashboard.summary.noNextStep")}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="#insights"
                className="inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium text-white/85 ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/10"
              >
                {t("dashboard.summary.reviewFindings")}
              </a>
              <a
                href="#steps"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-mist-900 transition-colors hover:bg-amber-100"
              >
                {t("dashboard.summary.openPathway")}
                <span aria-hidden className="rtl:-scale-x-100">→</span>
              </a>
            </div>
          </div>
        </motion.section>

        <motion.section {...enter(2)} className="card flex flex-col p-6" aria-labelledby="completeness-heading">
          <p id="completeness-heading" className="label-caps">
            {t("dashboard.summary.completeness")}
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-5xl leading-none tabular-nums text-ink-900">{readings}</span>
            <span className="text-sm text-ink-500">{t("dashboard.summary.readings")}</span>
          </div>
          <div className="mt-4 flex gap-1" aria-hidden>
            {tiles.map((tile) => (
              <span
                key={tile.domain}
                className={`h-1.5 flex-1 rounded-full ${tile.readings > 0 ? "bg-mist-500" : "bg-dawn-200"}`}
              />
            ))}
          </div>
          <p className="mt-2 text-[13px] text-ink-600">
            {t("dashboard.summary.areasCovered", { n: areasKnown, total })}
          </p>

          {missing.length > 0 ? (
            <div className="mt-5">
              <p className="text-[12px] font-semibold text-ink-900">{t("dashboard.summary.addMissing")}</p>
              <ul className="mt-2 divide-y divide-dawn-200/70 rounded-xl border border-dashed border-dawn-300">
                {missing.map((m) => (
                  <li key={m.label}>
                    <Link
                      href={m.href}
                      className="group flex items-center justify-between gap-3 px-3 py-2.5 text-[13px] text-ink-700 transition-colors hover:bg-dawn-50"
                    >
                      <span className="min-w-0">{m.label}</span>
                      <span aria-hidden className="text-mist-700 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100">
                        +
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-auto border-t border-dawn-200/70 pt-4">
            <div className="mt-1">
              <IntentionPicker current={intention} />
            </div>
          </div>
        </motion.section>
      </div>

      {/* ---------- areas at a glance ---------- */}
      <motion.section {...enter(3)} aria-labelledby="areas-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="areas-heading" className="text-[1.35rem] text-ink-900">
              {t("dashboard.summary.allAreas")}
            </h2>
            <p className="mt-0.5 text-[13px] text-ink-500">{t("dashboard.summary.allAreasSub")}</p>
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {tiles.map((tile) => (
            <li key={tile.domain}>
              <Link
                href={`/${locale}/trajectory/${tile.domain}`}
                className="card group flex h-full flex-col p-4 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-dawn-300 hover:shadow-[var(--shadow-lift)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13.5px] font-semibold text-ink-900">{t(`domains.short.${tile.domain}`)}</p>
                  <span aria-hidden className="text-ink-300 transition-colors group-hover:text-mist-700 rtl:-scale-x-100">
                    ↗
                  </span>
                </div>
                <div className="mt-3 h-9">
                  {tile.points.length >= 2 ? (
                    <Sparkline points={tile.points} tone={SPARK_TONE[tile.direction]} className="h-9 w-full" />
                  ) : (
                    <div className="flex h-full items-center">
                      <span className="h-px w-full border-t border-dashed border-dawn-300" />
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <DirectionBadge direction={tile.direction} confidence={tile.confidence} compact />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-dawn-200/70 pt-2.5 text-[11.5px] text-ink-500">
                  <span>{t("dashboard.summary.readingsCount", { n: tile.readings })}</span>
                  <span className="inline-flex items-center gap-1.5" title={t(`confidence.${tile.confidence}`)}>
                    {t("dashboard.summary.evidence")}
                    <ConfidenceBars level={tile.confidence} />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </motion.section>
    </div>
  );
}
