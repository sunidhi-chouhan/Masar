"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { JourneySavingVeil, useJourneyMotion } from "@/components/journey/journey-loaders";

const LUX = [0.16, 1, 0.3, 1] as const;

type SurfaceTone = "mist" | "dawn" | "privacy" | "plain";

/** Top accent per tone; colour carries the kind of content, never decoration. */
const ACCENT: Record<SurfaceTone, string> = {
  mist: "bg-mist-500",
  dawn: "bg-amber-400",
  privacy: "bg-mist-700",
  plain: "bg-dawn-300",
};

/** The journey's content card: white instrument surface with an optional accent rule. */
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
  /** Show the tone's accent rule along the top edge */
  showMotif?: boolean;
  footer?: ReactNode;
  busy?: boolean;
  busyLabel?: string;
}) {
  const { live, dur, animate } = useJourneyMotion();

  const body = (
    <div className={`card relative overflow-hidden p-6 md:p-7 ${className}`}>
      {showMotif ? <span aria-hidden className={`absolute inset-x-0 top-0 h-[3px] ${ACCENT[tone]}`} /> : null}
      {busy && busyLabel ? <JourneySavingVeil active={busy} label={busyLabel} /> : null}
      <div className="relative">{children}</div>
      {footer ? <div className="relative mt-6 border-t border-dawn-200/80 pt-4">{footer}</div> : null}
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
