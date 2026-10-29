import Link from "next/link";
import { pageContext } from "@/lib/page-context";
import { JourneyShell } from "@/components/journey/journey-shell";
import { JourneyRolePicker } from "@/components/journey/journey-role-picker";
import { SimulatedBadge } from "@/components/ui/atoms";

export default async function JourneyRolePage({ params }: PageProps<"/[locale]/journey">) {
  const { locale, t } = await pageContext(params);

  const roles = [
    { id: "female" as const, title: t("journey.roles.female.title"), body: t("journey.roles.female.body") },
    { id: "male" as const, title: t("journey.roles.male.title"), body: t("journey.roles.male.body") },
    { id: "clinician" as const, title: t("journey.roles.clinician.title"), body: t("journey.roles.clinician.body") },
    { id: "admin" as const, title: t("journey.roles.admin.title"), body: t("journey.roles.admin.body") },
  ];

  return (
    <JourneyShell stepLabel={t("journey.roles.eyebrow")} progress={0.08}>
      <div className="flex flex-wrap items-center gap-2">
        <SimulatedBadge />
      </div>
      <h1 className="mt-2 text-ink-900">{t("journey.roles.title")}</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-600">{t("journey.roles.subtitle")}</p>

      <JourneyRolePicker locale={locale} roles={roles} />

      <p className="mt-8 text-xs text-ink-400">
        {t("journey.roles.seededHint")}{" "}
        <Link href={`/${locale}/login`} className="font-medium text-mist-700 underline-offset-4 hover:underline">
          {t("nav.login")}
        </Link>
      </p>
    </JourneyShell>
  );
}
