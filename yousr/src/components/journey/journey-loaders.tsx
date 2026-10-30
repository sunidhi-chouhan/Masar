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

/**
 * Hydration-safe motion: keep `initial` stable; gate `animate` on `live`.
 * Never branch `initial` on reduced-motion — that mismatches SSR vs client.
 */
export function useJourneyMotion() {
  const prefersReduce = useReducedMotion();
  const [live, setLive] = useState(false);
  useEffect(() => setLive(true), []);
  const reduce = Boolean(prefersReduce);
  return {
    reduce,
    live,
    /** True after mount when motion is allowed */
    animate: live && !reduce,
    /** Duration helper — 0 when reduced or not yet live */
    dur: (ms: number) => (live && !reduce ? ms : 0),
  };
}

/** Three soft clinical dots — inline / button loading. */
export function JourneyPulseDots({
  label,
  className = "",
  active = true,
  withLabel = false,
  onDark = false,
}: {
  label: string;
  className?: string;
  active?: boolean;
  withLabel?: boolean;
  /** White dots for mist-700 primary buttons */
  onDark?: boolean;
}) {
  const { animate } = useJourneyMotion();
  if (!active) return null;
  const dot = onDark ? "bg-white" : "bg-mist-500";
  const labelCls = onDark ? "text-white/90" : "text-mist-700";
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <span className="inline-flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            aria-hidden
            className={`h-1.5 w-1.5 rounded-pill ${dot}`}
            animate={
              animate
                ? { opacity: [0.25, 1, 0.25], y: [0, -2.5, 0] }
                : { opacity: 0.7, y: 0 }
            }
            transition={
              animate
                ? { duration: 0.85, repeat: Infinity, delay: i * 0.14, ease: "easeInOut" }
                : { duration: 0 }
            }
          />
        ))}
      </span>
      {withLabel ? <span className={`text-xs font-medium ${labelCls}`}>{label}</span> : null}
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * Button-embedded loader: soft ring + dots.
 * Show after ~150ms so fast clicks don't flicker; keeps min width stable.
 */
export function JourneyButtonLoader({
  label,
  onDark = false,
  withLabel = true,
}: {
  label: string;
  onDark?: boolean;
  withLabel?: boolean;
}) {
  const { animate } = useJourneyMotion();
  const ring = onDark ? "border-white/35 border-t-white" : "border-mist-300 border-t-mist-700";
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      className="inline-flex items-center justify-center gap-2.5"
    >
      <span
        aria-hidden
        className={`inline-block h-4 w-4 rounded-pill border-2 ${ring} ${
          animate ? "journey-btn-spin" : ""
        }`}
      />
      <JourneyPulseDots label={label} onDark={onDark} withLabel={withLabel} />
    </span>
  );
}

/** Soft concentric rings — page-level wait cue (not a spinner wheel). */
export function JourneyBreathingRing({ className = "" }: { className?: string }) {
  const { animate } = useJourneyMotion();
  return (
    <span aria-hidden className={`relative inline-flex h-16 w-16 items-center justify-center ${className}`}>
      {[0, 1, 2].map((i) =>
        animate ? (
          <motion.span
            key={i}
            className="absolute inset-0 rounded-pill border border-mist-500/35"
            style={{ inset: i * 4 }}
            animate={{ opacity: [0.5, 0.08, 0.5], scale: [1, 1.12 + i * 0.04, 1] }}
            transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }}
          />
        ) : (
          <span
            key={i}
            className="absolute inset-0 rounded-pill border border-mist-500/35"
            style={{ inset: i * 4, opacity: 0.35 }}
          />
        ),
      )}
      <span className="relative h-3 w-3 rounded-pill bg-mist-700 shadow-[0_0_12px_color-mix(in_srgb,var(--mist-500)_55%,transparent)]" />
    </span>
  );
}

/** Soft bar shimmer for prepare / saving states. */
export function JourneyShimmerBar({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`h-1.5 overflow-hidden rounded-pill bg-dawn-200 ${className}`}
    >
      <div className="journey-shimmer h-full w-1/3 rounded-pill bg-gradient-to-r from-transparent via-mist-500/70 to-transparent" />
    </div>
  );
}

/** Translucent veil while a step is saving. */
export function JourneySavingVeil({
  active,
  label,
}: {
  active: boolean;
  label: string;
}) {
  const show = useDelayedFlag(active);
  if (!show) return null;
  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-white/70 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <JourneyPulseDots label={label} withLabel />
    </div>
  );
}
