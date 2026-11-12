"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Resident } from "@/lib/model";
import type { Report } from "@/lib/evidence";
import type { ProtoView } from "@/lib/prototype";
import type { Line } from "@/lib/path";
import { formatDateIn, t, type Lang } from "@/lib/i18n";
import type { ProtoState, Vars } from "./state";

// Shared context and small building blocks for the prototype.

export interface ProfileInfo {
  id: string;
  resident: Resident;
  story: "labs" | "lifestyle" | "limited" | "history";
}

export interface Ctx {
  s: ProtoState;
  set: (fn: (s: ProtoState) => ProtoState) => void;
  tr: (text: string, vars?: Vars) => string;
  say: (line: Line) => string;
  date: (iso: string) => string;
  profiles: ProfileInfo[];
  base: Resident;
  view: ProtoView;
  inbox: Resident[];
  report: Report;
  aiMode: "live" | "mock" | "off";
  accessKey: string | null;
}

export const ProtoCtx = createContext<Ctx | null>(null);

export function useProto(): Ctx {
  const c = useContext(ProtoCtx);
  if (!c) throw new Error("PrototypeContext");
  return c;
}

export function makeTr(lang: Lang) {
  const tr = (text: string, vars?: Vars) => t(lang, text, vars);
  const say = (l: Line) => tr(l.text, l.vars && Object.fromEntries(Object.entries(l.vars).map(([k, x]) => [k, typeof x === "string" ? tr(x) : x])));
  const date = (iso: string) => formatDateIn(lang, iso);
  return { tr, say, date };
}

/** Masar's mark: one line rising through readings to a gold point. */
export function Mark({ className = "h-8 w-8", inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={`flip-rtl ${className}`} aria-hidden>
      <rect width="32" height="32" rx="9" fill={inverted ? "#fff" : "var(--color-accent)"} />
      <path d="M7 21.5c3.2 0 4.2-6 7.4-6s3.6 3.6 6.4 3.6S24.5 10 25 10" fill="none" stroke={inverted ? "var(--color-accent)" : "#fff"} strokeWidth="2" strokeLinecap="round" />
      <circle cx="7" cy="21.5" r="1.7" fill={inverted ? "var(--color-accent)" : "#fff"} />
      <circle cx="25" cy="10" r="2.3" fill="var(--color-date)" />
    </svg>
  );
}

export function Brand({ inverted = false, sub }: { inverted?: boolean; sub?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${inverted ? "text-white" : "text-ink"}`}>
      <Mark inverted={inverted} />
      <span className="display text-[1.4rem] leading-none">Masar</span>
      <span aria-hidden className={`font-[family-name:var(--font-naskh)] text-[1rem] ${inverted ? "text-white/60" : "text-ink-3"}`}>
        مسار
      </span>
      {sub ? <span className={`ms-1 hidden rounded-full px-2 py-0.5 font-mono sm:inline text-[10.5px] uppercase tracking-[0.1em] ${inverted ? "bg-white/10 text-white/80" : "bg-zinc-100 text-ink-2"}`}>{sub}</span> : null}
    </span>
  );
}

/** A label that a feature is simulated in this prototype. Always visible where it applies. */
export function Simulated({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-dashed px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.08em] ${dark ? "border-white/40 text-white/80" : "border-soon/60 bg-soon-soft/60 text-soon"}`}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function Pill({ tone = "stone", children }: { tone?: "accent" | "soon" | "urgent" | "unknown" | "stone" | "dark"; children: ReactNode }) {
  const c = {
    accent: "bg-accent-soft text-accent",
    soon: "bg-soon-soft text-soon",
    urgent: "bg-urgent-soft text-urgent",
    unknown: "bg-unknown-soft text-unknown",
    stone: "bg-zinc-100 text-ink-2",
    dark: "bg-ink text-paper",
  }[tone];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${c}`}>{children}</span>;
}

export function Tabs<T extends string>({ items, value, onChange, label, dark = false }: { items: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; label: string; dark?: boolean }) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
      {items.map((i) => (
        <button
          key={i.id}
          role="tab"
          type="button"
          aria-selected={value === i.id}
          onClick={() => onChange(i.id)}
          className={`flex min-h-[38px] shrink-0 items-center gap-2 rounded-full px-3.5 text-[13.5px] font-medium transition-colors ${
            value === i.id ? (dark ? "bg-white text-ink" : "bg-ink text-paper") : dark ? "text-white/75 hover:bg-white/10" : "text-ink-2 hover:bg-surface"
          }`}
        >
          {i.label}
          {i.count !== undefined ? <span className={`tabular rounded-full px-1.5 text-[11px] ${value === i.id ? "bg-black/10" : "bg-black/5"}`}>{i.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, sub, tone = "accent" }: { label: string; value: ReactNode; sub?: string; tone?: "accent" | "soon" | "unknown" | "urgent" }) {
  const bar = { accent: "bg-accent", soon: "bg-soon", unknown: "bg-unknown", urgent: "bg-urgent" }[tone];
  return (
    <div className="pt-card relative overflow-hidden !py-4">
      <span aria-hidden className={`absolute inset-y-4 start-0 w-1 rounded-e-full ${bar}`} />
      <p className="text-[12.5px] text-ink-3">{label}</p>
      <p className="tabular mt-1 font-display text-[2rem] leading-none text-ink">{value}</p>
      {sub ? <p className="mt-1.5 text-[12.5px] text-ink-2">{sub}</p> : null}
    </div>
  );
}

/** A simple horizontal bar list for aggregate counts. */
export function Bars({ rows, max, unit = "" }: { rows: { label: string; n: number; note?: string; muted?: boolean }[]; max?: number; unit?: string }) {
  const m = max ?? Math.max(1, ...rows.map((r) => r.n));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
            <span className="text-ink">{r.label}</span>
            <span className="tabular text-ink-2">
              {r.n.toLocaleString("en")}
              {unit}
              {r.note ? <span className="ms-1.5 text-[12px] text-ink-3">{r.note}</span> : null}
            </span>
          </div>
          <span className="mt-1 block h-2 overflow-hidden rounded-full bg-zinc-100">
            <span className={`pt-grow block h-full rounded-full ${r.muted ? "bg-unknown-soft" : "bg-accent"}`} style={{ width: `${Math.max(2, (r.n / m) * 100)}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
