"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import { LocaleSwitch } from "@/components/ui/locale-switch";
import { SimulatedBadge } from "@/components/ui/atoms";
import { MasarMark } from "@/components/layout/sidebar-nav";
import { useJourneyMotion } from "@/components/journey/journey-loaders";

const LUX = [0.16, 1, 0.3, 1] as const;

export type JourneyStage = "role" | "consent" | "profile" | "prepare" | "ai" | "workspace";

const PATIENT_STAGES: JourneyStage[] = ["role", "consent", "profile", "prepare", "ai"];
const STAFF_STAGES: JourneyStage[] = ["role", "consent", "workspace"];

function stageFromProgress(progress: number | undefined): JourneyStage {
  if (progress === undefined || progress < 0.15) return "role";
  if (progress < 0.2) return "consent";
  if (progress < 0.7) return "profile";
  if (progress < 0.85) return "prepare";
  return "ai";
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <path d="m4 8.4 2.6 2.6L12 5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Vertical stage list for the journey rail. */
function StageRail({ stages, current }: { stages: JourneyStage[]; current: JourneyStage }) {
  const { t } = useI18n();
  const at = stages.indexOf(current);
  return (
    <ol className="relative space-y-1">
      {stages.map((s, i) => {
        const done = i < at;
        const now = i === at;
        return (
          <li key={s} className="relative flex gap-3.5 pb-5 last:pb-0">
            {i < stages.length - 1 ? (
              <span
                aria-hidden
                className={`absolute start-[13px] top-8 h-[calc(100%-1.75rem)] w-px ${done ? "bg-amber-400/70" : "bg-white/15"}`}
              />
            ) : null}
            <span
              className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums transition-colors ${
                done
                  ? "bg-amber-400 text-mist-900"
                  : now
                    ? "bg-white text-mist-900 shadow-[0_0_0_5px_rgba(255,255,255,0.12)]"
                    : "text-white/50 ring-1 ring-inset ring-white/25"
              }`}
              aria-hidden
            >
              {done ? <Check /> : i + 1}
            </span>
            <span className="min-w-0 pt-0.5">
              <span className={`block text-[14px] font-medium ${now ? "text-white" : done ? "text-white/80" : "text-white/55"}`}>
                {t(`journey.rail.stages.${s}`)}
              </span>
              <span className={`mt-0.5 block text-[12px] ${now ? "text-white/65" : "text-white/40"}`}>
                {t(`journey.rail.hints.${s}`)}
              </span>
            </span>
            {now ? <span className="sr-only">({t("journey.rail.step", { n: i + 1, total: stages.length })})</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

export function JourneyShell({
  children,
  stepLabel,
  progress,
  stage,
  staff = false,
  wide = false,
}: {
  children: ReactNode;
  stepLabel?: string;
  /** 0–1 progress through the patient journey */
  progress?: number;
  /** Which stage the rail highlights; derived from progress when omitted */
  stage?: JourneyStage;
  /** Clinician / system path: a shorter list of stages */
  staff?: boolean;
  /** Wider content column for the role gateway */
  wide?: boolean;
}) {
  const { t, locale } = useI18n();
  const { animate, live, dur, reduce } = useJourneyMotion();
  const stages = staff ? STAFF_STAGES : PATIENT_STAGES;
  const current = stage ?? stageFromProgress(progress);
  const at = Math.max(0, stages.indexOf(current));
  const pct = typeof progress === "number" ? Math.min(100, Math.max(0, progress * 100)) : null;
  const pageKey = typeof progress === "number" ? String(Math.round(progress * 40)) : "static";
  const maxW = wide ? "max-w-3xl" : "max-w-2xl";

  return (
    <div className="relative flex min-h-dvh bg-dawn-50">
      {/* ---------- rail (desktop) ---------- */}
      <aside className="sticky top-0 hidden h-dvh w-[22rem] shrink-0 lg:block xl:w-[24rem]">
        <div className="surface-pine flex h-full flex-col !rounded-none p-8 xl:p-10">
        <Link href={`/${locale}`} className="flex items-center gap-2.5 text-white">
          <MasarMark className="h-8 w-8" inverted />
          <span className="font-display text-[1.35rem] leading-none">{t("common.appName")}</span>
          <span className="text-sm text-white/50">{t("common.appNameAr")}</span>
        </Link>

        <div className="mt-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
            {t("journey.rail.step", { n: at + 1, total: stages.length })}
          </p>
          <h2 className="mt-2 text-[1.9rem] leading-tight text-white">{t("journey.rail.title")}</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">{t("journey.rail.subtitle")}</p>
        </div>

        <div className="mt-10">
          <StageRail stages={stages} current={current} />
        </div>

        <div className="mt-auto flex gap-2.5 rounded-xl bg-white/[0.06] p-3.5 ring-1 ring-inset ring-white/10">
          <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" fill="none" aria-hidden>
            <path d="M10 2.5 4 5v4.6c0 3.7 2.6 6.6 6 7.9 3.4-1.3 6-4.2 6-7.9V5l-6-2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="m7.4 10 1.8 1.8 3.5-3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-[12px] leading-relaxed text-white/70">{t("journey.rail.privacy")}</p>
        </div>
        </div>
      </aside>

      {/* ---------- content ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-dawn-200/70 bg-dawn-50/85 backdrop-blur-xl">
          <div className="flex h-14 items-center gap-3 px-4 md:px-8">
            <Link href={`/${locale}`} className="flex items-center gap-2 text-ink-900 lg:hidden">
              <MasarMark className="h-7 w-7" />
              <span className="font-display text-lg leading-none">{t("common.appName")}</span>
            </Link>
            {stepLabel ? <p className="label-caps hidden lg:block">{stepLabel}</p> : null}
            <div className="ms-auto flex items-center gap-2.5">
              {pct !== null ? (
                <span className="hidden text-xs tabular-nums text-ink-400 sm:inline" aria-hidden>
                  {Math.round(pct)}%
                </span>
              ) : null}
              <SimulatedBadge />
              <LocaleSwitch />
            </div>
          </div>
          {/* Mobile stage meter */}
          <div className="px-4 pb-3 lg:hidden">
            <div className="flex gap-1" aria-hidden>
              {stages.map((s, i) => (
                <span key={s} className={`h-1 flex-1 rounded-full ${i <= at ? "bg-mist-700" : "bg-dawn-200"}`} />
              ))}
            </div>
            <p className="mt-2 text-[12px] text-ink-500">
              <span className="font-semibold text-ink-900">{t("journey.rail.step", { n: at + 1, total: stages.length })}</span>
              {" · "}
              {t(`journey.rail.stages.${current}`)}
            </p>
          </div>
          {pct !== null ? (
            <div
              className="relative hidden h-[3px] w-full bg-transparent lg:block"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pct)}
              aria-valuetext={`${Math.round(pct)}%`}
              aria-label={t("journey.progressAria")}
            >
              <motion.div
                className="h-full origin-left bg-mist-700 rtl:origin-right"
                initial={false}
                animate={{ width: `${pct}%` }}
                transition={reduce || !live ? { duration: 0 } : { type: "spring", stiffness: 130, damping: 24, mass: 0.7 }}
              />
            </div>
          ) : null}
        </header>

        <main className={`mx-auto flex w-full ${maxW} flex-1 flex-col px-4 py-10 md:px-8 md:py-16`}>
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

        <footer className="border-t border-dawn-200/70 px-4 py-4 text-center text-[11.5px] text-ink-400 md:px-8">
          {t("footer.disclaimer")}
        </footer>
      </div>
    </div>
  );
}
