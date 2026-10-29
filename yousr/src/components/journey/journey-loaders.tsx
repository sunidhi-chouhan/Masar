"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/** ui-design-brain Spinner: delay ~300ms so fast actions don't flicker. */
export function useDelayedFlag(on: boolean, ms = 300) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!on) {
      setShow(false);
      return;
    }
    const id = window.setTimeout(() => setShow(true), ms);
    return () => window.clearTimeout(id);
  }, [on, ms]);
  return show;
}

/** Three soft clinical dots — inline / button loading. */
export function JourneyPulseDots({
  label,
  className = "",
  active = true,
}: {
  label: string;
  className?: string;
  /** When false, renders nothing (pair with useDelayedFlag). */
  active?: boolean;
}) {
  const reduce = useReducedMotion();
  if (!active) return null;
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`inline-flex items-center gap-1.5 ${className}`}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          aria-hidden
          className="h-1.5 w-1.5 rounded-pill bg-mist-500"
          animate={
            reduce
              ? { opacity: 0.7 }
              : { opacity: [0.25, 1, 0.25], y: [0, -2, 0] }
          }
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 0.9, repeat: Infinity, delay: i * 0.16, ease: "easeInOut" }
          }
        />
      ))}
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Soft concentric rings — page-level wait cue (not a spinner wheel). */
export function JourneyBreathingRing({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <span aria-hidden className={`relative inline-flex h-14 w-14 items-center justify-center ${className}`}>
      {[0, 1].map((i) => (
        <motion.span
          key={i}
          className="absolute inset-0 rounded-pill border border-mist-500/40"
          animate={
            reduce
              ? { opacity: 0.35, scale: 1 }
              : { opacity: [0.45, 0.08, 0.45], scale: [1, 1.28, 1] }
          }
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 2.4, repeat: Infinity, delay: i * 0.55, ease: "easeInOut" }
          }
        />
      ))}
      <span className="relative h-2.5 w-2.5 rounded-pill bg-mist-700" />
    </span>
  );
}
