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

function QuestionCard({ q, current, lang }: { q: Question; current: Answers[string] | undefined; lang: Lang }) {
  const tr = (text: string, vars?: Vars) => t(lang, text, vars);
  return (
    <fieldset className="card p-5">
      <legend className="sr-only">{tr(q.text)}</legend>
      <p className="text-[15px] font-medium text-zinc-950">{tr(q.text)}</p>
      {q.multi ? <p className="mt-0.5 text-[12.5px] text-zinc-500">{tr("Tick any that apply, or leave blank.")}</p> : null}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {q.options.map((o) => {
          const checked = Array.isArray(current) ? current.includes(o.value) : current === o.value;
          return (
            <label key={o.value} className="cursor-pointer">
              <input type={q.multi ? "checkbox" : "radio"} name={`q_${q.id}`} value={o.value} defaultChecked={checked} className="peer sr-only" />
              <span className="block rounded-xl border border-zinc-200 px-3.5 py-2.5 text-[14px] text-zinc-800 transition-colors peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:font-medium peer-checked:text-indigo-700 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500">
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
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id={`group-${i}`} className="text-[17px] font-semibold text-zinc-950">
              <span className="tabular me-2 text-[13px] text-indigo-600">
                {i + 1}/{groups.length}
              </span>
              {tr(g.title)}
            </h2>
            <span className="text-[12.5px] text-zinc-400">{tr("{n} questions", { n: g.items.length })}</span>
          </div>
          {g.body ? <p className="-mt-2 mb-3 text-[13.5px] text-zinc-500">{tr(g.body)}</p> : null}
          <div className="space-y-3">
            {g.items.map((q) => (
              <QuestionCard key={q.id} q={q} current={defaults[q.id]} lang={lang} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
