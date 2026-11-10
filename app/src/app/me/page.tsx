import Image from "next/image";
import Link from "next/link";
import { PHOTOS } from "@/lib/media";
import { Onboarding } from "@/components/onboarding";
import { TrajectoryChart } from "@/components/trajectory-chart";
import { Pill, SectionTitle, Shell, URGENCY_PILL, VERDICT_PILL } from "@/components/ui";
import { SURE_ITEMS, WORRY_LABELS, beliefItems, beliefScore } from "@/lib/checks";
import { answersFromRecords } from "@/lib/profile";
import { INTENTION_LABEL, TOUCHPOINT_LABEL } from "@/lib/model";
import { ALL_SOURCES, OPTION_LABEL, RULES, signalsFor, visibleRecord } from "@/lib/signals";
import { completeAfterCheck, requestConversation, setReminder } from "@/server/actions";
import { requireRole } from "@/server/session";
import { SubmitButton } from "@/components/submit-button";
import { personView, type PersonView } from "@/server/views";
import { aiEnabled } from "@/server/ai/gemini";
import { translator } from "@/server/lang";
import { formatDateIn, type Vars } from "@/lib/i18n";

type Tr = (text: string, vars?: Vars) => string;
import { AskButton, Companion } from "@/components/companion";
import { Reports } from "./reports";

// Per-user page: it reads the session on every request, so it is never prerendered.
export const instant = false;

export default async function MyPath() {
  const session = await requireRole("person");
  const v = personView(session.id);
  const { t, lang } = await translator();
  const fmt = (iso: string) => formatDateIn(lang, iso);
  const first = v.resident.name.split(" ")[0];

  if (!v.state.onboarded) {
    const hasSignal = signalsFor(visibleRecord(v.resident, ALL_SOURCES)).length > 0;
    return (
      <Shell session={session} minimal>
        <Onboarding
          firstName={first}
          touchpoint={v.resident.touchpoint}
          hasSignal={hasSignal}
          sex={v.resident.sex}
          defaults={answersFromRecords(v.resident)}
          lang={lang}
        />
      </Shell>
    );
  }

  const shared = Object.values(v.state.sources).filter(Boolean).length;
  const photo = v.resident.sex === "female" ? PHOTOS.personFemale : PHOTOS.personMale;

  return (
    <Shell session={session}>
      <header className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="relative mb-5 h-20 w-20 overflow-hidden rounded-[22px] ring-4 ring-indigo-50 md:hidden">
            <Image src={photo.src} alt={photo.alt} fill sizes="80px" className="object-cover object-top" />
          </div>
          <p className="eyebrow">
            {t("My path · after your {check} on {date}", { check: t(TOUCHPOINT_LABEL[v.resident.touchpoint.kind]), date: fmt(v.resident.touchpoint.at) })}
          </p>
          <h1 className="mt-3 text-[clamp(2.2rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-zinc-950">
            {t("{name}, here is your path.", { name: first })}
          </h1>
          <p className="mt-3 text-[15px] text-zinc-600">
            {t("Built only from the {n} of 5 sources you chose to share.", { n: shared })}{" "}
            <Link href="/me/privacy" className="font-medium text-indigo-600 underline-offset-4 hover:underline">
              {t("Change what you share")}
            </Link>
          </p>
        </div>
        <div className="relative hidden md:block">
          <div aria-hidden className="absolute -inset-4 -z-10 rounded-[32px] bg-gradient-to-br from-indigo-100 via-violet-50 to-white" />
          <div className="relative aspect-[4/3] overflow-hidden rounded-[24px]">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              priority
              sizes="(min-width: 768px) 35vw, 0px"
              className="ken-burns object-cover object-top"
            />
          </div>
          <div className="card absolute -bottom-4 -start-4 flex items-center gap-2.5 px-4 py-2.5 shadow-[var(--shadow-lift)]">
            <span aria-hidden className="h-2 w-2 rounded-full bg-indigo-600" />
            <span className="text-[13px] font-medium">
              {v.signals.length
                ? t(v.signals.length > 1 ? "{n} things worth talking about" : "1 thing worth talking about", { n: v.signals.length })
                : t("Nothing to worry about on record")}
            </span>
          </div>
        </div>
      </header>

      <SignalPanel v={v} t={t} />

      {v.state.remindAt && !v.state.request && v.signals.length ? (
        <div className="reveal mt-6 flex flex-wrap items-center gap-4 rounded-[20px] border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="flex-1 text-[14px] text-amber-950">
            {v.reminderDue
              ? t("You asked us to remind you. Is now a good time to ask your doctor for a conversation?")
              : t("We'll remind you on {date}. In the pilot this also comes as a text message.", { date: fmt(v.state.remindAt) })}
          </p>
          <form action={setReminder.bind(null, 0)}>
            <SubmitButton pendingLabel={t("Saving")} className="text-[13.5px] font-medium text-amber-900 underline underline-offset-4">
              {v.reminderDue ? t("Dismiss") : t("Cancel reminder")}
            </SubmitButton>
          </form>
        </div>
      ) : null}

      <Reports personId={session.id} reports={v.state.reports} t={t} fmt={fmt} lang={lang} />

      <section className="reveal mt-14">
        <SectionTitle n={1} title={t("What do we know?")} body={t("What is on record, and which parts you can and can't change.")} />
        <div className="grid gap-3 sm:grid-cols-2">
          {v.factors.map((f) => (
            <div key={f.label + f.value} className="card flex items-start gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-zinc-400">{t(f.label)}</p>
                <p className="mt-1 text-[16px] font-semibold text-zinc-950">{t(f.value)}</p>
                <p className="mt-1 text-[13px] text-zinc-600">{t(f.note)}</p>
              </div>
              <Pill tone={f.canChange ? "pine" : "stone"} dot={false}>
                {f.canChange ? t("You can change this") : t("Can't change")}
              </Pill>
            </div>
          ))}
        </div>
        {v.missing.length ? (
          <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 p-5">
            <p className="text-[14px] font-semibold text-zinc-950">{t("Not on record yet")}</p>
            <ul className="mt-2 space-y-1 text-[14px] text-zinc-600">
              {v.missing.map((m) => (
                <li key={m}>· {t(m)}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="reveal mt-14">
        <SectionTitle
          n={2}
          title={t("What's changing, and how sure are we?")}
          body={t("We only call something a real change when it is bigger than the normal ups and downs between tests.")}
        />
        {v.measures.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {v.measures.map((m) => (
              <article key={m.def.code} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-zinc-950">{t(m.def.label)}</h3>
                  <Pill tone={VERDICT_PILL[m.verdict].tone}>{t(VERDICT_PILL[m.verdict].label)}</Pill>
                </div>
                <p className="mt-1 text-[13.5px] text-zinc-600">{t(m.sentence)}</p>
                <div className="mt-3">
                  <TrajectoryChart view={m} lang={lang} />
                </div>
                <p className="mt-2 border-t border-zinc-200/70 pt-2.5 text-[12px] text-zinc-500">{t("Rule: {rule}", { rule: t(m.def.rule) })}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="card p-5 text-[15px] text-zinc-600">{t("Nothing you shared has readings over time yet, so no change can be described.")}</p>
        )}
        {v.signals.length ? (
          <div className="mt-4 rounded-2xl bg-zinc-100 p-5">
            <p className="text-[14px] font-semibold text-zinc-950">{t("What this can't tell you")}</p>
            <ul className="mt-2 space-y-1 text-[14px] text-zinc-600">
              {[...new Set(v.signals.map((s) => RULES[s.code].cannotTell))].map((c) => (
                <li key={c}>· {t(c)}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section id="next-step" className="reveal mt-14 scroll-mt-24">
        <SectionTitle n={3} title={t("What should I do next, and when?")} body={t("Options matched to what was found and your plans. You choose; your doctor advises.")} />
        <NextStep v={v} t={t} fmt={fmt} />
      </section>
      <Companion firstName={first} aiOn={aiEnabled()} lang={lang} />
    </Shell>
  );
}

const HEADLINE = {
  urgent: "Talk to your care team about this before treatment starts.",
  soon: "This is worth a conversation now rather than later.",
  routine: "This is worth raising at your next routine visit.",
} as const;

// Colours follow the timing, so how soon to act is the first thing people see.
const TONE = {
  urgent: { strip: "bg-rose-500", soft: "bg-rose-50", ink: "text-rose-700", ring: "ring-rose-200", bar: "bg-rose-500" },
  soon: { strip: "bg-amber-500", soft: "bg-amber-50", ink: "text-amber-700", ring: "ring-amber-200", bar: "bg-amber-500" },
  routine: { strip: "bg-indigo-500", soft: "bg-indigo-50", ink: "text-indigo-700", ring: "ring-indigo-200", bar: "bg-indigo-500" },
} as const;

const STRENGTH = { strong: 3, moderate: 2 } as Record<string, number>;

function SignalPanel({ v, t }: { v: PersonView; t: Tr }) {
  if (!v.state.scanning) {
    return (
      <div className="card mt-8 p-6">
        <p className="text-[16px] font-semibold text-zinc-950">{t("You have asked Masar not to keep an eye out.")}</p>
        <p className="mt-1 text-[14px] text-zinc-600">{t("Masar is not looking for anything new. You can turn this back on in My data.")}</p>
      </div>
    );
  }
  if (!v.signals.length || !v.urgency) {
    return (
      <div className="card mt-8 border-indigo-200/70 p-6 md:p-8">
        <Pill tone="pine">{t("Nothing needs a conversation right now")}</Pill>
        <p className="mt-4 font-semibold tracking-[-0.025em] text-[1.7rem] leading-snug text-zinc-950">{t("Nothing recorded so far points to a concern.")}</p>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-600">
          {t("That is not the same as a guarantee. Masar can only speak to what is on record, and some useful information isn't yet. If your records change, Masar looks again.")}
        </p>
      </div>
    );
  }

  const tone = TONE[v.urgency];
  return (
    <section aria-labelledby="found-title" className="reveal relative mt-8 overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-[0_24px_60px_-28px_rgb(24_24_27/0.35)]">
      <span aria-hidden className={`absolute inset-y-0 start-0 w-1.5 ${tone.strip}`} />

      <div className="flex flex-col gap-6 p-6 ps-8 md:flex-row md:items-start md:justify-between md:p-8 md:ps-10">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span aria-hidden className={`grid h-9 w-9 place-items-center rounded-full ${tone.soft} ${tone.ink}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7.5v5M12 16.2v.3" />
              </svg>
            </span>
            <span className="text-[13px] font-semibold text-zinc-500">{t("What Masar found")}</span>
            <span className={`rounded-full px-3 py-1 text-[12.5px] font-semibold ring-1 ring-inset ${tone.soft} ${tone.ink} ${tone.ring}`}>
              {t("Suggested timing")}: {t(URGENCY_PILL[v.urgency].label)}
            </span>
          </div>
          <h2 id="found-title" className="mt-4 text-[clamp(1.7rem,3.2vw,2.35rem)] font-semibold leading-[1.12] tracking-[-0.025em] text-zinc-950">
            {t(HEADLINE[v.urgency])}
          </h2>
          <p className="mt-3 flex items-start gap-2 text-[15px] leading-relaxed text-zinc-600">
            <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 shrink-0 text-indigo-500">
              <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" strokeLinejoin="round" />
            </svg>
            {t("This is not a diagnosis. It is a reason to talk to a doctor while you have the most options.")}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row md:flex-col">
          <a href="#next-step" className="rounded-full bg-indigo-600 px-5 py-3 text-center text-[14px] font-semibold text-white shadow-sm transition hover:bg-indigo-700">
            {v.state.request ? t("See your request") : t("Ask for a conversation")}
          </a>
          <AskButton
            text={t("Help me start the conversation with my doctor")}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-3 text-[14px] font-semibold text-zinc-900 transition hover:border-indigo-400"
          >
            <span aria-hidden className="orb" style={{ width: 18, height: 18 }}>
              <span className="orb__core" />
            </span>
            {t("Help me start")}
          </AskButton>
        </div>
      </div>

      <ol className="grid gap-px border-t border-zinc-200 bg-zinc-200 md:grid-cols-2">
        {v.signals.map((s, i) => {
          const rule = RULES[s.code];
          const strength = STRENGTH[rule.evidence.strength.toLowerCase()] ?? 1;
          return (
            <li key={s.code} className={`flex flex-col bg-white p-6 ps-8 md:ps-10 ${v.signals.length % 2 && i === v.signals.length - 1 ? "md:col-span-2" : ""}`}>
              <div className="flex items-start gap-3">
                <span className={`tabular grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[13px] font-bold ${tone.soft} ${tone.ink}`}>{i + 1}</span>
                <h3 className="pt-0.5 text-[17px] font-semibold leading-snug text-zinc-950">{t(rule.title)}</h3>
              </div>

              <p className="mt-4 text-[12px] font-semibold text-zinc-500">{t("Why Masar raised this")}</p>
              <ul className="mt-1.5 space-y-1.5">
                {s.reasons.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-[14px] text-zinc-800">
                    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" className="mt-[3px] shrink-0 text-indigo-500">
                      <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {t(r)}
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-[14px] leading-relaxed text-zinc-600">{t(rule.whyItMatters)}</p>

              <div className="mt-auto pt-5">
                <p className="rounded-xl bg-zinc-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-zinc-600">
                  <span className="font-semibold text-zinc-800">{t("What it can't tell you")}: </span>
                  {t(rule.cannotTell)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-zinc-500">
                  <span className="inline-flex items-center gap-1.5 font-medium text-zinc-700">
                    <span aria-hidden className="flex gap-0.5">
                      {[1, 2, 3].map((n) => (
                        <span key={n} className={`h-2.5 w-1 rounded-full ${n <= strength ? tone.bar : "bg-zinc-200"}`} />
                      ))}
                    </span>
                    {t("Evidence: {strength}", { strength: t(rule.evidence.strength.toLowerCase()) })}
                  </span>
                  <span>{rule.evidence.citation}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="flex items-center gap-2 border-t border-zinc-200 bg-zinc-50/80 px-6 py-3 ps-8 text-[12.5px] text-zinc-500 md:ps-10">
        <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 018 0v3" />
        </svg>
        {v.state.shareWithClinician
          ? t("Only you and your family doctor can see this. Never employers or insurers.")
          : t("Only you can see this. Your doctor sees it only if you allow it in My data.")}
      </p>
    </section>
  );
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
    if (!v.options.length) {
      return (
        <div className="card p-6">
          <p className="text-[15px] font-semibold text-zinc-950">{t("Nothing to arrange.")}</p>
          <p className="mt-1 text-[14px] text-zinc-600">
            {t("If you are planning children ({plans}), the items under “Not on record yet” are the most useful things to add.", {
              plans: v.record.intention ? t(INTENTION_LABEL[v.record.intention]).toLowerCase() : t("plans not shared"),
            })}
          </p>
        </div>
      );
    }
    const questions = [...new Set(v.signals.flatMap((s) => RULES[s.code].questions))];
    return (
      <form action={requestConversation} className="space-y-6">
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
