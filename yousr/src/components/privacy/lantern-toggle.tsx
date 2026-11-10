"use client";

import { useOptimistic, useTransition } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";

interface Props {
  id: string;
  label: string;
  hint: string;
  on: boolean;
  onToggle: (on: boolean) => Promise<void>;
  simulated?: boolean;
}

/** A consent row: the whole row explains, the switch on the end decides. */
export function LanternToggle({ id, label, hint, on, onToggle, simulated }: Props) {
  const { t, locale } = useI18n();
  const travel = locale === "ar" ? -20 : 20;
  const reduce = useReducedMotion();
  const [pending, start] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(on);

  const flip = () => {
    const next = !optimistic;
    start(async () => {
      setOptimistic(next);
      await onToggle(next);
    });
  };

  return (
    <div
      className={`flex items-center gap-4 rounded-[18px] border bg-white p-4 shadow-[var(--shadow-soft)] transition-colors md:px-5 ${
        optimistic ? "border-mist-300/70" : "border-dawn-200"
      }`}
    >
      <span
        aria-hidden
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
          optimistic ? "bg-mist-100 text-mist-700" : "bg-dawn-100 text-ink-400"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="6" rx="7" ry="2.5" />
          <path d="M5 6v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 12v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p id={`${id}-label`} className="text-[15px] font-semibold text-ink-900">
            {label}
          </p>
          {simulated ? (
            <span className="rounded-full border border-dashed border-slate-400/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
              {t("common.simulated")}
            </span>
          ) : null}
        </div>
        <p id={`${id}-hint`} className="mt-0.5 text-[13px] text-ink-600">
          {hint}
        </p>
      </div>
      <span
        className={`hidden shrink-0 text-xs font-medium sm:inline ${optimistic ? "text-mist-700" : "text-ink-400"}`}
        aria-live="polite"
      >
        {optimistic ? t("privacy.on") : t("privacy.off")}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={optimistic}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-hint`}
        disabled={pending}
        onClick={flip}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors disabled:opacity-70 ${
          optimistic ? "bg-mist-700" : "bg-dawn-300"
        }`}
      >
        <motion.span
          aria-hidden
          className="h-6 w-6 rounded-full bg-white shadow-[0_1px_3px_rgba(17,26,28,0.25)]"
          animate={{ x: optimistic ? travel : 0 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }}
        />
      </button>
    </div>
  );
}
