import { redirect } from "next/navigation";
import { pageContext } from "@/lib/page-context";
import { getJourneyState } from "@/lib/journey/state";
import { decideAiExplanation } from "@/server/actions/journey";
import { aiExplanationsConfigured } from "@/server/ai/claude";
import { JourneyShell } from "@/components/journey/journey-shell";
import { JourneySubmitButton } from "@/components/journey/journey-submit";
import { JourneyIntro, JourneyStaggerList } from "@/components/journey/journey-intro";
import { JourneySurface } from "@/components/journey/journey-surface";

export default async function JourneyAiPage({ params }: PageProps<"/[locale]/journey/ai">) {
  const { locale, t } = await pageContext(params);
  const journey = await getJourneyState();
  if (!journey || journey.path !== "patient") redirect(`/${locale}/journey`);
  const hasKey = aiExplanationsConfigured();

  const points = [
    t("journey.ai.points.rules"),
    t("journey.ai.points.model"),
    t("journey.ai.points.noScore"),
    t("journey.ai.points.decline"),
  ];

  return (
    <JourneyShell stepLabel={t("journey.ai.eyebrow")} progress={0.9} stage="ai">
      <JourneyIntro title={t("journey.ai.title")} body={t("journey.ai.subtitle")} />

      <div className="mt-7">
        <JourneySurface tone="dawn" showMotif>
          <JourneyStaggerList items={points} />
          {!hasKey ? <p className="mt-4 text-xs text-ink-400">{t("journey.ai.noKey")}</p> : null}
        </JourneySurface>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <form action={decideAiExplanation.bind(null, locale, true)}>
          <JourneySubmitButton>{t("journey.ai.accept")}</JourneySubmitButton>
        </form>
        <form action={decideAiExplanation.bind(null, locale, false)}>
          <JourneySubmitButton tone="secondary">{t("journey.ai.decline")}</JourneySubmitButton>
        </form>
      </div>
    </JourneyShell>
  );
}
