"use client";

import { useEffect, useState } from "react";
import { t, type Lang, type Vars } from "@/lib/i18n";
import { journeyFollowUps, saveFollowUpAnswer, type FollowUpResult } from "@/server/journey-actions";
import { StageActions, showStep } from "./stage";
import { QuestionCard } from "./question-card";

// Two final questions, asked only after the person has chosen permissions and
// only if "Your answers" is on. Written by Gemini when the assistant is
// allowed (checked on the server), otherwise chosen by Masar from a fixed bank.

const SOURCE_LABEL = {
  ai: "Suggested with Gemini",
  mock: "Suggested with Gemini · demo mock, no live model call",
  fallback: "Chosen by Masar around what you've shared",
} as const;

export function FinalStep({ lang, onBack, onDone }: { lang: Lang; onBack: () => void; onDone: () => void }) {
  const tr = (text: string, vars?: Vars) => t(lang, text, vars);
  const [fu, setFu] = useState<FollowUpResult | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [i, setI] = useState(0);
  const [attempt, setAttempt] = useState(0);

  // Load once per attempt. Under React's development double-run, the first run is cancelled before it calls the server.
  useEffect(() => {
    let live = true;
    Promise.resolve()
      .then(() => (live ? journeyFollowUps() : null))
      .then((r) => {
        if (!r) return;
        if (!live) return;
        if (!r.questions.length) return onDone();
        setFu(r);
        setAnswers(r.answers);
        setState("ready");
      })
      .catch(() => live && setState("error"));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const fq = fu?.questions[i];
  const fx = (s: string) => (fu?.source === "ai" ? s : tr(s));
  const go = (n: number) => {
    if (n < 0) return onBack();
    if (!fu || n >= fu.questions.length) return onDone();
    setI(n);
    showStep("jr-q-title");
  };
  const choose = (value: string | null) => {
    if (!fq) return;
    setAnswers((a) => {
      const n = { ...a };
      if (value) n[fq.id] = value;
      else delete n[fq.id];
      return n;
    });
    void saveFollowUpAnswer(fq.id, value).catch(() => {});
  };

  return (
    <section className="jr-stage jq-stage jr-enter" aria-labelledby="stage-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="eyebrow outline-none" id="stage-4" tabIndex={-1}>
          {tr("Personalized follow-up")}
        </p>
        <p className="font-mono text-[12px] text-ink-3" aria-live="polite">
          {tr("{n} of {total}", { n: Math.min(i + 1, 2), total: 2 })}
        </p>
      </div>
      {/* The same header as About you: one line of text and a thin segmented bar. */}
      <ol className="mt-3 grid grid-cols-2 gap-1.5" aria-hidden>
        {[0, 1].map((k) => (
          <li key={k}>
            <span className="block h-1 overflow-hidden rounded-full bg-rule">
              <span className="jr-progress block h-full rounded-full bg-accent" style={{ width: k < i ? "100%" : k === i ? "50%" : "0%" }} />
            </span>
          </li>
        ))}
      </ol>

      <div className="jq-body">
        {state === "ready" && fq ? (
          <div className="jq-intro">
            <h2 className="display jq-intro-title">{i === 0 ? tr("A little more context") : tr("One last thing...")}</h2>
            <p className="jq-intro-lead">
              {tr("Based on what you've shared, we'd like to understand a little more to make your path relevant to you.")}
            </p>
            <p className="jq-intro-note">
              <span aria-hidden className={`inline-block h-1.5 w-1.5 rounded-full ${fu!.source === "fallback" ? "bg-ink-3" : "bg-date"}`} />
              {tr(SOURCE_LABEL[fu!.source])}
            </p>
          </div>
        ) : null}
        <div key={`${state}-${i}`} className="jr-q">
          {state === "loading" ? (
            <div role="status">
              <h1 id="jr-q-title" tabIndex={-1} className="display jr-qtitle jq-title">
                {tr("Two final questions, chosen around what you've shared.")}
              </h1>
              <p className="jq-why flex items-center gap-3 text-[15px] text-ink-2">
                <span className="jr-spinner" aria-hidden />
                {tr("Choosing them now")}…
              </p>
            </div>
          ) : state === "error" ? (
            <div role="alert">
              <h1 id="jr-q-title" tabIndex={-1} className="display jr-qtitle jq-title">
                {tr("We couldn't prepare the last two questions.")}
              </h1>
              <p className="jq-why text-[15px] text-ink-2">{tr("Nothing is lost. Try again, or continue without them.")}</p>
            </div>
          ) : fq ? (
            <QuestionCard
              name={`fu-${fq.id}`}
              title={fx(fq.text)}
              why={fx(fq.why)}
              whyLabel={tr("Why we ask")}
              kind="single"
              options={fq.options.map((o) => ({ value: o.value, label: fx(o.label) }))}
              value={answers[fq.id]}
              onChange={(next) => choose(typeof next === "string" ? next : null)}
            />
          ) : null}
        </div>
      </div>

      <StageActions className="jq-nav">
        <button type="button" onClick={() => go(i - 1)} className="btn btn-secondary">
          {tr("Back")}
        </button>
        {state === "error" ? (
          <>
            <button
              type="button"
              onClick={() => {
                setState("loading");
                setAttempt((a) => a + 1);
              }}
              className="min-h-[44px] px-3 text-[14.5px] font-medium text-ink-2 underline-offset-4 hover:underline"
            >
              {tr("Try again")}
            </button>
            <button type="button" onClick={onDone} className="btn btn-primary ms-auto">
              {tr("Continue without them")}
            </button>
          </>
        ) : (
          <>
            {fq ? (
              <button
                type="button"
                onClick={() => {
                  choose(null);
                  go(i + 1);
                }}
                className="min-h-[44px] px-3 text-[14.5px] font-medium text-ink-2 underline-offset-4 hover:underline"
              >
                {tr("Skip")}
              </button>
            ) : null}
            <button type="button" onClick={() => go(i + 1)} disabled={state === "loading"} className="btn btn-primary ms-auto disabled:opacity-60">
              {i === 1 ? tr("Prepare my path") : tr("Continue")}
            </button>
          </>
        )}
      </StageActions>
    </section>
  );
}
