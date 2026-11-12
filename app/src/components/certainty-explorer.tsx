"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CERTAINTY } from "./editorial";
import type { Certainty } from "@/lib/certainty";

// One example statement at a time, with its certainty label beside it, and
// the six labels around it. Choosing a label shows its example and a one-line
// explanation. It steps through the labels on its own (only while visible,
// only if motion is allowed, and only until someone interacts), and works with
// keyboard (arrow keys, Home, End) and touch. Every example is illustrative.

/** Literal class names, so Tailwind generates them. Six labels: three each side of the example. */
const PLACE = [
  "lg:col-start-1 lg:row-start-1",
  "lg:col-start-1 lg:row-start-2",
  "lg:col-start-1 lg:row-start-3",
  "lg:col-start-3 lg:row-start-1",
  "lg:col-start-3 lg:row-start-2",
  "lg:col-start-3 lg:row-start-3",
];

export interface CertaintyItem {
  kind: Certainty;
  label: string;
  example: string;
  source: string;
  explain: string;
}

export function CertaintyExplorer({ items, exampleLabel, listLabel }: { items: CertaintyItem[]; exampleLabel: string; listLabel: string }) {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  // Step through the labels while the section is on screen and motion is welcome.
  useEffect(() => {
    if (!auto) return;
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    const timer = window.setInterval(() => {
      if (visible && !document.hidden) setActive((a) => (a + 1) % items.length);
    }, 3600);
    return () => {
      io.disconnect();
      window.clearInterval(timer);
    };
  }, [auto, items.length]);

  const choose = (i: number, focus = false) => {
    setAuto(false);
    setActive(i);
    if (focus) tabs.current[i]?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const next = { ArrowDown: 1, ArrowUp: -1, ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
    if (next) {
      e.preventDefault();
      choose((active + next + items.length) % items.length, true);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      choose(e.key === "Home" ? 0 : items.length - 1, true);
    }
  };

  const current = items[active];
  const c = CERTAINTY[current.kind];
  const half = Math.ceil(items.length / 2);

  // Wide screens: first half in the start column, second half in the end column, the example between them.
  const place = (i: number) => PLACE[i] ?? "";

  return (
    <div ref={root} className="cx relative">
      <div
        role="tablist"
        aria-label={listLabel}
        onKeyDown={onKey}
        className="cx-list grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-[13rem_1fr_13rem] lg:grid-rows-[repeat(3,minmax(118px,auto))] lg:gap-x-10 lg:gap-y-0"
      >
        {items.map((item, i) => {
          const on = i === active;
          const k = CERTAINTY[item.kind];
          return (
            <button
              key={item.kind}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`cx-tab-${item.kind}`}
              aria-selected={on}
              aria-controls="cx-panel"
              tabIndex={on ? 0 : -1}
              onClick={() => choose(i)}
              className={`cx-tab ${i < half ? "cx-tab--start" : "cx-tab--end"} ${place(i)} relative flex min-h-[48px] w-full items-center gap-3 self-center rounded-full border px-4 text-start transition-colors duration-300 ${
                on ? "is-on border-accent bg-surface shadow-[var(--shadow-lift)]" : "border-rule hover:border-rule-strong hover:bg-surface"
              }`}
              style={{ ["--i" as string]: i }}
            >
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${on ? "bg-accent-soft" : "bg-zinc-100"} ${k.ink}`}>
                <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden overflow="visible" className={`tag-anim tag-${item.kind}`}>
                  {k.glyph}
                </svg>
              </span>
              <span className={`font-mono text-[12px] font-medium uppercase tracking-[0.08em] ${on ? k.ink : "text-ink-2"}`}>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div
        id="cx-panel"
        role="tabpanel"
        aria-labelledby={`cx-tab-${current.kind}`}
        aria-live="polite"
        className="cx-panel mt-5 overflow-hidden rounded-[22px] border border-rule bg-surface p-6 shadow-[var(--shadow-lift)] sm:p-8 lg:absolute lg:inset-y-0 lg:start-[calc(13rem+2.5rem)] lg:end-[calc(13rem+2.5rem)] lg:mt-0 lg:flex lg:flex-col"
      >
        <p className="eyebrow">{exampleLabel}</p>
        <div key={current.kind} className="cx-swap lg:flex-1">
          <div className="mt-5 flex items-start gap-4">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full bg-zinc-100 ${c.ink}`}>
              <svg width="26" height="26" viewBox="0 0 12 12" aria-hidden overflow="visible" className={`tag-anim tag-${current.kind}`}>
                {c.glyph}
              </svg>
            </span>
            <p className="display min-h-[3.2em] text-[1.4rem] leading-snug text-ink sm:text-[1.65rem]">{current.example}</p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-rule pt-4">
            <span className={`font-mono text-[12px] font-semibold uppercase tracking-[0.08em] ${c.ink}`}>{current.label}</span>
            <span className="text-[13px] text-ink-3">{current.source}</span>
          </div>
          <p className="mt-2 text-[15.5px] leading-relaxed text-ink-2">{current.explain}</p>
        </div>
        <div className="mt-6 flex gap-1.5" aria-hidden>
          {items.map((item, i) => (
            <span key={item.kind} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i === active ? "bg-accent" : "bg-rule"}`} />
          ))}
        </div>
      </div>

      {/* Without JavaScript, every example is listed. */}
      <noscript>
        <ul className="mt-6 divide-y divide-rule border-y border-rule">
          {items.map((item) => (
            <li key={item.kind} className="py-3 text-[15px]">
              <span className="font-mono text-[12px] uppercase">{item.label}</span> · {item.example} <span className="text-ink-3">{item.explain}</span>
            </li>
          ))}
        </ul>
      </noscript>
    </div>
  );
}
