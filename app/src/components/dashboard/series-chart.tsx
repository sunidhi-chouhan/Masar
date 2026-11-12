"use client";

import { useId, useState } from "react";

// One measurement over time. Real readings only: the line joins them in date
// order, the usual range is a shaded band (when Masar has one), and each point
// can be hovered, focused or tapped to read its value, date and source. A
// table of the same values is one tap away. Cycles are bars, one per cycle.

export interface ChartPoint {
  at: string;
  /** already formatted for the reader's language */
  date: string;
  value: number;
  source: string;
}

export function SeriesChart({
  points,
  unit,
  band,
  refRange,
  bars = false,
  title,
  labels,
}: {
  points: ChartPoint[];
  unit: string;
  band?: [number, number];
  refRange?: [number, number];
  bars?: boolean;
  title: string;
  labels: { usual: string; showValues: string; hideValues: string; date: string; value: string; source: string; printedRange: string };
}) {
  const id = useId();
  const [active, setActive] = useState<number | null>(points.length - 1);
  const [table, setTable] = useState(false);
  const W = 560;
  const H = 180;
  const pad = { l: 36, r: 16, t: 16, b: 26 };
  const range = band ?? refRange;
  const values = points.map((p) => p.value);
  let lo = Math.min(...values, ...(range ? [range[0]] : []));
  let hi = Math.max(...values, ...(range ? [range[1]] : []));
  if (bars) lo = Math.min(lo, 0);
  // Round ticks (1, 2 or 5 × a power of ten), and an axis that ends on them.
  const span = hi - lo || Math.abs(hi) || 1;
  const raw = span / 3;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * mag).find((m) => m >= raw) ?? 10 * mag;
  lo = Math.floor((lo - span * 0.08) / step) * step;
  hi = Math.ceil((hi + span * 0.08) / step) * step;
  if (bars || lo < 0) lo = Math.max(0, lo);
  const x = (i: number) => (points.length === 1 ? (pad.l + W - pad.r) / 2 : pad.l + (i * (W - pad.l - pad.r)) / (points.length - 1));
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 1000) / 1000);
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  const barW = Math.max(6, Math.min(28, ((W - pad.l - pad.r) / Math.max(1, points.length)) * 0.55));
  const a = active !== null ? points[active] : null;

  return (
    <div>
      <div className="relative" dir="ltr">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-labelledby={`${id}-t`}>
          <title id={`${id}-t`}>{title}</title>
          {ticks.map((tv) => (
            <g key={tv}>
              <line x1={pad.l} x2={W - pad.r} y1={y(tv)} y2={y(tv)} className="stroke-rule" strokeDasharray="3 4" />
              <text x={pad.l - 8} y={y(tv) + 4} textAnchor="end" className="fill-ink-3 text-[10px]">
                {fmt(tv)}
              </text>
            </g>
          ))}
          {range ? (
            <rect x={pad.l} width={W - pad.l - pad.r} y={y(range[1])} height={Math.max(2, y(range[0]) - y(range[1]))} className="fill-accent-soft" opacity={0.7} />
          ) : null}
          {bars ? (
            points.map((p, i) => (
              <rect
                key={p.at + i}
                x={x(i) - barW / 2}
                width={barW}
                y={y(p.value)}
                height={y(lo) - y(p.value)}
                rx={Math.min(6, barW / 2)}
                className={`series-bar ${i === active ? "fill-accent" : range && (p.value < range[0] || p.value > range[1]) ? "fill-soon" : "fill-indigo-300"}`}
                style={{ ["--i" as string]: i }}
              />
            ))
          ) : (
            <>
              <path d={points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`).join(" ")} className="series-line fill-none stroke-accent" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
              {points.map((p, i) => (
                <g key={p.at + i}>
                  <circle cx={x(i)} cy={y(p.value)} r={i === active ? 6.5 : 4.5} className={i === active ? "fill-accent stroke-surface" : "fill-surface stroke-accent"} strokeWidth={2.5} />
                  {points.length <= 8 ? (
                    <text x={x(i)} y={y(p.value) - 11} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"} className="fill-ink text-[11px] font-semibold">
                      {fmt(p.value)}
                    </text>
                  ) : null}
                </g>
              ))}
            </>
          )}
          {points.length > 1 ? (
            <>
              <text x={x(0)} y={H - 6} textAnchor="start" className="fill-ink-3 text-[10px]">
                {points[0].date}
              </text>
              <text x={x(points.length - 1)} y={H - 6} textAnchor="end" className="fill-ink-3 text-[10px]">
                {points[points.length - 1].date}
              </text>
            </>
          ) : null}
        </svg>
        {/* Invisible, focusable hit areas over each point: hover, focus or tap to read it. */}
        <div className="absolute inset-0 flex" style={{ paddingInline: `${(pad.l / W) * 100}% ${(pad.r / W) * 100}%` }}>
          {points.map((p, i) => (
            <button
              key={p.at + i}
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-label={`${p.date}: ${fmt(p.value)} ${unit}, ${p.source}`}
              aria-pressed={i === active}
              className="h-full flex-1 rounded-md focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
            />
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
        <p aria-live="polite" className="text-ink-2">
          {a ? (
            <>
              <span className="tabular font-semibold text-ink" dir="ltr">
                {fmt(a.value)} {unit}
              </span>{" "}
              · {a.date} · {a.source}
            </>
          ) : null}
        </p>
        <span className="flex items-center gap-3 text-ink-3">
          {range ? (
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-2.5 w-4 rounded-sm bg-accent-soft" />
              {band ? labels.usual : labels.printedRange}
              <span dir="ltr">
                ({fmt(range[0])}–{fmt(range[1])})
              </span>
            </span>
          ) : null}
          <button type="button" onClick={() => setTable((t) => !t)} aria-expanded={table} className="link min-h-[32px]">
            {table ? labels.hideValues : labels.showValues}
          </button>
        </span>
      </div>
      {table ? (
        <table className="mt-2 w-full text-[13px]">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="text-start text-ink-3">
              <th className="py-1 text-start font-medium">{labels.date}</th>
              <th className="py-1 text-start font-medium">{labels.value}</th>
              <th className="py-1 text-start font-medium">{labels.source}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={p.at + i} className="border-t border-rule">
                <td className="py-1.5">{p.date}</td>
                <td className="tabular py-1.5" dir="ltr">
                  {fmt(p.value)} {unit}
                </td>
                <td className="py-1.5 text-ink-2">{p.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
