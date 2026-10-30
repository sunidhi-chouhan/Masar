import { redirect } from "next/navigation";
import { pageContext } from "@/lib/page-context";
import { PatientDashboard } from "@/components/trajectory/patient-dashboard";
import { BioLanding } from "@/components/landing/bio-landing";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale, t, session } = await pageContext(params);

  if (!session) {
    const roles = [
      { id: "female" as const, title: t("journey.roles.female.title"), body: t("journey.roles.female.body") },
      { id: "male" as const, title: t("journey.roles.male.title"), body: t("journey.roles.male.body") },
      { id: "clinician" as const, title: t("journey.roles.clinician.title"), body: t("journey.roles.clinician.body") },
      { id: "admin" as const, title: t("journey.roles.admin.title"), body: t("journey.roles.admin.body") },
    ];
    return <BioLanding locale={locale} roles={roles} />;
  }

  if (session.role === "clinician") redirect(`/${locale}/clinician`);
  if (session.role === "admin") redirect(`/${locale}/population`);

  return <PatientDashboard userId={session.userId} locale={locale} t={t} />;
}
