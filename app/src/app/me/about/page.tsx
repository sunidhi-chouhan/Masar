import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/ui";
import { AboutEditor } from "@/components/journey/about-editor";
import { RefreshSummary } from "@/components/dashboard/refresh-summary";
import { Icon } from "@/components/dashboard/icons";
import { answersFromRecords } from "@/lib/profile";
import { CHAPTERS, EXTRA_STATEMENT, fromRuleAnswers, labelOf, visibleQuestions } from "@/lib/journey";
import { beliefItems } from "@/lib/checks";
import { requireRole } from "@/server/session";
import { personView } from "@/server/views";
import { translator } from "@/server/lang";
import { aiMode } from "@/server/ai/gemini";

// About me: the person's own profile. What they told Masar, chapter by
// chapter, each answer changeable in place (saved only while "Your answers"
// is on); the two final questions with who chose them; and the quick check
// with what the evidence says. Findings update from Masar's rules as soon as
// answers change; the assistant's summary is rewritten only on request and
// only with its permission.

export const instant = false;

const SOURCE_LABEL = {
  ai: "Chosen by Google Gemini, checked by Masar",
  mock: "Chosen by the Gemini demo mock (no live model call)",
  fallback: "Chosen by Masar around what you shared",
} as const;

export default async function AboutMe() {
  const session = await requireRole("person");
  const v = personView(session.id);
  if (!v.state.onboarded) redirect("/me");
  const { t, lang } = await translator();
  const s = v.state;
  const sex = v.resident.sex;
  const answers = Object.keys(s.journey.answers).length ? s.journey.answers : s.sources.self ? fromRuleAnswers(sex, s.answers ?? answersFromRecords(v.resident)) : {};
  const visible = visibleQuestions(sex, answers);
  const goal = visible.find((q) => q.id === "goal");
  const goalLabel = goal ? labelOf(goal, answers.goal) : null;
  const items = [...beliefItems(sex), EXTRA_STATEMENT];
  const beliefs = s.sources.self && s.beliefsBefore ? [...s.beliefsBefore, s.journey.knowledgeExtra] : null;
  const fu = s.sources.self ? s.journey.followUps : null;
  const initials = v.resident.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <Shell session={session} wide>
      {/* Profile */}
      <div className="dash-card dash-hero grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center">
        <span aria-hidden className="grid h-20 w-20 place-items-center rounded-full bg-ink font-display text-[1.9rem] text-paper">
          {initials}
        </span>
        <div>
          <p className="eyebrow">{t("About me")}</p>
          <h1 className="display mt-1 text-[clamp(1.8rem,3.4vw,2.4rem)] leading-tight text-ink">{v.resident.name}</h1>
          <ul className="mt-3 flex flex-wrap gap-2 text-[12.5px]">
            <li className="dash-chip">{t("Age {age}", { age: v.resident.age })}</li>
            {goalLabel ? <li className="dash-chip">{t(goalLabel)}</li> : null}
            <li className="dash-chip">
              <Icon name="shield" className="h-4 w-4" />
              {s.sources.self ? t("Your answers are used") : t("Your answers are switched off")}
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <Link href="/me" className="btn btn-primary">
            {t("See my path")}
          </Link>
          <Link href="/me/privacy" className="btn btn-secondary">
            {t("What I share")}
          </Link>
        </div>
      </div>

      {!s.sources.self ? (
        <p className="mt-4 flex items-start gap-2 rounded-[14px] bg-soon-soft px-4 py-3 text-[14px] text-ink">
          <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-soon" />
          {t("“Your answers” is switched off, so Masar doesn't keep or use what you tell it. Switch it on in My data to save answers here.")}
        </p>
      ) : null}

      {/* At a glance: one tile per chapter */}
      <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {CHAPTERS.map((c, i) => {
          const qs = visible.filter((q) => q.chapter === c.id);
          const answered = qs.filter((q) => labelOf(q, answers[q.id]));
          return (
            <li key={c.id}>
              <a href={`#chapter-${c.id}`} className="dash-card dash-stat block !p-4">
                <span className="font-mono text-[11.5px] text-ink-3">{String.fromCharCode(65 + i)}</span>
                <span className="mt-1 block text-[14.5px] font-semibold text-ink">{t(c.title)}</span>
                <span className="mt-1 block text-[12.5px] text-ink-2">{t("{n} of {total} answered", { n: answered.length, total: qs.length })}</span>
              </a>
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="answers-title" className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="answers-title" className="display text-[1.7rem] text-ink">
              {t("Your answers")}
            </h2>
            <p className="mt-1 text-[14.5px] text-ink-2">{t("Change anything that's different now. Your findings update from Masar's rules as soon as you save.")}</p>
          </div>
        </div>
        <AboutEditor sex={sex} lang={lang} initial={answers} />
      </section>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        {/* The final two */}
        <section aria-labelledby="final-title" className="dash-card">
          <h2 id="final-title" className="flex items-center gap-2 text-[16.5px] font-semibold text-ink">
            <Icon name="spark" className="h-5 w-5 text-ink-2" />
            {t("Your two final questions")}
          </h2>
          {fu && fu.questions.length ? (
            <>
              <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-3">
                <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${fu.source === "fallback" ? "bg-ink-3" : "bg-date"}`} />
                {t(SOURCE_LABEL[fu.source])}
              </p>
              <ul className="mt-3 space-y-3">
                {fu.questions.map((q) => {
                  const a = q.options.find((o) => o.value === s.journey.followUpAnswers[q.id]);
                  const show = (x: string) => (fu.source === "ai" ? x : t(x));
                  return (
                    <li key={q.id} className="rounded-[14px] border border-rule p-3">
                      <p className="text-[13.5px] text-ink-3">{show(q.text)}</p>
                      <p className={`mt-1 text-[14.5px] ${a ? "font-medium text-ink" : "text-ink-3"}`}>{a ? show(a.label) : t("Skipped")}</p>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="mt-2 text-[14px] text-ink-3">{t("None: they're asked only when “Your answers” is on.")}</p>
          )}
        </section>

        {/* The quick check */}
        <section aria-labelledby="quick-title" className="dash-card">
          <h2 id="quick-title" className="flex items-center gap-2 text-[16.5px] font-semibold text-ink">
            <Icon name="book" className="h-5 w-5 text-ink-2" />
            {t("Your quick check")}
          </h2>
          {beliefs ? (
            <ul className="mt-3 space-y-3">
              {items.map((it, i) => {
                const b = beliefs[i];
                return (
                  <li key={it.text} className="rounded-[14px] border border-rule p-3">
                    <p className="text-[14px] font-medium text-ink">{t(it.text)}</p>
                    <p className="mt-1 text-[13px] text-ink-2">
                      {t("You said")}: {b ? t(b === "true" ? "True" : b === "false" ? "False" : "Not sure") : t("Skipped")} · {t("What the evidence says")}: {t(it.correct === "true" ? "True" : "False")}
                    </p>
                    <p className="mt-1 text-[13px] text-ink-3">{t(it.explain)}</p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-[14px] text-ink-3">{t("Not kept: “Your answers” was off when you finished.")}</p>
          )}
        </section>
      </div>

      {/* Insights after changes */}
      <section aria-labelledby="refresh-title" className="dash-card mt-4">
        <h2 id="refresh-title" className="text-[16.5px] font-semibold text-ink">
          {t("Your insights after a change")}
        </h2>
        <p className="mt-1 text-[14px] text-ink-2">
          {t("Findings, gaps and next steps are rebuilt from Masar's rules whenever your answers change: nothing to do.")}{" "}
          {s.assistantConsent ? t("The assistant's written summary is only rewritten when you ask.") : t("The assistant is off, so there's no written summary to rewrite.")}
        </p>
        {s.assistantConsent && s.sources.self ? (
          <div className="mt-3">
            <RefreshSummary
              labels={{
                idle: t("Update my summary"),
                busy: `${t("Updating")}…`,
                ai: t("Summary rewritten by Google Gemini and checked by Masar."),
                mock: t("Summary rewritten by the Gemini demo mock (no live model call)."),
                masar: t("The assistant couldn't write it, so Masar's own summary is used."),
                failed: t("Couldn't update. Please try again."),
              }}
            />
            {aiMode() === "off" ? <p className="mt-2 text-[12.5px] text-ink-3">{t("Gemini isn't connected in this environment, so Masar writes these itself.")}</p> : null}
          </div>
        ) : null}
      </section>
    </Shell>
  );
}
