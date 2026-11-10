"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const INDIGO = "#4f46e5";
const VIOLET = "#8b5cf6";
const ZINC = "#a1a1aa";
const AMBER = "#f59e0b";
const ROSE = "#f43f5e";
const GRID = "#e4e4e7";
const TICK = { fill: "#71717a", fontSize: 12 };

const tooltipStyle = {
  contentStyle: { borderRadius: 12, border: "1px solid #e4e4e7", boxShadow: "0 8px 24px -12px rgb(0 0 0 / 0.2)", fontSize: 13 },
  labelStyle: { color: "#09090b", fontWeight: 600 },
};

const dayLabel = (d: number) =>
  d === 0 ? "Start" : d < 60 ? `${Math.round(d / 7)} wk` : d < 365 ? `${Math.round(d / 30)} mo` : `${(d / 365).toFixed(d % 365 ? 1 : 0)} yr`;

/** Share of people who had a conversation, by time since they were flagged. */
export function TimeToConversation({ data }: { data: { day: number; masar: number; usual: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="masarFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={INDIGO} stopOpacity={0.35} />
            <stop offset="100%" stopColor={INDIGO} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="day" tickFormatter={dayLabel} tick={TICK} tickLine={false} axisLine={{ stroke: GRID }} />
        <YAxis unit="%" tick={TICK} tickLine={false} axisLine={false} domain={[0, 60]} />
        <Tooltip {...tooltipStyle} labelFormatter={(d) => `After ${dayLabel(Number(d))}`} formatter={(v, n) => [`${v}%`, n]} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
        <Area type="monotone" name="With Masar" dataKey="masar" stroke={INDIGO} strokeWidth={2.5} fill="url(#masarFill)" />
        <Area type="monotone" name="Usual care" dataKey="usual" stroke={ZINC} strokeWidth={2} strokeDasharray="5 4" fill="transparent" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** How many people made it through each step. */
export function Journey({ data }: { data: { label: string; n: number }[] }) {
  const top = data[0]?.n || 1;
  const rows = data.map((d) => ({ ...d, pct: Math.round((d.n / top) * 100) }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 4 }}>
        <XAxis type="number" hide domain={[0, top]} />
        <YAxis type="category" dataKey="label" width={170} tick={{ ...TICK, fill: "#27272a" }} tickLine={false} axisLine={false} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "#f4f4f5" }} formatter={(v) => [Number(v).toLocaleString("en"), "People"]} />
        <Bar dataKey="n" radius={[0, 8, 8, 0]} barSize={26}>
          {rows.map((r, i) => (
            <Cell key={r.label} fill={i === rows.length - 1 ? VIOLET : INDIGO} fillOpacity={1 - i * 0.15} />
          ))}
          <LabelList dataKey="pct" position="right" formatter={(v) => `${v}%`} style={{ fill: "#3f3f46", fontSize: 12, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** People flagged each month, and how many of them asked to talk. */
export function Monthly({ data }: { data: { month: string; signals: number; asked: number }[] }) {
  const label = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short" });
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="month" tickFormatter={label} tick={TICK} tickLine={false} axisLine={{ stroke: GRID }} />
        <YAxis tick={TICK} tickLine={false} axisLine={false} />
        <Tooltip {...tooltipStyle} labelFormatter={(m) => label(String(m))} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
        <Bar name="Flagged" dataKey="signals" fill={INDIGO} fillOpacity={0.85} radius={[6, 6, 0, 0]} barSize={22} />
        <Line name="Asked to talk" dataKey="asked" stroke={AMBER} strokeWidth={2.5} dot={{ r: 3, fill: AMBER }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/** What doctors decided for each reason someone was flagged. */
export function DoctorDecisions({ data }: { data: { title: string; acceptPct: number; modifyPct: number; overridePct: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 46)}>
      <BarChart data={data} layout="vertical" stackOffset="expand" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="title" width={230} tick={{ ...TICK, fill: "#27272a" }} tickLine={false} axisLine={false} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "#f4f4f5" }} formatter={(v, n) => [`${v}%`, n]} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
        <Bar name="Agreed" dataKey="acceptPct" stackId="a" fill={INDIGO} barSize={22} />
        <Bar name="Agreed and added a test" dataKey="modifyPct" stackId="a" fill={VIOLET} />
        <Bar name="Disagreed" dataKey="overridePct" stackId="a" fill={ROSE} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Share of each group who asked to talk, against the overall average. */
export function Reach({ data, average }: { data: { label: string; pct: number }[]; average: number }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 44, left: 8, bottom: 4 }}>
        <XAxis type="number" hide domain={[0, 100]} />
        <YAxis type="category" dataKey="label" width={110} tick={{ ...TICK, fill: "#27272a" }} tickLine={false} axisLine={false} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "#f4f4f5" }} formatter={(v) => [`${v}%`, "Asked to talk"]} />
        <ReferenceLine x={average} stroke="#52525b" strokeDasharray="4 4" label={{ value: `Average ${average}%`, position: "top", fill: "#52525b", fontSize: 11 }} />
        <Bar dataKey="pct" radius={[0, 8, 8, 0]} barSize={20}>
          {data.map((d) => (
            <Cell key={d.label} fill={d.pct < average - 10 ? ROSE : INDIGO} />
          ))}
          <LabelList dataKey="pct" position="right" formatter={(v) => `${v}%`} style={{ fill: "#3f3f46", fontSize: 12, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
