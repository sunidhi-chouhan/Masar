"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "@/lib/i18n/client";
import type { EquityRow, Funnel, HeatCell } from "@/server/population";

export function FunnelChart({ funnel }: { funnel: Funnel }) {
  const { t } = useI18n();
  const data = (Object.keys(funnel) as (keyof Funnel)[]).map((k) => ({ step: t(`population.funnelSteps.${k}`), n: funnel[k] }));
  return (
    <div className="h-56 w-full" dir="ltr">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
          <CartesianGrid stroke="var(--dawn-200)" vertical={false} strokeDasharray="2 4" />
          <XAxis dataKey="step" fontSize={11} stroke="var(--ink-400)" tickLine={false} interval={0} />
          <YAxis fontSize={11} stroke="var(--ink-400)" tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ background: "var(--dawn-50)", border: "1px solid var(--dawn-200)", borderRadius: 12, fontSize: 12 }} />
          <Bar dataKey="n" fill="var(--peach-500)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Heatmap({ cells }: { cells: HeatCell[] }) {
  const { t } = useI18n();
  const bands = [...new Set(cells.map((c) => c.ageBand))].sort();
  const order = ["pcos", "thyroid", "metabolic", "other", "none"];
  const conds = [...new Set(cells.map((c) => c.condition))].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const find = (b: string, c: string) => cells.find((x) => x.ageBand === b && x.condition === c);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="px-2 py-1 text-start font-normal text-ink-400">{t("population.groups.ageBand")}</th>
            {conds.map((c) => (
              <th key={c} className="px-2 py-1 text-start font-normal text-ink-600">
                {t(`population.conditionBuckets.${c}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bands.map((b) => (
            <tr key={b}>
              <td className="px-2 py-1 text-ink-600">{b}</td>
              {conds.map((c) => {
                const cell = find(b, c);
                if (!cell) return <td key={c} className="px-2 py-1" />;
                if (cell.total === null) {
                  return (
                    <td key={c} className="px-2 py-1">
                      <div
                        className="h-9 rounded-sm border border-slate-400/60"
                        style={{ background: "repeating-linear-gradient(45deg, transparent 0 4px, var(--slate-200) 4px 8px)" }}
                        title={t("population.suppressed")}
                      />
                    </td>
                  );
                }
                const share = cell.total ? (cell.counselled ?? 0) / cell.total : 0;
                return (
                  <td key={c} className="px-2 py-1">
                    <div
                      className="flex h-9 items-center justify-center rounded-sm text-ink-900"
                      style={{ background: `color-mix(in srgb, var(--mist-500) ${Math.round(share * 85) + 10}%, var(--dawn-100))` }}
                      title={`${cell.counselled}/${cell.total}`}
                    >
                      {cell.total}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EquityBars({ rows, group }: { rows: EquityRow[]; group: string }) {
  const { t } = useI18n();
  const data = rows
    .filter((r) => r.group === group)
    .map((r) => ({
      value: group === "intention" ? t(`intentions.${r.value}`) : r.value,
      signal: r.signalRate,
      counselled: r.counselledRate,
      suppressed: r.total === null,
    }));
  return (
    <div className="h-48 w-full" dir="ltr">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
          <CartesianGrid stroke="var(--dawn-200)" vertical={false} strokeDasharray="2 4" />
          <XAxis dataKey="value" fontSize={11} stroke="var(--ink-400)" tickLine={false} interval={0} />
          <YAxis fontSize={11} stroke="var(--ink-400)" tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
          <Tooltip contentStyle={{ background: "var(--dawn-50)", border: "1px solid var(--dawn-200)", borderRadius: 12, fontSize: 12 }} />
          <Bar dataKey="signal" name={t("population.signalRate")} fill="var(--peach-300)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="counselled" name={t("population.counselledRate")} fill="var(--mist-500)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
