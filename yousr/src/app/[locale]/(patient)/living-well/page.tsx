import Link from "next/link";
import { pageContext } from "@/lib/page-context";
import { HUBS, pick } from "@/lib/living-well/content";
import { Page } from "@/components/ui/atoms";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { PageHero } from "@/components/layout/page-hero";
import { QuestionList } from "@/components/living-well/living-well-card";
import { MetabolicOrbit } from "@/components/trajectory/section-figures";

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
      <Page wide>
        <PageHero
          title={t("livingWell.title")}
          subtitle={t("livingWell.subtitle")}
          tier="Education"
          figure={<MetabolicOrbit className="h-24 w-24" />}
        />
        <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <Stagger className="grid gap-4 sm:grid-cols-2">
            {HUBS.map((h) => (
              <StaggerItem key={h.id} className="h-full">
                <Link
                  href={`/${locale}/living-well/${h.id}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white/90 p-5 shadow-[var(--shadow-soft)] ring-1 ring-dawn-200/60 transition-shadow hover:shadow-[var(--shadow-lift)]"
                >
                  <span
                    aria-hidden
                    className="absolute -end-8 -top-8 h-28 w-28 rounded-full opacity-70 blur-2xl transition-opacity group-hover:opacity-100"
                    style={{ background: HUB_HUE[h.id] ?? "var(--peach-300)" }}
                  />
                  <span
                    aria-hidden
                    className="relative mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ background: `color-mix(in srgb, ${HUB_HUE[h.id] ?? "var(--peach-300)"} 55%, white)` }}
                  >
                    <span className="h-3 w-3 rounded-full bg-mist-700/70" />
                  </span>
                  <h3 className="relative font-display text-xl tracking-tight text-ink-900">
                    {pick(h, "title", locale)}
                  </h3>
                  <p className="relative mt-2 flex-1 text-sm leading-relaxed text-ink-600">
                    {pick(h, "intro", locale)}
                  </p>
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
