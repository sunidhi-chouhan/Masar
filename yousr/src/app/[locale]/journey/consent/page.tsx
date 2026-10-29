import { redirect } from "next/navigation";
import { pageContext } from "@/lib/page-context";
import { getJourneyState } from "@/lib/journey/state";
import { acceptGuidelines } from "@/server/actions/journey";
import { JourneyShell } from "@/components/journey/journey-shell";
import { JourneySubmitButton } from "@/components/journey/journey-submit";
import { PurposeFirewall } from "@/components/privacy/consent-centre";
import { SimulatedBadge } from "@/components/ui/atoms";

export default async function JourneyConsentPage({
  params,
}: PageProps<"/[locale]/journey/consent">) {
  const { locale, t } = await pageContext(params);
  const journey = await getJourneyState();
  if (!journey || journey.stage === "role") redirect(`/${locale}/journey`);

  const isPatient = journey.path === "patient";

  return (
    <JourneyShell stepLabel={t("journey.consent.eyebrow")} progress={isPatient ? 0.18 : 0.5}>
      <div className="flex flex-wrap items-center gap-2">
        <SimulatedBadge />
      </div>
      <h1 className="mt-2 text-ink-900">{t("journey.consent.title")}</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-600">{t("journey.consent.subtitle")}</p>

      <div className="mt-6 space-y-4 rounded-lg border border-dawn-200 bg-white p-5 md:p-6">
        <ul className="list-disc space-y-2 ps-5 text-sm text-ink-600">
          <li>{t("journey.consent.points.guidelines")}</li>
          <li>{t("journey.consent.points.synthetic")}</li>
          <li>{t("journey.consent.points.control")}</li>
          {isPatient ? <li>{t("journey.consent.points.share")}</li> : null}
        </ul>
        <PurposeFirewall />
      </div>

      <form action={acceptGuidelines.bind(null, locale)} className="mt-8 flex flex-wrap items-center gap-3">
        <JourneySubmitButton>{t("journey.consent.accept")}</JourneySubmitButton>
        <a
          href={`/${locale}/journey`}
          className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-ink-600 underline-offset-4 hover:underline"
        >
          {t("journey.consent.decline")}
        </a>
      </form>
      <p className="mt-3 text-xs text-ink-400">{t("journey.consent.declineHint")}</p>
    </JourneyShell>
  );
}
