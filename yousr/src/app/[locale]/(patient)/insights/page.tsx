import Link from "next/link";
import { requireRole } from "@/lib/page-context";
import { loadPatientBundle } from "@/server/patient";
import { DOMAINS, type Domain } from "@/lib/domain/types";
import { Page, DirectionBadge, TierRibbon } from "@/components/ui/atoms";
import { Reveal } from "@/components/ui/motion";
import { PageHero } from "@/components/layout/page-hero";
import { DomainSphere, InsightHalo } from "@/components/trajectory/section-figures";

export default async function InsightsHubPage({ params }: PageProps<"/[locale]/insights">) {
  const { locale, t, session } = await requireRole(params, ["patient"]);
  const bundle = await loadPatientBundle(
    { userId: session.userId, role: session.role },
    session.userId,
    "PersonalView",
    "insights-hub",
  );

  return (
    <div className="relative overflow-hidden">
      <Page wide>
        <PageHero
          title={t("insights.hubTitle")}
          subtitle={t("insights.hubSubtitle")}
          tier="DecisionSupport"
          figure={<InsightHalo direction="Unknown" />}
        />
        <Reveal delay={0.1} className="mt-8">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DOMAINS.map((domain) => {
              const r = bundle.results.find((x) => x.domain === domain);
              if (!r) return null;
              return (
                <li key={domain}>
                  <Link
                    href={`/${locale}/insights/${domain}`}
                    className="flex h-full flex-col gap-3 rounded-[1.5rem] bg-gradient-to-br from-white to-mist-100/40 p-5 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <DomainSphere domain={domain as Domain} direction={r.direction} size={44} />
                      <TierRibbon tier={r.tier} />
                    </div>
                    <p className="font-display text-lg text-ink-900">{t(`domains.${domain}`)}</p>
                    <DirectionBadge direction={r.direction} confidence={r.confidence} />
                    <p className="mt-auto text-sm text-mist-700">{t("insights.open")} →</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </Page>
    </div>
  );
}
