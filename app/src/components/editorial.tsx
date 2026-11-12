import type { ReactNode } from "react";
import type { Urgency } from "@/lib/model";
import { t, type Lang } from "@/lib/i18n";

// The building blocks of the editorial design. Server components only.

import type { Certainty } from "@/lib/certainty";
export type { Certainty };

export const CERTAINTY: Record<Certainty, { label: string; ink: string; glyph: ReactNode; explain: string }> = {
  fact: {
    label: "Fact",
    ink: "text-ink",
    explain: "On record, from a source you shared.",
    glyph: <circle cx="6" cy="6" r="3.2" fill="currentColor" />,
  },
  said: {
    label: "You said",
    ink: "text-ink-2",
    explain: "What you told Masar.",
    glyph: <path d="M2.5 3.5h7v4.2H5.6L3.4 9.6V7.7h-.9z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />,
  },
  trend: {
    label: "Trend",
    ink: "text-soon",
    explain: "A change bigger than Masar's published rule for normal ups and downs.",
    glyph: <path d="M1.8 8.8l3-3 2 2 3.4-4.2M7.4 3.6h2.8v2.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />,
  },
  steady: {
    label: "Steady",
    ink: "text-accent",
    explain: "Within normal ups and downs between tests.",
    glyph: <path d="M1.8 4.6c1.4-1 2.8 1 4.2 0s2.8-1 4.2 0M1.8 7.8c1.4-1 2.8 1 4.2 0s2.8-1 4.2 0" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />,
  },
  evidence: {
    label: "Evidence",
    ink: "text-accent",
    explain: "What a published guideline says, about people in general, not a prediction about you.",
    glyph: <path d="M2.4 2.6h3.2c.6 0 .9.4.9.9v6c0-.5-.4-.9-.9-.9H2.4zM9.6 2.6H6.4c-.6 0-.9.4-.9.9v6c0-.5.4-.9.9-.9h3.2z" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />,
  },
  unknown: {
    label: "Unknown",
    ink: "text-unknown",
    explain: "Masar doesn't have this, or this measure can't tell it.",
    glyph: <circle cx="6" cy="6" r="3.8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeDasharray="2 1.6" />,
  },
};

/** The small label naming a statement's certainty. Colour, glyph and word, so never colour alone. */
export function Tag({ kind, lang, animated = false }: { kind: Certainty; lang: Lang; animated?: boolean }) {
  const c = CERTAINTY[kind];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] ${c.ink}`} title={t(lang, c.explain)}>
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className={animated ? `tag-anim tag-${kind}` : undefined} overflow="visible">
        {c.glyph}
      </svg>
      {t(lang, c.label)}
    </span>
  );
}

/**
 * One sentence of interpretation. The certainty, source and date sit in a
 * margin rail on wide screens and above the sentence on narrow ones.
 */
export function Statement({
  kind,
  lang,
  meta,
  children,
}: {
  kind: Certainty;
  lang: Lang;
  /** source · date, already translated */
  meta?: string;
  children: ReactNode;
}) {
  return (
    <li className="grid gap-1 py-3.5 sm:grid-cols-[9.5rem_1fr] sm:gap-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 sm:flex-col sm:items-start sm:pt-1">
        <Tag kind={kind} lang={lang} />
        {meta ? <span className="text-[12px] text-ink-3">{meta}</span> : null}
      </div>
      <div className="text-[16px] leading-relaxed text-ink">
        <span className="sr-only">{t(lang, CERTAINTY[kind].label)}: </span>
        {children}
      </div>
    </li>
  );
}

export function Statements({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <ul className="divide-y divide-rule border-y border-rule" aria-label={label}>
      {children}
    </ul>
  );
}

export const TIMING: Record<Urgency, { label: string; ink: string; soft: string }> = {
  urgent: { label: "Before treatment starts", ink: "text-urgent", soft: "bg-urgent-soft" },
  soon: { label: "Worth discussing soon", ink: "text-soon", soft: "bg-soon-soft" },
  routine: { label: "At your next routine visit", ink: "text-accent", soft: "bg-accent-soft" },
};

/** How soon to act: the one coloured element on a screen, always in words. */
export function Timing({ urgency, lang }: { urgency: Urgency; lang: Lang }) {
  const x = TIMING[urgency];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] font-semibold ${x.soft} ${x.ink}`}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      <span className="sr-only">{t(lang, "Suggested timing")}: </span>
      {t(lang, x.label)}
    </span>
  );
}

/** Says who wrote a block of text: Masar's rules and copy, or the assistant. */
export function ProvenanceNote({ from, lang }: { from: "ai" | "masar"; lang: Lang }) {
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-3">
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${from === "ai" ? "bg-date" : "bg-ink-3"}`} />
      {from === "ai" ? t(lang, "Written by Masar's assistant (Google Gemini) from your record. Check with your doctor.") : t(lang, "Masar's own words")}
    </p>
  );
}

/** A section opening: mono label, serif headline, optional standfirst. */
export function SectionHead({ label, title, body, id }: { label?: string; title: ReactNode; body?: ReactNode; id?: string }) {
  return (
    <header className="mb-6">
      {label ? <p className="eyebrow">{label}</p> : null}
      <h2 id={id} className="display mt-2 text-[clamp(1.7rem,3.2vw,2.3rem)] leading-[1.12] text-ink">
        {title}
      </h2>
      {body ? <p className="measure mt-3 text-[16px] leading-relaxed text-ink-2">{body}</p> : null}
    </header>
  );
}
