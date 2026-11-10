import { redirect } from "next/navigation";
import { pageContext } from "@/lib/page-context";
import { getJourneyState } from "@/lib/journey/state";
import { JourneyShell } from "@/components/journey/journey-shell";
import { EcgPrepare } from "@/components/journey/ecg-prepare";

export default async function JourneyPreparePage({
  params,
}: PageProps<"/[locale]/journey/prepare">) {
  const { locale, t } = await pageContext(params);
  const journey = await getJourneyState();
  if (!journey || journey.path !== "patient") redirect(`/${locale}/journey`);

  return (
    <JourneyShell stepLabel={t("journey.prepare.eyebrow")} progress={0.78} stage="prepare">
      <EcgPrepare locale={locale} />
    </JourneyShell>
  );
}
