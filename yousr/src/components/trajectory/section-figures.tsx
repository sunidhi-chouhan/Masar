"use client";

import type { ReactNode } from "react";
import type { Direction, Domain } from "@/lib/domain/types";

/*
 * Masar clinical icon system. One grammar everywhere: a soft rounded tile
 * tinted by meaning (direction), holding a 1.6px line glyph for the area.
 * Colour carries state only; the glyph carries the subject.
 */

type Tone = "pine" | "gold" | "clay" | "slate" | "stone";

const TONE: Record<Tone, { bg: string; ring: string; fg: string }> = {
  pine: { bg: "var(--mist-100)", ring: "color-mix(in srgb, var(--mist-300) 70%, transparent)", fg: "var(--mist-700)" },
  gold: { bg: "var(--amber-100)", ring: "color-mix(in srgb, var(--amber-400) 45%, transparent)", fg: "var(--amber-700)" },
  clay: { bg: "var(--peach-200)", ring: "color-mix(in srgb, var(--peach-300) 80%, transparent)", fg: "var(--peach-700)" },
  slate: { bg: "var(--slate-200)", ring: "color-mix(in srgb, var(--slate-400) 40%, transparent)", fg: "var(--slate-600)" },
  stone: { bg: "var(--dawn-100)", ring: "var(--dawn-200)", fg: "var(--ink-700)" },
};

const DIRECTION_TONE: Record<Direction, Tone> = {
  Improving: "pine",
  Stable: "stone",
  Shifting: "clay",
  Discuss: "gold",
  Unknown: "slate",
};

const GLYPH: Record<Domain | "timeline" | "insight" | "leaf" | "shield", ReactNode> = {
  cycle: (
    <>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M17.6 3.8v3.2h-3.2" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  reserve: (
    <>
      <path d="M12 3.5c3.4 0 6 4.8 6 9.2 0 4-2.7 6.8-6 6.8s-6-2.8-6-6.8c0-4.4 2.6-9.2 6-9.2Z" />
      <circle cx="12" cy="13.5" r="2.4" />
    </>
  ),
  metabolic: <path d="M3 12.5h4l2.2-5.5 4 11 2.4-5.5H21" />,
  male: (
    <>
      <circle cx="10" cy="14" r="5" />
      <path d="M13.6 10.4 19.5 4.5M15 4.5h4.5V9" />
    </>
  ),
  conditions: (
    <>
      <rect x="5" y="4.5" width="14" height="16" rx="2.5" />
      <path d="M9.5 3.5h5v2.5h-5zM12 10v6M9 13h6" />
    </>
  ),
  lifestyle: (
    <>
      <path d="M19.5 4.5C10 4.5 5 9 5 18.5c9.5 0 14.5-5 14.5-14Z" />
      <path d="M5 19.5 13.5 11" />
    </>
  ),
  timeline: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2.5" />
      <path d="M4 10h16M9 3v4M15 3v4" />
      <circle cx="9" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  insight: (
    <>
      <path d="M12 3.5a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2v.5h5v-.5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3.5Z" />
      <path d="M10 20h4" />
    </>
  ),
  leaf: (
    <>
      <path d="M12 20s-7-4.2-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.8-7 10-7 10Z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 5 6.2v5.2c0 4.2 3 7.5 7 9.1 4-1.6 7-4.9 7-9.1V6.2L12 3.5Z" />
      <path d="m9 12 2.1 2.1 4-4.1" />
    </>
  ),
};

function IconTile({
  glyph,
  tone,
  size,
  label,
  className = "",
}: {
  glyph: ReactNode;
  tone: Tone;
  size: number;
  label?: string;
  className?: string;
}) {
  const c = TONE[tone];
  const icon = Math.round(size * 0.5);
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        background: c.bg,
        color: c.fg,
        boxShadow: `inset 0 0 0 1px ${c.ring}`,
      }}
    >
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {glyph}
      </svg>
    </span>
  );
}

/** Area glyph, tinted by its current direction — used on cards, tabs and lists. */
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
  return <IconTile glyph={GLYPH[domain]} tone={DIRECTION_TONE[direction]} size={Math.min(size, 48)} label={label} />;
}

/** Group header mark for the detail sections. */
export function GroupConstellation({
  groupKey,
  className = "",
}: {
  groupKey: "reproductive" | "history" | "context";
  className?: string;
}) {
  const glyph = groupKey === "reproductive" ? GLYPH.reserve : groupKey === "history" ? GLYPH.shield : GLYPH.metabolic;
  return <IconTile glyph={glyph} tone="pine" size={52} className={className} />;
}

/** Timeline / care-pathway mark. */
export function ChronoOrbit({
  className = "",
}: {
  readingCount?: number;
  hasChart?: boolean;
  className?: string;
}) {
  return <IconTile glyph={GLYPH.timeline} tone="pine" size={52} className={className} />;
}

/** Featured-insight mark, tinted by direction. */
export function InsightHalo({
  direction = "Discuss",
  className = "",
}: {
  direction?: Direction;
  className?: string;
}) {
  return <IconTile glyph={GLYPH.insight} tone={DIRECTION_TONE[direction]} size={48} className={className} />;
}

/** Wellbeing / living-well mark. */
export function MetabolicOrbit({ className = "" }: { className?: string }) {
  return <IconTile glyph={GLYPH.leaf} tone="pine" size={52} className={className.replace(/\bh-\d+\b|\bw-\d+\b/g, "")} />;
}

/** Compact status pip for metabolic mini cells. */
export function StatusOrb({
  status,
}: {
  status: "available" | "single" | "outdated" | "missing";
}) {
  const cls =
    status === "available"
      ? "bg-mist-500"
      : status === "single"
        ? "bg-mist-300"
        : status === "outdated"
          ? "bg-amber-400"
          : "border border-dashed border-slate-400 bg-transparent";
  return <span aria-hidden className={`dot ${cls}`} />;
}
