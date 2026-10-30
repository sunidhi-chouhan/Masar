"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import { SimulatedBadge } from "@/components/ui/atoms";
import { useJourneyMotion } from "@/components/journey/journey-loaders";
import { DomainRadar, type RadarNode } from "@/components/trajectory/domain-radar";

const LUX = [0.16, 1, 0.3, 1] as const;

export function DashboardHero({
  name,
  age,
  intentionLabel,
  conditionsLabel,
  readings,
  areasKnown,
  areasWatch,
  nodes,
}: {
  name: string;
  age: number;
  intentionLabel: string;
  conditionsLabel: string | null;
  readings: number;
  areasKnown: number;
  areasWatch: number;
  nodes: RadarNode[];
}) {
  const { t, locale } = useI18n();
  const { animate, live, dur } = useJourneyMotion();

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-mist-100/80 via-dawn-50 to-peach-200/25 shadow-[var(--shadow-soft)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_85%_10%,color-mix(in_srgb,var(--mist-300)_40%,transparent),transparent),radial-gradient(ellipse_45%_40%_at_5%_90%,color-mix(in_srgb,var(--peach-200)_35%,transparent),transparent)]"
      />
      <div aria-hidden className="journey-grain pointer-events-none absolute inset-0 opacity-30" />

      <div className="relative grid gap-6 p-5 md:grid-cols-[1.15fr_0.95fr] md:gap-8 md:p-7 lg:p-8">
        <div className="flex min-w-0 flex-col justify-center">
          <motion.div
            initial={live && animate ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: dur(0.45), ease: LUX }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="label-caps mb-0">{t("dashboard.eyebrow")}</p>
              <SimulatedBadge />
            </div>
            <p className="mt-3 font-display text-base text-mist-700 sm:text-lg">
              {t("dashboard.hero.greeting", { name })}
            </p>
            <h1 className="mt-1 font-display text-[clamp(1.75rem,4vw,2.55rem)] leading-[1.12] tracking-tight text-ink-900">
              {t("dashboard.hero.title")}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-600">
              {t("dashboard.hero.tagline")}
            </p>

            <p className="mt-4 text-sm text-ink-600">
              <span className="font-medium text-ink-900">{name}</span>
              <span> · {t("common.age", { age })}</span>
              <span> · {intentionLabel}</span>
              {conditionsLabel ? <span> · {conditionsLabel}</span> : null}
            </p>

            <dl className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { k: "readings", v: readings, label: t("dashboard.hero.statReadings") },
                { k: "known", v: areasKnown, label: t("dashboard.hero.statKnown") },
                { k: "watch", v: areasWatch, label: t("dashboard.hero.statWatch") },
              ].map((s, i) => (
                <motion.div
                  key={s.k}
                  className="rounded-xl bg-white/70 px-3 py-2.5 shadow-[var(--shadow-soft)] backdrop-blur-sm"
                  initial={live && animate ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: dur(0.35), delay: animate ? 0.1 + i * 0.06 : 0, ease: LUX }}
                >
                  <dt className="text-[10px] font-medium uppercase tracking-wider text-ink-400">{s.label}</dt>
                  <dd className="mt-0.5 font-display text-xl tabular-nums text-ink-900 sm:text-2xl">{s.v}</dd>
                </motion.div>
              ))}
            </dl>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href={`/${locale}/profile`}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-mist-700 px-5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition-colors hover:bg-mist-500"
              >
                {t("trajectory.addData")}
              </Link>
              <Link
                href={`/${locale}/privacy`}
                className="inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-medium text-mist-700 transition-colors hover:bg-white/60"
              >
                {t("nav.privacy")}
              </Link>
            </div>
          </motion.div>
        </div>

        <div className="relative min-h-[14rem]">
          <DomainRadar nodes={nodes} />
        </div>
      </div>
    </section>
  );
}
