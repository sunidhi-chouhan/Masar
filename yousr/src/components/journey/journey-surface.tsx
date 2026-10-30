"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { JourneySavingVeil, useJourneyMotion } from "@/components/journey/journey-loaders";
import { JourneyPathMotif } from "@/components/journey/journey-path-motif";

const LUX = [0.16, 1, 0.3, 1] as const;

type SurfaceTone = "mist" | "dawn" | "privacy" | "plain";

const TONE: Record<
  SurfaceTone,
  { wash: string; orb: string; motif?: "mist" | "dawn" }
> = {
  mist: {
    wash: "from-mist-100/70 via-white to-dawn-50",
    orb: "bg-[radial-gradient(circle,color-mix(in_srgb,var(--mist-300)_45%,transparent),transparent_70%)]",
    motif: "mist",
  },
  dawn: {
    wash: "from-dawn-100/80 via-white to-peach-200/20",
    orb: "bg-[radial-gradient(circle,color-mix(in_srgb,var(--peach-200)_50%,transparent),transparent_70%)]",
    motif: "dawn",
  },
  privacy: {
    wash: "from-mist-100/50 via-white to-dawn-100/40",
    orb: "bg-[radial-gradient(circle,color-mix(in_srgb,var(--mist-300)_35%,transparent),transparent_70%)]",
    motif: "mist",
  },
  plain: {
    wash: "from-white via-white to-dawn-50",
    orb: "bg-[radial-gradient(circle,color-mix(in_srgb,var(--dawn-200)_40%,transparent),transparent_70%)]",
  },
};

/** Soft interactive surface — shadow lift, no competing border. */
export function JourneySurface({
  children,
  tone = "mist",
  className = "",
  showMotif = false,
  footer,
  busy = false,
  busyLabel,
}: {
  children: ReactNode;
  tone?: SurfaceTone;
  className?: string;
  showMotif?: boolean;
  footer?: ReactNode;
  busy?: boolean;
  busyLabel?: string;
}) {
  const { live, dur, animate } = useJourneyMotion();
  const t = TONE[tone];

  const body = (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${t.wash} p-5 shadow-[var(--shadow-soft)] md:p-6 ${className}`}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute -end-10 -top-12 h-40 w-40 rounded-pill ${t.orb}`}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -start-6 bottom-0 h-28 w-28 rounded-pill bg-[radial-gradient(circle,color-mix(in_srgb,var(--dawn-200)_35%,transparent),transparent_70%)]"
      />
      {busy && busyLabel ? <JourneySavingVeil active={busy} label={busyLabel} /> : null}
      {showMotif && t.motif ? (
        <div className="relative mb-4 max-w-xs opacity-90">
          <JourneyPathMotif variant={t.motif} />
        </div>
      ) : null}
      <div className="relative">{children}</div>
      {footer ? (
        <div className="relative mt-6 border-t border-dawn-200/80 pt-4">{footer}</div>
      ) : null}
    </div>
  );

  if (!live) return body;

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur(0.4), ease: LUX }}
    >
      {body}
    </motion.div>
  );
}
