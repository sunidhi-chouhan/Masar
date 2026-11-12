"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Lang, type Vars } from "@/lib/i18n";
import { finishKnown, finishReview, finishSave, finishSummary } from "@/server/journey-actions";
import { StageActions, StageHead } from "./stage";

// Preparing the path. Each line is one real server step, run in order; a line
// is ticked only when its step has returned, with what it actually did. There
// are no timed delays. Each step has a time limit: if one fails or runs past
// it, the screen says so and can retry from that step. When all four have
// returned, the page moves to My Path.
//
// The run starts from an effect. In development React runs effects twice
// (mount, clean up, mount); the first run yields once before calling anything,
// so its cleanup cancels it and only the second run reaches the server. (An
// earlier version guarded with a "started" ref instead, which made the second
// run skip itself after the first was cancelled: the screen stayed at 0/4.)

type Result = string;

class StepTimeout extends Error {}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new StepTimeout()), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

export function PreparingStep({ lang, onBack, onComplete }: { lang: Lang; onBack: () => void; onComplete: () => void }) {
  const tr = (text: string, vars?: Vars) => t(lang, text, vars);
  const router = useRouter();
  const [done, setDone] = useState<Result[]>([]);
  const [failedAt, setFailedAt] = useState<number | null>(null);
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const startFrom = useRef(0);

  const steps: { label: string; limit: number; run: () => Promise<Result> }[] = [
    {
      label: "Bringing your information together",
      limit: 20_000,
      run: async () => {
        const r = await finishSave();
        if (!r.permitted) return tr("Your answers stayed on this device, as you chose");
        return tr(r.answered === 1 ? "1 answer saved" : "{n} answers saved", { n: r.answered });
      },
    },
    {
      label: "Reviewing your reproductive-health context",
      limit: 20_000,
      run: async () => {
        const r = await finishReview();
        return r.findings
          ? tr(r.findings === 1 ? "Masar's published rules found 1 thing worth a conversation" : "Masar's published rules found {n} things worth a conversation", { n: r.findings })
          : tr("Masar's published rules found nothing that needs a conversation right now");
      },
    },
    {
      label: "Identifying what is known and what is still missing",
      limit: 20_000,
      run: async () => {
        const r = await finishKnown();
        return tr("{known} known · {missing} still missing", { known: r.known, missing: r.missing });
      },
    },
    {
      label: "Preparing your personalized next steps",
      // The assistant has 45 seconds before Masar writes the summary itself.
      limit: 60_000,
      run: async () => {
        const r = await finishSummary();
        return tr(r.source === "ai" ? "Summary written by Gemini, checked by Masar" : r.source === "mock" ? "Summary by the Gemini demo mock, checked by Masar" : "Summary written by Masar");
      },
    },
  ];

  useEffect(() => {
    let live = true;
    let fallback: ReturnType<typeof setTimeout> | undefined;
    const from = startFrom.current;
    (async () => {
      await Promise.resolve();
      if (!live) return;
      for (let i = from; i < steps.length; i++) {
        try {
          const r = await withTimeout(steps[i].run(), steps[i].limit);
          if (!live) return;
          setDone((d) => {
            const n = [...d];
            n[i] = r;
            return n;
          });
        } catch (e) {
          if (!live) return;
          setSlow(e instanceof StepTimeout);
          setFailedAt(i);
          return;
        }
      }
      if (!live) return;
      // Everything is saved: show the path itself. If the refresh hasn't replaced this screen shortly (the journey runs on /me), reload it.
      onComplete();
      router.refresh();
      fallback = setTimeout(() => window.location.reload(), 4000);
    })();
    return () => {
      live = false;
      if (fallback) clearTimeout(fallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const retry = () => {
    startFrom.current = failedAt ?? 0;
    setFailedAt(null);
    setSlow(false);
    setAttempt((a) => a + 1);
  };

  const doneCount = done.filter(Boolean).length;
  const complete = doneCount === steps.length;
  const busy = failedAt === null && !complete;
  const R = 62;
  const C = 2 * Math.PI * R;

  return (
    <section className="jr-stage jr-enter" aria-labelledby="stage-4">
      {/* Centred between the progress bar and the footer, so the page is balanced rather than top-heavy. */}
      <div className="my-auto pb-4">
        <StageHead
          id="stage-4"
          eyebrow={tr("Your path")}
          title={complete ? tr("Your path is ready.") : tr("Preparing your path")}
          lead={tr("Each step below is something Masar is actually doing with what you chose to share.")}
        />

        <div className="mt-9 flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-12">
          {/* The ring fills only as each real step returns; the faint orbit shows activity while one is running. */}
          <div className={`relative h-[112px] w-[112px] shrink-0 sm:h-[148px] sm:w-[148px] ${busy ? "prep-ring--busy" : ""}`} aria-hidden>
            <svg viewBox="0 0 148 148" className="h-full w-full -rotate-90">
              <circle cx="74" cy="74" r={R} fill="none" strokeWidth="6" className="prep-ring-track" />
              <circle cx="74" cy="74" r={R} fill="none" strokeWidth="6" className="prep-ring-fill" strokeDasharray={C} strokeDashoffset={C * (1 - doneCount / steps.length)} />
              {busy ? <circle cx="74" cy="74" r={R + 9} fill="none" strokeWidth="2" className="prep-ring-orbit" strokeDasharray={`${C * 0.16} ${C * 2}`} /> : null}
            </svg>
            <span className="absolute inset-0 grid place-items-center text-center">
              {complete ? (
                <svg width="34" height="34" viewBox="0 0 14 14" className="text-accent">
                  <path d="M3 7.4l2.6 2.6 5.4-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span>
                  <span className="display block text-[1.9rem] leading-none text-ink sm:text-[2.3rem]" dir="ltr">
                    {doneCount}/{steps.length}
                  </span>
                  <span className="mt-1 block text-[11.5px] text-ink-3">{tr("steps done")}</span>
                </span>
              )}
            </span>
          </div>

          <ol className="prep-steps min-w-0 flex-1" aria-live="polite">
            {steps.map((s, i) => {
              const state = done[i] ? "done" : failedAt === i ? "failed" : failedAt === null && doneCount === i ? "active" : "waiting";
              return (
                <li key={s.label} className={`prep-step prep-step--${state}`}>
                  <span aria-hidden className="prep-mark">
                    {state === "done" ? (
                      <svg width="13" height="13" viewBox="0 0 14 14">
                        <path d="M3 7.4l2.6 2.6 5.4-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : state === "active" ? (
                      <span className="jr-spinner !h-3 !w-3" />
                    ) : state === "failed" ? (
                      "!"
                    ) : (
                      <span className="font-mono text-[11px]">{i + 1}</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1 pt-[3px]">
                    <span className="prep-label block text-[16px] leading-snug">{tr(s.label)}…</span>
                    {done[i] ? <span className="prep-result mt-1 block text-[14px] text-ink-2">{done[i]}</span> : null}
                    {state === "failed" ? (
                      <span className="mt-1 block text-[14px] text-urgent">
                        {slow ? tr("This is taking longer than it should. Nothing you entered is lost.") : tr("This step didn't complete. Nothing you entered is lost.")}
                      </span>
                    ) : null}
                    <span className="sr-only">{state === "done" ? tr("done") : state === "active" ? tr("in progress") : state === "failed" ? tr("failed") : tr("waiting")}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {failedAt !== null ? (
          <StageActions>
            <button type="button" onClick={onBack} className="btn btn-secondary">
              {tr("Back")}
            </button>
            <button type="button" onClick={retry} className="btn btn-primary ms-auto">
              {tr("Try again")}
            </button>
          </StageActions>
        ) : complete ? (
          <p className="jr-note mt-8 text-[14.5px] text-ink-2" role="status">
            {tr("Opening your path")}…
          </p>
        ) : null}
      </div>
    </section>
  );
}
