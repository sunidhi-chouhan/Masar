"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import { LocaleSwitch } from "@/components/ui/locale-switch";
import { SimulatedBadge } from "@/components/ui/atoms";

export function JourneyShell({
  children,
  stepLabel,
  progress,
}: {
  children: ReactNode;
  stepLabel?: string;
  /** 0–1 progress through the patient journey */
  progress?: number;
}) {
  const { t, locale } = useI18n();
  const reduce = useReducedMotion();
  const pct = typeof progress === "number" ? Math.min(100, Math.max(0, progress * 100)) : null;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-dawn-50">
      {/* Atmosphere: soft radial wash — one accent family (mist), no diagonal gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,color-mix(in_srgb,var(--mist-100)_70%,transparent),transparent),radial-gradient(ellipse_60%_40%_at_100%_100%,color-mix(in_srgb,var(--dawn-200)_55%,transparent),transparent)]"
      />

      <header className="relative z-10 border-b border-dawn-200/90 bg-dawn-50/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link
            href={`/${locale}/journey`}
            className="font-display text-lg tracking-tight text-ink-900"
          >
            <span className="font-semibold">{t("common.appName")}</span>
            <span className="text-ink-400"> · </span>
            <span className="text-mist-700">{t("common.appNameAr")}</span>
          </Link>
          <div className="ms-auto flex items-center gap-2">
            {pct !== null ? (
              <span className="hidden text-xs tabular-nums text-ink-400 sm:inline" aria-hidden>
                {Math.round(pct)}%
              </span>
            ) : null}
            <SimulatedBadge />
            <LocaleSwitch />
          </div>
        </div>
        {pct !== null ? (
          <div
            className="h-1.5 w-full bg-dawn-200/90"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            aria-valuetext={`${Math.round(pct)}%`}
            aria-label={t("journey.progressAria")}
          >
            <motion.div
              className="h-full origin-left bg-mist-500 rtl:origin-right"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 140, damping: 26, mass: 0.7 }
              }
            />
          </div>
        ) : null}
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 md:py-12">
        {stepLabel ? <p className="label-caps mb-2">{stepLabel}</p> : null}
        <motion.div
          key={typeof progress === "number" ? String(Math.round(progress * 20)) : "static"}
          className="flex flex-1 flex-col"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </main>

      <footer className="relative z-10 border-t border-dawn-200/80 px-4 py-3 text-center text-xs text-ink-400">
        {t("footer.disclaimer")}
      </footer>
    </div>
  );
}
