import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/page-context";
import { loadPatientBundle } from "@/server/patient";
import { DOMAINS, type Domain } from "@/lib/domain/types";
import { explain } from "@/lib/ai/explainer";
import { DirectionBadge, GlowField, LinkButton, Page, TierRibbon } from "@/components/ui/atoms";
import { Reveal } from "@/components/ui/motion";
import { EvidenceList, UnknownCards } from "@/components/trajectory/drivers";
import { TeachBackSheet } from "@/components/trajectory/teach-back-sheet";
import { AskMasarPanel } from "@/components/trajectory/ask-masar-panel";

export default async function InsightPage({ params }: PageProps<"/[locale]/insights/[domain]">) {
  const { domain } = await params;
  if (!(DOMAINS as readonly string[]).includes(domain)) notFound();
  const { locale, t, session } = await requireRole(params, ["patient"]);
  const bundle = await loadPatientBundle({ userId: session.userId, role: session.role }, session.userId, "PersonalView", `insight:${domain}`);
  const result = bundle.results.find((r) => r.domain === domain);
  if (!result) notFound();
  const text = explain(result, t);

  return (
    <div className="relative overflow-hidden">
      <GlowField variant="mist" />
      <Page>
        <Reveal>
          <Link href={`/${locale}/trajectory/${domain}`} className="text-sm text-mist-700 underline-offset-4 hover:underline">
            ← {t(`domains.${domain}`)}
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-ink-900">{t("insights.title", { domain: t(`domains.${domain}`).toLowerCase() })}</h1>
            <TierRibbon tier={result.tier} />
          </div>
          <div className="mt-3">
            <DirectionBadge direction={result.direction} confidence={result.confidence} />
          </div>
        </Reveal>

        <Reveal delay={0.1} className="mt-8 space-y-6">
          <Block label={t("insights.observed")}>{text.observed}</Block>
          <Block label={t("insights.whyMatters")}>{text.why}</Block>
          <div>
            <p className="label-caps mb-2">{t("insights.evidence")}</p>
            <EvidenceList ids={result.drivers.map((d) => d.evidenceId)} />
          </div>
          <div>
            <p className="label-caps mb-2">{t("insights.stillUnknown")}</p>
            <UnknownCards unknowns={result.unknowns} addHref={`/${locale}/profile`} />
          </div>
          <Block label={t("insights.cannotConclude")} tone="muted">
            {t("insights.cannotBody")}
          </Block>
        </Reveal>

        <Reveal delay={0.2} className="mt-10">
          <TeachBackSheet domain={domain as Domain} />
        </Reveal>

        <Reveal delay={0.22} className="mt-8">
          <AskMasarPanel />
        </Reveal>

        <Reveal delay={0.25} className="mt-8 flex flex-wrap gap-2">
          <LinkButton href={`/${locale}/actions`}>{t("insights.nextSteps")}</LinkButton>
          <LinkButton href={`/${locale}/living-well`} tone="secondary">
            {t("nav.livingWell")}
          </LinkButton>
        </Reveal>
        <p className="mt-10 text-xs text-ink-400">{t("common.notDiagnosis")}</p>
      </Page>
    </div>
  );
}

function Block({ label, children, tone = "paper" }: { label: string; children: React.ReactNode; tone?: "paper" | "muted" }) {
  return (
    <div className={tone === "paper" ? "surface-paper p-5" : "rounded-lg border border-slate-200 bg-slate-200/30 p-5"}>
      <p className="label-caps mb-1">{label}</p>
      <p className="text-ink-900">{children}</p>
    </div>
  );
}
