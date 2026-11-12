"use client";

import { useId, useState } from "react";
import { formatDateIn } from "@/lib/i18n";
import type { Aggregates } from "@/lib/experience/aggregates";
import { EQUITY_KEY, IMPACT, SCENES, line, tr, type L10n } from "@/lib/experience/copy";
import { clinicianLines, type Derived, type Observation, type Stamp } from "@/lib/experience/derive";
import { AREAS, stepsFor } from "@/lib/experience/questions";
import type { ReviewDecision } from "@/lib/experience/state";
import { INTENTION_LABEL, SOURCES, type Reading, type SourceId } from "@/lib/model";
import { labelFor, questionsFor } from "@/lib/profile";
import { OPTION_LABEL, RULES, clinicalReason } from "@/lib/signals";
import { useSim } from "./sim-context";

const HEADING: Record<string, string> = {
  know: "What we know",
  said: "What you told us",
  changed: "What changed",
  matters: "Why it matters",
  certain: "How certain we are",
  cannot: "What we cannot conclude",
};

const STAMP: Record<Stamp, string> = {
  fact: "Fact",
  said: "You said",
  trend: "Trend",
  steady: "Steady",
  evidence: "Evidence",
  unknown: "Unknown",
};

const STAMP_INK: Record<Stamp, string> = {
  fact: "text-ink",
  said: "text-ink-2",
  trend: "text-soon",
  steady: "text-accent",
  evidence: "text-accent",
  unknown: "text-unknown",
};

function Title() {
  const { state, headingRef } = useSim();
  const scene = SCENES[state.scene];
  return (
    <header className="max-w-3xl">
      <p className="eyebrow">
        {line(state.lang, scene.tier)} · {String(state.scene + 1).padStart(2, "0")}
      </p>
      <h1 ref={headingRef} tabIndex={-1} className="display mt-3 text-[clamp(2.15rem,5vw,3.5rem)] leading-[1.04] text-ink outline-none">
        {line(state.lang, scene.title)}
      </h1>
    </header>
  );
}

function Shown({ at, children }: { at: number; children: React.ReactNode }) {
  const { state } = useSim();
  if (state.beat < at) return null;
  return <div className={at > 0 ? "xm-rise" : undefined}>{children}</div>;
}

function P({ en, ar }: L10n) {
  const { state } = useSim();
  return <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ink-2">{state.lang === "ar" ? ar : en}</p>;
}

function Tag({ kind }: { kind: Stamp }) {
  const { state } = useSim();
  return <span className={`font-mono text-[11px] font-medium uppercase tracking-[0.08em] ${STAMP_INK[kind]}`}>{tr(state.lang, STAMP[kind])}</span>;
}

function SwitchRow({ label, detail, on, onChange }: { label: string; detail?: string; on: boolean; onChange: (on: boolean) => void }) {
  const id = useId();
  return (
    <li className="flex items-start gap-4 py-4">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block cursor-pointer text-[16.5px] font-semibold text-ink">
          {label}
        </label>
        {detail ? <p className="mt-0.5 text-[14px] leading-snug text-ink-3">{detail}</p> : null}
      </div>
      <span className="xm-switch">
        <input id={id} type="checkbox" role="switch" checked={on} aria-checked={on} onChange={(event) => onChange(event.target.checked)} />
        <span aria-hidden />
      </span>
    </li>
  );
}

export function SceneBody() {
  const { state } = useSim();
  const id = SCENES[state.scene].id;
  return (
    <div data-scene={id}>
      {id === "discover" ? <Discover /> : null}
      {id === "trust" ? <Trust /> : null}
      {id === "questions" ? <Questions /> : null}
      {id === "picture" ? <Picture /> : null}
      {id === "changes" ? <Changes /> : null}
      {id === "evidence" ? <Evidence /> : null}
      {id === "options" ? <Options /> : null}
      {id === "clinician" ? <Clinician /> : null}
      {id === "population" ? <Population /> : null}
      {id === "impact" ? <Impact /> : null}
      {id === "outcome" ? <Outcome /> : null}
    </div>
  );
}

function Discover() {
  const { state } = useSim();
  const ar = state.lang === "ar";
  return (
    <article>
      <Title />
      <P
        en="Noura Al Mansouri is 34. She is fictional. She has just come from a Health Age check. The things that could matter — family history, a hormone result, cycle dates, weight — do not sit in one place. A meaningful conversation often waits until someone is already trying."
        ar="نورة المنصوري في الرابعة والثلاثين. هي شخصية خيالية. خرجت للتو من فحص العمر الصحي. ما قد يهم — التاريخ العائلي، ونتيجة هرمون، وتواريخ الدورة، والوزن — لا يجتمع في مكان واحد. وكثيرًا ما تنتظر المحادثة المفيدة حتى يكون الشخص قد بدأ المحاولة."
      />
      <ol className="mt-8 max-w-2xl divide-y divide-rule border-y border-rule">
        {(
          [
            ["Scattered", "مبعثرة", "History, labs, cycles and the checks she already attends live apart.", "التاريخ والفحوص والدورات والفحوصات التي تحضرها تعيش منفصلة."],
            ["Misjudged", "تُقدَّر على غير وجهها", "A single result is easy to read as a verdict. It is not one.", "يسهل قراءة نتيجة واحدة كأنها حكم. وهي ليست كذلك."],
            ["Late", "متأخرة", "By the time anyone looks, some options have narrowed. The aim is an earlier conversation, not a more anxious one.", "حين ينظر أحد، تكون بعض الخيارات قد ضاقت. الهدف محادثة أبكر، لا قلق أكبر."],
          ] as const
        ).map(([en, arTitle, body, arBody]) => (
          <li key={en} className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
            <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-accent">{ar ? arTitle : en}</p>
            <p className="text-[16px] leading-relaxed text-ink-2">{ar ? arBody : body}</p>
          </li>
        ))}
      </ol>
      <figure className="mt-10">
        <LifeCourse beat={state.beat} />
        <figcaption className="mt-3 max-w-2xl text-[13.5px] text-ink-3">
          {ar ? "رسم لفجوة التوقيت. ليس قياسات نورة، وليس درجة." : "An illustration of the timing gap. Not Noura’s measurements, and not a score."}
        </figcaption>
      </figure>
      <Shown at={1}>
        <P
          en="Masar does not invent medical facts. It can bring together only what she agrees to share, so a change can be noticed while choices are still open."
          ar="مسار لا يخترع حقائق طبية. يمكنه أن يجمع فقط ما توافق على مشاركته، فيُلاحَظ التغيّر والخيارات ما زالت مفتوحة."
        />
      </Shown>
      <Shown at={2}>
        <P
          en="The rest of this demonstration stays with Noura. The same record, the same answers, and the same permissions follow her from privacy to the clinic and on to the health system."
          ar="تبقى بقية هذا العرض مع نورة. السجل نفسه، والإجابات نفسها، والأذونات نفسها ترافقها من الخصوصية إلى العيادة ثم إلى النظام الصحي."
        />
      </Shown>
    </article>
  );
}

function LifeCourse({ beat }: { beat: number }) {
  return (
    <svg viewBox="0 0 720 168" className="w-full" role="img" aria-hidden>
      <line x1="28" y1="118" x2="692" y2="118" className="xm-base" />
      {beat < 1 ? (
        <>
          <path d="M48 78h70" className="xm-ink xm-draw" pathLength={1} />
          <path d="M168 52h86" className="xm-ink xm-draw" pathLength={1} />
          <path d="M300 96h64" className="xm-ink xm-draw" pathLength={1} />
          <path d="M430 64h120" className="xm-ink xm-draw" pathLength={1} />
        </>
      ) : (
        <path d="M28 118 C 140 118, 180 70, 300 70 S 520 118, 692 118" className="xm-join xm-draw" pathLength={1} />
      )}
      {beat >= 2 ? (
        <>
          <circle cx="300" cy="70" r="7" className="xm-mark xm-dot-in" />
          <circle cx="560" cy="104" r="6" className="xm-late xm-dot-in" />
        </>
      ) : null}
      <text x="28" y="146" fill="#625e55" fontSize="12" fontFamily="ui-monospace, monospace">18</text>
      <text x="676" y="146" fill="#625e55" fontSize="12" fontFamily="ui-monospace, monospace">45</text>
    </svg>
  );
}

function Trust() {
  const { state, dispatch, view } = useSim();
  const lang = state.lang;
  const t = (text: string) => tr(lang, text);
  const codes = [...new Set(view.record.readings.map((reading) => reading.code))];
  return (
    <article>
      <Title />
      <P
        en="Every optional permission starts off. Noura chooses each source, who may see the summary, and whether an assistant may read anything. This demonstration does not write a consent record and does not call Gemini."
        ar="كل إذن اختياري يبدأ متوقفًا. نورة تختار كل مصدر، ومن يرى الملخص، وهل يقرأ مساعد أي شيء. هذا العرض لا يكتب سجل إذن ولا يستدعي Gemini."
      />
      <ul className="mt-6 divide-y divide-rule border-y border-rule">
        {SOURCES.map((source) => (
          <SwitchRow
            key={source.id}
            label={t(source.label)}
            detail={t(source.detail)}
            on={state.sources[source.id]}
            onChange={(on) => dispatch({ type: "source", id: source.id, on })}
          />
        ))}
        <SwitchRow
          label={t("Keep an eye out for me")}
          detail={lang === "ar" ? "من دون هذا الإذن تبقى السجلات ظاهرة، ولا تُعرَض محادثة." : "Without this, records can still be shown. A conversation is not offered."}
          on={state.scanning}
          onChange={(on) => dispatch({ type: "flag", key: "scanning", on })}
        />
      </ul>
      <div className="mt-6 max-w-2xl border-s-2 border-accent ps-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent">{lang === "ar" ? "في العرض المأذون الآن" : "In the authorised view now"}</p>
        <p className="mt-1 text-[16px] leading-relaxed text-ink">
          {codes.length
            ? codes.map((code) => t(codeLabel(code))).join(lang === "ar" ? " · " : " · ")
            : lang === "ar"
              ? "لا قياسات. إيقاف مصدر يُخرج قيمه من هنا ومن كل مشهد لاحق."
              : "No measurements. Switching a source off removes its values here and from every later scene."}
        </p>
        <p className="mt-2 text-[14.5px] text-ink-2">
          {view.signals.length
            ? view.signals.map((signal) => t(RULES[signal.code].title)).join(lang === "ar" ? " · " : " · ")
            : lang === "ar"
              ? "لا محادثة معروضة بعد."
              : "No conversation is offered yet."}
        </p>
      </div>
      <Shown at={1}>
        <ul className="mt-8 divide-y divide-rule border-y border-rule">
          <SwitchRow
            label={t("My family doctor")}
            detail={t("Dr Layla Al Hashimi sees your summary and your requests: only the sources you switched on.")}
            on={state.shareClinician}
            onChange={(on) => dispatch({ type: "flag", key: "shareClinician", on })}
          />
          <SwitchRow
            label={t("Let the assistant read my summary")}
            detail={lang === "ar" ? "يبقى متوقفًا حتى يُفعَّل. هذا العرض يستخدم كلمات مسار نفسها ولا يرسل شيئًا إلى Gemini." : "Stays off until it is switched on. This demonstration uses Masar’s own words and sends nothing to Gemini."}
            on={state.assistant}
            onChange={(on) => dispatch({ type: "flag", key: "assistant", on })}
          />
          <SwitchRow
            label={t("Let the assistant read reports I upload")}
            detail={lang === "ar" ? "إذن منفصل. لا يوجد ملف مرفوع في هذه القصة، والإذن وحده لا ينشئ نتيجة." : "A separate consent. This story has no uploaded file, and consent alone does not create a result."}
            on={state.reportReading}
            onChange={(on) => dispatch({ type: "flag", key: "reportReading", on })}
          />
          <SwitchRow
            label={lang === "ar" ? "تحليلات السكان" : "Population analytics"}
            detail={lang === "ar" ? "غرض في نموذج الإذن. المفتاح توضيحي: لا يُضاف صف نورة إلى المجاميع أبدًا." : "A purpose in the consent model. Illustrative: Noura’s row is never added to the aggregates."}
            on={state.population}
            onChange={(on) => dispatch({ type: "flag", key: "population", on })}
          />
        </ul>
        <div className="mt-6 max-w-2xl">
          <p className="text-[15px] font-semibold text-ink">{t("Never, by design")}</p>
          <p className="mt-1 text-[14.5px] leading-relaxed text-ink-2">{t("There is no setting that gives these access, because the purpose does not exist in Masar.")}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {["Employers", "Insurers", "Marketing and unrelated apps"].map((item) => (
              <li key={item} className="rounded-full bg-urgent-soft px-3 py-1 text-[13px] font-medium text-urgent">
                {t(item)}
              </li>
            ))}
          </ul>
        </div>
      </Shown>
    </article>
  );
}

function codeLabel(code: Reading["code"]): string {
  if (code === "amh") return "Egg-reserve hormone (AMH)";
  if (code === "cycle_length") return "Cycle length";
  if (code === "bmi") return "Weight for height (BMI)";
  if (code === "sleep_hours") return "Sleep";
  if (code === "hba1c") return "Blood sugar (HbA1c)";
  if (code === "tsh") return "Thyroid";
  return "Sperm count";
}

function Questions() {
  const { state, dispatch } = useSim();
  const lang = state.lang;
  const t = (text: string) => tr(lang, text);
  const steps = stepsFor(state.answers);
  if (state.reviewing) return <Review stepsCount={steps.length} />;
  const step = steps[Math.min(state.qIndex, steps.length - 1)];
  const advance = (skipId?: string) => {
    if (skipId) dispatch({ type: "skip", id: skipId });
    const nextAnswers = { ...state.answers };
    if (skipId) delete nextAnswers[skipId];
    const nextSteps = stepsFor(nextAnswers);
    if (state.qIndex >= nextSteps.length - 1) dispatch({ type: "review", on: true });
    else dispatch({ type: "q", index: state.qIndex + 1 });
  };
  return (
    <article>
      <Title />
      <P
        en="These are Masar’s own questions. A later question appears only when an earlier answer makes it relevant. She can skip any of them. Nothing here adds a medical rule."
        ar="هذه أسئلة مسار نفسها. السؤال اللاحق لا يظهر إلا إذا جعلته إجابة سابقة ذا صلة. يمكنها تخطي أي سؤال. ولا شيء هنا يضيف قاعدة طبية."
      />
      {step.kind === "note" ? (
        <NoteStep id={step.id} />
      ) : (
        <fieldset className="mt-8 max-w-2xl">
          <legend className="text-[13px] font-medium text-accent">{t(AREAS[step.area] ?? step.area)}</legend>
          <p className="mt-2 text-[1.45rem] leading-snug text-ink">{t(step.question.text)}</p>
          <p className="mt-2 text-[14.5px] leading-relaxed text-ink-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent">{t("Why we ask")}</span>
            {" · "}
            {t(step.why)}
          </p>
          <div className="mt-4" role={step.question.multi ? "group" : "radiogroup"}>
            {step.question.options.map((option) => {
              const current = state.answers[step.id];
              const checked = Array.isArray(current) ? current.includes(option.value) : current === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role={step.question.multi ? "checkbox" : "radio"}
                  aria-checked={checked}
                  className="xm-choice"
                  onClick={() => {
                    if (step.question.multi) {
                      const list = Array.isArray(current) ? current : [];
                      const value = list.includes(option.value) ? list.filter((item) => item !== option.value) : [...list, option.value];
                      dispatch({ type: "answer", id: step.id, value });
                    } else {
                      dispatch({ type: "answer", id: step.id, value: option.value });
                    }
                  }}
                >
                  <span className="xm-dot" aria-hidden />
                  {t(option.label)}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" className="xm-btn" disabled={state.qIndex === 0} onClick={() => dispatch({ type: "q", index: state.qIndex - 1 })}>
          {lang === "ar" ? "رجوع" : "Back"}
        </button>
        {step.kind === "ask" ? (
          <button type="button" className="xm-btn xm-btn--quiet" onClick={() => advance(step.id)}>
            {lang === "ar" ? "تخطي" : "Skip"}
          </button>
        ) : null}
        <button
          type="button"
          className="xm-btn xm-btn--accent"
          disabled={step.kind === "ask" && !step.question.multi && state.answers[step.id] === undefined}
          onClick={() => advance()}
        >
          {lang === "ar" ? "متابعة" : "Continue"}
        </button>
      </div>
    </article>
  );
}

function NoteStep({ id }: { id: "age" | "labs" | "other" }) {
  const copy: Record<typeof id, L10n & { title: L10n }> = {
    age: {
      title: { en: "Age and life stage", ar: "العمر ومرحلة الحياة" },
      en: "Noura is 34. Age comes from her Masar account. There is no extra medical question for it. She may want children in a few years — she can confirm or change that next.",
      ar: "نورة في الرابعة والثلاثين. العمر من حسابها في مسار. لا سؤال طبي إضافي عنه. قد تريد أطفالًا بعد بضع سنوات — ويمكنها تأكيد ذلك أو تغييره في السؤال التالي.",
    },
    labs: {
      title: { en: "Available laboratory information", ar: "معلومات المختبر المتاحة" },
      en: "Laboratory results are not asked here. They appear only when Lab results is on. Two AMH results are on her synthetic lab record. Thyroid and blood sugar are not. Their absence is not a finding.",
      ar: "لا تُسأل نتائج المختبر هنا. تظهر فقط عندما تكون نتائج المختبر مفعّلة. نتيجتا AMH في سجلها المخبري الاصطناعي. الغدة الدرقية وسكر الدم ليسا فيه. وغيابهما ليس نتيجة.",
    },
    other: {
      title: { en: "Other authorised information", ar: "معلومات أخرى مأذون بها" },
      en: "Weight comes from the Health Age check. Cycle dates and one sleep reading come from the phone, if that source is on. Nothing in this story was read out of a document by an assistant.",
      ar: "الوزن من فحص العمر الصحي. تواريخ الدورة وقراءة نوم واحدة من الهاتف، إذا كان ذلك المصدر مفعّلًا. ولم يقرأ مساعد شيئًا من وثيقة في هذه القصة.",
    },
  };
  const item = copy[id];
  const { state } = useSim();
  return (
    <div className="mt-8 max-w-2xl">
      <h2 className="display text-[1.8rem] text-ink">{line(state.lang, item.title)}</h2>
      <p className="mt-3 text-[16.5px] leading-relaxed text-ink-2">{line(state.lang, item)}</p>
    </div>
  );
}

function Review({ stepsCount }: { stepsCount: number }) {
  const { state, dispatch } = useSim();
  const lang = state.lang;
  const t = (text: string) => tr(lang, text);
  const steps = stepsFor(state.answers);
  return (
    <article>
      <Title />
      <P
        en="She can change any answer. What she leaves blank stays unknown. It is not recorded as a no."
        ar="يمكنها تغيير أي إجابة. ما تتركه فارغًا يبقى غير معروف. ولا يُسجَّل كأنه «لا»."
      />
      <ul className="mt-6 max-w-2xl divide-y divide-rule border-y border-rule">
        {steps.map((step, index) => {
          if (step.kind !== "ask") return null;
          const value = state.answers[step.id];
          const shown =
            value === undefined
              ? lang === "ar"
                ? "تم التخطي"
                : "Skipped"
              : Array.isArray(value)
                ? value.length
                  ? value.map((item) => t(labelFor(step.question, item))).join(lang === "ar" ? "، " : ", ")
                  : t("None of the listed conditions.")
                : t(labelFor(step.question, value));
          return (
            <li key={step.id} className="flex items-start gap-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-ink-3">{t(step.question.text)}</p>
                <p className="mt-0.5 text-[16px] text-ink">{shown}</p>
              </div>
              <button type="button" className="xm-btn xm-btn--quiet" onClick={() => dispatch({ type: "q", index: index })}>
                {lang === "ar" ? "تعديل" : "Edit"}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[13px] text-ink-3">
        {stepsCount} {lang === "ar" ? "خطوات، بما فيها المقدمات." : "steps, including the notes."}
      </p>
    </article>
  );
}

function Picture() {
  const { state, view } = useSim();
  const lang = state.lang;
  const t = (text: string) => tr(lang, text);
  const readings = [...view.record.readings].sort((a, b) => a.at.localeCompare(b.at));
  return (
    <article>
      <Title />
      <P
        en="Each source adds its own facts. A number always keeps its date and its source. Confirmed synthetic records are separate from what she typed, and neither is an assistant’s extraction."
        ar="كل مصدر يضيف حقائقه. كل رقم يحتفظ بتاريخه ومصدره. السجلات الاصطناعية المؤكدة منفصلة عما كتبته، وكلاهما ليس استخراجًا من مساعد."
      />
      <Shown at={0}>
        <ul className="mt-8 max-w-2xl divide-y divide-rule border-y border-rule">
          {SOURCES.map((source) => (
            <li key={source.id} className="flex items-baseline justify-between gap-4 py-3">
              <span className="text-[16px] text-ink">{t(source.label)}</span>
              <span className={`font-mono text-[12px] uppercase tracking-[0.08em] ${state.sources[source.id] ? "text-accent" : "text-ink-3"}`}>
                {state.sources[source.id] ? (lang === "ar" ? "مأذون" : "On") : lang === "ar" ? "متوقف" : "Off"}
              </span>
            </li>
          ))}
        </ul>
      </Shown>
      <Shown at={1}>
        {readings.length ? (
          <ul className="mt-8 max-w-3xl divide-y divide-rule border-y border-rule">
            {readings.map((reading) => (
              <li key={`${reading.code}-${reading.at}`} className="grid gap-1 py-3 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
                <div>
                  <Tag kind="fact" />
                  <p className="mt-1 text-[12.5px] text-ink-3">{t("Confirmed synthetic record")}</p>
                </div>
                <p className="text-[16px] text-ink">
                  <span className="font-medium">{t(codeLabel(reading.code))}</span>
                  <span className="tabular"> {reading.value} {reading.unit}</span>
                  <span className="mt-0.5 block text-[13.5px] text-ink-3">
                    {t(sourceName(reading.source))} · {formatDateIn(lang, reading.at)}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-[16px] text-ink-2">{lang === "ar" ? "لا قياسات في العرض المأذون." : "No measurements are in the authorised view."}</p>
        )}
        <AnswersList />
      </Shown>
      <Shown at={2}>
        <div className="mt-8 max-w-2xl">
          <Tag kind="unknown" />
          <p className="mt-2 text-[16px] leading-relaxed text-ink-2">{t("No condition is recorded in the shared clinic record. That is not a finding that none exists.")}</p>
          <p className="mt-3 text-[16px] leading-relaxed text-ink-2">
            {lang === "ar"
              ? "لا استخراج غير مؤكد. لا ملف مرفوع في هذه القصة. في المنتج الحي تبقى القيم المقروءة من ملف غير مؤكدة حتى تراجعها، وذلك فقط إذا كانت نتائج المختبر وإذن قراءة التقارير مفعّلين معًا."
              : "No unverified extraction. This story has no uploaded file. In the live product, values read from a file stay unconfirmed until she checks them, and only when lab results and report-reading consent are both on."}
          </p>
          {view.missing.length ? (
            <ul className="mt-4 space-y-1 text-[15px] text-ink-2">
              {view.missing.map((item) => (
                <li key={item}>{t(item)}</li>
              ))}
            </ul>
          ) : null}
          <p className="mt-3 text-[14.5px] text-ink-3">{t("Missing information is not a negative finding.")}</p>
        </div>
      </Shown>
    </article>
  );
}

function sourceName(id: SourceId): string {
  return SOURCES.find((source) => source.id === id)?.label ?? id;
}

function AnswersList() {
  const { state } = useSim();
  const lang = state.lang;
  const t = (text: string) => tr(lang, text);
  if (!state.sources.self) {
    return <p className="mt-4 text-[15px] text-ink-2">{t("What you tell us is off, so your answers are not in this view.")}</p>;
  }
  const questions = questionsFor("female");
  const rows = questions.filter((question) => state.answers[question.id] !== undefined);
  if (!rows.length) return <p className="mt-4 text-[15px] text-ink-2">{t("Nothing you told Masar is part of this comparison.")}</p>;
  return (
    <ul className="mt-6 max-w-3xl divide-y divide-rule border-y border-rule">
      {rows.map((question) => {
        const value = state.answers[question.id];
        const shown = Array.isArray(value) ? (value.length ? value.map((item) => t(labelFor(question, item))).join(", ") : t("None of the listed conditions.")) : t(labelFor(question, String(value)));
        return (
          <li key={question.id} className="grid gap-1 py-3 sm:grid-cols-[8.5rem_1fr]">
            <Tag kind="said" />
            <p className="text-[16px] text-ink">
              {t(question.text)}
              <span className="mt-0.5 block text-ink-2">{shown}</span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function Changes() {
  const { view, state } = useSim();
  const lang = state.lang;
  const readings = view.record.readings;
  return (
    <article>
      <Title />
      <P
        en="The line below is Noura’s authorised record, by date. A change is called meaningful only when an existing published rule says so. A smaller change stays usual variation. One reading cannot show a direction."
        ar="الخط أدناه هو سجل نورة المأذون، حسب التاريخ. لا يُسمى التغيّر ذا معنى إلا إذا قالت بذلك قاعدة منشورة قائمة. التغيّر الأصغر يبقى تذبذبًا معتادًا. والقراءة الواحدة لا تُظهر اتجاهًا."
      />
      {!state.scanning ? (
        <p className="mt-4 max-w-2xl text-[15px] text-soon">{tr(lang, "Masar is not looking for a conversation until you allow it. The comparisons are still shown.")}</p>
      ) : null}
      {readings.length ? (
        <>
          <Timeline readings={readings} showCompare={state.beat >= 1} showMeaning={state.beat >= 2} lang={lang} />
          <ul className="mt-6 max-w-3xl divide-y divide-rule border-y border-rule">
            {view.measures.map((measure) => (
              <li key={measure.def.code} className="grid gap-1 py-3 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
                <Tag kind={measure.verdict === "meaningful" ? "trend" : measure.verdict === "normal" ? "steady" : "unknown"} />
                <div>
                  <p className="text-[16px] font-medium text-ink">{tr(lang, measure.def.label)}</p>
                  <p className="text-[15px] leading-relaxed text-ink-2">{localUnit(lang, tr(lang, measure.sentence))}</p>
                  <Shown at={2}>
                    <p className="mt-1 text-[13.5px] text-ink-3">
                      {lang === "ar" ? "القاعدة المنشورة: " : "Published rule: "}
                      {tr(lang, measure.def.rule)}
                    </p>
                  </Shown>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-6 text-[16px] text-ink-2">{lang === "ar" ? "لا تواريخ في العرض المأذون. أرجعوا إلى الإذن وشاركوا مصدرًا." : "No dates are in the authorised view. Go back to consent and share a source."}</p>
      )}
    </article>
  );
}

function localUnit(lang: "en" | "ar", text: string): string {
  if (lang !== "ar") return text;
  return text.replace(/\bdays\b/g, "يومًا").replace(/\bhours\b/g, "ساعة");
}

function Timeline({ readings, showCompare, showMeaning, lang }: { readings: Reading[]; showCompare: boolean; showMeaning: boolean; lang: "en" | "ar" }) {
  const times = readings.map((reading) => Date.parse(reading.at));
  const min = Math.min(...times);
  const max = Math.max(...times);
  const newest = [...readings].sort((a, b) => a.at.localeCompare(b.at)).at(-1)!.at;
  const amh = readings.filter((reading) => reading.code === "amh").sort((a, b) => a.at.localeCompare(b.at));
  const latestAmh = amh.at(-1)?.at;
  const x = (at: string) => 88 + (max === min ? 0.5 : (Date.parse(at) - min) / (max - min)) * 590;
  const lane: Record<string, number> = { amh: 36, bmi: 78, cycle_length: 112, sleep_hours: 146 };
  const names: Record<string, string> = lang === "ar"
    ? { amh: "AMH", bmi: "BMI", cycle_length: "الدورة", sleep_hours: "النوم" }
    : { amh: "AMH", bmi: "BMI", cycle_length: "Cycles", sleep_hours: "Sleep" };
  const present = [...new Set(readings.map((reading) => reading.code))];
  return (
    <svg viewBox="0 0 720 170" className="mt-8 w-full" style={{ direction: "ltr" }} aria-hidden>
      <line x1="84" y1="158" x2="696" y2="158" className="xm-base" />
      {present.map((code) => (
        <text key={code} x="78" y={(lane[code] ?? 90) + 4} fill="#625e55" fontSize="12" textAnchor="end" direction="ltr" fontFamily="ui-monospace, monospace">
          {names[code] ?? code}
        </text>
      ))}
      {readings.map((reading) => {
        const y = lane[reading.code] ?? 90;
        const meaningful = showMeaning && reading.code === "amh" && amh.length >= 2 && reading.at === latestAmh;
        const earlier = reading.at.slice(0, 4) < newest.slice(0, 4);
        return (
          <g key={`${reading.code}-${reading.at}`}>
            <circle cx={x(reading.at)} cy={y} r={meaningful ? 7 : 4.5} className={meaningful ? "xm-late xm-dot-in" : "xm-mark xm-dot-in"} opacity={showCompare || earlier ? 1 : 0.35} />
          </g>
        );
      })}
    </svg>
  );
}

function Evidence() {
  const { view, state } = useSim();
  const lang = state.lang;
  const [id, setId] = useState("amh");
  const current = view.observations.find((item) => item.id === id) ?? view.observations[0];
  const limit = state.beat === 0 ? 2 : state.beat === 1 ? 4 : 6;
  return (
    <article>
      <Title />
      <P
        en="Pick one observation. The six parts stay in this order. A cited guideline describes people in general. It is never a prediction about Noura. If the assistant switch is on, the words are still Masar’s: Gemini is not called here."
        ar="اختاروا ملاحظة واحدة. الأجزاء الستة تبقى بهذا الترتيب. الدليل المستشهَد به يصف الناس عمومًا. وهو ليس توقعًا بشأن نورة. وإذا كان مفتاح المساعد مفعّلًا، فالكلمات ما زالت كلمات مسار: لا يُستدعى Gemini هنا."
      />
      {state.assistant ? <p className="mt-3 text-[14px] text-soon">{tr(lang, "Illustrative. Gemini is not called in this demonstration.")}</p> : null}
      <div className="mt-6 flex gap-2 overflow-x-auto" role="tablist">
        {view.observations.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={item.id === current?.id} className={`xm-btn ${item.id === current?.id ? "xm-btn--accent" : ""}`} onClick={() => setId(item.id)}>
            {tr(lang, item.title)}
          </button>
        ))}
      </div>
      {current ? <ObservationView item={current} limit={limit} /> : null}
    </article>
  );
}

function ObservationView({ item, limit }: { item: Observation; limit: number }) {
  const { state } = useSim();
  const lang = state.lang;
  const t = (text: string) => tr(lang, text);
  const driver = item.driver === "modifiable" ? "Modifiable" : item.driver === "non-modifiable" ? "Not modifiable" : "Unknown";
  return (
    <div className="mt-6 max-w-3xl">
      <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-3">{t(driver)}</p>
      <ol className="mt-2 divide-y divide-rule border-y border-rule">
        {item.stanzas.slice(0, limit).map((stanza, index) => (
          <li key={`${stanza.heading}-${index}`} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
            <div>
              <p className="text-[13px] text-ink-3">{t(HEADING[stanza.heading])}</p>
              <Tag kind={stanza.kind} />
            </div>
            <p className="text-[16px] leading-relaxed text-ink">
              {t(stanza.text)}
              {stanza.at ? <span className="mt-1 block text-[13px] text-ink-3">{stanza.source ? `${t(sourceName(stanza.source))} · ` : ""}{formatDateIn(lang, stanza.at)}</span> : null}
            </p>
          </li>
        ))}
      </ol>
      {limit >= 4 && item.evidence ? (
        <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
          <Tag kind="evidence" />
          <span className="ms-2">{item.evidence.citation}</span>
          <span className="ms-2 text-ink-3">{t(item.evidence.strength)}</span>
          <span className="mt-1 block">{t("What a published guideline says, about people in general, not a prediction about you.")}</span>
        </p>
      ) : null}
    </div>
  );
}

function Options() {
  const { view, state, dispatch } = useSim();
  const lang = state.lang;
  const t = (text: string) => tr(lang, text);
  const [picked, setPicked] = useState(0);
  const option = view.options[picked] ?? view.options[0];
  return (
    <article>
      <Title />
      <P
        en="Masar lists options the published rules attach to what is currently shared. It does not choose one, and it does not prescribe. Noura can ask about one of them. A clinician decides anything clinical."
        ar="يسرد مسار الخيارات التي تربطها القواعد المنشورة بما هو مشارَك الآن. وهو لا يختار واحدًا، ولا يصف علاجًا. يمكن لنورة أن تسأل عن أحدها. والطبيبة تقرر أي أمر سريري."
      />
      {!view.options.length ? (
        <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-ink-2">
          {lang === "ar"
            ? "لا خيار من القواعد المنشورة فيما هو مشارَك الآن. مشاركة مصدر، أو السماح لمسار بالنظر، قد يغيّر ذلك. الغياب ليس نتيجة."
            : "No option from the published rules is available in what is shared now. Sharing a source, or allowing Masar to look, may change that. Absence is not a finding."}
        </p>
      ) : (
        <>
          <ol className="mt-6 max-w-2xl divide-y divide-rule border-y border-rule">
            {view.options.map((kind, index) => (
              <li key={kind}>
                <button type="button" className="flex w-full items-baseline gap-4 py-3 text-start" onClick={() => setPicked(index)} aria-current={kind === option}>
                  <span className="font-mono text-[12px] text-accent">{String(index + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="block text-[17px] text-ink">{t(OPTION_LABEL[kind].title)}</span>
                    <span className="block text-[14.5px] text-ink-2">{t(OPTION_LABEL[kind].body)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          {option ? (
            <Shown at={1}>
              <div className="mt-6 max-w-2xl">
                <h2 className="display text-[1.7rem] text-ink">{t(OPTION_LABEL[option].title)}</h2>
                <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">
                  {lang === "ar" ? "لماذا يُعرض: " : "Why it is shown: "}
                  {view.signals
                    .filter((signal) => RULES[signal.code].options.includes(option))
                    .map((signal) => t(RULES[signal.code].title))
                    .join(lang === "ar" ? "، " : ", ")}
                </p>
                <ul className="mt-3 space-y-1 text-[15px] text-ink-2">
                  {view.signals
                    .filter((signal) => RULES[signal.code].options.includes(option))
                    .flatMap((signal) => signal.reasons)
                    .map((reason) => (
                      <li key={reason}>{t(reason)}</li>
                    ))}
                </ul>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
                  {view.signals
                    .filter((signal) => RULES[signal.code].options.includes(option))
                    .map((signal) => t(RULES[signal.code].cannotTell))
                    .join(" ")}
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-ink">{t(OPTION_LABEL[option].next)}</p>
                <p className="mt-2 text-[14px] text-ink-3">
                  {lang === "ar" ? "المحادثة مع الطبيبة مناسبة لهذا الخيار. القرار يبقى لنورة وللطبيبة." : "A clinician conversation is appropriate for this option. The decision stays with Noura and the clinician."}
                </p>
                <button
                  type="button"
                  className="xm-btn xm-btn--accent mt-4"
                  onClick={() => {
                    const question = view.signals.flatMap((signal) => RULES[signal.code].questions)[0] ?? "";
                    dispatch({ type: "request", option, question });
                    dispatch({ type: "scene", index: SCENES.findIndex((scene) => scene.id === "clinician") });
                  }}
                >
                  {lang === "ar" ? "اطلبوا محادثة عن هذا" : "Ask for a conversation about this"}
                </button>
              </div>
            </Shown>
          ) : null}
        </>
      )}
      <button type="button" className="xm-btn xm-btn--quiet mt-6" onClick={() => dispatch({ type: "scene", index: SCENES.findIndex((scene) => scene.id === "trust") })}>
        {lang === "ar" ? "العودة إلى الإذن" : "Back to consent"}
      </button>
    </article>
  );
}

function Clinician() {
  const { state, dispatch, view } = useSim();
  const lang = state.lang;
  const t = (text: string) => tr(lang, text);
  const [note, setNote] = useState("");
  const [error, setError] = useState(false);
  const questions = [...new Set(view.signals.flatMap((signal) => RULES[signal.code].questions))];
  const decide = (kind: ReviewDecision) => {
    if (kind === "Override" && !note.trim()) {
      setError(true);
      return;
    }
    setError(false);
    dispatch({ type: "decide", kind, note });
  };
  return (
    <article>
      <Title />
      <P
        en="Noura can ask Dr Layla to look. Dr Layla sees only the shared summary. Her decision is the live workflow: accept, add a test, or disagree and write a reason. The conversation after that is simulated. No call is placed and no appointment is booked."
        ar="يمكن لنورة أن تطلب من د. ليلى الاطلاع. لا ترى د. ليلى إلا الملخص المشارَك. قرارها هو مسار العمل الحي: الموافقة، أو إضافة فحص، أو الاختلاف مع سبب مكتوب. المحادثة بعد ذلك محاكاة. لا تُجرى مكالمة ولا يُحجز موعد."
      />
      <section className="mt-8 max-w-2xl">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-accent">{lang === "ar" ? "طلب نورة" : "Noura’s request"}</h2>
        {state.request ? (
          <div className="mt-2">
            <p className="text-[18px] text-ink">{state.request.option ? t(OPTION_LABEL[state.request.option].title) : lang === "ar" ? "تريد الحديث" : "She would like to talk"}</p>
            <p className="mt-1 text-[15.5px] text-ink-2">“{t(state.request.question)}”</p>
            <button type="button" className="xm-btn xm-btn--quiet mt-3" onClick={() => dispatch({ type: "clear-request" })}>
              {lang === "ar" ? "سحب الطلب في هذا العرض" : "Withdraw the request in this demonstration"}
            </button>
          </div>
        ) : (
          <form
            className="mt-3"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              dispatch({
                type: "request",
                option: view.options[0] ?? null,
                question: String(data.get("question") ?? ""),
              });
            }}
          >
            <label className="text-[15px] text-ink" htmlFor="ask">
              {lang === "ar" ? "سببها، من أسئلة القواعد المنشورة" : "Her reason, from the published rules’ questions"}
            </label>
            <select id="ask" name="question" className="mt-2 w-full border border-rule-strong bg-surface px-3 py-3 text-[15px] text-ink" defaultValue={questions[0] ?? ""}>
              {questions.length ? questions.map((question) => (
                <option key={question} value={question}>
                  {t(question)}
                </option>
              )) : (
                <option value={lang === "ar" ? "أريد الحديث عما هو في سجلي." : "I would like to talk about what is on my record."}>
                  {lang === "ar" ? "أريد الحديث عما هو في سجلي." : "I would like to talk about what is on my record."}
                </option>
              )}
            </select>
            <button type="submit" className="xm-btn xm-btn--accent mt-3">
              {lang === "ar" ? "إرسال الطلب داخل العرض" : "Send the request inside this demonstration"}
            </button>
          </form>
        )}
      </section>
      <Shown at={1}>
        {!state.shareClinician ? (
          <div className="mt-8 max-w-2xl border-s-2 border-urgent ps-4" role="status">
            <p className="text-[18px] text-ink">{lang === "ar" ? "الاطلاع ممنوع" : "This look is blocked"}</p>
            <p className="mt-1 text-[15.5px] leading-relaxed text-ink-2">
              {lang === "ar"
                ? "نورة لم تشارك ملخصها مع الطبيبة. لا أسماء نتائج ولا تواريخ من هذا الجانب. في المنتج الحي يُكتب المنع في سجل الاطلاع. هذا العرض لا يكتب ذلك السجل."
                : "Noura has not shared her summary with the clinician. No result and no date is shown on this side. In the live product the block is written to her access log. This demonstration does not write that log."}
            </p>
          </div>
        ) : (
          <ClinicianSummary view={view} />
        )}
      </Shown>
      <Shown at={2}>
        {state.shareClinician ? (
          <div className="mt-8 max-w-2xl">
            <h2 className="text-[18px] font-semibold text-ink">{lang === "ar" ? "قرار د. ليلى" : "Dr Layla’s decision"}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["Accept", lang === "ar" ? "موافقة" : "Accept"],
                  ["Modify", lang === "ar" ? "إضافة فحص" : "Add a test"],
                  ["Override", lang === "ar" ? "اختلاف" : "Disagree"],
                ] as const
              ).map(([kind, label]) => (
                <button key={kind} type="button" className="xm-btn" onClick={() => decide(kind)}>
                  {label}
                </button>
              ))}
            </div>
            <label className="mt-3 block text-[14px] text-ink-2" htmlFor="reason">
              {t("A reason is needed when you disagree.")}
            </label>
            <textarea id="reason" value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="mt-1 w-full border border-rule-strong bg-surface px-3 py-2 text-[15px] text-ink" />
            {error ? <p className="mt-1 text-[14px] text-urgent">{t("A reason is needed when you disagree.")}</p> : null}
            {state.decision ? (
              <div className="mt-4">
                <p className="text-[16px] text-ink">
                  {state.decision.kind === "Accept"
                    ? lang === "ar"
                      ? "وافقت على التفسير في هذا العرض. لا موعد أُنشئ."
                      : "She accepted the interpretation in this demonstration. No appointment was created."
                    : state.decision.kind === "Modify"
                      ? lang === "ar"
                        ? "وافقت وأضافت فحصًا للنقاش. الفحص نفسه غير مطلوب هنا. الطبيبة تقرر إن كان مفيدًا."
                        : "She agreed and added a test to discuss. The test is not ordered here. A doctor decides whether one would help."
                      : lang === "ar"
                        ? `اختلفت. السبب: ${state.decision.note} لم تُنشأ إحالة.`
                        : `She disagreed. Reason: ${state.decision.note} No referral was created.`}
                </p>
                {!state.consulted ? (
                  <button type="button" className="xm-btn xm-btn--accent mt-3" onClick={() => dispatch({ type: "consult" })}>
                    {lang === "ar" ? "فتح محادثة محاكاة" : "Open the simulated conversation"}
                  </button>
                ) : (
                  <Consultation />
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </Shown>
    </article>
  );
}

function ClinicianSummary({ view }: { view: Derived }) {
  const { state } = useSim();
  const lang = state.lang;
  const t = (text: string) => tr(lang, text);
  return (
    <div className="mt-8 grid gap-8 border-t border-ink pt-6 lg:grid-cols-[1fr_1fr]">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent">{lang === "ar" ? "ملخص مأذون" : "Authorised summary"}</p>
        <h2 className="display mt-1 text-[1.8rem] text-ink">{lang === "ar" ? "نورة المنصوري" : view.resident.name}</h2>
        <p className="mt-1 text-[15px] text-ink-2">
          {view.resident.age}
          {" · "}
          {view.record.intention
            ? t(INTENTION_LABEL[view.record.intention])
            : lang === "ar"
              ? "الخطط ليست في هذا العرض"
              : "Plans are not in this view"}
        </p>
        <ul className="mt-4 space-y-3">
          {view.signals.length ? (
            view.signals.map((signal) => (
              <li key={signal.code}>
                <p className="text-[16px] font-medium text-ink">{t(RULES[signal.code].title)}</p>
                <p className="text-[13.5px] text-ink-3">{RULES[signal.code].clinicalTitle}</p>
                {signal.reasons.map((reason) => (
                  <p key={reason} className="text-[14.5px] text-ink-2">
                    {t(reason)}
                    <span className="mt-0.5 block text-[12.5px] text-ink-3">{clinicalReason(reason)}</span>
                  </p>
                ))}
              </li>
            ))
          ) : (
            <li className="text-[15px] text-ink-2">{t("Nothing in the shared information meets a published reason for a conversation.")}</li>
          )}
        </ul>
      </div>
      <div>
        <p className="text-[14px] font-semibold text-ink">{lang === "ar" ? "ما لا نعرفه" : "What is missing"}</p>
        <ul className="mt-2 space-y-1 text-[14.5px] text-ink-2">
          {view.missing.length ? view.missing.map((item) => <li key={item}>{t(item)}</li>) : <li>{t("Missing information is not a negative finding.")}</li>}
        </ul>
        <p className="mt-4 text-[14px] leading-relaxed text-ink-3">{t("What a published guideline says, about people in general, not a prediction about you.")}</p>
      </div>
    </div>
  );
}

function Consultation() {
  const { view, state } = useSim();
  const lang = state.lang;
  const t = (text: string) => tr(lang, text);
  return (
    <div className="mt-5 border-t border-rule pt-4">
      <p className="rounded-full bg-soon-soft px-3 py-1 text-[12.5px] font-semibold text-soon inline-flex">{t("Simulated consultation. Not an appointment and not a call.")}</p>
      <div className="mt-4 space-y-4">
        <p className="text-[16px] leading-relaxed text-ink">
          <span className="block text-[12px] font-mono uppercase tracking-[0.08em] text-ink-3">{lang === "ar" ? "نورة" : "Noura"}</span>
          {state.request ? t(state.request.question) : ""}
        </p>
        {clinicianLines(view).map((paragraph) => (
          <p key={paragraph} className="text-[16px] leading-relaxed text-ink-2">
            <span className="block text-[12px] font-mono uppercase tracking-[0.08em] text-accent">{lang === "ar" ? "د. ليلى · محاكاة" : "Dr Layla · simulated"}</span>
            {t(paragraph)}
          </p>
        ))}
      </div>
    </div>
  );
}

function Population() {
  const { aggregates: data, state } = useSim();
  const lang = state.lang;
  const t = (text: string) => tr(lang, text);
  return (
    <article>
      <Title />
      <P
        en="These counts are other synthetic residents. Noura is not among them, whether or not the population switch is on. A group of fewer than 10 is hidden, and the exact number is hidden with it. The counts say who the published rules would speak to. They are not attendance, and they do not replace a clinical decision."
        ar="هذه الأعداد لمقيمين اصطناعيين آخرين. نورة ليست بينهم، سواء كان مفتاح السكان مفعّلًا أم لا. المجموعة التي تقل عن 10 تُخفى، ويُخفى معها العدد نفسه. الأعداد تقول من ستحدثه القواعد المنشورة. وهي ليست حضورًا، ولا تغني عن قرار سريري."
      />
      <p className="mt-4 font-mono text-[12px] text-ink-3">
        {data.withSignal.toLocaleString(lang === "ar" ? "ar-AE-u-nu-latn" : "en")} / {data.optedIn.toLocaleString(lang === "ar" ? "ar-AE-u-nu-latn" : "en")}
        {lang === "ar" ? " لديهم ما يستدعي محادثة، من الذين قبلوا مسار في المجموعة الاصطناعية." : " have something the rules would raise, among those who accepted Masar in the synthetic population."}
      </p>
      <Shown at={1}>
        <Cohorts data={data} />
      </Shown>
      <Shown at={2}>
        <Equity data={data} />
        {data.hiddenReasons > 0 ? (
          <p className="mt-4 text-[15px] text-unknown">
            <Tag kind="unknown" />
            <span className="ms-2">
              {lang === "ar"
                ? data.hiddenReasons === 1
                  ? `سبب واحد مخفي لأن أقل من ${data.minGroup} أشخاص لديهم. العدد غير معروض.`
                  : `${data.hiddenReasons} من الأسباب مخفية لأن أقل من ${data.minGroup} أشخاص لديهم. العدد غير معروض.`
                : data.hiddenReasons === 1
                  ? `1 reason is hidden because fewer than ${data.minGroup} people have it. The count is not shown.`
                  : `${data.hiddenReasons} reasons are hidden because fewer than ${data.minGroup} people have them. The count is not shown.`}
            </span>
          </p>
        ) : null}
        <p className="mt-3 text-[13.5px] text-ink-3">{t("Hidden")}: &lt; {data.minGroup}</p>
      </Shown>
    </article>
  );
}

function Cohorts({ data }: { data: Aggregates }) {
  const { state } = useSim();
  const lang = state.lang;
  const t = (text: string) => tr(lang, text);
  const gaps: Record<string, L10n> = {
    "women30-no-amh": {
      en: "Women of 30 or older with no AMH result on the synthetic record",
      ar: "نساء في الثلاثين أو أكثر بلا نتيجة AMH في السجل الاصطناعي",
    },
    "men-trying-no-semen": {
      en: "Men planning a pregnancy soon, with no semen analysis on the synthetic record",
      ar: "رجال يخططون للحمل قريبًا، بلا تحليل سائل منوي في السجل الاصطناعي",
    },
  };
  return (
    <div className="mt-8">
      <h2 className="text-[18px] font-semibold text-ink">{lang === "ar" ? "من قد تفيده مشورة أبكر" : "Who may benefit from an earlier conversation"}</h2>
      <ul className="mt-3 max-w-3xl divide-y divide-rule border-y border-rule">
        {data.cohorts.map((cohort) => (
          <li key={cohort.code} className="flex items-baseline justify-between gap-4 py-2.5">
            <span className="text-[15.5px] text-ink">{t(RULES[cohort.code].title)}</span>
            <span className="tabular text-[15px] text-ink-2">{cohort.n.toLocaleString("en")}</span>
          </li>
        ))}
      </ul>
      <h2 className="mt-8 text-[18px] font-semibold text-ink">{lang === "ar" ? "فجوات في السجل" : "Gaps on the record"}</h2>
      <ul className="mt-3 max-w-3xl divide-y divide-rule border-y border-rule">
        {data.gaps.map((gap) => (
          <li key={gap.id} className="flex items-baseline justify-between gap-4 py-2.5">
            <span className="text-[15.5px] text-ink">{line(lang, gaps[gap.id])}</span>
            <span className="tabular text-[15px] text-unknown">{gap.n === null ? t("Hidden") : gap.n.toLocaleString("en")}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[13.5px] text-ink-3">{t("Missing information is not a negative finding.")}</p>
    </div>
  );
}

function Equity({ data }: { data: Aggregates }) {
  const { state } = useSim();
  const lang = state.lang;
  const t = (text: string) => tr(lang, text);
  const dimension = { sex: "Sex", language: "Language", nationality: "Nationality group", age: "Age" };
  return (
    <div className="mt-8">
      <h2 className="text-[18px] font-semibold text-ink">{lang === "ar" ? "من ستحدثه القواعد، لا من حضر" : "Who the rules would speak to, not who attended"}</h2>
      <ul className="mt-3 max-w-3xl divide-y divide-rule border-y border-rule">
        {data.equity.map((cell) => (
          <li key={`${cell.dimension}-${cell.key}`} className="grid grid-cols-[8rem_1fr_auto] items-baseline gap-3 py-2 text-[15px]">
            <span className="text-ink-3">{t(dimension[cell.dimension])}</span>
            <span className="text-ink">{t(EQUITY_KEY[cell.key] ?? cell.key)}</span>
            <span className="tabular text-ink-2">{cell.n === null ? t("Hidden") : cell.n.toLocaleString("en")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Impact() {
  const { state, dispatch, view } = useSim();
  const lang = state.lang;
  const amh = view.record.readings.filter((reading) => reading.code === "amh");
  const health = view.record.readings.filter((reading) => reading.code === "bmi");
  return (
    <article>
      <Title />
      <P
        en="A pilot would measure the six things below. This prototype does not have the attended dates, teach-back rates or equity of access those measures need. Each one is an evaluation target. No improvement figure is shown, and pregnancy is not a success measure."
        ar="سيقيس البرنامج التجريبي الأمور الستة أدناه. لا يملك هذا النموذج تواريخ الحضور ولا نسب الفهم ولا عدالة الوصول التي تحتاجها تلك المقاييس. كل واحد هدف للتقييم. لا تُعرض نسبة تحسّن، والحمل ليس مقياس نجاح."
      />
      <ol className="mt-8 max-w-3xl divide-y divide-rule border-y border-rule">
        {IMPACT.map((item, index) => (
          <li key={item.id} className="py-4">
            <p className="font-mono text-[12px] text-accent">{String(index + 1).padStart(2, "0")}</p>
            <h2 className="mt-1 text-[1.25rem] text-ink">{line(lang, item.title)}</h2>
            <p className="mt-1 text-[13px] font-semibold text-unknown">{tr(lang, "Target — not a measured result")}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{line(lang, item.definition)}</p>
            <Shown at={1}>
              <p className="mt-2 text-[14.5px] leading-relaxed text-ink-3">
                {lang === "ar" ? "البيانات المطلوبة: " : "Data required: "}
                {line(lang, item.data)}
              </p>
            </Shown>
          </li>
        ))}
      </ol>
      <Shown at={1}>
        <div className="mt-8 max-w-2xl">
          <h2 className="text-[18px] font-semibold text-ink">{lang === "ar" ? "تواريخ نورة، لا فاصل مقيس" : "Noura’s dates, not a measured interval"}</h2>
          {amh.length ? (
            <ul className="mt-2 text-[15px] text-ink-2">
              {amh.map((reading) => (
                <li key={reading.at}>
                  AMH {reading.value} {reading.unit} · {formatDateIn(lang, reading.at)}
                </li>
              ))}
              {health.map((reading) => (
                <li key={reading.at}>
                  BMI {reading.value} · {formatDateIn(lang, reading.at)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[15px] text-ink-2">{lang === "ar" ? "هذه التواريخ ليست في العرض المأذون." : "Those dates are not in the authorised view."}</p>
          )}
          <p className="mt-2 text-[14.5px] text-ink-3">
            {lang === "ar"
              ? "لا تاريخ حضور في نظام سريري. طلب داخل هذا العرض ليس قياسًا."
              : "There is no attended date in a clinical system. A request inside this demonstration is not a measurement."}
          </p>
          <fieldset className="mt-6">
            <legend className="text-[16px] text-ink">{lang === "ar" ? "هل يخبركم هذا إن كان يمكنكم الحمل؟" : "Does this tell you whether you can get pregnant?"}</legend>
            <div className="mt-2 flex gap-2">
              <button type="button" className="xm-btn" aria-pressed={state.teach === "yes"} onClick={() => dispatch({ type: "teach", answer: "yes" })}>
                {lang === "ar" ? "نعم" : "Yes"}
              </button>
              <button type="button" className="xm-btn" aria-pressed={state.teach === "no"} onClick={() => dispatch({ type: "teach", answer: "no" })}>
                {lang === "ar" ? "لا" : "No"}
              </button>
            </div>
            {state.teach === "yes" ? (
              <p className="mt-2 text-[15px] text-ink-2">{tr(lang, "AMH cannot measure egg quality or predict your chance of getting pregnant naturally.")}</p>
            ) : null}
            {state.teach === "no" ? (
              <p className="mt-2 text-[15px] text-ink-2">
                {lang === "ar" ? "هذه إجابة واحدة خيالية. وهي ليست نسبة." : "That is one fictional answer. It is not a rate."}
              </p>
            ) : null}
          </fieldset>
        </div>
      </Shown>
    </article>
  );
}

function Outcome() {
  const { state } = useSim();
  const ar = state.lang === "ar";
  const parties = [
    [ar ? "المقيمة" : "The resident", ar ? "ترى ما تغيّر، وما لا يمكن قوله، وتختار إن كانت ستسأل." : "She sees what changed, what cannot be said, and whether to ask."],
    [ar ? "الطبيبة" : "The clinician", ar ? "ترى الملخص المأذون فقط، وتقبل أو تعدّل أو تختلف." : "She sees only the authorised summary, and accepts, adds a test, or disagrees."],
    [ar ? "النظام الصحي" : "The health system", ar ? "يرى مجاميع محمية، لا سجل نورة، ليخطّط لا ليقرر عنها." : "It sees protected counts, not Noura’s record, for planning rather than a decision about her."],
  ];
  return (
    <article>
      <Title />
      <P
        en="One person, followed the whole way. Earlier awareness came from records she chose to share. The explanation kept facts, her words, the comparison, the evidence and the unknown apart. The options were hers to raise. The clinician decided. The system saw nobody’s reproductive record."
        ar="شخص واحد، من البداية إلى النهاية. جاء الوعي الأبكر من سجلات اختارت مشاركتها. وأبقى الشرح الحقيقة وكلامها والمقارنة والدليل والمجهول منفصلين. كانت الخيارات لها أن تثيرها. وقررت الطبيبة. ولم يرَ النظام سجلًا إنجابيًا لأحد."
      />
      <Shown at={1}>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {parties.map(([title, body]) => (
            <li key={title} className="border-t border-ink pt-3">
              <h2 className="display text-[1.45rem] text-ink">{title}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{body}</p>
            </li>
          ))}
        </ol>
        <p className="display mt-12 max-w-3xl text-[clamp(2rem,5vw,3.4rem)] leading-[1.08] text-accent">
          {ar ? "اتجاه وثقة — لا درجة واحدة أبدًا." : "Direction and confidence — never a single score."}
        </p>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-3">
          {ar
            ? "الثقة هنا كلمات عن مدى كفاية المقارنة، لا رقم يلخّص الصحة الإنجابية. هذا عرض اصطناعي. وهو ليس اعتمادًا سريريًا ولا اتصالًا بسجل صحي حقيقي."
            : "Confidence here is words about how far a comparison can go, not a number that sums up reproductive health. This is a synthetic demonstration. It is not clinical validation and not a connection to a real health record."}
        </p>
      </Shown>
    </article>
  );
}
