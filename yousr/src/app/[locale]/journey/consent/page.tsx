import { redirect } from "next/navigation";
import { pageContext } from "@/lib/page-context";
import { getJourneyState } from "@/lib/journey/state";
import { acceptGuidelines } from "@/server/actions/journey";
import { JourneyShell } from "@/components/journey/journey-shell";
import { JourneySubmitButton } from "@/components/journey/journey-submit";
import { JourneyIntro, JourneyStaggerList } from "@/components/journey/journey-intro";
import { JourneySurface } from "@/components/journey/journey-surface";
import { PurposeFirewall } from "@/components/privacy/consent-centre";

export default async function JourneyConsentPage({
  params,
}: PageProps<"/[locale]/journey/consent">) {
  const { locale, t } = await pageContext(params);
  const journey = await getJourneyState();
  if (!journey || journey.stage === "role") redirect(`/${locale}/journey`);

  const isPatient = journey.path === "patient";
  const points = [
    t("journey.consent.points.guidelines"),
    t("journey.consent.points.synthetic"),
    t("journey.consent.points.control"),
    ...(isPatient ? [t("journey.consent.points.share")] : []),
  ];

  return (
    <JourneyShell stepLabel={t("journey.consent.eyebrow")} progress={isPatient ? 0.18 : 0.5}>
      <JourneyIntro title={t("journey.consent.title")} body={t("journey.consent.subtitle")} />

      <div className="mt-7">
        <JourneySurface tone="privacy" showMotif>
          <JourneyStaggerList items={points} />
          <div className="mt-5">
            <PurposeFirewall />
          </div>
        </JourneySurface>
      </div>

      <form action={acceptGuidelines.bind(null, locale)} className="mt-8 flex flex-wrap items-center gap-3">
        <JourneySubmitButton>{t("journey.consent.accept")}</JourneySubmitButton>
        <a
          href={`/${locale}/journey`}
          className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-ink-600 underline-offset-4 hover:underline"
        >
          {t("journey.consent.decline")}
        </a>
      </form>
      <p className="mt-3 text-xs text-ink-400">{t("journey.consent.declineHint")}</p>
    </JourneyShell>
  );
}
