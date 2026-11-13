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

/**
 * The landing page's menu below laptop width, where the section links don't
 * fit in the header. A panel drops under the header with the sections, the
 * other destinations and (as children) the language switch. Escape or a
 * choice closes it and returns focus to the button.
 */
export function LandingMenu({
  items,
  links,
  labels,
  children,
}: {
  items: [string, string][];
  links: { href: string; label: string; icon: "users" | "book" | "signIn" }[];
  labels: { open: string; close: string; sections: string };
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const close = useCallback((focus = true) => {
    setOpen(false);
    if (focus) button.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onResize = () => window.innerWidth >= 1024 && close(false);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      document.documentElement.style.overflow = "";
    };
  }, [open, close]);

  const go = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    close(false);
    target.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", href);
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls="landing-menu"
        aria-label={open ? labels.close : labels.open}
        onClick={() => (open ? close() : setOpen(true))}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink hover:bg-surface lg:hidden"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path className={`menu-line ${open ? "is-open-a" : ""}`} d="M4.5 8h15" />
          <path className={`menu-line ${open ? "is-open-b" : ""}`} d="M4.5 16h15" />
        </svg>
      </button>
      {open ? (
        <>
          <button type="button" aria-hidden tabIndex={-1} onClick={() => close()} className="landing-menu-scrim absolute inset-x-0 top-full z-30 h-[100svh] bg-ink/20 lg:hidden" />
          <div
            ref={panel}
            id="landing-menu"
            className="landing-menu absolute inset-x-0 top-full z-40 max-h-[calc(100svh-76px)] overflow-y-auto border-b border-rule bg-paper px-4 pb-6 pt-2 shadow-[0_24px_40px_-24px_rgb(28_27_24/0.35)] lg:hidden"
          >
            <nav aria-label={labels.sections}>
              <p className="eyebrow px-2 pb-1 pt-2">{labels.sections}</p>
              <ul>
                {items.map(([href, text], i) => (
                  <li key={href} className="landing-menu-item" style={{ ["--i" as string]: i }}>
                    <a href={href} onClick={(e) => go(e, href)} className="flex min-h-[52px] items-center justify-between gap-3 rounded-[14px] px-3 text-[17px] font-medium text-ink hover:bg-surface">
                      {text}
                      <svg viewBox="0 0 24 24" className="flip-rtl h-4 w-4 text-ink-3" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M9.5 6l6 6-6 6" />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <ul className="mt-3 grid gap-2 border-t border-rule pt-4 sm:grid-cols-2">
              {links.map((l, i) => (
                <li key={l.href} className="landing-menu-item" style={{ ["--i" as string]: items.length + i }}>
                  <a href={l.href} className={`flex min-h-[52px] items-center gap-3 rounded-[14px] px-3 text-[16px] font-semibold ${l.icon === "signIn" ? "bg-accent text-white" : "bg-surface text-ink ring-1 ring-rule"}`}>
                    <MenuIcon name={l.icon} />
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            {children ? <div className="mt-3 flex justify-center">{children}</div> : null}
          </div>
        </>
      ) : null}
    </>
  );
}

function MenuIcon({ name }: { name: "users" | "book" | "signIn" }) {
  const d = {
    users: "M9 11.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 19c1-3 3-4.5 5.5-4.5s4.5 1.5 5.5 4.5M15 6.2a3 3 0 0 1 0 5.6M17 14.8c1.7.6 2.9 2 3.5 4.2",
    book: "M5 5.5c2.5-.8 5-.5 7 1.2v12.8c-2-1.7-4.5-2-7-1.2zM19 5.5c-2.5-.8-5-.5-7 1.2v12.8c2-1.7 4.5-2 7-1.2z",
    signIn: "M13 5.5h4.5a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H13M4.5 12h10M11 8.5l3.5 3.5-3.5 3.5",
  }[name];
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 shrink-0 ${name === "signIn" ? "flip-rtl" : ""}`} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
