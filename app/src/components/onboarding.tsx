"use client";

import { useState } from "react";
import { SOURCES, TOUCHPOINT_LABEL, type Sex, type Touchpoint } from "@/lib/model";
import { beliefItems, WORRY_LABELS } from "@/lib/checks";
import type { Answers } from "@/lib/profile";
import { completeOnboarding } from "@/server/actions";
import { HealthQuestions } from "./health-questions";
import { SubmitButton } from "./submit-button";
import { t, type Lang, type Vars } from "@/lib/i18n";

const STEP_TITLES = ["Why you're seeing this", "What to share", "About you", "A few quick questions"];
const LAST = STEP_TITLES.length - 1;

function Switch({ name, label, detail, defaultOn = false }: { name: string; label: string; detail: string; defaultOn?: boolean }) {
  // label and detail arrive already translated
  const [on, setOn] = useState(defaultOn);
  return (
    <label className={`flex cursor-pointer items-center gap-4 rounded-2xl border bg-white px-4 py-3.5 transition-colors ${on ? "border-indigo-200" : "border-zinc-200"}`}>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-zinc-950">{label}</span>
        <span className="mt-0.5 block text-[13px] text-zinc-500">{detail}</span>
      </span>
      <input type="checkbox" name={name} checked={on} onChange={(e) => setOn(e.target.checked)} className="peer sr-only" />
      <span aria-hidden className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-indigo-600" : "bg-zinc-300"}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left] ${on ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </label>
  );
}

export function Onboarding({
  firstName,
  touchpoint,
  hasSignal,
  sex,
  defaults,
  lang = "en",
}: {
  firstName: string;
  touchpoint: { kind: Touchpoint; at: string };
  hasSignal: boolean;
  sex: Sex;
  defaults: Answers;
  lang?: Lang;
}) {
  const tr = (text: string, vars?: Vars) => t(lang, text, vars);
  const [step, setStep] = useState(0);
  const go = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const date = new Date(touchpoint.at).toLocaleDateString(lang === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { day: "numeric", month: "long" });

  return (
    <form action={completeOnboarding} className="mx-auto max-w-2xl">
      <ol className="mb-10 flex gap-1.5" aria-label={tr("Steps")}>
        {STEP_TITLES.map((title, i) => (
          <li key={title} className="flex-1">
            <span className={`block h-1 rounded-full ${i <= step ? "bg-indigo-600" : "bg-zinc-200"}`} />
            <span className={`mt-2 block text-[12px] ${i === step ? "font-semibold text-zinc-950" : "text-zinc-400"}`}>
              {i + 1}. {tr(title)}
            </span>
          </li>
        ))}
      </ol>

      <section hidden={step !== 0} className="page-enter">
        <p className="eyebrow">{tr("A message from Masar")}</p>
        <h1 className="mt-3 font-semibold tracking-[-0.025em] text-[2.6rem] leading-[1.05] text-zinc-950">
          {hasSignal ? tr("{name}, something in your records is worth a conversation.", { name: firstName }) : tr("{name}, here is what your records show.", { name: firstName })}
        </h1>
        <p className="mt-5 text-[16px] leading-relaxed text-zinc-600">
          {tr("At your {check} on {date}, you agreed that Masar could look through your health records for anything about having children in the future.", { check: tr(TOUCHPOINT_LABEL[touchpoint.kind]), date })}{" "}
          {hasSignal
            ? tr("It found something worth talking about now rather than later.")
            : tr("Nothing it found needs a conversation right now, and it will be honest about what it cannot know.")}
        </p>
        <ul className="mt-6 space-y-3 text-[15px] text-zinc-800">
          {[
            "This is not a diagnosis and not a fertility score.",
            "Only you and your own doctor can see it, and only what you choose to share.",
            "Employers and insurers can never see it. No setting exists that would allow it.",
          ].map((line) => (
            <li key={line} className="flex gap-3">
              <span aria-hidden className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[11px] text-indigo-600">
                ✓
              </span>
              {tr(line)}
            </li>
          ))}
        </ul>
      </section>

      <section hidden={step !== 1} className="page-enter">
        <h1 className="font-semibold tracking-[-0.025em] text-[2.2rem] leading-tight text-zinc-950">{tr("Choose what Masar may use")}</h1>
        <p className="mt-3 text-[15px] text-zinc-600">{tr("Nothing is switched on until you choose. Each source is separate, and you can change your mind at any time from “My data”.")}</p>
        <div className="mt-6 space-y-2.5">
          {SOURCES.map((s) => (
            <Switch key={s.id} name={`source_${s.id}`} label={tr(s.label)} detail={tr(s.detail)} />
          ))}
        </div>
        <p className="mb-2.5 mt-8 text-[13px] font-semibold uppercase tracking-[0.1em] text-zinc-500">{tr("Who may see your summary")}</p>
        <Switch name="share_clinician" label={tr("My family doctor")} detail={tr("So they can review it and arrange a conversation if you ask")} />
      </section>

      <section hidden={step !== 2} className="page-enter">
        <h1 className="font-semibold tracking-[-0.025em] text-[2.2rem] leading-tight text-zinc-950">{tr("A little about you")}</h1>
        <p className="mt-3 text-[15px] text-zinc-600">
          {tr("Only you know some of this. We've filled in what your records already say, so just check and correct. Skip anything you'd rather not answer.")}
        </p>
        <div className="mt-6">
          <HealthQuestions sex={sex} defaults={defaults} lang={lang} />
        </div>
      </section>

      <section hidden={step !== 3} className="page-enter">
        <h1 className="font-semibold tracking-[-0.025em] text-[2.2rem] leading-tight text-zinc-950">{tr("Three quick questions")}</h1>
        <p className="mt-3 text-[15px] text-zinc-600">
          {tr("There are no wrong answers. We'll ask again after you've spoken to your doctor, to see whether Masar helped.")}
        </p>
        <div className="mt-6 space-y-4">
          {beliefItems(sex).map((item, i) => (
            <fieldset key={item.text} className="card p-5">
              <legend className="sr-only">{tr(item.text)}</legend>
              <p className="text-[15px] font-medium text-zinc-950">{tr(item.text)}</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  ["true", "True"],
                  ["false", "False"],
                  ["unsure", "Not sure"],
                ].map(([value, label]) => (
                  <label key={value} className="cursor-pointer">
                    <input type="radio" name={`belief_${i}`} value={value} defaultChecked={value === "unsure"} className="peer sr-only" />
                    <span className="block rounded-xl border border-zinc-200 py-2 text-center text-sm text-zinc-800 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:font-medium peer-checked:text-indigo-600">
                      {tr(label)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <fieldset className="card p-5">
            <legend className="sr-only">{tr("Worry")}</legend>
            <p className="text-[15px] font-medium text-zinc-950">{tr("Right now, how worried do you feel about your reproductive health?")}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {WORRY_LABELS.map((label, i) => (
                <label key={label} className="cursor-pointer">
                  <input type="radio" name="worry" value={i + 1} defaultChecked={i === 1} className="peer sr-only" />
                  <span className="block rounded-xl border border-zinc-200 px-2 py-2 text-center text-sm text-zinc-800 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:font-medium peer-checked:text-indigo-600">
                    {tr(label)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <div className="mt-10 flex items-center gap-3">
        {step > 0 ? (
          <button type="button" onClick={() => go(step - 1)} className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800">
            {tr("Back")}
          </button>
        ) : null}
        {step < LAST ? (
          <button type="button" onClick={() => go(step + 1)} className="ms-auto rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            {tr("Continue")}
          </button>
        ) : (
          <SubmitButton pendingLabel={tr("Reading your records")} className="ms-auto rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            {tr("Show me my path")}
          </SubmitButton>
        )}
      </div>
    </form>
  );
}
