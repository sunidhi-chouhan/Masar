"use client";

import { motion } from "motion/react";
import { useJourneyMotion } from "@/components/journey/journey-loaders";

/** Quiet longitudinal path mark — direction over time, never a score. */
export function JourneyPathMotif({
  variant = "mist",
  className = "",
}: {
  variant?: "mist" | "dawn";
  className?: string;
}) {
  const { animate } = useJourneyMotion();
  const stroke = variant === "mist" ? "var(--mist-500)" : "var(--peach-500)";
  const soft = variant === "mist" ? "var(--mist-300)" : "var(--peach-300)";
  const d = "M8 36 C48 36, 58 18, 88 18 S128 40, 158 40 S198 22, 212 22";

  return (
    <svg
      className={`h-14 w-full ${className}`}
      viewBox="0 0 220 56"
      fill="none"
      aria-hidden
    >
      <path d={d} stroke={soft} strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
      {animate ? (
        <motion.path
          d={d}
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0.2, opacity: 0.5 }}
          animate={{ pathLength: [0.2, 1], opacity: [0.5, 1, 0.85] }}
          transition={{ duration: 2.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
      ) : (
        <path d={d} stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      )}
      {[
        { cx: 88, cy: 18 },
        { cx: 158, cy: 40 },
        { cx: 212, cy: 22 },
      ].map((p, i) =>
        animate ? (
          <motion.circle
            key={i}
            cx={p.cx}
            cy={p.cy}
            r="3.25"
            fill={stroke}
            animate={{ opacity: [0.35, 1, 0.55] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }}
          />
        ) : (
          <circle key={i} cx={p.cx} cy={p.cy} r="3.25" fill={stroke} opacity="0.85" />
        ),
      )}
    </svg>
  );
}

/** Compact brand horizon used beside the role page title. */
export function JourneyHorizonMark({ className = "" }: { className?: string }) {
  const { animate } = useJourneyMotion();
  const d = "M12 52 C36 52, 44 28, 72 28 S108 56, 132 48";
  return (
    <svg
      className={`h-16 w-28 text-mist-500 sm:h-20 sm:w-36 ${className}`}
      viewBox="0 0 144 80"
      fill="none"
      aria-hidden
    >
      <ellipse
        cx="72"
        cy="72"
        rx="64"
        ry="18"
        fill="color-mix(in srgb, var(--mist-100) 80%, transparent)"
      />
      <path d={d} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.35" />
      {animate ? (
        <motion.path
          d={d}
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1] }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            repeatType: "reverse",
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      ) : (
        <path d={d} stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
      )}
      <circle cx="72" cy="28" r="4" fill="var(--mist-700)" />
      <circle cx="132" cy="48" r="3" fill="var(--mist-500)" opacity="0.7" />
    </svg>
  );
}
