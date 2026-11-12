"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Marks its element once it scrolls into view (`data-inview="true"`), and keeps
 * `data-visible` current so looping motion can pause while off-screen.
 *
 * The attributes are written straight to the DOM, not through React state, so
 * nothing re-renders and no animation restarts. The server renders
 * `data-inview="false"`; CSS only hides content in that state when motion is
 * allowed, and a <noscript> rule on the page shows everything without JS.
 */
export function InView({
  as: Tag = "div",
  className,
  children,
  threshold = 0.25,
  ...rest
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  threshold?: number;
} & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      if (el) el.dataset.inview = "true";
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        el.dataset.visible = entry.isIntersecting ? "true" : "false";
        if (entry.isIntersecting) el.dataset.inview = "true";
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return (
    <Tag ref={ref} data-inview="false" className={className} {...rest}>
      {children}
    </Tag>
  );
}
