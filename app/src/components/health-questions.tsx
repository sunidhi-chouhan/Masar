"use client";

import type { Sex } from "@/lib/model";
import { questionsFor, type Answers, type Question } from "@/lib/profile";
import { t, type Lang, type Vars } from "@/lib/i18n";

// Shown in three short groups rather than one long list.
const GROUPS: { title: string; body: string; ids: string[] }[] = [
  { title: "Your plans", body: "So Masar knows what matters to you.", ids: ["plans", "partner", "pregnantBefore", "fatheredBefore"] },
  { title: "Your health", body: "Things that can affect fertility, now or later.", ids: ["cycles", "symptoms", "familyMenopause", "maleHistory", "steroids", "conditions"] },
  { title: "Daily life", body: "Things you can change, if you want to.", ids: ["smoking", "heat", "sleep", "stress", "activity"] },
];

/** Why each question is asked, said honestly: some answers are context only and raise nothing. */
const WHY: Record<string, string> = {
  plans: "So the options Masar shows match what you want, and when.",
  partner: "Context only: it shapes how things are worded. It doesn't raise any finding.",
  pregnantBefore: "Context only, for you and your doctor. It doesn't raise any finding.",
  fatheredBefore: "Context only, for you and your doctor. It doesn't raise any finding.",
  cycles: "Cycles that are often irregular are worth a routine check.",
  symptoms: "Very painful or heavy periods are worth checking; some causes are easier to manage when found early.",
  familyMenopause: "Early menopause in a mother or sister can make timing worth discussing earlier.",
  conditions: "Some conditions are best managed before trying for a pregnancy.",
  maleHistory: "Some past problems can affect sperm; a simple test can give an early start.",
  steroids: "Testosterone and steroids can switch off sperm production, often for months.",
  heat: "Sperm are made best a little below body temperature.",
  smoking: "Smoking affects eggs and sperm, and stopping helps.",
  sleep: "Everyday context you can change. It doesn't raise any finding.",
  stress: "Everyday context you can change. It doesn't raise any finding.",
  activity: "Everyday context you can change. It doesn't raise any finding.",
};

function QuestionCard({ q, current, lang }: { q: Question; current: Answers[string] | undefined; lang: Lang }) {
  const tr = (text: string, vars?: Vars) => t(lang, text, vars);
  const why = WHY[q.id];
  return (
    <fieldset className="py-6" aria-describedby={why ? `why-${q.id}` : undefined}>
      <legend className="float-start w-full text-[17px] font-medium text-ink">{tr(q.text)}</legend>
      {why ? (
        <p id={`why-${q.id}`} className="clear-both pt-1 text-[13.5px] text-ink-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent">{tr("Why we ask")}</span> · {tr(why)}
        </p>
      ) : null}
      {q.multi ? <p className="mt-1 text-[13px] text-ink-3">{tr("Tick any that apply, or leave blank.")}</p> : null}
      <div className="clear-both mt-3 flex flex-wrap gap-2">
        {q.options.map((o) => {
          const checked = Array.isArray(current) ? current.includes(o.value) : current === o.value;
          return (
            <label key={o.value} className="cursor-pointer">
              <input type={q.multi ? "checkbox" : "radio"} name={`q_${q.id}`} value={o.value} defaultChecked={checked} className="peer sr-only" />
              <span className="flex min-h-[44px] items-center rounded-full border border-rule-strong px-4 text-[14.5px] text-ink-2 transition-colors peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:font-semibold peer-checked:text-accent">
                {tr(o.label)}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** The health questions as tappable choices. Field names are `q_<id>`. */
export function HealthQuestions({ sex, defaults, lang = "en" }: { sex: Sex; defaults: Answers; lang?: Lang }) {
  const tr = (text: string, vars?: Vars) => t(lang, text, vars);
  const questions = questionsFor(sex);
  const placed = new Set(GROUPS.flatMap((g) => g.ids));
  const groups = [
    ...GROUPS.map((g) => ({ ...g, items: g.ids.flatMap((id) => questions.filter((q) => q.id === id)) })),
    { title: "Anything else", body: "", items: questions.filter((q) => !placed.has(q.id)) },
  ].filter((g) => g.items.length);

  return (
    <div className="space-y-10">
      {groups.map((g, i) => (
        <section key={g.title} aria-labelledby={`group-${i}`}>
          <div className="flex items-baseline justify-between gap-3 border-b-2 border-ink pb-2">
            <h2 id={`group-${i}`} className="display text-[1.6rem] text-ink">
              <span className="tabular me-3 font-mono text-[13px] text-accent">
                {i + 1}/{groups.length}
              </span>
              {tr(g.title)}
            </h2>
            <span className="text-[13px] text-ink-3">{tr("{n} questions", { n: g.items.length })}</span>
          </div>
          {g.body ? <p className="mt-2 text-[14.5px] text-ink-2">{tr(g.body)}</p> : null}
          <div className="divide-y divide-rule">
            {g.items.map((q) => (
              <QuestionCard key={q.id} q={q} current={defaults[q.id]} lang={lang} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
