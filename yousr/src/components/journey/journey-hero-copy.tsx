"use client";

import { motion, useReducedMotion } from "motion/react";
import { LUX } from "@/components/journey/magnetic";

/** Massive display title + micro subtitle with stagger-fade (creative-ui typography). */
export function JourneyHeroCopy({ title, subtitle }: { title: string; subtitle: string }) {
  const reduce = useReducedMotion();
  return (
    <div className="mt-4 max-w-3xl">
      <motion.h1
        className="journey-display text-[clamp(2.4rem,6vw,4.25rem)] text-ink-900"
        initial={reduce ? false : { opacity: 0, y: 22, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.65, ease: LUX }}
      >
        {title}
      </motion.h1>
      <motion.p
        className="mt-5 max-w-xl text-[15px] leading-relaxed tracking-wide text-ink-600"
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1, ease: LUX }}
      >
        {subtitle}
      </motion.p>
    </div>
  );
}
