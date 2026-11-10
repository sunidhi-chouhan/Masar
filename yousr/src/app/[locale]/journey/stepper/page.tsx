import { redirect } from "next/navigation";
import { pageContext } from "@/lib/page-context";
import { getJourneyState } from "@/lib/journey/state";
import { JOURNEY_USER_ID, type Intention, type Sex } from "@/lib/domain/types";
import { prisma } from "@/lib/db/prisma";
import { JourneyShell } from "@/components/journey/journey-shell";
import { JourneyStepper } from "@/components/journey/journey-stepper";

export default async function JourneyStepperPage({
  params,
}: PageProps<"/[locale]/journey/stepper">) {
  const { locale, session } = await pageContext(params);
  const journey = await getJourneyState();
  if (!journey || journey.path !== "patient") redirect(`/${locale}/journey`);
  if (journey.stage === "role" || journey.stage === "consent") redirect(`/${locale}/journey/consent`);
  if (session?.userId !== JOURNEY_USER_ID) redirect(`/${locale}/journey`);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: JOURNEY_USER_ID },
    include: { profile: true },
  });
  const sex = (journey.sex ?? user.sex) as Sex;
  const profile = user.profile;
  const conditions = profile ? (JSON.parse(profile.conditions) as string[]) : [];
  const familyHistory = profile ? (JSON.parse(profile.familyHistory) as string[]) : [];
  const stepCount = sex === "female" ? 6 : 5;
  const idx = journey.stepIndex ?? 0;
  const progress = 0.2 + (idx / stepCount) * 0.45;

  return (
    <JourneyShell progress={progress} stage="profile">
      <JourneyStepper
        locale={locale}
        sex={sex}
        initialIndex={idx}
        conditions={conditions}
        familyHistory={familyHistory}
        intention={user.intention as Intention}
      />
    </JourneyShell>
  );
}
