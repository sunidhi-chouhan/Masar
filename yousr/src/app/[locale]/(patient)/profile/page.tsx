import { requireRole } from "@/lib/page-context";
import { prisma } from "@/lib/db/prisma";
import { parseJsonArray, type Intention, type Sex } from "@/lib/domain/types";
import { Page } from "@/components/ui/atoms";
import { Reveal } from "@/components/ui/motion";
import { PageHero } from "@/components/layout/page-hero";
import { ProfileWizard } from "@/components/profile/profile-wizard";
import { DomainSphere } from "@/components/trajectory/section-figures";

export default async function ProfilePage({ params, searchParams }: PageProps<"/[locale]/profile">) {
  const { locale, t, session } = await requireRole(params, ["patient"]);
  const sp = await searchParams;
  const initialStep = typeof sp?.step === "string" ? sp.step : undefined;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId }, include: { profile: true } });
  return (
    <div className="relative overflow-hidden">
      <Page>
        <PageHero
          title={t("profile.title")}
          subtitle={t("profile.subtitle")}
          tier="DecisionSupport"
          figure={<DomainSphere domain="lifestyle" direction="Stable" size={88} />}
        />
        <Reveal delay={0.1} className="mt-8">
          <ProfileWizard
            sex={user.sex as Sex}
            intention={user.intention as Intention}
            completed={parseJsonArray(user.profile?.completed)}
            conditions={parseJsonArray(user.profile?.conditions)}
            familyHistory={parseJsonArray(user.profile?.familyHistory)}
            medications={parseJsonArray(user.profile?.medications)}
            trajectoryHref={`/${locale}/trajectory`}
            initialStep={initialStep}
          />
        </Reveal>
      </Page>
    </div>
  );
}
