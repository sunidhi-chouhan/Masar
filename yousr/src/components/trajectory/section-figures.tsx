"use client";

import { motion } from "motion/react";
import type { Direction, Domain } from "@/lib/domain/types";
import { useJourneyMotion } from "@/components/journey/journey-loaders";

type Tone = "mist" | "amber" | "peach" | "slate" | "dawn";

const TONE_FILL: Record<Tone, { core: string; ring: string; soft: string; accent: string }> = {
  mist: {
    core: "var(--color-mist-500, #2a8f7f)",
    ring: "var(--color-mist-300, #9dd4c8)",
    soft: "var(--color-mist-100, #e4f4f0)",
    accent: "var(--color-peach-400, #e8a87c)",
  },
  amber: {
    core: "var(--color-amber-500, #d4a017)",
    ring: "var(--color-amber-300, #f0d78c)",
    soft: "var(--color-amber-100, #f8efd0)",
    accent: "var(--color-mist-500, #2a8f7f)",
  },
  peach: {
    core: "var(--color-peach-500, #d4896a)",
    ring: "var(--color-peach-300, #efc4b0)",
    soft: "var(--color-peach-200, #f6ddd0)",
    accent: "var(--color-mist-700, #1a5c52)",
  },
  slate: {
    core: "var(--color-slate-500, #64748b)",
    ring: "var(--color-slate-300, #cbd5e1)",
    soft: "var(--color-dawn-100, #f3efe8)",
    accent: "var(--color-mist-500, #2a8f7f)",
  },
  dawn: {
    core: "var(--color-ink-600, #4a453f)",
    ring: "var(--color-dawn-300, #ddd4c6)",
    soft: "var(--color-dawn-100, #f3efe8)",
    accent: "var(--color-mist-500, #2a8f7f)",
  },
};

const DIRECTION_TONE: Record<Direction, Tone> = {
  Improving: "mist",
  Stable: "mist",
  Shifting: "peach",
  Discuss: "amber",
  Unknown: "slate",
};

const DOMAIN_TONE: Record<Domain, Tone> = {
  cycle: "mist",
  reserve: "peach",
  metabolic: "mist",
  male: "mist",
  conditions: "amber",
  lifestyle: "dawn",
};

function useLiveMotion() {
  const { animate, live, dur } = useJourneyMotion();
  return { animate: animate && live, dur };
}

/** Soft spherical glyph for one health area — used on domain cards & tabs. */
export function DomainSphere({
  domain,
  direction = "Unknown",
  size = 72,
  label,
}: {
  domain: Domain;
  direction?: Direction;
  size?: number;
  label?: string;
}) {
  const { animate, dur } = useLiveMotion();
  const tone = direction === "Unknown" || direction === "Stable" ? DOMAIN_TONE[domain] : DIRECTION_TONE[direction];
  const c = TONE_FILL[tone];
  const uid = `ds-${domain}-${size}`;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className="shrink-0"
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      initial={animate ? { scale: 0.86, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: dur(0.5), ease: [0.16, 1, 0.3, 1] }}
    >
      <defs>
        <radialGradient id={`${uid}-g`} cx="32%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="45%" stopColor={c.soft} stopOpacity="1" />
          <stop offset="100%" stopColor={c.ring} stopOpacity="0.85" />
        </radialGradient>
        <filter id={`${uid}-blur`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>
      <circle cx="40" cy="40" r="36" fill={`url(#${uid}-g)`} />
      <circle
        cx="40"
        cy="40"
        r="28"
        fill="none"
        stroke={c.core}
        strokeOpacity="0.35"
        strokeWidth="1.2"
        className={animate ? "masar-orbit-slow" : undefined}
        style={{ transformOrigin: "40px 40px" }}
        strokeDasharray="8 10"
      />
      <motion.circle
        cx="40"
        cy="40"
        r="14"
        fill={c.core}
        fillOpacity="0.88"
        animate={animate ? { scale: [1, 1.06, 1] } : undefined}
        transition={animate ? { duration: 3.6, repeat: Infinity, ease: "easeInOut" } : undefined}
        style={{ transformOrigin: "40px 40px" }}
      />
      <circle cx="34" cy="33" r="5" fill="#fff" fillOpacity="0.45" filter={`url(#${uid}-blur)`} />
      {/* Domain-flavoured inner mark */}
      {domain === "conditions" ? (
        <path d="M40 30v20M30 40h20" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
      ) : domain === "metabolic" ? (
        <path
          d="M28 46c4-10 8-14 12-14s8 4 12 14"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
      ) : domain === "cycle" ? (
        <circle cx="40" cy="40" r="7" fill="none" stroke="#fff" strokeWidth="2" opacity="0.9" />
      ) : domain === "lifestyle" ? (
        <path d="M32 44l8-12 8 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
      ) : domain === "male" ? (
        <circle cx="37" cy="42" r="7" fill="none" stroke="#fff" strokeWidth="2" opacity="0.9" />
      ) : (
        <circle cx="40" cy="40" r="5" fill="#fff" fillOpacity="0.85" />
      )}
      <circle cx="58" cy="24" r="3.5" fill={c.accent} className={animate ? "masar-float-dot" : undefined} />
    </motion.svg>
  );
}

/** Large header figure for detail groups — circular constellation. */
export function GroupConstellation({
  groupKey,
  className = "",
}: {
  groupKey: "reproductive" | "history" | "context";
  className?: string;
}) {
  const { animate, dur } = useLiveMotion();
  const tone: Tone = groupKey === "history" ? "amber" : groupKey === "context" ? "peach" : "mist";
  const c = TONE_FILL[tone];
  const uid = `gc-${groupKey}`;

  const nodes =
    groupKey === "reproductive"
      ? [
          { cx: 70, cy: 36, r: 7 },
          { cx: 108, cy: 58, r: 5 },
          { cx: 52, cy: 78, r: 4.5 },
        ]
      : groupKey === "history"
        ? [
            { cx: 64, cy: 42, r: 6 },
            { cx: 100, cy: 70, r: 5 },
            { cx: 48, cy: 88, r: 4 },
          ]
        : [
            { cx: 58, cy: 48, r: 5.5 },
            { cx: 96, cy: 40, r: 4.5 },
            { cx: 88, cy: 86, r: 6 },
            { cx: 44, cy: 80, r: 3.5 },
          ];

  return (
    <motion.svg
      viewBox="0 0 140 120"
      className={`h-[5.5rem] w-[6.5rem] shrink-0 sm:h-28 sm:w-32 ${className}`}
      aria-hidden
      initial={animate ? { opacity: 0, x: 12 } : false}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: dur(0.55), ease: [0.16, 1, 0.3, 1] }}
    >
      <defs>
        <radialGradient id={`${uid}-core`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="55%" stopColor={c.soft} />
          <stop offset="100%" stopColor={c.ring} stopOpacity="0.7" />
        </radialGradient>
      </defs>
      <circle cx="70" cy="60" r="48" fill={`url(#${uid}-core)`} opacity="0.95" />
      <circle
        cx="70"
        cy="60"
        r="38"
        fill="none"
        stroke={c.core}
        strokeOpacity="0.25"
        strokeWidth="1"
        strokeDasharray="3 7"
        className={animate ? "masar-orbit-slow" : undefined}
        style={{ transformOrigin: "70px 60px" }}
      />
      <motion.circle
        cx="70"
        cy="60"
        r="16"
        fill={c.core}
        fillOpacity="0.85"
        animate={animate ? { scale: [1, 1.08, 1] } : undefined}
        transition={animate ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : undefined}
        style={{ transformOrigin: "70px 60px" }}
      />
      <circle cx="64" cy="54" r="5" fill="#fff" fillOpacity="0.4" />
      {nodes.map((n, i) => (
        <g key={i}>
          <line
            x1="70"
            y1="60"
            x2={n.cx}
            y2={n.cy}
            stroke={c.core}
            strokeOpacity="0.28"
            strokeWidth="1"
          />
          <motion.circle
            cx={n.cx}
            cy={n.cy}
            r={n.r}
            fill={i % 2 === 0 ? c.accent : c.core}
            fillOpacity="0.9"
            animate={animate ? { scale: [1, 1.15, 1] } : undefined}
            transition={
              animate
                ? { duration: 2.8 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.25 }
                : undefined
            }
            style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
          />
        </g>
      ))}
    </motion.svg>
  );
}

/** Chronological orbit for the trajectory panel — readings as satellites. */
export function ChronoOrbit({
  readingCount = 0,
  hasChart = false,
  className = "",
}: {
  readingCount?: number;
  hasChart?: boolean;
  className?: string;
}) {
  const { animate, dur } = useLiveMotion();
  const c = TONE_FILL.mist;
  const sats = Math.min(Math.max(readingCount, 1), 5);
  const angles = Array.from({ length: sats }, (_, i) => (i / sats) * Math.PI * 2 - Math.PI / 2);

  return (
    <motion.svg
      viewBox="0 0 120 120"
      className={`h-24 w-24 shrink-0 ${className}`}
      aria-hidden
      initial={animate ? { opacity: 0, scale: 0.9 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: dur(0.45) }}
    >
      <defs>
        <radialGradient id="chrono-g" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor={c.soft} />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="52" fill="url(#chrono-g)" />
      <circle
        cx="60"
        cy="60"
        r="40"
        fill="none"
        stroke={c.ring}
        strokeWidth="1.5"
        strokeDasharray={hasChart ? "0" : "4 6"}
        className={animate ? "masar-orbit-slow" : undefined}
        style={{ transformOrigin: "60px 60px" }}
      />
      <circle cx="60" cy="60" r="12" fill={c.core} fillOpacity="0.9" />
      <circle cx="56" cy="55" r="3.5" fill="#fff" fillOpacity="0.45" />
      {angles.map((a, i) => {
        const x = 60 + Math.cos(a) * 40;
        const y = 60 + Math.sin(a) * 40;
        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r={i === 0 ? 5 : 3.5}
            fill={i === 0 ? c.accent : c.core}
            animate={animate ? { scale: [1, 1.2, 1] } : undefined}
            transition={
              animate ? { duration: 2.4, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" } : undefined
            }
            style={{ transformOrigin: `${x}px ${y}px` }}
          />
        );
      })}
    </motion.svg>
  );
}

/** Halo figure for featured insights (e.g. Conditions · Worth discussing). */
export function InsightHalo({
  direction = "Discuss",
  className = "",
}: {
  direction?: Direction;
  className?: string;
}) {
  const { animate, dur } = useLiveMotion();
  const tone = DIRECTION_TONE[direction];
  const c = TONE_FILL[tone];

  return (
    <motion.svg
      viewBox="0 0 100 100"
      className={`h-20 w-20 shrink-0 ${className}`}
      aria-hidden
      initial={animate ? { opacity: 0, rotate: -8 } : false}
      animate={{ opacity: 1, rotate: 0 }}
      transition={{ duration: dur(0.5) }}
    >
      <defs>
        <radialGradient id="insight-halo" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="60%" stopColor={c.soft} />
          <stop offset="100%" stopColor={c.ring} stopOpacity="0.8" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="44" fill="url(#insight-halo)" />
      {[34, 26, 18].map((r, i) => (
        <circle
          key={r}
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={c.core}
          strokeOpacity={0.2 + i * 0.12}
          strokeWidth="1"
          className={animate && i === 0 ? "masar-orbit-slow" : undefined}
          style={{ transformOrigin: "50px 50px" }}
          strokeDasharray={i === 1 ? "5 8" : undefined}
        />
      ))}
      <motion.circle
        cx="50"
        cy="50"
        r="10"
        fill={c.core}
        animate={animate ? { scale: [1, 1.12, 1] } : undefined}
        transition={animate ? { duration: 2.8, repeat: Infinity, ease: "easeInOut" } : undefined}
        style={{ transformOrigin: "50px 50px" }}
      />
      {/* soft spark for Discuss */}
      {direction === "Discuss" || direction === "Shifting" ? (
        <motion.path
          d="M72 28l2.5 5.5 6 .5-4.5 4 1.5 5.5L72 40.5 66.5 43.5l1.5-5.5-4.5-4 6-.5Z"
          fill={c.accent}
          animate={animate ? { opacity: [0.55, 1, 0.55], scale: [0.95, 1.05, 0.95] } : undefined}
          transition={animate ? { duration: 2.2, repeat: Infinity } : undefined}
          style={{ transformOrigin: "72px 34px" }}
        />
      ) : null}
    </motion.svg>
  );
}

/** Orbital figure for “What is metabolic health?” */
export function MetabolicOrbit({ className = "" }: { className?: string }) {
  const { animate, dur } = useLiveMotion();
  const c = TONE_FILL.mist;
  const moons = [
    { a: -0.4, r: 5, fill: c.accent },
    { a: 1.2, r: 4, fill: c.core },
    { a: 2.6, r: 3.5, fill: TONE_FILL.peach.core },
    { a: 4.1, r: 4.5, fill: c.ring },
  ];

  return (
    <motion.svg
      viewBox="0 0 128 128"
      className={`h-28 w-28 shrink-0 ${className}`}
      aria-hidden
      initial={animate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur(0.5) }}
    >
      <defs>
        <radialGradient id="meta-orb" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="55%" stopColor={c.soft} />
          <stop offset="100%" stopColor={c.ring} />
        </radialGradient>
      </defs>
      <circle cx="64" cy="64" r="56" fill="url(#meta-orb)" />
      <ellipse
        cx="64"
        cy="64"
        rx="42"
        ry="18"
        fill="none"
        stroke={c.core}
        strokeOpacity="0.35"
        strokeWidth="1.2"
        className={animate ? "masar-orbit-slow" : undefined}
        style={{ transformOrigin: "64px 64px" }}
      />
      <ellipse
        cx="64"
        cy="64"
        rx="18"
        ry="42"
        fill="none"
        stroke={c.accent}
        strokeOpacity="0.3"
        strokeWidth="1.2"
        className={animate ? "masar-orbit-rev" : undefined}
        style={{ transformOrigin: "64px 64px" }}
      />
      <circle cx="64" cy="64" r="14" fill={c.core} fillOpacity="0.88" />
      <circle cx="58" cy="58" r="4" fill="#fff" fillOpacity="0.4" />
      {/* wave mark */}
      <path
        d="M52 68c4-6 8-8 12-8s8 2 12 8"
        stroke="#fff"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.85"
      />
      {moons.map((m, i) => {
        const x = 64 + Math.cos(m.a) * 42;
        const y = 64 + Math.sin(m.a) * 18;
        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r={m.r}
            fill={m.fill}
            animate={animate ? { scale: [1, 1.18, 1] } : undefined}
            transition={
              animate ? { duration: 2.6 + i * 0.35, repeat: Infinity, delay: i * 0.2 } : undefined
            }
            style={{ transformOrigin: `${x}px ${y}px` }}
          />
        );
      })}
    </motion.svg>
  );
}

/** Compact circular status pip for metabolic mini cells. */
export function StatusOrb({
  status,
}: {
  status: "available" | "single" | "outdated" | "missing";
}) {
  const fill =
    status === "available"
      ? TONE_FILL.mist.core
      : status === "single"
        ? TONE_FILL.dawn.ring
        : status === "outdated"
          ? TONE_FILL.amber.core
          : TONE_FILL.slate.ring;
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="shrink-0">
      <circle cx="7" cy="7" r="6" fill={fill} fillOpacity={status === "missing" ? 0.35 : 0.9} />
      {status === "missing" ? (
        <circle cx="7" cy="7" r="6" fill="none" stroke={TONE_FILL.slate.core} strokeDasharray="2 2" strokeWidth="1" />
      ) : null}
      {status === "available" ? <circle cx="5.5" cy="5.5" r="1.6" fill="#fff" fillOpacity="0.55" /> : null}
    </svg>
  );
}
