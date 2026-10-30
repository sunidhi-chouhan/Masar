"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import { LocaleSwitch } from "@/components/ui/locale-switch";
import { SimulatedBadge } from "@/components/ui/atoms";
import { useJourneyMotion } from "@/components/journey/journey-loaders";

const LUX = [0.16, 1, 0.3, 1] as const;

export function JourneyShell({
  children,
  stepLabel,
  progress,
  wide = false,
}: {
  children: ReactNode;
  stepLabel?: string;
  /** 0–1 progress through the patient journey */
  progress?: number;
  /** Slightly wider canvas for the role gateway */
  wide?: boolean;
}) {
  const { t, locale } = useI18n();
  const { animate, live, dur, reduce } = useJourneyMotion();
  const pct = typeof progress === "number" ? Math.min(100, Math.max(0, progress * 100)) : null;
  const pageKey = typeof progress === "number" ? String(Math.round(progress * 40)) : "static";
  const maxW = wide ? "max-w-4xl" : "max-w-3xl";

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-dawn-50">
      {/* Atmospheric layers */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-15%,color-mix(in_srgb,var(--mist-100)_85%,transparent),transparent_60%),radial-gradient(ellipse_50%_45%_at_100%_90%,color-mix(in_srgb,var(--peach-200)_45%,transparent),transparent),radial-gradient(ellipse_40%_35%_at_0%_70%,color-mix(in_srgb,var(--dawn-200)_55%,transparent),transparent)]"
      />
      <div
        aria-hidden
        className="journey-grain pointer-events-none absolute inset-0 opacity-[0.35]"
      />
      {animate ? (
        <>
          <div
            aria-hidden
            className="journey-float pointer-events-none absolute -start-20 top-16 h-72 w-72 rounded-pill bg-[radial-gradient(circle,color-mix(in_srgb,var(--mist-300)_32%,transparent),transparent_68%)]"
          />
          <div
            aria-hidden
            className="journey-float-delay pointer-events-none absolute -end-24 bottom-24 h-80 w-80 rounded-pill bg-[radial-gradient(circle,color-mix(in_srgb,var(--peach-200)_38%,transparent),transparent_70%)]"
          />
          <div
            aria-hidden
            className="journey-float pointer-events-none absolute start-1/3 top-1/2 h-40 w-40 -translate-y-1/2 rounded-pill bg-[radial-gradient(circle,color-mix(in_srgb,var(--mist-100)_50%,transparent),transparent_70%)] opacity-60"
          />
        </>
      ) : null}

      <header className="relative z-10 border-b border-dawn-200/70 bg-dawn-50/70 backdrop-blur-md">
        <div className={`mx-auto flex ${maxW} items-center gap-3 px-4 py-3.5`}>
          <Link
            href={`/${locale}/journey`}
            className="group font-display text-lg tracking-tight text-ink-900 transition-opacity hover:opacity-80"
          >
            <span className="font-semibold">{t("common.appName")}</span>
            <span className="text-ink-400"> · </span>
            <span className="text-mist-700">{t("common.appNameAr")}</span>
          </Link>
          <div className="ms-auto flex items-center gap-2.5">
            {pct !== null ? (
              <motion.span
                key={Math.round(pct)}
                className="hidden text-xs tabular-nums text-ink-400 sm:inline"
                aria-hidden
                initial={{ opacity: 0, y: 4 }}
                animate={live ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
                transition={{ duration: dur(0.25) }}
              >
                {Math.round(pct)}%
              </motion.span>
            ) : null}
            <SimulatedBadge />
            <LocaleSwitch />
          </div>
        </div>
        {pct !== null ? (
          <div
            className="relative h-1.5 w-full overflow-hidden bg-dawn-200/80"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            aria-valuetext={`${Math.round(pct)}%`}
            aria-label={t("journey.progressAria")}
          >
            <motion.div
              className="relative h-full origin-left bg-gradient-to-r from-mist-700 via-mist-500 to-mist-300 rtl:origin-right"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={
                reduce || !live
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 130, damping: 24, mass: 0.7 }
              }
            >
              {animate ? (
                <span
                  aria-hidden
                  className="journey-progress-glow absolute inset-y-0 end-0 w-10 bg-gradient-to-l from-white/55 to-transparent"
                />
              ) : null}
            </motion.div>
          </div>
        ) : null}
      </header>

      <main className={`relative z-10 mx-auto flex w-full ${maxW} flex-1 flex-col px-4 py-9 md:py-14`}>
        {stepLabel ? <p className="label-caps mb-2">{stepLabel}</p> : null}
        {live ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={pageKey}
              className="flex flex-1 flex-col"
              initial={animate ? { opacity: 0, y: 14 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={animate ? { opacity: 0, y: -8 } : undefined}
              transition={{ duration: dur(0.4), ease: LUX }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex flex-1 flex-col">{children}</div>
        )}
      </main>

      <footer className="relative z-10 border-t border-dawn-200/70 px-4 py-3 text-center text-xs text-ink-400">
        {t("footer.disclaimer")}
      </footer>
    </div>
  );
}
