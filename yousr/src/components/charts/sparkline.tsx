"use client";

import { useId, useMemo } from "react";
import type { ChartPoint } from "@/components/charts/confidence-band";

/** Compact SVG sparkline for domain cards — no axes, calm clinical stroke. */
export function Sparkline({
  points,
  tone = "mist",
  className = "",
}: {
  points: ChartPoint[];
  tone?: "mist" | "peach" | "amber" | "slate";
  className?: string;
}) {
  const uid = useId();
  const stroke =
    tone === "peach"
      ? "var(--peach-500)"
      : tone === "amber"
        ? "var(--amber-400)"
        : tone === "slate"
          ? "var(--slate-400)"
          : "var(--mist-500)";

  const path = useMemo(() => {
    if (points.length < 2) return null;
    const sorted = [...points].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    const vals = sorted.map((p) => p.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = Math.max(max - min, 0.01);
    const w = 120;
    const h = 36;
    const pad = 3;
    const coords = sorted.map((p, i) => {
      const x = pad + (i / (sorted.length - 1)) * (w - pad * 2);
      const y = h - pad - ((p.value - min) / span) * (h - pad * 2);
      return { x, y };
    });
    const d = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
    const area = `${d} L${coords[coords.length - 1].x.toFixed(1)} ${h} L${coords[0].x.toFixed(1)} ${h} Z`;
    return { d, area, last: coords[coords.length - 1], w, h };
  }, [points]);

  if (!path) {
    return (
      <svg className={className} viewBox="0 0 120 36" width="120" height="36" aria-hidden>
        <line x1="4" y1="18" x2="116" y2="18" stroke="var(--dawn-200)" strokeWidth="1.5" strokeDasharray="3 4" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox={`0 0 ${path.w} ${path.h}`} width={path.w} height={path.h} aria-hidden>
      <defs>
        <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={path.area} fill={`url(#${uid}-fill)`} />
      <path
        d={path.d}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="journey-spark-draw"
      />
      <circle cx={path.last.x} cy={path.last.y} r="3.25" fill={stroke} />
    </svg>
  );
}
