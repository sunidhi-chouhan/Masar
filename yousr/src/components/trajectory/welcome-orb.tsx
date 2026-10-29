"use client";

import { motion, useReducedMotion } from "motion/react";

/** Decorative constellation: five orbs at varying brightness, breathing slowly. */
export function WelcomeOrb() {
  const reduce = useReducedMotion();
  const orbs = [
    { x: 50, y: 18, r: 26, color: "var(--mist-500)", alpha: 0.95 },
    { x: 82, y: 42, r: 20, color: "var(--peach-500)", alpha: 0.7 },
    { x: 70, y: 80, r: 18, color: "var(--amber-400)", alpha: 0.85 },
    { x: 28, y: 78, r: 16, color: "var(--slate-400)", alpha: 0.35 },
    { x: 16, y: 40, r: 22, color: "var(--mist-300)", alpha: 0.6 },
  ];
  return (
    <svg viewBox="0 0 100 100" className="h-72 w-72 md:h-96 md:w-96" role="img" aria-label="Decorative constellation of five soft orbs">
      <defs>
        {orbs.map((o, i) => (
          <radialGradient key={i} id={`og${i}`}>
            <stop offset="0%" stopColor={o.color} stopOpacity={o.alpha} />
            <stop offset="60%" stopColor={o.color} stopOpacity={o.alpha * 0.45} />
            <stop offset="100%" stopColor={o.color} stopOpacity={0} />
          </radialGradient>
        ))}
      </defs>
      <path
        d="M50 18 L82 42 L70 80 L28 78 L16 40 Z"
        fill="none"
        stroke="var(--dawn-300)"
        strokeWidth={0.4}
        strokeDasharray="1.5 2"
      />
      {orbs.map((o, i) => (
        <motion.circle
          key={i}
          cx={o.x}
          cy={o.y}
          r={o.r}
          fill={`url(#og${i})`}
          animate={reduce ? undefined : { r: [o.r, o.r * 1.08, o.r] }}
          transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </svg>
  );
}
