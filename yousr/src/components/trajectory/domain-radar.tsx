"use client";

import { motion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import type { Confidence, Direction, Domain } from "@/lib/domain/types";
import { useJourneyMotion } from "@/components/journey/journey-loaders";

export type RadarNode = {
  domain: Domain;
  direction: Direction;
  confidence: Confidence;
  hasChart: boolean;
};

const FILL: Record<Direction, string> = {
  Improving: "var(--mist-500)",
  Stable: "var(--mist-300)",
  Shifting: "var(--peach-500)",
  Discuss: "var(--amber-400)",
  Unknown: "var(--slate-400)",
};

const LUX = [0.16, 1, 0.3, 1] as const;

/** Dispatch so TrajectoryPanel can sync selection. */
export function selectDashboardDomain(domain: Domain) {
  window.dispatchEvent(new CustomEvent("masar:select-domain", { detail: { domain } }));
  document.getElementById("trajectory")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Editorial constellation of domains — direction of change at a glance.
 * Not a score: each node is an independent area.
 */
export function DomainRadar({ nodes }: { nodes: RadarNode[] }) {
  const { t } = useI18n();
  const { animate, live, dur } = useJourneyMotion();
  const n = Math.max(nodes.length, 1);
  const cx = 160;
  const cy = 118;
  const R = 78;

  const positions = nodes.map((node, i) => {
    const angle = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return {
      ...node,
      x: cx + Math.cos(angle) * R,
      y: cy + Math.sin(angle) * R,
      angle,
    };
  });

  return (
    <div className="relative" role="region" aria-label={t("dashboard.radar.label")}>
      <svg viewBox="0 0 320 236" className="mx-auto h-auto w-full max-w-sm" role="img" aria-hidden>
        <defs>
          <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--mist-300)" stopOpacity="0.45" />
            <stop offset="70%" stopColor="var(--mist-100)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r="108" fill="url(#radar-glow)" />
        {[42, 78, 108].map((r) => (
          <circle
            key={r}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--dawn-200)"
            strokeWidth="1"
            strokeDasharray={r === 78 ? "0" : "2 6"}
            opacity={0.85}
          />
        ))}
        {positions.map((p, i) => {
          const next = positions[(i + 1) % positions.length];
          const d = `M ${p.x} ${p.y} Q ${cx} ${cy} ${next.x} ${next.y}`;
          return animate ? (
            <motion.path
              key={`arc-${p.domain}`}
              d={d}
              fill="none"
              stroke="var(--mist-300)"
              strokeWidth="1"
              strokeOpacity="0.55"
              animate={{ pathLength: [0.2, 1], opacity: [0.25, 0.7, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
            />
          ) : (
            <path
              key={`arc-${p.domain}`}
              d={d}
              fill="none"
              stroke="var(--mist-300)"
              strokeWidth="1"
              strokeOpacity="0.45"
            />
          );
        })}
        <circle cx={cx} cy={cy} r="6" fill="var(--mist-700)" opacity="0.85" />
        <text
          x={cx}
          y={cy + 22}
          textAnchor="middle"
          className="fill-ink-400"
          style={{ fontSize: 9, letterSpacing: "0.12em" }}
        >
          MASAR
        </text>
      </svg>

      <ul className="pointer-events-none absolute inset-0">
        {positions.map((p, i) => {
          const insufficient = p.confidence === "InsufficientData";
          const left = `${(p.x / 320) * 100}%`;
          const top = `${(p.y / 236) * 100}%`;
          return (
            <li
              key={p.domain}
              className="pointer-events-auto absolute"
              style={{ left, top, transform: "translate(-50%, -50%)" }}
            >
              <motion.button
                type="button"
                onClick={() => selectDashboardDomain(p.domain)}
                initial={live && animate ? { opacity: 0, scale: 0.7 } : false}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: dur(0.4), delay: animate ? 0.08 * i : 0, ease: LUX }}
                whileHover={animate ? { scale: 1.08 } : undefined}
                whileTap={animate ? { scale: 0.96 } : undefined}
                className={`group flex flex-col items-center gap-1 rounded-xl px-1.5 py-1 outline-none focus-visible:ring-2 focus-visible:ring-mist-500 ${
                  insufficient ? "opacity-70" : ""
                }`}
                aria-label={`${t(`domains.${p.domain}`)}: ${
                  insufficient ? t("confidence.notEnough") : t(`directions.${p.direction}`)
                }`}
              >
                <span
                  className="relative flex h-11 w-11 items-center justify-center rounded-pill shadow-[var(--shadow-soft)] transition-shadow group-hover:shadow-[var(--shadow-lift)]"
                  style={{
                    background: insufficient
                      ? "color-mix(in srgb, var(--slate-200) 80%, white)"
                      : `color-mix(in srgb, ${FILL[p.direction]} 28%, white)`,
                    boxShadow: `0 0 0 2px color-mix(in srgb, ${FILL[p.direction]} 55%, transparent)`,
                  }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-pill"
                    style={{ background: insufficient ? "var(--slate-400)" : FILL[p.direction] }}
                  />
                  {animate && !insufficient ? (
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-pill opacity-40"
                      style={{
                        boxShadow: `0 0 0 0 ${FILL[p.direction]}`,
                        animation: "journey-orb-pulse 2.8s ease-out infinite",
                        animationDelay: `${i * 0.25}s`,
                      }}
                    />
                  ) : null}
                </span>
                <span className="max-w-[4.5rem] truncate text-center text-[10px] font-medium leading-tight text-ink-900 sm:text-[11px]">
                  {t(`domains.${p.domain}`)}
                </span>
              </motion.button>
            </li>
          );
        })}
      </ul>
      <p className="mt-1 text-center text-xs text-ink-400">{t("dashboard.radar.hint")}</p>
    </div>
  );
}
