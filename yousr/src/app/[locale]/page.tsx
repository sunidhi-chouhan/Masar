import { redirect } from "next/navigation";
import { pageContext } from "@/lib/page-context";
import { PatientDashboard } from "@/components/trajectory/patient-dashboard";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale, t, session } = await pageContext(params);

  // No session: start the clinical onboarding journey (seeded personas remain on /login).
  if (!session) redirect(`/${locale}/journey`);
  if (session.role === "clinician") redirect(`/${locale}/clinician`);
  if (session.role === "admin") redirect(`/${locale}/population`);

  return <PatientDashboard userId={session.userId} locale={locale} t={t} />;
}
