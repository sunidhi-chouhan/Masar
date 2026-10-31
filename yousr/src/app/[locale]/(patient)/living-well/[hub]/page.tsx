import Link from "next/link";
import { notFound } from "next/navigation";
import { pageContext } from "@/lib/page-context";
import { cardsByStrength, getHub, pick } from "@/lib/living-well/content";
import { Page } from "@/components/ui/atoms";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { PageHero } from "@/components/layout/page-hero";
import { LivingWellCard, QuestionList } from "@/components/living-well/living-well-card";
import { MetabolicOrbit } from "@/components/trajectory/section-figures";

export default async function HubPage({ params }: PageProps<"/[locale]/living-well/[hub]">) {
  const { hub: hubId } = await params;
  const hub = getHub(hubId);
  if (!hub) notFound();
  const { locale, t } = await pageContext(params);
  return (
    <div className="relative overflow-hidden">
      <Page wide>
        <Link
          href={`/${locale}/living-well`}
          className="mb-4 inline-flex text-sm font-medium text-mist-700 underline-offset-4 hover:underline"
        >
          ← {t("livingWell.backToHubs")}
        </Link>
        <PageHero
          title={pick(hub, "title", locale)}
          subtitle={pick(hub, "intro", locale)}
          tier="Education"
          figure={<MetabolicOrbit className="h-24 w-24" />}
        />
        <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <Stagger className="grid gap-4 md:grid-cols-2">
            {cardsByStrength(hub).map((c) => (
              <StaggerItem key={c.id} className="h-full">
                <LivingWellCard card={c} />
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal delay={0.2}>
            <QuestionList />
          </Reveal>
        </div>
        <p className="mt-10 text-xs text-ink-400">{t("common.notDiagnosis")}</p>
      </Page>
    </div>
  );
}
