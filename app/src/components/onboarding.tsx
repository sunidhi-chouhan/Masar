"use client";

import { use, useEffect, useState } from "react";
import { browser } from "react-dom";
import { t, type Lang, type Vars } from "@/lib/i18n";
import type { Sex } from "@/lib/model";
import { visibleQuestions, type JAnswer, type JAnswers } from "@/lib/journey";
import { beginJourney, commitJourney, saveJourneyStep } from "@/server/journey-actions";
import { ConsentStep, type ConsentItem } from "./journey/consent-step";
import { QuestionsStep } from "./journey/questions-step";
import { KnowledgeStep } from "./journey/knowledge-step";
import { FinalStep } from "./journey/final-step";
import { PreparingStep } from "./journey/preparing-step";
import { StageActions, StageHead, showStep } from "./journey/stage";

// The first-visit journey, in five stages:
//   Welcome → About you → Quick check → Your permissions → Your path.
// About you and the quick check happen in this browser only: the answers are
// kept in this tab's session storage (so a reload doesn't lose them) and are
// sent to Masar when the person leaves the permissions step, and only if they
// switched "Your answers" on. The server checks that permission again. No
// finding, count or hint appears anywhere in this journey.

const STAGES = ["Welcome", "About you", "Quick check", "Your permissions", "Your path"];
const KNOWLEDGE_COUNT = 4;

export interface JourneyInitial {
  step: number;
  startedAt: string | null;
  /** answers already stored with permission (a returning person), else empty */
  answers: JAnswers;
  knowledge: (string | null)[];
  worry: number | null;
}

interface Draft {
  answers: JAnswers;
  pos: string | null;
  knowledge: (string | null)[];
  worry: number | null;
}

const PREFIX = "masar-journey:";
const draftKey = (personId: string, startedAt: string) => `${PREFIX}${personId}:${startedAt}`;

function readDraft(key: string): Draft | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<Draft>;
    return {
      answers: d.answers && typeof d.answers === "object" ? d.answers : {},
      pos: typeof d.pos === "string" ? d.pos : null,
      knowledge: Array.from({ length: KNOWLEDGE_COUNT }, (_, i) => (Array.isArray(d.knowledge) && typeof d.knowledge[i] === "string" ? d.knowledge[i] : null)),
      worry: typeof d.worry === "number" ? d.worry : null,
    };
  } catch {
    return null;
  }
}

/** Removes this person's drafts other than `keep` (e.g. from a journey that was reset). */
function pruneDrafts(personId: string, keep: string | null) {
  try {
    for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
      const k = window.sessionStorage.key(i);
      if (k?.startsWith(`${PREFIX}${personId}:`) && k !== keep) window.sessionStorage.removeItem(k);
    }
  } catch {
    // storage unavailable: nothing to remove
  }
}

export function Onboarding({
  personId,
  firstName,
  sex,
  lang = "en",
  initial,
  consent,
  aiMode,
}: {
  personId: string;
  firstName: string;
  sex: Sex;
  lang?: Lang;
  initial: JourneyInitial;
  consent: ConsentItem[];
  aiMode: "live" | "mock" | "off";
}) {
  // Rendered in the browser only: the draft lives in this tab's session storage, which the server can't see.
  use(browser("The onboarding draft is kept in this tab's session storage."));
  const tr = (text: string, vars?: Vars) => t(lang, text, vars);
  const [startedAt, setStartedAt] = useState(initial.startedAt);
  const [draft, setDraft] = useState<Draft>(() => {
    const fromServer: Draft = {
      answers: initial.answers,
      pos: null,
      knowledge: Array.from({ length: KNOWLEDGE_COUNT }, (_, i) => initial.knowledge[i] ?? null),
      worry: initial.worry,
    };
    return (initial.startedAt && readDraft(draftKey(personId, initial.startedAt))) || fromServer;
  });
  // Never resume straight into "Your path": the person comes back to their permissions first.
  const [step, setStep] = useState(Math.min(initial.step, 3));
  const [permitted, setPermitted] = useState(false);
  const [phase, setPhase] = useState<"final" | "prepare">("final");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const selfOn = consent.find((c) => c.key === "self")?.on ?? false;

  // Keep the draft in this tab only, so a reload or a step back never loses it.
  useEffect(() => {
    if (!startedAt) return;
    const key = draftKey(personId, startedAt);
    try {
      window.sessionStorage.setItem(key, JSON.stringify(draft));
    } catch {
      // storage unavailable: the journey still works, it just won't survive a reload
    }
  }, [draft, startedAt, personId]);
  useEffect(() => {
    pruneDrafts(personId, startedAt ? draftKey(personId, startedAt) : null);
  }, [personId, startedAt]);

  const go = (n: number) => {
    setStep(n);
    if (n === 4) setPhase("final");
    void saveJourneyStep(n).catch(() => {});
    showStep(`stage-${n}`);
  };

  const begin = () => {
    go(1);
    beginJourney()
      .then((r) => setStartedAt(r.startedAt))
      .catch(() => {});
  };

  const setAnswer = (id: string, value: JAnswer | null) =>
    setDraft((d) => {
      const answers = { ...d.answers };
      if (value === null || (Array.isArray(value) && !value.length)) delete answers[id];
      else answers[id] = value;
      // Follow-ups that no longer apply are dropped, so nothing hidden lingers.
      const visible = new Set(visibleQuestions(sex, answers).map((q) => q.id));
      for (const k of Object.keys(answers)) if (!visible.has(k)) delete answers[k];
      return { ...d, answers };
    });

  // Leaving the permissions step: answers go to Masar only if "Your answers" is on.
  const toPath = async () => {
    setSaving(true);
    setSaveError(false);
    try {
      const r = await commitJourney(selfOn ? { answers: draft.answers, knowledge: draft.knowledge, worry: draft.worry } : { answers: {}, knowledge: [], worry: null });
      setPermitted(r.stored);
      go(4);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const clearDraft = () => pruneDrafts(personId, null);

  return (
    <div className="journey-root mx-auto flex w-full max-w-3xl flex-1 flex-col">
      {/* Five stages: done, current, upcoming. */}
      <nav aria-label={tr("Journey progress")} className="jr-progress-nav">
        <ol className="flex items-start gap-1.5 sm:gap-2">
          {STAGES.map((s, i) => (
            <li key={s} className="flex-1" aria-current={i === step ? "step" : undefined}>
              <span className={`jr-stage-bar block h-1 rounded-full ${i < step ? "bg-accent" : i === step ? "bg-accent/60" : "bg-rule"}`} />
              <span className={`mt-2 hidden items-center gap-1.5 text-[12.5px] sm:flex ${i === step ? "font-semibold text-ink" : i < step ? "text-accent" : "text-ink-3"}`}>
                {i < step ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                    <path d="M2.5 6.2l2.3 2.3 4.7-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
                {tr(s)}
                <span className="sr-only">{i < step ? ` (${tr("done")})` : i === step ? ` (${tr("current")})` : ""}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-[13px] text-ink-3 sm:hidden">{tr("Step {n} of {total}: {title}", { n: step + 1, total: STAGES.length, title: tr(STAGES[step]) })}</p>
      </nav>

      {step === 0 ? (
        <section className="jr-stage jr-enter" aria-labelledby="stage-0">
          <StageHead
            id="stage-0"
            eyebrow={tr("Welcome to Masar")}
            title={tr("{name}, your reproductive health deserves a clearer picture.", { name: firstName })}
            lead={tr("Masar helps you understand the factors that may influence your reproductive potential, recognize changes over time, and prepare for informed conversations with healthcare professionals.")}
          />
          <ul className="jr-welcome mt-7 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            {[
              "This is not a diagnosis.",
              "Masar does not calculate a fertility score.",
              "You stay in control of your information.",
              "Your answers stay on this device until you choose what Masar may keep.",
              "You can skip any question.",
              "About five minutes, depending on what you share.",
            ].map((line, i) => (
              <li key={line} className="jr-item flex gap-3 border-t border-rule py-3 text-[15px] text-ink" style={{ ["--i" as string]: i }}>
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {tr(line)}
              </li>
            ))}
          </ul>
          <StageActions>
            <button type="button" onClick={begin} className="btn btn-primary ms-auto">
              {tr("Begin my journey")}
            </button>
          </StageActions>
        </section>
      ) : null}

      {step === 1 ? (
        <QuestionsStep
          sex={sex}
          lang={lang}
          answers={draft.answers}
          onAnswer={setAnswer}
          pos={draft.pos}
          setPos={(pos) => setDraft((d) => ({ ...d, pos }))}
          onBack={() => go(0)}
          onNext={() => go(2)}
        />
      ) : null}
      {step === 2 ? (
        <KnowledgeStep
          sex={sex}
          lang={lang}
          answers={draft.knowledge}
          setAnswers={(fn) => setDraft((d) => ({ ...d, knowledge: fn(d.knowledge) }))}
          worry={draft.worry}
          setWorry={(worry) => setDraft((d) => ({ ...d, worry }))}
          onBack={() => {
            setDraft((d) => ({ ...d, pos: "review" }));
            go(1);
          }}
          onNext={() => go(3)}
        />
      ) : null}
      {step === 3 ? <ConsentStep items={consent} lang={lang} aiMode={aiMode} saving={saving} saveError={saveError} onBack={() => go(2)} onNext={toPath} /> : null}
      {step === 4 ? (
        permitted && phase === "final" ? (
          <FinalStep lang={lang} onBack={() => go(3)} onDone={() => setPhase("prepare")} />
        ) : (
          <PreparingStep lang={lang} onBack={() => go(3)} onComplete={clearDraft} />
        )
      ) : null}
    </div>
  );
}
