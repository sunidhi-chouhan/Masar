"use client";

import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface TrendPoint {
  t: number;
  value: number;
  /** one of the latest readings Masar compared */
  latest: boolean;
}

const INDIGO = "#4f46e5";
const AMBER = "#d97706";
const TICK = { fill: "#71717a", fontSize: 11 };
const locale = (lang: "en" | "ar") => (lang === "ar" ? "ar-AE-u-nu-latn" : "en-GB");
const tidy = (v: number) => String(Math.round(v * 10) / 10);

/** Readings over time, the usual range shaded, the latest readings emphasised. Same look as the report charts. */
export function TrendChart({
  points,
  band,
  unit,
  label,
  meaningful,
  bandLabel,
  lang = "en",
}: {
  points: TrendPoint[];
  band?: [number, number];
  unit: string;
  label: string;
  meaningful: boolean;
  bandLabel?: string;
  lang?: "en" | "ar";
}) {
  const month = (t: number) => new Date(t).toLocaleDateString(locale(lang), { month: "short", year: "2-digit" });
  const values = points.map((p) => p.value);
  const lo = Math.min(...values, band ? band[0] : Infinity);
  const hi = Math.max(...values, band ? band[1] : -Infinity);
  const pad = Math.max((hi - lo) * 0.2, 0.5);
  const domain: [number, number] = [Math.max(0, +(lo - pad).toFixed(1)), +(hi + pad).toFixed(1)];
  const stroke = meaningful ? AMBER : INDIGO;

  return (
    <div role="img" aria-label={label} className="mt-2" dir="ltr">
      <ResponsiveContainer width="100%" height={190}>
        <LineChart data={points} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 5" vertical={false} />
          {band ? (
            <ReferenceArea
              y1={band[0]}
              y2={band[1]}
              fill="#eef2ff"
              fillOpacity={0.9}
              ifOverflow="extendDomain"
              label={{ value: bandLabel ?? `Usual range ${band[0]}–${band[1]}`, position: "insideTopLeft", fill: "#4338ca", fontSize: 10.5, fontWeight: 600 }}
            />
          ) : null}
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={month}
            tick={TICK}
            tickLine={false}
            axisLine={{ stroke: "#e4e4e7" }}
            minTickGap={24}
            padding={{ left: 12, right: 12 }}
          />
          <YAxis domain={domain} tickFormatter={tidy} tick={TICK} tickLine={false} axisLine={false} width={44} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e4e4e7", fontSize: 13 }}
            labelFormatter={(t) => new Date(Number(t)).toLocaleDateString(locale(lang), { day: "numeric", month: "short", year: "numeric" })}
            formatter={(v) => [`${v} ${unit}`, label]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={2.25}
            isAnimationActive={false}
            dot={(props) => {
              const { cx, cy, payload, index } = props as { cx: number; cy: number; payload: TrendPoint; index: number };
              return (
                <circle
                  key={index}
                  cx={cx}
                  cy={cy}
                  r={payload.latest ? 5 : 3.5}
                  fill={payload.latest ? stroke : "#fff"}
                  stroke={stroke}
                  strokeWidth={1.6}
                />
              );
            }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
