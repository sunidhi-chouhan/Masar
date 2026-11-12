"use client";

import { useState } from "react";
import { t, type Lang, type Vars } from "@/lib/i18n";
import type { Sex } from "@/lib/model";
import { CHAPTERS, labelOf, visibleQuestions, type JAnswer, type JAnswers } from "@/lib/journey";
import { StageActions, showStep } from "./stage";
import { QuestionCard } from "./question-card";

// About you, as a conversation: one question at a time, each with why it is
// asked. Follow-ups appear only when an earlier answer makes them relevant.
// Everything here stays in this browser: nothing is sent to Masar until the
// person has chosen their permissions, and then only if they allow it.

export function QuestionsStep({
  sex,
  lang,
  answers,
  onAnswer,
  pos,
  setPos,
  onBack,
  onNext,
}: {
  sex: Sex;
  lang: Lang;
  answers: JAnswers;
  onAnswer: (id: string, value: JAnswer | null) => void;
  pos: string | null;
  setPos: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const tr = (text: string, vars?: Vars) => t(lang, text, vars);
  const visible = visibleQuestions(sex, answers);
  const order = [...visible.map((q) => q.id), "review"];
  const current = pos && order.includes(pos) ? pos : order[0];
  const idx = order.indexOf(current);
  const q = visible.find((x) => x.id === current);
  const [showSkipped, setShowSkipped] = useState(false);

  const moveTo = (id: string) => {
    setPos(id);
    showStep("jr-q-title");
  };
  const next = () => (idx >= order.length - 1 ? onNext() : moveTo(order[idx + 1]));
  const back = () => (idx === 0 ? onBack() : moveTo(order[idx - 1]));


  // Chapter progress: one line of text and one thin segmented bar.
  const chapterIndex = q ? CHAPTERS.findIndex((c) => c.id === q.chapter) : CHAPTERS.length;
  const inChapter = q ? visible.filter((x) => x.chapter === q.chapter) : [];
  const qNumber = q ? inChapter.findIndex((x) => x.id === q.id) + 1 : 0;
  const fill = (i: number) => (i < chapterIndex ? 100 : i > chapterIndex ? 0 : Math.max(8, ((qNumber - 1) / Math.max(1, inChapter.length)) * 100));

  return (
    <section className="jr-stage jq-stage jr-enter" aria-labelledby="stage-1">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="eyebrow outline-none" id="stage-1" tabIndex={-1}>
          {tr("About you")}
        </p>
        <p className="font-mono text-[12px] text-ink-3" aria-live="polite">
          {q
            ? `${String.fromCharCode(65 + chapterIndex)} · ${tr(CHAPTERS[chapterIndex].title)} · ${tr("{n} of {total}", { n: qNumber, total: inChapter.length })}`
            : tr("Check your answers")}
        </p>
      </div>
      <ol className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${CHAPTERS.length}, minmax(0, 1fr))` }} aria-label={tr("Chapters")}>
        {CHAPTERS.map((c, i) => (
          <li key={c.id} aria-current={i === chapterIndex ? "step" : undefined}>
            <span className="sr-only">
              {tr(c.title)}: {i < chapterIndex ? tr("done") : i === chapterIndex ? tr("current") : tr("waiting")}
            </span>
            <span aria-hidden className="block h-1 overflow-hidden rounded-full bg-rule">
              <span className="jr-progress block h-full rounded-full bg-accent" style={{ width: `${fill(i)}%` }} />
            </span>
          </li>
        ))}
      </ol>

      <div className="jq-body">
        <div key={current} className="jr-q">
          {q ? (
            <QuestionCard
              name={`jq-${q.id}`}
              title={tr(q.text)}
              why={tr(q.why)}
              whyLabel={tr("Why we ask")}
              kind={q.multi ? "multi" : "single"}
              options={q.options.map((o) => ({ value: o.value, label: tr(o.label), exclusive: o.exclusive }))}
              value={answers[q.id] as string | string[] | undefined}
              onChange={(next) => onAnswer(q.id, next)}
              foot={q.sensitive ? tr("This is a sensitive question. You can skip it, and your answer is only used as you choose.") : q.multi ? tr("Choose any that apply.") : null}
            />
          ) : (
            <div>
              <h1 id="jr-q-title" tabIndex={-1} className="display jr-qtitle jq-title">
                {tr("Check your answers")}
              </h1>
              <p className="jq-why text-[14.5px] leading-relaxed text-ink-2">
                {tr("Change anything before you continue. Skipped questions are fine: missing information is never counted against you. Nothing has left this device yet.")}
              </p>
              {(() => {
                const answered = visible.filter((x) => labelOf(x, answers[x.id]));
                const skipped = visible.filter((x) => !labelOf(x, answers[x.id]));
                const row = (x: (typeof visible)[number]) => {
                  const label = labelOf(x, answers[x.id]);
                  return (
                    <div key={x.id} className="flex min-w-0 items-center gap-3 border-b border-rule py-1">
                      <dt className="min-w-0 flex-1 truncate text-[13px] text-ink-3" title={tr(x.text)}>
                        {tr(x.text)}
                      </dt>
                      <dd className={`max-w-[45%] truncate text-[13.5px] ${label ? "font-medium text-ink" : "text-ink-3"}`}>
                        {label ? label.split(", ").map((l) => tr(l)).join(", ") : tr("Skipped")}
                      </dd>
                      <dd>
                        <button type="button" onClick={() => moveTo(x.id)} className="link min-h-[30px] text-[13px]">
                          {label ? tr("Edit") : tr("Answer")}
                          <span className="sr-only">: {tr(x.text)}</span>
                        </button>
                      </dd>
                    </div>
                  );
                };
                return (
                  // The same footprint as a question's answers; a long list scrolls inside it, so navigation never moves.
                  <div className="jq-answers jq-review" tabIndex={0} role="region" aria-label={tr("Your answers")}>
                    {answered.length ? <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">{answered.map(row)}</dl> : null}
                    {skipped.length ? (
                      <div className="mt-3">
                        <button type="button" onClick={() => setShowSkipped((v) => !v)} aria-expanded={showSkipped} className="link min-h-[32px] text-[13.5px]">
                          {tr(skipped.length === 1 ? "1 skipped question" : "{n} skipped questions", { n: skipped.length })} · {showSkipped ? tr("Hide") : tr("Show")}
                        </button>
                        {showSkipped ? <dl className="mt-1 grid grid-cols-1 gap-x-8 sm:grid-cols-2">{skipped.map(row)}</dl> : null}
                      </div>
                    ) : null}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      <StageActions className="jq-nav">
        <button type="button" onClick={back} className="btn btn-secondary">
          {tr("Back")}
        </button>
        {q ? (
          <button
            type="button"
            onClick={() => {
              onAnswer(q.id, null);
              next();
            }}
            className="min-h-[44px] px-3 text-[14.5px] font-medium text-ink-2 underline-offset-4 hover:underline"
          >
            {tr("Skip")}
          </button>
        ) : null}
        <button type="button" onClick={next} className="btn btn-primary ms-auto">
          {q ? tr("Continue") : tr("Continue to the quick check")}
        </button>
      </StageActions>
    </section>
  );
}
