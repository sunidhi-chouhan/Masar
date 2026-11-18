import { Suspense } from "react";
import { Onboarding } from "@/components/onboarding";
import { Shell } from "@/components/ui";
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
import { LiveResident } from "@/components/prototype/live";
import { liveExtras, liveState, liveView } from "@/server/experience";
import { Reports } from "./reports";
import "@/components/prototype/prototype.css";

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

  // The latest resident experience: the same components as /prototype, on this account's own stored record.
  const lv = liveView(session.id);
  const initial = liveState(session.id, lang);
  const extras = liveExtras(v.state);
  const stamp = JSON.stringify([lang, initial.consent, v.state.request?.status ?? null, v.state.request?.decision ?? null, v.state.scanning, v.state.reports.map((r) => r.status), v.state.remindAt]);

  return (
    <Shell session={session} wide>
      <LiveResident
        resident={lv.resident}
        initial={initial}
        extras={extras}
        aiMode={aiMode()}
        stamp={stamp}
        slots={{
          banner:
            v.state.remindAt && !v.state.request && v.signals.length ? (
              <div className="mb-4 flex flex-wrap items-center gap-4 rounded-[14px] bg-soon-soft px-5 py-4">
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
            ) : null,
          reports: <Reports personId={session.id} reports={v.state.reports} t={t} fmt={fmt} lang={lang} aiReads={aiAllowedFor(session.id, "reportReading")} />,
          request: (
            <div className="mt-4">
              <NextStep v={v} t={t} fmt={fmt} />
            </div>
          ),
        }}
      />
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
      <form action={requestConversation} className="pt-card space-y-5">
        <div>
          <h3 className="text-[16px] font-semibold text-ink">{t("Ask your doctor for a conversation")}</h3>
          <p className="mt-1 text-[13.5px] text-ink-2">{t("Dr Layla Al Hashimi reviews your request. Nothing is sent until you press the button.")}</p>
        </div>
        <fieldset className="grid gap-3 md:grid-cols-3">
          <legend className="mb-3 text-[14px] font-semibold text-ink">{t("Choose what you would like")}</legend>
          {v.options.map((o, i) => (
            <label key={o} className="cursor-pointer">
              <input type="radio" name="option" value={o} defaultChecked={i === 0} className="peer sr-only" />
              <span className="block h-full rounded-[18px] border border-rule bg-surface p-4 transition-colors hover:border-rule-strong peer-checked:border-accent peer-checked:bg-accent-soft/40 peer-checked:shadow-[0_0_0_3px_var(--color-accent-soft)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                <span className="block text-[15px] font-semibold text-ink">{t(OPTION_LABEL[o].title)}</span>
                <span className="mt-1 block text-[13.5px] text-ink-2">{t(OPTION_LABEL[o].body)}</span>
                <span className="mt-3 block border-t border-rule pt-2.5 text-[12.5px] text-ink-3">
                  <span className="font-medium text-ink-2">{t("What happens next:")} </span>
                  {t(OPTION_LABEL[o].next)}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        <fieldset className="rounded-[18px] bg-zinc-50 p-4">
          <legend className="sr-only">{t("Questions to bring")}</legend>
          <p className="text-[14px] font-semibold text-ink">{t("Questions to bring")}</p>
          <p className="text-[13px] text-ink-3">{t("Your doctor sees the ones you tick.")}</p>
          <div className="mt-3 space-y-2">
            {questions.map((q, i) => (
              <label key={q} className="flex cursor-pointer items-start gap-3 text-[14px] text-ink">
                <input type="checkbox" name="question" value={q} defaultChecked={i < 2} className="mt-1 h-4 w-4 accent-[var(--color-accent)]" />
                {t(q)}
              </label>
            ))}
          </div>
          <textarea
            name="own_question"
            rows={2}
            placeholder={t("Add your own question")}
            className="pt-input mt-3 !h-auto py-2.5"
          />
        </fieldset>
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton pendingLabel={t("Sending to your doctor")} className="btn btn-primary">
            {t("Ask for this conversation")}
          </SubmitButton>
          {v.state.remindAt ? null : (
            <SubmitButton formAction={setReminder.bind(null, 14)} pendingLabel={t("Saving")} className="btn btn-secondary">
              {t("Not ready yet, remind me in 2 weeks")}
            </SubmitButton>
          )}
        </div>
        {!v.state.shareWithClinician ? (
          <p className="text-[13px] text-urgent">{t("Your doctor can only see this if you allow it in My data.")}</p>
        ) : null}
      </form>
    );
  }

  const at = STATUS_STEPS.findIndex((s) => s.key === req.status);
  const before = beliefScore(v.resident.sex, v.state.beliefsBefore);
  const after = beliefScore(v.resident.sex, v.state.beliefsAfter);

  return (
    <div className="space-y-5">
      <div className="pt-card">
        <p className="text-[13px] text-ink-3">{t("You asked for")}</p>
        <p className="mt-1 text-[18px] font-semibold text-ink">{t(OPTION_LABEL[req.option].title)}</p>
        <ol className="mt-5 grid gap-2 sm:grid-cols-4">
          {STATUS_STEPS.map((s, i) => (
            <li key={s.key}>
              <span className={`block h-1.5 rounded-full ${i <= at ? "bg-accent" : "bg-rule"}`} />
              <span className={`mt-2 block text-[13px] ${i <= at ? "font-medium text-ink" : "text-ink-3"}`}>{t(s.label)}</span>
            </li>
          ))}
        </ol>
        {req.decision ? (
          <p className="mt-5 rounded-[12px] bg-zinc-50 px-4 py-3 text-[14px] text-ink">
            {req.decision === "Accept" && t("Dr Layla agreed and will arrange it.")}
            {req.decision === "Modify" && t("Dr Layla agreed and added a test first, so the conversation can tell you more.")}
            {req.decision === "Override" && t("Dr Layla suggested a different approach: {reason}", { reason: req.reason ?? "" })}
            {req.note ? ` “${req.note}”` : ""}
          </p>
        ) : null}
        {req.bookedFor ? <p className="mt-3 text-[14px] text-ink-2">{t("Appointment: {date}", { date: fmt(req.bookedFor) })}</p> : null}
      </div>

      {req.status === "attended" && !v.state.beliefsAfter ? (
        <form action={completeAfterCheck} className="pt-card space-y-5">
          <div>
            <p className="text-[16px] font-semibold text-ink">{t("After your conversation: four quick questions")}</p>
            <p className="text-[13.5px] text-ink-3">{t("This is how Masar checks it actually helped.")}</p>
          </div>
          {SURE_ITEMS.map((q, i) => (
            <fieldset key={q} className="flex flex-wrap items-center justify-between gap-3">
              <legend className="sr-only">{t(q)}</legend>
              <span className="text-[14px] text-ink">{t(q)}</span>
              <span className="flex gap-2">
                {["yes", "no"].map((a) => (
                  <label key={a} className="cursor-pointer">
                    <input type="radio" name={`sure_${i}`} value={a} defaultChecked={a === "yes"} className="peer sr-only" />
                    <span className="block rounded-full border border-rule-strong px-4 py-1.5 text-[13px] capitalize peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-ink">
                      {t(a === "yes" ? "Yes" : "No")}
                    </span>
                  </label>
                ))}
              </span>
            </fieldset>
          ))}
          <div className="border-t border-rule pt-5">
            {beliefItems(v.resident.sex).map((item, i) => (
              <fieldset key={item.text} className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <legend className="sr-only">{t(item.text)}</legend>
                <span className="text-[14px] text-ink">{t(item.text)}</span>
                <span className="flex gap-2">
                  {[
                    ["true", "True"],
                    ["false", "False"],
                    ["unsure", "Not sure"],
                  ].map(([value, label]) => (
                    <label key={value} className="cursor-pointer">
                      <input type="radio" name={`belief_${i}`} value={value} defaultChecked={value === "unsure"} className="peer sr-only" />
                      <span className="block rounded-full border border-rule-strong px-3 py-1.5 text-[13px] peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-ink">
                        {t(label)}
                      </span>
                    </label>
                  ))}
                </span>
              </fieldset>
            ))}
            <fieldset className="flex flex-wrap items-center justify-between gap-3">
              <legend className="sr-only">{t("Worry")}</legend>
              <span className="text-[14px] text-ink">{t("How worried do you feel now?")}</span>
              <select name="worry" defaultValue="1" className="rounded-full border border-rule-strong px-3 py-1.5 text-[13px]">
                {WORRY_LABELS.map((l, i) => (
                  <option key={l} value={i + 1}>
                    {t(l)}
                  </option>
                ))}
              </select>
            </fieldset>
          </div>
          <SubmitButton className="btn btn-primary">{t("Save")}</SubmitButton>
        </form>
      ) : null}

      {v.state.beliefsAfter && v.state.sure ? (
        <div className="pt-card">
          <p className="text-[16px] font-semibold text-ink">{t("Before and after")}</p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-[12.5px] text-ink-3">{t("Fertility facts right")}</dt>
              <dd className="tabular mt-1 text-2xl font-semibold text-ink">
                {before} → {after} <span className="text-base font-normal text-ink-3">{t("of {n}", { n: 3 })}</span>
              </dd>
            </div>
            <div>
              <dt className="text-[12.5px] text-ink-3">{t("Felt sure about next steps")}</dt>
              <dd className="tabular mt-1 text-2xl font-semibold text-ink">
                {v.state.sure.filter(Boolean).length} <span className="text-base font-normal text-ink-3">{t("of {n}", { n: 4 })}</span>
              </dd>
            </div>
            <div>
              <dt className="text-[12.5px] text-ink-3">{t("Worry")}</dt>
              <dd className="mt-1 text-[15px] font-semibold text-ink">
                {t(WORRY_LABELS[(v.state.worryBefore ?? 2) - 1])} → {t(WORRY_LABELS[(v.state.worryAfter ?? 2) - 1])}
              </dd>
            </div>
          </dl>
          <ul className="mt-5 space-y-1 border-t border-rule pt-4 text-[13.5px] text-ink-2">
            {beliefItems(v.resident.sex).map((b) => (
              <li key={b.text}>
                · <span className="font-medium text-ink">{b.correct === "true" ? t("True") : t("False")}:</span> {t(b.text)} {t(b.explain)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
