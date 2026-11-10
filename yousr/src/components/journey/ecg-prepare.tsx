"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { finishPrepare } from "@/server/actions/journey";
import { JourneyBreathingRing, useJourneyMotion } from "@/components/journey/journey-loaders";

const STAGE_KEYS = ["gather", "align", "summarise"] as const;

/** Shows each step Masar runs while the server recomputes the trajectory. */
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

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={t("journey.prepare.aria")}
    >
      <JourneyBreathingRing className="mb-6" />

      <h1 className="max-w-md text-[clamp(2rem,3.8vw,2.6rem)] leading-[1.05] tracking-[-0.02em] text-ink-900">
        {t("journey.prepare.title")}
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-600">{t("journey.prepare.body")}</p>

      <ol className="card mt-8 w-full max-w-md divide-y divide-dawn-200/70 text-start">
        {STAGE_KEYS.map((key, idx) => {
          const done = idx < stage;
          const current = idx === stage;
          return (
            <li key={key} className="flex items-center gap-3 px-5 py-4">
              <span
                aria-hidden
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                  done ? "bg-mist-700 text-white" : current ? "bg-mist-100 text-mist-700" : "bg-dawn-100 text-ink-300"
                }`}
              >
                {done ? (
                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
                    <path d="m4 8.4 2.6 2.6L12 5.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : current ? (
                  <span className={`h-2 w-2 rounded-full bg-mist-700 ${animate ? "animate-pulse" : ""}`} />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              <span className={`text-[14.5px] ${done ? "text-ink-600" : current ? "font-medium text-ink-900" : "text-ink-400"}`}>
                {t(`journey.prepare.stages.${key}`)}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs text-ink-400">{t("journey.prepare.hint")}</p>
    </div>
  );
}
