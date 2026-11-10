import { HealthQuestions } from "@/components/health-questions";
import { Shell } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { answersFromRecords } from "@/lib/profile";
import { saveAnswers } from "@/server/actions";
import { redirect } from "next/navigation";
import { requireRole } from "@/server/session";
import { personView } from "@/server/views";
import { translator } from "@/server/lang";

// Per-user page: it reads the session on every request, so it is never prerendered.
export const instant = false;

export default async function AboutMe() {
  const session = await requireRole("person");
  const v = personView(session.id);
  // Nothing to edit until the person has chosen what to share.
  if (!v.state.onboarded) redirect("/me");
  const { t, lang } = await translator();

  return (
    <Shell session={session}>
      <p className="eyebrow">{t("About me")}</p>
      <h1 className="mt-2 text-[clamp(2rem,4vw,2.8rem)] font-semibold leading-[1.05] tracking-[-0.035em]">{t("Your answers about your health")}</h1>
      <p className="mt-3 max-w-2xl text-[15px] text-zinc-600">
        {t("Change anything that's different now. Your path updates as soon as you save.")}
        {!v.state.sources.self ? ` ${t("These answers are only used while “What you tell us” is switched on in My data.")}` : ""}
      </p>
      <form action={saveAnswers} className="mt-8 max-w-2xl space-y-6">
        <HealthQuestions sex={v.resident.sex} defaults={v.state.answers ?? answersFromRecords(v.resident)} lang={lang} />
        <SubmitButton pendingLabel={t("Updating your path")} className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
          {t("Save my answers")}
        </SubmitButton>
      </form>
    </Shell>
  );
}
