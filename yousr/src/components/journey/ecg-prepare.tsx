"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import { finishPrepare } from "@/server/actions/journey";
import {
  JourneyBreathingRing,
  JourneyShimmerBar,
  useJourneyMotion,
} from "@/components/journey/journey-loaders";

const ECG_PATH =
  "M0 32 H40 L48 32 L56 10 L64 54 L72 32 H112 L120 32 L128 18 L136 46 L144 32 H184 L192 32 L200 14 L208 50 L216 32 H320";

const STAGE_KEYS = ["gather", "align", "summarise"] as const;
const LUX = [0.16, 1, 0.3, 1] as const;

function EcgPanel({ animate }: { animate: boolean }) {
  return (
    <div className="relative mt-10 w-full max-w-md overflow-hidden rounded-lg border border-dawn-200 bg-white px-3 py-6">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full text-dawn-200"
        aria-hidden
        preserveAspectRatio="none"
      >
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeWidth="1" />
        {[25, 50, 75].map((x) => (
          <line
            key={x}
            x1={`${x}%`}
            y1="0"
            x2={`${x}%`}
            y2="100%"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.45"
          />
        ))}
      </svg>

      <svg className="relative mx-auto h-16 w-full text-mist-700" viewBox="0 0 320 64" fill="none" aria-hidden>
        <path
          d={ECG_PATH}
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          className={animate ? "journey-ecg-trace" : undefined}
          d={ECG_PATH}
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={animate ? "1" : undefined}
          strokeDashoffset={animate ? 1 : undefined}
        />
        {animate ? (
          <rect
            className="journey-ecg-scan"
            x="0"
            y="4"
            width="18"
            height="56"
            fill="url(#journey-scan-grad)"
            opacity="0.55"
          />
        ) : null}
        <defs>
          <linearGradient id="journey-scan-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--mist-500)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--mist-500)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--mist-500)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <JourneyShimmerBar className="mx-auto mt-4 max-w-[12rem]" />
    </div>
  );
}

/** Quiet clinical pulse while the server recomputes the trajectory. */
export function EcgPrepare({ locale }: { locale: string }) {
  const { t } = useI18n();
  const { animate, live, reduce } = useJourneyMotion();
  const started = useRef(false);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const minWait = new Promise((r) => setTimeout(r, reduce ? 900 : 3200));
    void minWait.then(() => finishPrepare(locale));
  }, [locale, reduce]);

  useEffect(() => {
    if (!live) return;
    if (reduce) {
      setStage(STAGE_KEYS.length - 1);
      return;
    }
    const id = window.setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGE_KEYS.length - 1));
    }, 1050);
    return () => window.clearInterval(id);
  }, [live, reduce]);

  const stageKey = STAGE_KEYS[stage];

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={t("journey.prepare.aria")}
    >
      <JourneyBreathingRing className="mb-6" />

      <h1 className="max-w-md font-display text-[clamp(1.55rem,3.5vw,2rem)] tracking-tight text-ink-900">
        {t("journey.prepare.title")}
      </h1>
      <p className="mt-2 max-w-md text-sm text-ink-600">{t("journey.prepare.body")}</p>

      <EcgPanel animate={animate} />

      <ol className="mt-8 flex items-center justify-center gap-2" aria-hidden>
        {STAGE_KEYS.map((key, idx) => {
          const done = idx < stage;
          const current = idx === stage;
          return (
            <li key={key} className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-pill transition-transform ${
                  done || current ? "bg-mist-700" : "bg-dawn-300"
                } ${animate && current ? "scale-125" : ""}`}
              />
              {idx < STAGE_KEYS.length - 1 ? (
                <span
                  className={`h-px w-6 sm:w-10 ${idx < stage ? "bg-mist-500" : "bg-dawn-200"}`}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="mt-4 min-h-[1.5rem]">
        {live && animate ? (
          <AnimatePresence mode="wait">
            <motion.p
              key={stageKey}
              className="text-sm font-medium text-mist-700"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: LUX }}
            >
              {t(`journey.prepare.stages.${stageKey}`)}
            </motion.p>
          </AnimatePresence>
        ) : (
          <p className="text-sm font-medium text-mist-700">
            {t(`journey.prepare.stages.${stageKey}`)}
          </p>
        )}
      </div>
      <p className="mt-2 text-xs text-ink-400">{t("journey.prepare.hint")}</p>
    </div>
  );
}
