import { requireRole } from "@/lib/page-context";
import { PatientDashboard } from "@/components/trajectory/patient-dashboard";

export default async function TrajectoryPage({ params }: PageProps<"/[locale]/trajectory">) {
  const { locale, t, session } = await requireRole(params, ["patient"]);
  return <PatientDashboard userId={session.userId} locale={locale} t={t} />;
}
