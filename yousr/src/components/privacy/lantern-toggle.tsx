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

/** A consent switch drawn as a lantern: lit when sharing, dim when not. */
export function LanternToggle({ id, label, hint, on, onToggle, simulated }: Props) {
  const { t } = useI18n();
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
      className={`flex items-center gap-4 overflow-hidden rounded-[1.5rem] p-4 shadow-[var(--shadow-soft)] transition-colors ${
        optimistic
          ? "bg-gradient-to-br from-white to-amber-100/40 ring-1 ring-amber-300/40"
          : "bg-dawn-50/80 ring-1 ring-dawn-200/60"
      }`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={optimistic}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-hint`}
        disabled={pending}
        onClick={flip}
        className="relative h-14 w-14 shrink-0 rounded-pill focus-visible:outline-mist-500"
      >
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-pill"
          animate={{
            background: optimistic
              ? "radial-gradient(circle at 50% 45%, #fff3d6 0%, var(--amber-400) 45%, var(--peach-500) 100%)"
              : "radial-gradient(circle at 50% 45%, var(--slate-200) 0%, var(--slate-400) 100%)",
            boxShadow: optimistic ? "0 0 28px rgba(231,178,87,0.65), 0 0 6px rgba(231,178,87,0.9)" : "0 0 0 rgba(0,0,0,0)",
          }}
          transition={{ duration: reduce ? 0 : 0.5, ease: "easeOut" }}
        />
        <span aria-hidden className="absolute inset-x-[42%] top-1 h-1.5 rounded-sm bg-ink-900/40" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p id={`${id}-label`} className="font-display text-lg text-ink-900">
            {label}
          </p>
          {simulated ? (
            <span className="rounded-sm border border-dashed border-slate-400 px-1.5 text-[11px] uppercase tracking-wide text-slate-600">
              {t("common.simulated")}
            </span>
          ) : null}
        </div>
        <p id={`${id}-hint`} className="text-sm text-ink-600">
          {hint}
        </p>
      </div>
      <span className={`shrink-0 text-xs ${optimistic ? "text-amber-700" : "text-slate-600"}`} aria-live="polite">
        {optimistic ? t("privacy.on") : t("privacy.off")}
      </span>
    </div>
  );
}
