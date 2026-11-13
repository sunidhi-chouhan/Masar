"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "./dashboard/icons";

/**
 * The patient review's section bar on phones and tablets: one chip per
 * section, the one in view marked, and the bar scrolls to keep it visible.
 * On wide screens the page shows evidence and decision side by side, so the
 * bar is hidden there.
 */
export function ClinicJump({ items }: { items: { id: string; label: string; icon: IconName; badge?: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    const sections = items.map((i) => document.getElementById(i.id)).filter((x): x is HTMLElement => Boolean(x));
    const io = new IntersectionObserver(
      () => {
        const line = window.innerWidth >= 768 ? 150 : 200;
        let current = sections[0]?.id ?? "";
        for (const s of sections) if (s.getBoundingClientRect().top <= line) current = s.id;
        setActive(current);
      },
      { rootMargin: "-120px 0px -55% 0px", threshold: [0, 0.01, 1] },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [items]);

  useEffect(() => {
    const chip = bar.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    chip?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  return (
    <nav ref={bar} aria-label="Sections of this record" className="sticky top-[118px] z-20 -mx-4 mt-4 flex gap-1.5 overflow-x-auto border-b border-rule bg-paper/95 px-4 py-2 backdrop-blur-md [scrollbar-width:none] md:top-16 md:-mx-8 md:px-8 lg:hidden">
      {items.map((i) => (
        <a
          key={i.id}
          href={`#${i.id}`}
          data-id={i.id}
          aria-current={active === i.id ? "location" : undefined}
          className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-[13.5px] font-medium transition-colors ${
            active === i.id ? "bg-ink text-white" : "bg-surface text-ink-2 ring-1 ring-rule"
          }`}
        >
          <Icon name={i.icon} className="h-[18px] w-[18px]" />
          {i.label}
          {i.badge ? <span className={`rounded-full px-1.5 text-[11px] font-semibold ${active === i.id ? "bg-white/20" : "bg-amber-100 text-amber-800"}`}>{i.badge}</span> : null}
        </a>
      ))}
    </nav>
  );
}
