"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
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
    <div className="h-64 w-full" dir="ltr">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: -8 }}>
          <CartesianGrid stroke="var(--dawn-200)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="ts"
            type="number"
            domain={[xMin, now]}
            tickFormatter={(v: number) => formatMonth(new Date(v), locale)}
            stroke="var(--ink-400)"
            fontSize={11}
            tickLine={false}
          />
          <YAxis domain={[yMin, yMax]} stroke="var(--ink-400)" fontSize={11} tickLine={false} axisLine={false} width={40} />
          {/* reference band = the range we can speak to for conversation */}
          <ReferenceArea
            y1={band.low ?? yMin}
            y2={band.high ?? yMax}
            fill="var(--mist-300)"
            fillOpacity={0.28}
            stroke="none"
          />
          {/* shade = readings older than the freshness window */}
          <ReferenceArea x1={xMin} x2={staleCut} fill="var(--slate-200)" fillOpacity={0.45} stroke="none" />
          <Tooltip
            cursor={{ stroke: "var(--peach-300)" }}
            contentStyle={{ background: "var(--dawn-50)", border: "1px solid var(--dawn-200)", borderRadius: 12, fontSize: 12 }}
            labelFormatter={(v) => formatDate(new Date(Number(v)), locale)}
            formatter={(value, _n, item) => [`${value} ${band.unit}`, String((item.payload as ChartPoint).source)]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--peach-700)"
            strokeWidth={2}
            dot={{ r: 4, fill: "var(--peach-500)", stroke: "var(--dawn-50)", strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            isAnimationActive
          />
        </LineChart>
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
