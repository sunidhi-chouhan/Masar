"use client";

import { useState, useSyncExternalStore } from "react";

// Questions to bring, and things to bring: ticked ones are remembered on this
// device only (nothing is sent), and the ticked questions can be copied as a
// note. A convenience, not a record.

const subscribe = () => () => {};

export function PrepareList({
  storageKey,
  items,
  copyable = false,
  labels,
  dark = false,
}: {
  storageKey: string;
  items: string[];
  copyable?: boolean;
  labels: { copy: string; copied: string; heading: string };
  dark?: boolean;
}) {
  const saved = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.localStorage.getItem(storageKey) ?? "";
      } catch {
        return "";
      }
    },
    () => "",
  );
  const [ticked, setTicked] = useState<string[] | null>(null);
  const current: string[] = ticked ?? (saved ? (JSON.parse(saved) as string[]) : copyable ? items.slice(0, 3) : []);
  const [copied, setCopied] = useState(false);

  const toggle = (x: string) => {
    const next = current.includes(x) ? current.filter((y) => y !== x) : [...current, x];
    setTicked(next);
    setCopied(false);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // storage unavailable: still works for this visit
    }
  };

  return (
    <div>
      <ul className="space-y-1.5">
        {items.map((x) => {
          const on = current.includes(x);
          return (
            <li key={x}>
              <label className={`flex cursor-pointer items-start gap-3 rounded-[12px] px-2.5 py-2 transition-colors ${dark ? "hover:bg-white/5" : "hover:bg-zinc-50"}`}>
                <input type="checkbox" checked={on} onChange={() => toggle(x)} className="peer sr-only" />
                <span
                  aria-hidden
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${
                    on ? "border-accent bg-accent text-white" : dark ? "border-white/35" : "border-rule-strong"
                  }`}
                >
                  {on ? (
                    <svg width="11" height="11" viewBox="0 0 12 12">
                      <path d="M2.5 6.2l2.3 2.3 4.7-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </span>
                <span className={`text-[14.5px] leading-snug ${dark ? "text-white/90" : "text-ink"}`}>{x}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {copyable ? (
        <button
          type="button"
          disabled={!current.length}
          onClick={() => {
            const text = [labels.heading, ...items.filter((x) => current.includes(x)).map((q, i) => `${i + 1}. ${q}`)].join("\n");
            navigator.clipboard?.writeText(text).then(() => setCopied(true));
          }}
          className={`mt-3 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors disabled:opacity-50 ${dark ? "bg-white text-ink hover:bg-paper" : "bg-ink text-paper hover:bg-accent"}`}
        >
          {copied ? labels.copied : labels.copy}
        </button>
      ) : null}
    </div>
  );
}
