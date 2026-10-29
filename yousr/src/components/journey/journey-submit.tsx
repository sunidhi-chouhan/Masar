"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n/client";
import { JourneyPulseDots, useDelayedFlag } from "@/components/journey/journey-loaders";

/** Verb-first CTA; loader appears after 300ms; 44px touch target. */
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
  const showLoader = useDelayedFlag(pending);
  const { t } = useI18n();
  const base =
    tone === "primary"
      ? "inline-flex min-h-11 min-w-[10rem] items-center justify-center rounded-md bg-mist-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mist-500 disabled:opacity-70"
      : tone === "secondary"
        ? "inline-flex min-h-11 min-w-[10rem] items-center justify-center rounded-md border border-dawn-300 bg-white px-5 py-2.5 text-sm font-medium text-ink-900 transition-colors hover:bg-dawn-100 disabled:opacity-70"
        : "inline-flex min-h-11 items-center justify-center rounded-md px-3 py-2.5 text-sm font-medium text-ink-600 underline-offset-4 transition-colors hover:underline disabled:opacity-50";

  return (
    <button type="submit" disabled={pending} className={`${base} ${className}`}>
      {showLoader ? <JourneyPulseDots label={t("journey.loading")} /> : children}
    </button>
  );
}
