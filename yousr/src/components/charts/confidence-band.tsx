"use client";

import { useId, useMemo } from "react";
import {
  Area,
  CartesianGrid,
  Line,
  ComposedChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useI18n } from "@/lib/i18n/client";
import { formatDate, formatMonth } from "@/lib/i18n/format";
import type { Band } from "@/lib/engine/bands";

export interface ChartPoint {
  at: string; // ISO
  value: number;
  source: string;
}

export function ConfidenceBand({
  points,
  band,
  staleMonths,
  nowIso,
}: {
  points: ChartPoint[];
  band: Band;
  staleMonths: number;
  /** server-provided clock so the chart is pure on the client */
  nowIso: string;
}) {
  const { t, locale } = useI18n();
  const gid = useId();
  const data = useMemo(
    () => points.map((p) => ({ ...p, ts: new Date(p.at).getTime() })).sort((a, b) => a.ts - b.ts),
    [points],
  );
  if (!data.length) return <p className="text-sm text-ink-400">{t("domainDetail.noChart")}</p>;

  const values = data.map((d) => d.value);
  const lo = Math.min(...values, band.low ?? Infinity);
  const hi = Math.max(...values, band.high ?? -Infinity);
  const pad = Math.max((hi - lo) * 0.25, 1);
  const yMin = Math.floor(lo - pad);
  const yMax = Math.ceil(hi + pad);
  const now = new Date(nowIso).getTime();
  const staleCut = now - staleMonths * 30.44 * 86_400_000;
  const xMin = Math.min(data[0].ts, staleCut);

  return (
    <div className="relative h-72 w-full rounded-xl bg-gradient-to-b from-white/40 to-dawn-50/50 p-1" dir="ltr">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 16, right: 18, bottom: 6, left: -4 }}>
          <defs>
            <linearGradient id={`${gid}-line`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--mist-500)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--mist-500)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--dawn-200)" strokeDasharray="2 5" vertical={false} />
          <XAxis
            dataKey="ts"
            type="number"
            domain={[xMin, now]}
            tickFormatter={(v: number) => formatMonth(new Date(v), locale)}
            stroke="var(--ink-400)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[yMin, yMax]}
            stroke="var(--ink-400)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={42}
          />
          <ReferenceArea
            y1={band.low ?? yMin}
            y2={band.high ?? yMax}
            fill="var(--mist-300)"
            fillOpacity={0.22}
            stroke="none"
          />
          <ReferenceArea x1={xMin} x2={staleCut} fill="var(--slate-200)" fillOpacity={0.35} stroke="none" />
          <Tooltip
            cursor={{ stroke: "var(--mist-300)", strokeDasharray: "4 4" }}
            contentStyle={{
              background: "color-mix(in srgb, var(--dawn-50) 92%, white)",
              border: "1px solid var(--dawn-200)",
              borderRadius: 12,
              fontSize: 12,
              boxShadow: "var(--shadow-soft)",
            }}
            labelFormatter={(v) => formatDate(new Date(Number(v)), locale)}
            formatter={(value, _n, item) => [
              `${value} ${band.unit}`,
              String((item.payload as ChartPoint).source),
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="none"
            fill={`url(#${gid}-line)`}
            isAnimationActive
            animationDuration={900}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--mist-700)"
            strokeWidth={2.25}
            dot={{ r: 4.5, fill: "var(--mist-500)", stroke: "var(--dawn-50)", strokeWidth: 2 }}
            activeDot={{ r: 7, fill: "var(--mist-700)", stroke: "white", strokeWidth: 2 }}
            isAnimationActive
            animationDuration={1100}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <table className="sr-only-table">
        <caption>{t("domainDetail.chart")}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.at}>
              <td>{formatDate(d.at, locale)}</td>
              <td>
                {d.value} {band.unit}
              </td>
              <td>{d.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
