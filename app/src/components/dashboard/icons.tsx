import type { ReactNode } from "react";
import type { Topic } from "@/lib/dashboard";

// Small line icons, drawn for Masar: one per topic and a few for actions.
// Decorative: every icon sits next to a text label.

const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const TOPIC: Record<Topic, ReactNode> = {
  plans: (
    <>
      <rect x="4" y="5.5" width="16" height="14" rx="3" {...P} />
      <path d="M8 3.5v4M16 3.5v4M4 10h16" {...P} />
      <path d="M9 14.5l2 2 4-4" {...P} />
    </>
  ),
  cycles: (
    <>
      <circle cx="12" cy="12" r="7.5" {...P} />
      <path d="M12 4.5a7.5 7.5 0 0 1 7.5 7.5" {...P} strokeWidth={2.4} />
      <circle cx="12" cy="12" r="2" {...P} />
    </>
  ),
  reserve: (
    <>
      <circle cx="12" cy="12" r="7.5" {...P} />
      <circle cx="12" cy="12" r="3.2" {...P} />
      <circle cx="16.5" cy="8" r="1" fill="currentColor" />
    </>
  ),
  sperm: (
    <>
      <circle cx="8" cy="9" r="3" {...P} />
      <path d="M10.4 10.8c2 1.6 3 3.2 4.2 4.4s2.6 1.6 4.4 1.3" {...P} />
    </>
  ),
  metabolic: (
    <>
      <path d="M12 4c3 3.6 5 6.3 5 9a5 5 0 0 1-10 0c0-2.7 2-5.4 5-9z" {...P} />
      <path d="M10 14.5h4" {...P} />
    </>
  ),
  conditions: (
    <>
      <rect x="5" y="4" width="14" height="16" rx="3" {...P} />
      <path d="M12 8.5v6M9 11.5h6" {...P} />
    </>
  ),
  family: (
    <>
      <circle cx="8.5" cy="8" r="2.5" {...P} />
      <circle cx="16" cy="9.5" r="2" {...P} />
      <path d="M3.5 19c.6-3.4 2.6-5 5-5s4.4 1.6 5 5M13.5 19c.4-2.4 1.6-3.6 3-3.6s2.6 1.2 3 3.6" {...P} />
    </>
  ),
  life: (
    <>
      <path d="M12 19s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 1.8C19 14.6 12 19 12 19z" {...P} />
    </>
  ),
};

export function TopicIcon({ topic, className = "h-5 w-5" }: { topic: Topic; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {TOPIC[topic]}
    </svg>
  );
}

const ICON = {
  spark: <path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8z" {...P} />,
  chart: (
    <>
      <path d="M4 19.5h16" {...P} />
      <path d="M6 15l4-4.5 3 3 5-6" {...P} />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8" {...P} />
      <path d="M14.8 9.2l-1.6 4-4 1.6 1.6-4z" {...P} />
    </>
  ),
  chat: <path d="M5 6.5h14v9H10l-4 3v-3H5z" {...P} />,
  doc: (
    <>
      <path d="M7 3.5h7l4 4v13H7z" {...P} />
      <path d="M14 3.5v4h4M9.5 12h6M9.5 15.5h6" {...P} />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5l7 2.6v5.4c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6.1z" {...P} />
      <path d="M9 12l2 2 4-4" {...P} />
    </>
  ),
  question: (
    <>
      <circle cx="12" cy="12" r="8" {...P} />
      <path d="M9.8 9.6a2.3 2.3 0 0 1 4.4.8c0 1.6-2.2 2-2.2 3.4" {...P} />
      <circle cx="12" cy="16.6" r=".6" fill="currentColor" />
    </>
  ),
  clipboard: (
    <>
      <rect x="6" y="5" width="12" height="15.5" rx="2.5" {...P} />
      <path d="M9.5 3.5h5v3h-5zM9 11h6M9 14.5h4" {...P} />
    </>
  ),
  book: <path d="M5 5.5c2.5-.8 4.8-.6 7 .9 2.2-1.5 4.5-1.7 7-.9v13c-2.5-.8-4.8-.6-7 .9-2.2-1.5-4.5-1.7-7-.9zM12 6.4v13" {...P} />,
  flask: (
    <>
      <path d="M9.5 3.5h5M10.5 3.5v5L6 17.5a2 2 0 0 0 1.8 3h8.4a2 2 0 0 0 1.8-3l-4.5-9v-5" {...P} />
      <path d="M8 15h8" {...P} />
    </>
  ),
  plug: (
    <>
      <path d="M9 4v4M15 4v4M7 8h10v3a5 5 0 0 1-10 0z" {...P} />
      <path d="M12 16v4" {...P} />
    </>
  ),
  arrow: <path d="M5 12h13M13 7l5 5-5 5" {...P} />,
  check: <path d="M5.5 12.5l4 4 9-9" {...P} />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8" {...P} />
      <path d="M12 7.5V12l3 2" {...P} />
    </>
  ),
};

export type IconName = keyof typeof ICON;

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} rtl-flip-${name === "arrow" ? "yes" : "no"}`} aria-hidden>
      {ICON[name]}
    </svg>
  );
}
