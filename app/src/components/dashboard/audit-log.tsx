"use client";

import { useState } from "react";

// The access log, filterable: every choice the person made and every look,
// allowed or blocked. Newest first, grouped by day.

export interface AuditEntry {
  at: string;
  day: string;
  time: string;
  who: string;
  what: string;
  allowed: boolean;
  group: "you" | "doctor" | "assistant" | "masar";
}

export function AuditLog({
  entries,
  labels,
}: {
  entries: AuditEntry[];
  labels: { all: string; you: string; doctor: string; assistant: string; blocked: string; allowed: string; blockedOne: string; empty: string; filter: string; more: string };
}) {
  const [filter, setFilter] = useState<"all" | "you" | "doctor" | "assistant" | "blocked">("all");
  const [limit, setLimit] = useState(25);
  const shown = entries.filter((e) => (filter === "all" ? true : filter === "blocked" ? !e.allowed : e.group === filter));
  const days = [...new Set(shown.slice(0, limit).map((e) => e.day))];
  const tabs = [
    ["all", labels.all, entries.length],
    ["you", labels.you, entries.filter((e) => e.group === "you").length],
    ["doctor", labels.doctor, entries.filter((e) => e.group === "doctor").length],
    ["assistant", labels.assistant, entries.filter((e) => e.group === "assistant").length],
    ["blocked", labels.blocked, entries.filter((e) => !e.allowed).length],
  ] as const;

  return (
    <div>
      <div role="group" aria-label={labels.filter} className="flex flex-wrap gap-2">
        {tabs.map(([id, label, n]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => {
              setFilter(id);
              setLimit(25);
            }}
            className={`inline-flex min-h-[36px] items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-colors ${
              filter === id ? "border-ink bg-ink text-paper" : "border-rule-strong text-ink-2 hover:border-ink-3"
            }`}
          >
            {label}
            <span className={`tabular rounded-full px-1.5 text-[11.5px] ${filter === id ? "bg-white/15" : "bg-zinc-100"}`}>{n}</span>
          </button>
        ))}
      </div>
      {shown.length ? (
        <div className="mt-4 space-y-5" aria-live="polite">
          {days.map((day) => (
            <section key={day}>
              <h3 className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-ink-3">{day}</h3>
              <ol className="mt-2 divide-y divide-rule rounded-[16px] border border-rule bg-surface">
                {shown
                  .slice(0, limit)
                  .filter((e) => e.day === day)
                  .map((e, i) => (
                    <li key={e.at + i} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-[14px]">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${e.allowed ? "bg-accent-soft text-accent" : "bg-urgent-soft text-urgent"}`}
                      >
                        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
                        {e.allowed ? labels.allowed : labels.blockedOne}
                      </span>
                      <span className="font-medium text-ink">{e.who}</span>
                      <span className="min-w-0 flex-1 text-ink-2">{e.what}</span>
                      <time dateTime={e.at} className="text-[12.5px] text-ink-3">
                        {e.time}
                      </time>
                    </li>
                  ))}
              </ol>
            </section>
          ))}
          {shown.length > limit ? (
            <button type="button" onClick={() => setLimit((l) => l + 25)} className="btn btn-secondary">
              {labels.more}
            </button>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-[14px] text-ink-3">{labels.empty}</p>
      )}
    </div>
  );
}
