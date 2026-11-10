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
      className="relative flex flex-wrap items-end justify-between gap-5 border-b border-dawn-200/80 pb-7"
    >
      <div className="relative min-w-0 max-w-2xl">
        {eyebrow ? <p className="label-caps mb-2">{eyebrow}</p> : null}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-[clamp(2rem,3.4vw,2.75rem)] leading-[1.05] text-ink-900">{title}</h1>
          {tier ? <TierRibbon tier={tier} /> : null}
        </div>
        {subtitle ? <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-600 md:text-base">{subtitle}</p> : null}
        {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {figure ? <div className="relative ms-auto hidden shrink-0 sm:block">{figure}</div> : null}
    </motion.header>
  );
}
