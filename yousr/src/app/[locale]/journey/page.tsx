import Link from "next/link";
import { pageContext } from "@/lib/page-context";
import { JourneyShell } from "@/components/journey/journey-shell";
import { JourneyRolePicker } from "@/components/journey/journey-role-picker";
import { JourneyIntro } from "@/components/journey/journey-intro";

export default async function JourneyRolePage({ params }: PageProps<"/[locale]/journey">) {
  const { locale, t } = await pageContext(params);

  const roles = [
    {
      id: "female" as const,
      title: t("journey.roles.female.title"),
      body: t("journey.roles.female.body"),
      tag: t("journey.roles.female.tag"),
    },
    {
      id: "male" as const,
      title: t("journey.roles.male.title"),
      body: t("journey.roles.male.body"),
      tag: t("journey.roles.male.tag"),
    },
    {
      id: "clinician" as const,
      title: t("journey.roles.clinician.title"),
      body: t("journey.roles.clinician.body"),
      tag: t("journey.roles.clinician.tag"),
    },
    {
      id: "admin" as const,
      title: t("journey.roles.admin.title"),
      body: t("journey.roles.admin.body"),
      tag: t("journey.roles.admin.tag"),
    },
  ];

  return (
    <JourneyShell stepLabel={t("journey.roles.eyebrow")} progress={0.08} stage="role" wide>
      <JourneyIntro
        hero
        badge={false}
        brandLine={t("journey.roles.brandLine")}
        title={t("journey.roles.title")}
        body={t("journey.roles.subtitle")}
      />

      <JourneyRolePicker locale={locale} roles={roles} />

      <p className="mt-10 text-xs text-ink-400">
        {t("journey.roles.seededHint")}{" "}
        <Link href={`/${locale}/login`} className="font-medium text-mist-700 underline-offset-4 hover:underline">
          {t("nav.login")}
        </Link>
      </p>
    </JourneyShell>
  );
}
