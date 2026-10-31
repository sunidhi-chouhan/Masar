"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import type { Tier } from "@/lib/domain/types";
import { TierRibbon } from "@/components/ui/atoms";
import { useJourneyMotion } from "@/components/journey/journey-loaders";

const LUX = [0.16, 1, 0.3, 1] as const;

export function PageHero({
  title,
  subtitle,
  tier,
  figure,
  actions,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  tier?: Tier;
  figure?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  const { animate, live, dur } = useJourneyMotion();

  return (
    <motion.header
      initial={live && animate ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur(0.4), ease: LUX }}
      className="relative flex flex-wrap items-start justify-between gap-4 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-white via-white to-mist-100/40 p-5 shadow-[var(--shadow-soft)] md:p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -end-10 -top-12 h-36 w-36 rounded-full opacity-40 blur-2xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-mist-300, #9dd4c8) 70%, transparent), transparent 70%)",
        }}
      />
      <div className="relative min-w-0 max-w-2xl">
        {eyebrow ? <p className="label-caps mb-1.5 text-mist-700">{eyebrow}</p> : null}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-display text-3xl tracking-tight text-ink-900 md:text-4xl">{title}</h1>
          {tier ? <TierRibbon tier={tier} /> : null}
        </div>
        {subtitle ? <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-600 md:text-base">{subtitle}</p> : null}
        {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {figure ? <div className="relative ms-auto shrink-0">{figure}</div> : null}
    </motion.header>
  );
}
