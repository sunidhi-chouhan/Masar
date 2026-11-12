"use client";

import { useRef } from "react";

// Everything on record, in date order, on one line: results, checks, uploads
// and requests. Scrolls sideways (with the buttons, the keyboard or a swipe);
// years are marked on the line. Opens at the most recent end.

export interface TimelineItem {
  at: string;
  year: string;
  date: string;
  kind: "lab" | "device" | "healthAge" | "malaffi" | "self" | "check" | "request" | "report";
  kindLabel: string;
  title: string;
  detail?: string;
}

const TONE: Record<TimelineItem["kind"], string> = {
  lab: "bg-accent text-white",
  report: "bg-accent-strong text-white",
  device: "bg-indigo-300 text-ink",
  healthAge: "bg-soon-soft text-soon",
  malaffi: "bg-unknown-soft text-unknown",
  self: "bg-zinc-100 text-ink-2",
  check: "bg-date text-ink",
  request: "bg-ink text-paper",
};

export function HealthTimeline({ items, label, labels }: { items: TimelineItem[]; label: string; labels: { earlier: string; later: string } }) {
  const scroller = useRef<HTMLDivElement>(null);
  const move = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollBy({ left: dir * (rtl ? -1 : 1) * el.clientWidth * 0.8, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  return (
    <div className="relative">
      <div className="mb-3 flex justify-end gap-2">
        <button type="button" onClick={() => move(-1)} className="btn btn-secondary !min-h-[36px] !px-3.5 text-[13px]">
          {labels.earlier}
        </button>
        <button type="button" onClick={() => move(1)} className="btn btn-secondary !min-h-[36px] !px-3.5 text-[13px]">
          {labels.later}
        </button>
      </div>
      <div
        ref={(el) => {
          scroller.current = el;
          // Open at the latest events (the end of the line).
          if (el && !el.dataset.placed) {
            el.dataset.placed = "1";
            const rtl = getComputedStyle(el).direction === "rtl";
            el.scrollLeft = rtl ? -el.scrollWidth : el.scrollWidth;
          }
        }}
        tabIndex={0}
        role="region"
        aria-label={label}
        className="timeline-scroll overflow-x-auto pb-3 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <ol className="relative flex min-w-max gap-3 pt-9">
          {/* the line */}
          <span aria-hidden className="absolute inset-x-0 top-[18px] h-px bg-rule-strong" />
          {items.map((it, i) => {
            const newYear = i === 0 || items[i - 1].year !== it.year;
            return (
              <li key={`${it.at}-${i}`} className="timeline-item relative w-[13.5rem] shrink-0" style={{ ["--i" as string]: Math.min(i, 12) }}>
                {newYear ? (
                  <span className="absolute -top-9 start-0 rounded-full bg-paper px-1 font-mono text-[11.5px] font-semibold text-ink-2">{it.year}</span>
                ) : null}
                <span aria-hidden className="absolute -top-[22px] start-4 h-2.5 w-2.5 rounded-full border-2 border-paper bg-accent" />
                <div className="h-full rounded-[16px] border border-rule bg-surface p-3.5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE[it.kind]}`}>{it.kindLabel}</span>
                  <p className="mt-2 text-[14px] font-medium leading-snug text-ink">{it.title}</p>
                  <p className="mt-1 text-[12.5px] text-ink-3">
                    {it.date}
                    {it.detail ? ` · ${it.detail}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
