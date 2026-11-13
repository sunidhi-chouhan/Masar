import { Suspense } from "react";
import { Onboarding } from "@/components/onboarding";
import { Shell } from "@/components/ui";
import { DashSection, Explore, Insights, KnowledgeBoard, Overview, OverTime, Prepare, ReportTeaser, type Tx } from "@/components/dashboard/sections";
import { SectionNav } from "@/components/dashboard/section-nav";
import { dashboardFor } from "@/server/dashboard";
import { SURE_ITEMS, WORRY_LABELS, beliefItems, beliefScore } from "@/lib/checks";
import { SOURCES } from "@/lib/model";
import { OPTION_LABEL, RULES } from "@/lib/signals";
import { completeAfterCheck, requestConversation, setReminder } from "@/server/actions";
import { requireRole } from "@/server/session";
import { SubmitButton } from "@/components/submit-button";
import { personView, type PersonView } from "@/server/views";
import { aiAllowedFor, aiMode } from "@/server/ai/gemini";
import { accessLog } from "@/server/store";
import type { ConsentItem } from "@/components/journey/consent-step";
import { translator } from "@/server/lang";
import { formatDateIn, type Vars } from "@/lib/i18n";
import { Companion, type AskIntent } from "@/components/companion";
import { Reports } from "./reports";

type Tr = (text: string, vars?: Vars) => string;

// Per-user page: it reads the session on every request, so it is never prerendered.
export const instant = false;

export default async function MyPath() {
  const session = await requireRole("person");
  const v = personView(session.id);
  const { t, lang } = await translator();
  const fmt = (iso: string) => formatDateIn(lang, iso);
  const first = v.resident.name.split(" ")[0];

  if (!v.state.onboarded) {
    // Nothing is looked for or revealed before the person chooses what Masar may use.
    return (
      <Shell session={session} minimal>
        <Suspense fallback={<div className="flex-1" aria-busy="true" />}>
          <Onboarding
            personId={session.id}
            firstName={first}
            sex={v.resident.sex}
            lang={lang}
            initial={{
              step: v.state.journey.step,
              startedAt: v.state.journey.startedAt,
              answers: v.state.sources.self ? v.state.journey.answers : {},
              knowledge: v.state.sources.self ? [...(v.state.beliefsBefore ?? []), v.state.journey.knowledgeExtra] : [],
              worry: v.state.sources.self ? v.state.worryBefore : null,
            }}
            consent={consentItems(session.id)}
            aiMode={aiMode()}
          />
        </Suspense>
      </Shell>
    );
  }

  // Translates a line and any words inside it.
  const say = (line: { text: string; vars?: Record<string, string | number> }) =>
    t(line.text, line.vars && Object.fromEntries(Object.entries(line.vars).map(([k, x]) => [k, typeof x === "string" ? t(x) : x])));
  const x: Tx = { t, lang, date: fmt, say };
  const d = dashboardFor(v);
  const aiOn = aiAllowedFor(session.id, "assistant");
  const mode = aiMode();

  // The overview summary: the assistant's, only with consent and in this language; otherwise Masar's own.
  // Shown only when the assistant (or its labelled demo mock) wrote it, with consent: otherwise the dashboard is the summary.
  const stored = v.state.assistantConsent && v.state.journey.summary?.lang === lang ? v.state.journey.summary : null;
  const summaryLines = stored
    ? [...stored.data.reproductive_goals.slice(0, 1), ...stored.data.health_context.slice(0, 2), ...stored.data.areas_to_explore.slice(0, 2), ...stored.data.missing_information.slice(0, 1)].slice(0, 6)
    : [];

  const nav = [
    { id: "overview", label: t("Overview") },
    { id: "insights", label: t("What stood out") },
    { id: "over-time", label: t("Over time") },
    { id: "explore", label: t("What next") },
    { id: "prepare", label: t("Your doctor") },
    { id: "report", label: t("Report") },
  ];

  // The assistant's starting points, from this person's own dashboard.
  const starters: { label: string; intent: AskIntent }[] = [
    ...(d.insights[0] ? [{ label: t("Why does “{title}” matter for me?", { title: t(d.insights[0].title) }), intent: { kind: "insight" as const, code: d.insights[0].code } }] : []),
    { label: t("What's still unknown about me?"), intent: { kind: "unknown" } },
    ...(d.series[0] ? [{ label: t("What does the {test} measure, and what can't it tell me?", { test: t(d.series[0].label) }), intent: { kind: "measure" as const, code: d.series[0].code } }] : []),
    { label: t("What should I ask my doctor?"), intent: { kind: "questions" } },
    { label: t("What information do you have about me?"), intent: { kind: "known" } },
  ];

  return (
    <Shell session={session} wide>
      <SectionNav items={nav} label={t("Sections of your path")} />

      {v.state.remindAt && !v.state.request && v.signals.length ? (
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-[14px] bg-soon-soft px-5 py-4">
          <p className="flex-1 text-[15px] text-ink">
            {v.reminderDue
              ? t("You asked us to remind you. Is now a good time to ask your doctor for a conversation?")
              : t("We'll remind you on {date}. In the pilot this also comes as a text message.", { date: fmt(v.state.remindAt) })}
          </p>
          <form action={setReminder.bind(null, 0)}>
            <SubmitButton pendingLabel={t("Saving")} className="min-h-[44px] text-[14px] font-medium text-soon underline underline-offset-4">
              {v.reminderDue ? t("Dismiss") : t("Cancel reminder")}
            </SubmitButton>
          </form>
        </div>
      ) : null}

      <section id="overview" aria-label={t("Overview")} className="scroll-mt-32">
        <Overview
          d={d}
          x={x}
          shared={{ doctor: v.state.shareWithClinician, assistant: !v.state.assistantConsent ? "off" : aiOn ? "on" : mode === "mock" ? "mock" : "notConnected" }}
          summary={{ lines: summaryLines, from: stored?.source ?? "masar" }}
        />
      </section>

      <DashSection
        id="insights"
        n={2}
        icon="spark"
        title={t("What stood out in your record")}
        body={t("For each thing we noticed: why it came up, why it matters, how strong the evidence is, and what it can't tell you.")}
      >
        <Insights d={d} x={x} />
        <div id="known" className="scroll-mt-32 pt-8">
          <h3 className="display mb-4 text-[1.45rem] text-ink">{t("What we know, what we don't, and what to ask about")}</h3>
          <KnowledgeBoard d={d} x={x} />
        </div>
      </DashSection>

      <DashSection
        id="over-time"
        n={3}
        icon="chart"
        title={t("How things have changed over time")}
        body={t("These are your actual results, from what you chose to share. We only call something a real change when it's bigger than the usual ups and downs between tests.")}
      >
        <OverTime d={d} x={x}>
          <Reports personId={session.id} reports={v.state.reports} t={t} fmt={fmt} lang={lang} aiReads={aiAllowedFor(session.id, "reportReading")} />
        </OverTime>
      </DashSection>

      <DashSection id="explore" n={4} icon="compass" title={t("What you could do next")} body={t("Each idea says why it's here. You decide what, if anything, to do.")}>
        <Explore d={d} x={x} />
      </DashSection>

      <DashSection id="prepare" n={5} icon="clipboard" title={t("Prepare for your doctor")} body={t("Questions to ask, things to bring, and a short summary you can show your doctor.")}>
        <Prepare d={d} x={x} personId={session.id}>
          <NextStep v={v} t={t} fmt={fmt} />
        </Prepare>
      </DashSection>

      <DashSection id="report" n={6} icon="doc" title={t("Your personal health report")} body={t("Everything on this page in one document you can print or save, with where each piece came from.")}>
        <ReportTeaser d={d} x={x} />
      </DashSection>

      <Companion firstName={first} aiOn={aiOn} mock={mode === "mock" && v.state.assistantConsent} lang={lang} starters={starters} />
    </Shell>
  );
}

/** Each permission's state, from the stored choices and the person's own access log. */
function consentItems(id: string): ConsentItem[] {
  const p = personView(id).state;
  const log = accessLog(id).map((a) => a.what);
  const status = (on: boolean, stopped: string) => (on ? "granted" : log.includes(stopped) ? "revoked" : "none") as ConsentItem["status"];
  return [
    ...SOURCES.map((src) => ({ key: src.id, on: p.sources[src.id], status: status(p.sources[src.id], `Stopped sharing: ${src.label}`) })),
    { key: "share" as const, on: p.shareWithClinician, status: status(p.shareWithClinician, "Stopped your doctor seeing your summary") },
    { key: "assistant" as const, on: p.assistantConsent, status: status(p.assistantConsent, "Stopped Masar's assistant reading your summary") },
    { key: "reading" as const, on: p.reportReadingConsent, status: status(p.reportReadingConsent, "Stopped Masar's assistant reading your uploaded reports") },
  ];
}

const STATUS_STEPS = [
  { key: "requested", label: "You asked" },
  { key: "reviewed", label: "Your doctor reviewed" },
  { key: "booked", label: "Appointment booked" },
  { key: "attended", label: "Conversation held" },
] as const;

function NextStep({ v, t, fmt }: { v: PersonView; t: Tr; fmt: (iso: string) => string }) {
  const req = v.state.request;

  if (!req) {
    // Nothing to request: the sections above already cover what could help.
    if (!v.options.length) return null;
    const questions = [...new Set(v.signals.flatMap((s) => RULES[s.code].questions))];
    return (
      <form action={requestConversation} className="dash-card space-y-6">
        <div>
          <h3 className="text-[16px] font-semibold text-ink">{t("Ask your doctor for a conversation")}</h3>
          <p className="mt-1 text-[13.5px] text-ink-2">{t("Dr Layla Al Hashimi reviews your request. Nothing is sent until you press the button.")}</p>
        </div>
        <fieldset className="grid gap-3 md:grid-cols-2">
          <legend className="mb-3 text-[14px] font-semibold text-zinc-950">{t("Choose what you would like")}</legend>
          {v.options.map((o, i) => (
            <label key={o} className="cursor-pointer">
              <input type="radio" name="option" value={o} defaultChecked={i === 0} className="peer sr-only" />
              <span className="card block h-full p-5 transition-colors peer-checked:border-indigo-500 peer-checked:shadow-[0_0_0_3px_var(--color-indigo-50)]">
                <span className="block text-[15px] font-semibold text-zinc-950">{t(OPTION_LABEL[o].title)}</span>
                <span className="mt-1 block text-[13.5px] text-zinc-600">{t(OPTION_LABEL[o].body)}</span>
                <span className="mt-3 block border-t border-zinc-200/80 pt-2.5 text-[12.5px] text-zinc-500">
                  <span className="font-medium text-zinc-700">{t("What happens next:")} </span>
                  {t(OPTION_LABEL[o].next)}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        <fieldset className="card p-5">
          <legend className="sr-only">{t("Questions to bring")}</legend>
          <p className="text-[14px] font-semibold text-zinc-950">{t("Questions to bring")}</p>
          <p className="text-[13px] text-zinc-500">{t("Your doctor sees the ones you tick.")}</p>
          <div className="mt-3 space-y-2">
            {questions.map((q, i) => (
              <label key={q} className="flex cursor-pointer items-start gap-3 text-[14px] text-zinc-800">
                <input type="checkbox" name="question" value={q} defaultChecked={i < 2} className="mt-1 h-4 w-4 accent-[var(--color-indigo-600)]" />
                {t(q)}
              </label>
            ))}
          </div>
          <textarea
            name="own_question"
            rows={2}
            placeholder={t("Add your own question")}
            className="mt-3 w-full rounded-xl border border-zinc-300 px-3 py-2 text-[14px] outline-none focus:border-indigo-500"
          />
        </fieldset>
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton pendingLabel={t("Sending to your doctor")} className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
            {t("Ask for this conversation")}
          </SubmitButton>
          {v.state.remindAt ? null : (
            <SubmitButton formAction={setReminder.bind(null, 14)} pendingLabel={t("Saving")} className="rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800 hover:border-zinc-400">
              {t("Not ready yet, remind me in 2 weeks")}
            </SubmitButton>
          )}
        </div>
        {!v.state.shareWithClinician ? (
          <p className="text-[13px] text-rose-700">{t("Your doctor can only see this if you allow it in My data.")}</p>
        ) : null}
      </form>
    );
  }

  const at = STATUS_STEPS.findIndex((s) => s.key === req.status);
  const before = beliefScore(v.resident.sex, v.state.beliefsBefore);
  const after = beliefScore(v.resident.sex, v.state.beliefsAfter);

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <p className="text-[13px] text-zinc-500">{t("You asked for")}</p>
        <p className="mt-1 text-[18px] font-semibold text-zinc-950">{t(OPTION_LABEL[req.option].title)}</p>
        <ol className="mt-5 grid gap-2 sm:grid-cols-4">
          {STATUS_STEPS.map((s, i) => (
            <li key={s.key}>
              <span className={`block h-1.5 rounded-full ${i <= at ? "bg-amber-500" : "bg-zinc-200"}`} />
              <span className={`mt-2 block text-[13px] ${i <= at ? "font-medium text-zinc-950" : "text-zinc-400"}`}>{t(s.label)}</span>
            </li>
          ))}
        </ol>
        {req.decision ? (
          <p className="mt-5 rounded-xl bg-zinc-100 px-4 py-3 text-[14px] text-zinc-800">
            {req.decision === "Accept" && t("Dr Layla agreed and will arrange it.")}
            {req.decision === "Modify" && t("Dr Layla agreed and added a test first, so the conversation can tell you more.")}
            {req.decision === "Override" && t("Dr Layla suggested a different approach: {reason}", { reason: req.reason ?? "" })}
            {req.note ? ` “${req.note}”` : ""}
          </p>
        ) : null}
        {req.bookedFor ? <p className="mt-3 text-[14px] text-zinc-600">{t("Appointment: {date}", { date: fmt(req.bookedFor) })}</p> : null}
      </div>

      {req.status === "attended" && !v.state.beliefsAfter ? (
        <form action={completeAfterCheck} className="card space-y-5 p-6">
          <div>
            <p className="text-[16px] font-semibold text-zinc-950">{t("After your conversation: four quick questions")}</p>
            <p className="text-[13.5px] text-zinc-500">{t("This is how Masar checks it actually helped.")}</p>
          </div>
          {SURE_ITEMS.map((q, i) => (
            <fieldset key={q} className="flex flex-wrap items-center justify-between gap-3">
              <legend className="sr-only">{t(q)}</legend>
              <span className="text-[14px] text-zinc-800">{t(q)}</span>
              <span className="flex gap-2">
                {["yes", "no"].map((a) => (
                  <label key={a} className="cursor-pointer">
                    <input type="radio" name={`sure_${i}`} value={a} defaultChecked={a === "yes"} className="peer sr-only" />
                    <span className="block rounded-full border border-zinc-300 px-4 py-1.5 text-[13px] capitalize peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:text-indigo-600">
                      {t(a === "yes" ? "Yes" : "No")}
                    </span>
                  </label>
                ))}
              </span>
            </fieldset>
          ))}
          <div className="border-t border-zinc-200 pt-5">
            {beliefItems(v.resident.sex).map((item, i) => (
              <fieldset key={item.text} className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <legend className="sr-only">{t(item.text)}</legend>
                <span className="text-[14px] text-zinc-800">{t(item.text)}</span>
                <span className="flex gap-2">
                  {[
                    ["true", "True"],
                    ["false", "False"],
                    ["unsure", "Not sure"],
                  ].map(([value, label]) => (
                    <label key={value} className="cursor-pointer">
                      <input type="radio" name={`belief_${i}`} value={value} defaultChecked={value === "unsure"} className="peer sr-only" />
                      <span className="block rounded-full border border-zinc-300 px-3 py-1.5 text-[13px] peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:text-indigo-600">
                        {t(label)}
                      </span>
                    </label>
                  ))}
                </span>
              </fieldset>
            ))}
            <fieldset className="flex flex-wrap items-center justify-between gap-3">
              <legend className="sr-only">{t("Worry")}</legend>
              <span className="text-[14px] text-zinc-800">{t("How worried do you feel now?")}</span>
              <select name="worry" defaultValue="1" className="rounded-full border border-zinc-300 px-3 py-1.5 text-[13px]">
                {WORRY_LABELS.map((l, i) => (
                  <option key={l} value={i + 1}>
                    {t(l)}
                  </option>
                ))}
              </select>
            </fieldset>
          </div>
          <SubmitButton className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">{t("Save")}</SubmitButton>
        </form>
      ) : null}

      {v.state.beliefsAfter && v.state.sure ? (
        <div className="card p-6">
          <p className="text-[16px] font-semibold text-zinc-950">{t("Before and after")}</p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-[12.5px] text-zinc-500">{t("Fertility facts right")}</dt>
              <dd className="tabular mt-1 text-2xl font-semibold text-zinc-950">
                {before} → {after} <span className="text-base font-normal text-zinc-500">{t("of {n}", { n: 3 })}</span>
              </dd>
            </div>
            <div>
              <dt className="text-[12.5px] text-zinc-500">{t("Felt sure about next steps")}</dt>
              <dd className="tabular mt-1 text-2xl font-semibold text-zinc-950">
                {v.state.sure.filter(Boolean).length} <span className="text-base font-normal text-zinc-500">{t("of {n}", { n: 4 })}</span>
              </dd>
            </div>
            <div>
              <dt className="text-[12.5px] text-zinc-500">{t("Worry")}</dt>
              <dd className="mt-1 text-[15px] font-semibold text-zinc-950">
                {t(WORRY_LABELS[(v.state.worryBefore ?? 2) - 1])} → {t(WORRY_LABELS[(v.state.worryAfter ?? 2) - 1])}
              </dd>
            </div>
          </dl>
          <ul className="mt-5 space-y-1 border-t border-zinc-200 pt-4 text-[13.5px] text-zinc-600">
            {beliefItems(v.resident.sex).map((b) => (
              <li key={b.text}>
                · <span className="font-medium text-zinc-950">{b.correct === "true" ? t("True") : t("False")}:</span> {t(b.text)} {t(b.explain)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
