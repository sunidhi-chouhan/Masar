import type { ReactNode } from "react";

// The frame every onboarding stage shares, so the five steps read as one
// journey: the same eyebrow, title size, lead width and action row.

export function StageHead({ id, eyebrow, title, lead }: { id: string; eyebrow: string; title: string; lead?: ReactNode }) {
  return (
    <header>
      <p className="eyebrow">{eyebrow}</p>
      <h1 id={id} tabIndex={-1} className="display jr-title">
        {title}
      </h1>
      {lead ? <p className="jr-lead">{lead}</p> : null}
    </header>
  );
}

/** Back on the start side, the main action on the end side; follows the content, never pinned. */
export function StageActions({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`jr-actions ${className}`}>{children}</div>;
}

/**
 * Brings a new step into view and moves focus to its heading. On desktop the
 * journey scrolls inside <main> (the page itself never scrolls); on phones the
 * page scrolls. Either way, only when the top is out of view.
 */
export function showStep(focusId: string) {
  if (typeof window === "undefined") return;
  const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  const main = document.getElementById("main");
  if (main && main.scrollTop > 0) main.scrollTo({ top: 0, behavior });
  if (window.scrollY > 0) window.scrollTo({ top: 0, behavior });
  setTimeout(() => document.getElementById(focusId)?.focus({ preventScroll: true }), 60);
}
