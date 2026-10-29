import { redirect } from "next/navigation";
import { pageContext } from "@/lib/page-context";
import { getJourneyState } from "@/lib/journey/state";
import { decideAiExplanation } from "@/server/actions/journey";
import { JourneyShell } from "@/components/journey/journey-shell";
import { JourneySubmitButton } from "@/components/journey/journey-submit";
import { SimulatedBadge } from "@/components/ui/atoms";

export default async function JourneyAiPage({ params }: PageProps<"/[locale]/journey/ai">) {
  const { locale, t } = await pageContext(params);
  const journey = await getJourneyState();
  if (!journey || journey.path !== "patient") redirect(`/${locale}/journey`);
  const hasKey = Boolean(process.env.GEMINI_API_KEY?.trim());

  return (
    <JourneyShell stepLabel={t("journey.ai.eyebrow")} progress={0.9}>
      <div className="flex flex-wrap items-center gap-2">
        <SimulatedBadge />
      </div>
      <h1 className="mt-2 text-ink-900">{t("journey.ai.title")}</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-600">{t("journey.ai.subtitle")}</p>

      <div className="mt-6 space-y-3 rounded-lg border border-dawn-200 bg-white p-5 text-sm text-ink-600 md:p-6">
        <p>{t("journey.ai.points.rules")}</p>
        <p>{t("journey.ai.points.gemini")}</p>
        <p>{t("journey.ai.points.noScore")}</p>
        <p>{t("journey.ai.points.decline")}</p>
        {!hasKey ? <p className="text-xs text-ink-400">{t("journey.ai.noKey")}</p> : null}
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
