"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";

// The landing page's header and section navigation.
// - The header sticks once you scroll, gaining a quiet background and hairline.
// - Links arrive in turn; a soft indicator slides to the section in view
//   (scroll-spy), marked aria-current="location".
// - Clicking scrolls smoothly (instantly with reduced motion), updates the
//   address, and moves keyboard focus to the section.

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function StickyHeader({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    const first = requestAnimationFrame(on);
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      cancelAnimationFrame(first);
      window.removeEventListener("scroll", on);
    };
  }, []);
  return (
    <div data-scrolled={scrolled} className="landing-header sticky top-0 z-40">
      {children}
    </div>
  );
}

export function LandingNav({ items, label }: { items: [string, string][]; label: string }) {
  const [active, setActive] = useState<string | null>(null);
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);
  const links = useRef<Record<string, HTMLAnchorElement | null>>({});
  const nav = useRef<HTMLElement>(null);

  /** Marks a link current and slides the indicator under it (or hides it). */
  const mark = useCallback((href: string | null) => {
    setActive(href);
    const el = href ? links.current[href] : null;
    setBar(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
  }, []);

  // Which section is in view: the last one whose top has passed a line a third of the way down.
  useEffect(() => {
    const ids = items.map(([href]) => href.slice(1));
    const sections = ids.map((id) => document.getElementById(id)).filter((x): x is HTMLElement => Boolean(x));
    const io = new IntersectionObserver(
      () => {
        const line = window.innerHeight * 0.33;
        let current: string | null = null;
        for (const s of sections) if (s.getBoundingClientRect().top <= line) current = `#${s.id}`;
        // Past the last section's bottom, nothing is current.
        const last = sections.at(-1);
        if (last && last.getBoundingClientRect().bottom < line) current = null;
        mark(current);
      },
      { rootMargin: "0px 0px -60% 0px", threshold: [0, 0.01, 0.5, 1] },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [items, mark]);

  const go = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", href);
    // Keyboard and screen-reader users land in the section they chose.
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    mark(href);
  };

  return (
    <nav ref={nav} aria-label={label} className="landing-nav relative hidden items-center gap-1 lg:flex">
      <span aria-hidden className={`landing-nav-bar ${bar ? "is-on" : ""}`} style={bar ? { left: bar.left, width: bar.width } : undefined} />
      {items.map(([href, text], i) => (
        <a
          key={href}
          ref={(el) => {
            links.current[href] = el;
          }}
          href={href}
          onClick={(e) => go(e, href)}
          aria-current={active === href ? "location" : undefined}
          className={`landing-nav-link relative rounded-full px-3 py-2 text-[14px] transition-colors ${active === href ? "text-ink" : "text-ink-2 hover:text-ink"}`}
          style={{ ["--i" as string]: i }}
        >
          {text}
        </a>
      ))}
    </nav>
  );
}
