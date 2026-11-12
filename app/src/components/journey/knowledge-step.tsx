"use client";

import { useState } from "react";
import { t, type Lang, type Vars } from "@/lib/i18n";
import type { Sex } from "@/lib/model";
import { beliefItems, WORRY_LABELS } from "@/lib/checks";
import { EXTRA_STATEMENT } from "@/lib/journey";
import { StageActions, StageHead, showStep } from "./stage";

// The quick check, one statement at a time. Once the person answers, a short
// note on what the evidence says appears under it and Continue unlocks. There
// is no score, rank or result. The first three statements are the existing
// evaluation items (kept so the before-and-after measure still works); the
// fourth is educational only. Then one optional question about worry, and the
// way to permissions. Like About you, everything stays in this browser until
// the person chooses what Masar may keep.

const CHOICES = [
  ["true", "True"],
  ["false", "False"],
  ["unsure", "Not sure"],
] as const;

export function KnowledgeStep({
  sex,
  lang,
  answers,
  setAnswers,
  worry,
  setWorry,
  onBack,
  onNext,
}: {
  sex: Sex;
  lang: Lang;
  answers: (string | null)[];
  setAnswers: (fn: (a: (string | null)[]) => (string | null)[]) => void;
  worry: number | null;
  setWorry: (w: number | null) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const tr = (text: string, vars?: Vars) => t(lang, text, vars);
  const items = [...beliefItems(sex), EXTRA_STATEMENT];
  const WORRY = items.length; // the optional last screen
  const [idx, setIdx] = useState(() => {
    const firstOpen = answers.findIndex((a, i) => i < items.length && !a);
    return firstOpen === -1 ? WORRY : firstOpen;
  });

  const item = idx < items.length ? items[idx] : null;
  const a = item ? answers[idx] : null;

  const moveTo = (n: number) => {
    setIdx(n);
    showStep("kc-q");
  };

  const choose = (value: string) => setAnswers((x) => x.map((y, j) => (j === idx ? value : y)));

  return (
    <section className="jr-stage jr-enter" aria-labelledby="stage-2">
      <StageHead
        id="stage-2"
        eyebrow={tr("Quick check")}
        title={tr("Let's explore what you already know.")}
        lead={tr("These questions help us understand where clearer explanations may be useful. There are no wrong answers, and nothing is scored.")}
      />

      {/* Progress: answered statements can be reopened directly. */}
      <div className="kc-progress flex items-center gap-4">
        <p className="shrink-0 font-mono text-[12px] text-ink-3" aria-live="polite">
          {item ? tr("Question {n} of {total}", { n: idx + 1, total: items.length }) : tr("One last question · optional")}
        </p>
        <ol className="flex flex-1 gap-1.5" aria-label={tr("Quick check progress")}>
          {items.map((it, i) => {
            const done = !!answers[i];
            const state = i === idx ? "current" : done ? "done" : "todo";
            return (
              <li key={it.text} className="flex-1">
                <button
                  type="button"
                  disabled={!done || i === idx}
                  onClick={() => moveTo(i)}
                  aria-label={tr("Question {n} of {total}", { n: i + 1, total: items.length }) + (done ? ` · ${tr("answered")}` : "")}
                  aria-current={i === idx ? "step" : undefined}
                  className="flex h-6 w-full items-center enabled:cursor-pointer"
                >
                  <span className={`kc-dot kc-dot--${state}`} />
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div key={idx} className="jr-q mt-5">
        {item ? (
          <fieldset aria-labelledby="kc-q" aria-describedby="kc-note">
            <p id="kc-q" tabIndex={-1} className="display text-[clamp(1.4rem,2.9vw,1.85rem)] leading-[1.25] text-ink outline-none">
              {tr(item.text)}
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2.5 sm:max-w-lg">
              {CHOICES.map(([value, label], i) => (
                <label key={value} className="jr-opt" style={{ ["--i" as string]: i }}>
                  <input type="radio" name={`kc-${idx}`} value={value} checked={a === value} onChange={() => choose(value)} className="sr-only" />
                  <span className="kc-choice">
                    {a === value ? (
                      <svg width="13" height="13" viewBox="0 0 12 12" aria-hidden>
                        <path d="M2.5 6.2l2.3 2.3 4.7-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                    {tr(label)}
                  </span>
                </label>
              ))}
            </div>
            <div id="kc-note" aria-live="polite">
              {a ? (
                <div className="jr-note mt-5 flex gap-3 rounded-[16px] border border-rule bg-surface px-4 py-3.5 sm:px-5">
                  <span aria-hidden className="mt-[3px] grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-bold text-accent">
                    i
                  </span>
                  <p className="text-[14.5px] leading-relaxed text-ink-2">
                    <span className="font-semibold text-ink">
                      {tr("What the evidence says")}: {item.correct === "true" ? tr("True") : tr("False")}.
                    </span>{" "}
                    {tr(item.explain)}
                  </p>
                </div>
              ) : null}
            </div>
          </fieldset>
        ) : (
          <fieldset aria-labelledby="kc-q">
            <p id="kc-q" tabIndex={-1} className="display text-[clamp(1.4rem,2.9vw,1.85rem)] leading-[1.25] text-ink outline-none">
              {tr("Right now, how worried do you feel about your reproductive health?")}
            </p>
            <p className="mt-2 text-[14px] text-ink-3">{tr("Optional. It helps Masar see whether clearer information makes a difference to you.")}</p>
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {WORRY_LABELS.map((label, i) => (
                <label key={label} className="jr-opt" style={{ ["--i" as string]: i }}>
                  <input type="radio" name="worry" value={i + 1} checked={worry === i + 1} onChange={() => setWorry(i + 1)} className="sr-only" />
                  <span className="kc-choice px-2 text-center text-[14.5px]">{tr(label)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      <StageActions>
        <button type="button" onClick={() => (idx === 0 ? onBack() : moveTo(idx - 1))} className="btn btn-secondary">
          {tr("Back")}
        </button>
        {item ? (
          <>
            {!a ? <span className="hidden text-[13.5px] text-ink-3 sm:inline">{tr("Choose an answer to continue")}</span> : null}
            <button type="button" onClick={() => moveTo(idx + 1)} disabled={!a} className="btn btn-primary ms-auto disabled:cursor-not-allowed disabled:opacity-50">
              {tr("Continue")}
            </button>
          </>
        ) : (
          <button type="button" onClick={onNext} className="btn btn-primary ms-auto">
            {tr("Continue to your permissions")}
          </button>
        )}
      </StageActions>
    </section>
  );
}
