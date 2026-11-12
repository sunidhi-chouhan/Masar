"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type Lang, type Vars } from "@/lib/i18n";
import type { Sex } from "@/lib/model";
import { CHAPTERS, labelOf, visibleQuestions, type JAnswers, type JQuestion } from "@/lib/journey";
import { finishEditing, saveJourneyAnswer } from "@/server/journey-actions";

// About me: every answer from the journey, chapter by chapter, each one
// changeable in place. Saved as it changes; the path is rebuilt on Done.

export function AboutEditor({ sex, lang, initial }: { sex: Sex; lang: Lang; initial: JAnswers }) {
  const tr = (text: string, vars?: Vars) => t(lang, text, vars);
  const router = useRouter();
  const [answers, setAnswers] = useState<JAnswers>(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<false | "save" | "consent">(false);
  const [leaving, setLeaving] = useState(false);
  const visible = visibleQuestions(sex, answers);

  const save = (q: JQuestion, value: string) => {
    let next: string | string[] | null = value;
    if (q.multi) {
      const cur = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : [];
      const opt = q.options.find((o) => o.value === value)!;
      next = cur.includes(value) ? cur.filter((x) => x !== value) : opt.exclusive ? [value] : [...cur.filter((x) => !q.options.find((o) => o.value === x)?.exclusive), value];
    }
    setAnswers((a) => {
      const n = { ...a };
      if (next === null || (Array.isArray(next) && !next.length)) delete n[q.id];
      else n[q.id] = next;
      return n;
    });
    setError(false);
    saveJourneyAnswer(q.id, next)
      .then((r) => !r.ok && setError("consent"))
      .catch(() => setError("save"));
  };

  const done = async () => {
    setLeaving(true);
    try {
      await finishEditing();
      router.push("/me");
    } catch {
      setError("save");
      setLeaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
      {CHAPTERS.map((c, ci) => {
        const qs = visible.filter((q) => q.chapter === c.id);
        if (!qs.length) return null;
        const answered = qs.filter((q) => labelOf(q, answers[q.id])).length;
        return (
          <section key={c.id} id={`chapter-${c.id}`} aria-labelledby={`ch-${c.id}`} className="dash-card scroll-mt-28">
            <div className="flex items-start gap-3">
              <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-ink font-mono text-[13px] text-paper">
                {String.fromCharCode(65 + ci)}
              </span>
              <div className="min-w-0 flex-1">
                <h2 id={`ch-${c.id}`} className="text-[16.5px] font-semibold text-ink">
                  {tr(c.title)}
                </h2>
                <p className="text-[12.5px] text-ink-3">{tr("{n} of {total} answered", { n: answered, total: qs.length })}</p>
              </div>
            </div>
            <span aria-hidden className="mt-3 block h-1 overflow-hidden rounded-full bg-zinc-100">
              <span className="block h-full rounded-full bg-accent" style={{ width: `${(answered / qs.length) * 100}%` }} />
            </span>
            <ul className="divide-y divide-rule">
              {qs.map((q) => {
                const label = labelOf(q, answers[q.id]);
                const isOpen = open === q.id;
                return (
                  <li key={q.id} className="py-3">
                    <div className="flex flex-wrap items-start gap-x-4 gap-y-1">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] text-ink-3">{tr(q.text)}</span>
                        <span className={`mt-0.5 flex flex-wrap gap-1.5 text-[14px] ${label ? "font-medium text-ink" : "text-ink-3"}`}>
                          {label
                            ? label.split(", ").map((l) => (
                                <span key={l} className="rounded-full bg-accent-soft px-2.5 py-0.5 text-accent">
                                  {tr(l)}
                                </span>
                              ))
                            : tr("Skipped")}
                        </span>
                      </span>
                      <button type="button" aria-expanded={isOpen} aria-controls={`edit-${q.id}`} onClick={() => setOpen(isOpen ? null : q.id)} className="link min-h-[40px] text-[13.5px]">
                        {isOpen ? tr("Close") : tr("Change")}
                        <span className="sr-only">: {tr(q.text)}</span>
                      </button>
                    </div>
                    {isOpen ? (
                      <fieldset id={`edit-${q.id}`} className="jr-q mt-3" aria-label={tr(q.text)}>
                        <p className="text-[13.5px] text-ink-3">
                          {tr("Why we ask")}: {tr(q.why)}
                        </p>
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {q.options.map((o) => {
                            const v = answers[q.id];
                            const checked = Array.isArray(v) ? v.includes(o.value) : v === o.value;
                            return (
                              <label key={o.value} className="cursor-pointer">
                                <input type={q.multi ? "checkbox" : "radio"} name={`ed-${q.id}`} checked={checked} onChange={() => save(q, o.value)} className="peer sr-only" />
                                <span className="flex min-h-[46px] items-center rounded-[12px] border border-rule-strong bg-surface px-3.5 text-[14.5px] text-ink peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:font-semibold">
                                  {tr(o.label)}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      </div>
      {error ? (
        <p role="alert" className="text-[14px] text-urgent">
          {error === "consent" ? tr("Not saved: “Your answers” is switched off. Switch it on in My data to keep changes.") : tr("Couldn't save. Please try again.")}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button type="button" onClick={done} disabled={leaving} className="btn btn-primary disabled:opacity-60">
          {leaving ? `${tr("Updating your path")}…` : tr("Done, update my path")}
        </button>
      </div>
    </div>
  );
}
