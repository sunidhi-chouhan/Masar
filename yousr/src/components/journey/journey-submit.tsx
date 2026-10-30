"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import {
  JourneyButtonLoader,
  useDelayedFlag,
  useJourneyMotion,
} from "@/components/journey/journey-loaders";

/** Verb-first CTA; loader after ~150ms; 44px touch target; width held while loading. */
export function JourneySubmitButton({
  children,
  tone = "primary",
  className = "",
}: {
  children: ReactNode;
  tone?: "primary" | "secondary" | "tertiary";
  className?: string;
}) {
  const { pending } = useFormStatus();
  /** Immediate on primary actions — users expect instant feedback on CTA press. */
  const showLoader = useDelayedFlag(pending, 80);
  const { animate } = useJourneyMotion();
  const { t } = useI18n();
  const onDark = tone === "primary";
  const base =
    tone === "primary"
      ? "inline-flex min-h-11 min-w-[11rem] items-center justify-center rounded-lg bg-mist-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition-[background-color,box-shadow] hover:bg-mist-500 hover:shadow-[var(--shadow-lift)] disabled:opacity-80"
      : tone === "secondary"
        ? "inline-flex min-h-11 min-w-[11rem] items-center justify-center rounded-lg border border-dawn-300 bg-white/90 px-5 py-2.5 text-sm font-semibold text-ink-900 transition-colors hover:border-mist-300 hover:bg-mist-100/40 disabled:opacity-80"
        : "inline-flex min-h-11 items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 underline-offset-4 transition-colors hover:underline disabled:opacity-50";

  return (
    <motion.button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      whileHover={animate && !pending ? { y: -1 } : undefined}
      whileTap={animate && !pending ? { scale: 0.98 } : undefined}
      className={`${base} ${className}`}
    >
      {showLoader ? (
        <JourneyButtonLoader label={t("journey.loading")} onDark={onDark} />
      ) : (
        children
      )}
    </motion.button>
  );
}
