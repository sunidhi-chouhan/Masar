import Link from "next/link";
import { notFound } from "next/navigation";
import { pageContext } from "@/lib/page-context";
import { cardsByStrength, getHub, pick } from "@/lib/living-well/content";
import { GlowField, Page, TierRibbon } from "@/components/ui/atoms";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { LivingWellCard, QuestionList } from "@/components/living-well/living-well-card";

export default async function HubPage({ params }: PageProps<"/[locale]/living-well/[hub]">) {
  const { hub: hubId } = await params;
  const hub = getHub(hubId);
  if (!hub) notFound();
  const { locale, t } = await pageContext(params);
  return (
    <div className="relative overflow-hidden">
      <GlowField variant={hub.id === "men" || hub.id === "stress" ? "mist" : "amber"} />
      <Page wide>
        <Reveal>
          <Link href={`/${locale}/living-well`} className="text-sm text-mist-700 underline-offset-4 hover:underline">
            ← {t("livingWell.backToHubs")}
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-ink-900">{pick(hub, "title", locale)}</h1>
            <TierRibbon tier="Education" />
          </div>
          <p className="mt-2 max-w-2xl text-ink-600">{pick(hub, "intro", locale)}</p>
        </Reveal>
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
