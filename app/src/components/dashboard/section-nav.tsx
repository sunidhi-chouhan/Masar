"use client";

import { useEffect, useState } from "react";

// The dashboard's sections, one tap away and following the reader: the
// current section is highlighted as it scrolls past. Plain links underneath,
// so it works without JavaScript and with the keyboard.

export function SectionNav({ items, label }: { items: { id: string; label: string }[]; label: string }) {
  const [current, setCurrent] = useState(items[0]?.id);

  useEffect(() => {
    // The current section is the last one whose top has passed just below the nav.
    let frame = 0;
    const update = () => {
      frame = 0;
      let at = items[0]?.id;
      for (const i of items) {
        const el = document.getElementById(i.id);
        if (el && el.getBoundingClientRect().top <= 150) at = i.id;
      }
      // At the very bottom, the last section is current even if it is short.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) at = items[items.length - 1]?.id;
      setCurrent((c) => (c === at ? c : at));
    };
    const onScroll = () => {
      if (!frame) frame = window.setTimeout(update, 60);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.clearTimeout(frame);
    };
  }, [items]);

  return (
    <nav aria-label={label} className="dash-nav sticky top-16 z-20 -mx-4 mb-8 border-b border-rule bg-paper/90 px-4 backdrop-blur-md md:-mx-8 md:px-8">
      <ol className="flex gap-1 overflow-x-auto py-2.5 [scrollbar-width:none]">
        {items.map((i, n) => (
          <li key={i.id} className="shrink-0">
            <a
              href={`#${i.id}`}
              aria-current={current === i.id ? "location" : undefined}
              className={`flex min-h-[38px] items-center gap-2 rounded-full px-3.5 text-[13.5px] font-medium transition-colors ${
                current === i.id ? "bg-ink text-paper" : "text-ink-2 hover:bg-surface"
              }`}
            >
              <span className={`font-mono text-[11px] ${current === i.id ? "text-paper/70" : "text-ink-3"}`}>{String(n + 1).padStart(2, "0")}</span>
              {i.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
