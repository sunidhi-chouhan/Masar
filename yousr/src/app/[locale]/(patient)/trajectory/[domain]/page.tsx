import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/page-context";
import { loadPatientBundle, timelineFor } from "@/server/patient";
import { DOMAINS, type Domain } from "@/lib/domain/types";
import { STALENESS_MONTHS, THRESHOLDS } from "@/lib/engine/rules";
import { ImportCard } from "@/components/demo/import-card";
import { metabolicBreakdown } from "@/lib/engine/breakdown";
import { MetabolicBreakdown } from "@/components/trajectory/metabolic-breakdown";
import { EmptyState } from "@/components/trajectory/empty-state";
import { Timeline } from "@/components/trajectory/timeline";
import { hubsForDomain, pick } from "@/lib/living-well/content";
import { DirectionBadge, GlowField, LinkButton, Page, TierRibbon } from "@/components/ui/atoms";
import { Reveal } from "@/components/ui/motion";
import { ConfidenceBand } from "@/components/charts/confidence-band";
import { bandFor } from "@/lib/engine/bands";
import { DriverGroups, EvidenceList, UnknownCards } from "@/components/trajectory/drivers";
import { SimulateSlider } from "@/components/trajectory/simulate-slider";

export default async function DomainDetailPage({ params }: PageProps<"/[locale]/trajectory/[domain]">) {
  const { domain } = await params;
  if (!(DOMAINS as readonly string[]).includes(domain)) notFound();
  const { locale, t, session } = await requireRole(params, ["patient"]);
  const bundle = await loadPatientBundle({ userId: session.userId, role: session.role }, session.userId, "PersonalView", `domain:${domain}`);
  const result = bundle.results.find((r) => r.domain === domain);
  if (!result) notFound();

  // Mariam's synthetic AMH import workflow is always available on her reserve
  // detail page (both inside and outside the guided demo) and never shown for
  // other personas.
  const showImport = domain === "reserve" && session.userId === "u_mariam";
  const existingAmh = showImport
    ? bundle.observations
        .filter((o) => o.code === "amh" && o.dataSourceId === "LabMock" && o.valueNum !== null)
        .sort((a, b) => b.effectiveAt.getTime() - a.effectiveAt.getTime())[0] ?? null
    : null;

  const band = bandFor(domain as Domain);
  const points = band
    ? bundle.observations
        .filter((o) => o.code === band.code && o.valueNum !== null)
        .map((o) => ({ at: o.effectiveAt.toISOString(), value: o.valueNum as number, source: t(`privacy.sources.${o.dataSourceId}`) }))
    : [];
  const staleMonths = domain === "cycle" ? STALENESS_MONTHS.cycle : domain === "lifestyle" ? STALENESS_MONTHS.checkin : STALENESS_MONTHS.lab;
  const hubs = hubsForDomain(domain as Domain);
  const simulatable = domain === "lifestyle" || domain === "metabolic";
  const now = new Date();
  const breakdown = domain === "metabolic" ? metabolicBreakdown(bundle.observations, now) : null;
  const insufficient = result.confidence === "InsufficientData";
  const timeline = await timelineFor(session.userId, domain as Domain, now);

  return (
    <div className="relative overflow-hidden">
      <GlowField variant={result.direction === "Discuss" ? "amber" : result.direction === "Unknown" ? "mist" : "dawn"} />
      <Page>
        <Reveal>
          <Link href={`/${locale}/trajectory`} className="text-sm text-mist-700 underline-offset-4 hover:underline">
            ← {t("trajectory.title")}
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-ink-900">{t(`domains.${domain}`)}</h1>
            <TierRibbon tier={result.tier} />
          </div>
          <p className="mt-1 text-ink-600">{t(`domains.about.${domain}`)}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <DirectionBadge direction={result.direction} confidence={result.confidence} />
            <span className="text-sm text-ink-600">
              {insufficient ? t("confidence.notEnoughHint") : t(`directions.hint.${result.direction}`)}
            </span>
          </div>
          {!insufficient ? (
            <p className="mt-2 text-sm text-ink-600">
              <span className="font-medium text-ink-900">{t("confidence.label")}:</span> {t(`confidence.hint.${result.confidence}`)}
            </p>
          ) : null}
        </Reveal>

        {insufficient ? (
          <Reveal delay={0.1} className="mt-6">
            <EmptyState domain={domain as Domain} unknowns={result.unknowns} breakdown={breakdown} sourcesOn={bundle.sources} />
          </Reveal>
        ) : (
          <Reveal delay={0.1} className="surface-paper mt-6 p-5">
            <p className="font-display text-lg font-medium text-ink-900">{t(`observed.${result.observedKey}`)}</p>
            <p className="mt-1.5 text-sm text-ink-600">{t(`summaries.${result.summaryKey}`)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <LinkButton href={`/${locale}/insights/${domain}`}>{t("domainDetail.understand")}</LinkButton>
              <LinkButton href={`/${locale}/actions`} tone="secondary">
                {t("nav.actions")}
              </LinkButton>
            </div>
          </Reveal>
        )}

        {breakdown ? (
          <Reveal delay={0.12} className="mt-8">
            <MetabolicBreakdown categories={breakdown} />
          </Reveal>
        ) : null}

        {showImport ? (
          <Reveal delay={0.12} className="mt-6">
            <ImportCard
              current={{ direction: result.direction, confidence: result.confidence }}
              existing={
                existingAmh
                  ? { value: existingAmh.valueNum as number, unit: existingAmh.unit ?? "ng/mL", effectiveAt: existingAmh.effectiveAt.toISOString() }
                  : null
              }
              referenceLower={THRESHOLDS.reserve.amhLowerReference}
            />
          </Reveal>
        ) : null}

        {band && points.length >= 2 ? (
          <Reveal delay={0.15} className="mt-8 surface-paper p-5">
            <h2 className="text-ink-900">{t("domainDetail.chart")}</h2>
            <p className="mb-3 mt-1 text-sm text-ink-600">{t("domainDetail.chartLegend")}</p>
            <ConfidenceBand points={points} band={band} staleMonths={staleMonths} nowIso={now.toISOString()} />
          </Reveal>
        ) : band && points.length === 1 ? (
          <Reveal delay={0.15} className="mt-8 surface-paper p-5">
            <h2 className="text-ink-900">{t("domainDetail.chart")}</h2>
            <p className="mt-1 text-sm text-ink-600">{t("timeline.noTrend")}</p>
          </Reveal>
        ) : null}

        <Reveal delay={0.18} className="mt-8 surface-paper p-5">
          <h2 className="text-ink-900">{t("timeline.title")}</h2>
          <p className="mb-4 mt-1 text-sm text-ink-600">{t("timeline.body")}</p>
          <Timeline events={timeline} />
        </Reveal>

        {result.drivers.length ? (
          <Reveal delay={0.2} className="mt-8">
            <h2 className="text-ink-900">{t("domainDetail.drivers")}</h2>
            <div className="mt-3">
              <DriverGroups drivers={result.drivers} />
            </div>
          </Reveal>
        ) : null}

        {!insufficient ? (
          <Reveal delay={0.25} className="mt-8">
            <h2 className="text-ink-900">{t("trajectory.whatShade")}</h2>
            <div className="mt-3">
              <UnknownCards unknowns={result.unknowns} addHref={`/${locale}/profile`} />
            </div>
          </Reveal>
        ) : null}

        {simulatable ? (
          <Reveal delay={0.3} className="mt-8">
            <SimulateSlider
              domain={domain as Domain}
              profile={bundle.profile}
              observations={bundle.observations.map((o) => ({ ...o, effectiveAt: o.effectiveAt.toISOString() }))}
              nowIso={now.toISOString()}
            />
          </Reveal>
        ) : null}

        {hubs.length ? (
          <Reveal delay={0.3} className="mt-8">
            <h2 className="text-ink-900">{t("domainDetail.livingWell")}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {hubs.map((h) => (
                <Link key={h.id} href={`/${locale}/living-well/${h.id}`} className="surface-paper lift block p-4">
                  <p className="font-semibold text-ink-900">{pick(h, "title", locale)}</p>
                  <p className="mt-1 text-sm text-ink-600">{pick(h, "intro", locale)}</p>
                </Link>
              ))}
            </div>
          </Reveal>
        ) : null}

        <Reveal delay={0.35} className="mt-8">
          <h2 className="text-ink-900">{t("domainDetail.evidence")}</h2>
          <div className="mt-3">
            <EvidenceList ids={result.drivers.map((d) => d.evidenceId)} />
          </div>
        </Reveal>
        <p className="mt-8 text-xs text-ink-600">{t("common.notDiagnosis")}</p>
      </Page>
    </div>
  );
}
