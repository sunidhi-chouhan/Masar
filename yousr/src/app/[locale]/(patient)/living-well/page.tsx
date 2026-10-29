import Link from "next/link";
import { pageContext } from "@/lib/page-context";
import { HUBS, pick } from "@/lib/living-well/content";
import { GlowField, Page, TierRibbon } from "@/components/ui/atoms";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { QuestionList } from "@/components/living-well/living-well-card";

const HUB_HUE: Record<string, string> = {
  pcos: "var(--peach-300)",
  men: "var(--mist-300)",
  foundations: "var(--amber-100)",
  stress: "var(--mist-100)",
  laughter: "var(--amber-400)",
  "life-stages": "var(--dawn-300)",
};

export default async function LivingWellPage({ params }: PageProps<"/[locale]/living-well">) {
  const { locale, t } = await pageContext(params);
  return (
    <div className="relative overflow-hidden">
      <GlowField variant="amber" />
      <Page wide>
        <Reveal>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-ink-900">{t("livingWell.title")}</h1>
            <TierRibbon tier="Education" />
          </div>
          <p className="mt-2 max-w-2xl text-ink-600">{t("livingWell.subtitle")}</p>
        </Reveal>
        <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <Stagger className="grid gap-4 sm:grid-cols-2">
            {HUBS.map((h) => (
              <StaggerItem key={h.id} className="h-full">
                <Link href={`/${locale}/living-well/${h.id}`} className="surface-paper lift relative block h-full overflow-hidden p-6">
                  <span
                    aria-hidden
                    className="absolute -end-10 -top-10 h-32 w-32 rounded-pill opacity-70 blur-2xl"
                    style={{ background: HUB_HUE[h.id] ?? "var(--peach-300)" }}
                  />
                  <h3 className="relative text-ink-900">{pick(h, "title", locale)}</h3>
                  <p className="relative mt-2 text-sm text-ink-600">{pick(h, "intro", locale)}</p>
                  <p className="relative mt-4 text-xs text-ink-400">
                    {h.cards.length} · {h.domains.map((d) => t(`domains.${d}`)).join(", ")}
                  </p>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal delay={0.2}>
            <QuestionList />
          </Reveal>
        </div>
      </Page>
    </div>
  );
}
