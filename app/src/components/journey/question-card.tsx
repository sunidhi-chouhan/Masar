"use client";

import type { ReactNode } from "react";

// One question, always laid out the same way, whatever it asks:
//
//   heading        reserved for two lines
//   why we ask     reserved for two lines
//   answers        a fixed two-column grid, four rows reserved (up to eight
//                  answers), every card the same height; or a text box
//                  filling that same area
//   helper line    reserved for one line (multi-select hint, sensitive note,
//                  where the question came from, characters left)
//
// The reservations apply on desktop, where the journey is one screen; on
// phones everything flows naturally. Nothing is clipped: text longer than a
// reservation wraps and the area grows.

export type QuestionKind = "single" | "multi" | "text";

export interface QuestionOption {
  value: string;
  label: string;
  /** choosing it clears the others (e.g. "None") */
  exclusive?: boolean;
}

export function QuestionCard({
  title,
  why,
  whyLabel,
  kind,
  options = [],
  value,
  onChange,
  name,
  foot,
  textLabel,
  maxLength = 400,
}: {
  title: ReactNode;
  why?: ReactNode;
  whyLabel: string;
  kind: QuestionKind;
  options?: QuestionOption[];
  value: string | string[] | undefined;
  onChange: (next: string | string[] | null) => void;
  /** a name for the input group, unique per question */
  name: string;
  foot?: ReactNode;
  /** accessible label for a text answer */
  textLabel?: string;
  maxLength?: number;
}) {
  const selected = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];

  const pick = (o: QuestionOption) => {
    if (kind === "single") return onChange(o.value);
    const has = selected.includes(o.value);
    const next = has ? selected.filter((x) => x !== o.value) : o.exclusive ? [o.value] : [...selected.filter((x) => !options.find((p) => p.value === x)?.exclusive), o.value];
    onChange(next.length ? next : null);
  };

  return (
    <fieldset className="jq" aria-labelledby="jr-q-title" aria-describedby={why ? "jr-q-why" : undefined}>
      <h1 id="jr-q-title" tabIndex={-1} className="display jr-qtitle jq-title">
        {title}
      </h1>
      <p id="jr-q-why" className="jq-why flex gap-2 text-[14.5px] leading-relaxed text-ink-2">
        {why ? (
          <>
            <span aria-hidden className="mt-[3px] grid h-4 w-4 shrink-0 place-items-center rounded-full border border-accent text-[10px] font-semibold text-accent">
              i
            </span>
            <span>
              <span className="font-medium text-ink">{whyLabel}: </span>
              {why}
            </span>
          </>
        ) : null}
      </p>

      {kind === "text" ? (
        <div className="jq-answers">
          <textarea
            aria-label={textLabel}
            name={name}
            maxLength={maxLength}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value ? e.target.value : null)}
            className="jq-text block w-full resize-none rounded-[14px] border border-rule-strong bg-surface px-4 py-3 text-[15px] leading-relaxed text-ink outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
          />
        </div>
      ) : (
        <div className="jq-answers jq-grid">
          {options.map((o, i) => {
            const checked = selected.includes(o.value);
            return (
              <label key={o.value} className="jr-opt jq-card-wrap" style={{ ["--i" as string]: i }}>
                <input type={kind === "multi" ? "checkbox" : "radio"} name={name} value={o.value} checked={checked} onChange={() => pick(o)} className="peer sr-only" />
                <span className="jq-card peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
                  <span aria-hidden className={`grid h-5 w-5 shrink-0 place-items-center border-2 ${kind === "multi" ? "rounded-[5px]" : "rounded-full"} ${checked ? "border-accent bg-accent" : "border-rule-strong"}`}>
                    {checked ? (
                      kind === "multi" ? (
                        <svg width="11" height="11" viewBox="0 0 12 12">
                          <path d="M2.5 6.2l2.3 2.3 4.7-5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      )
                    ) : null}
                  </span>
                  <span className="min-w-0">{o.label}</span>
                </span>
              </label>
            );
          })}
        </div>
      )}

      <div className="jq-foot text-[13px] leading-snug text-ink-3">{foot}</div>
    </fieldset>
  );
}
