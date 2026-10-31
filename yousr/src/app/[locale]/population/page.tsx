import Link from "next/link";
import { requireRole } from "@/lib/page-context";
import { K_ANONYMITY, populationReport } from "@/server/population";
import { metricsSnapshot } from "@/server/metrics";
import { Page, SimulatedBadge } from "@/components/ui/atoms";
import { EquityBars, FunnelChart, Heatmap } from "@/components/population/charts";

export default async function PopulationPage({ params }: PageProps<"/[locale]/population">) {
  const { locale, t, session } = await requireRole(params, ["admin"]);
  const [report, metrics] = await Promise.all([populationReport({ userId: session.userId, role: session.role }), metricsSnapshot()]);
  const groups = ["sex", "nationality", "language", "intention", "ageBand"] as const;

  const suggested = report.funnel.counselSuggested || 1;
  const uptake = Math.round((report.funnel.counselRequested / suggested) * 100);
  const referred = report.funnel.signal || 1;
  const referralPct = Math.round((report.funnel.referralCompleted / referred) * 100);

  return (
    <Page wide>
      <div className="flex flex-wrap items-center gap-2">
        <p className="label-caps">{t("population.workspace")}</p>
        <SimulatedBadge />
      </div>
      <h1 className="mt-1 text-ink-900">{t("population.title")}</h1>
      <p className="mt-2 max-w-2xl text-ink-600">{t("population.subtitle")}</p>
      <p className="mt-3 rounded-md border border-dashed border-slate-400 bg-slate-200/30 px-3 py-2 text-sm text-slate-600">
        {t("population.banner", { k: K_ANONYMITY })} · {t("population.consented", { n: report.consentedCount })} ·{" "}
        {t("population.excluded", { n: report.excludedCount })}
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <li className="surface-paper p-4">
          <p className="label-caps">{t("population.kpis.uptake")}</p>
          <p className="mt-1 font-display text-3xl text-ink-900">{report.funnel.counselSuggested === 0 ? "—" : `${uptake}%`}</p>
          <p className="mt-1 text-xs text-ink-600">{t("population.kpis.uptakeHint", { n: report.funnel.counselRequested, total: report.funnel.counselSuggested })}</p>
        </li>
        <li className="surface-paper p-4">
          <p className="label-caps">{t("population.kpis.referral")}</p>
          <p className="mt-1 font-display text-3xl text-ink-900">{report.funnel.signal === 0 ? "—" : `${referralPct}%`}</p>
          <p className="mt-1 text-xs text-ink-600">{t("population.kpis.referralHint", { n: report.funnel.referralCompleted })}</p>
        </li>
        <li className="surface-paper p-4">
          <p className="label-caps">{t("population.medianRequest")}</p>
          <p className="mt-1 font-display text-3xl text-ink-900">{report.medianDaysSignalToRequest ?? "—"}</p>
          <p className="mt-1 text-xs text-ink-600">{t("population.kpis.days")}</p>
        </li>
        <li className="surface-paper p-4">
          <p className="label-caps">{t("population.kpis.completeness")}</p>
          <p className="mt-1 font-display text-3xl text-ink-900">{report.consentedCount}</p>
          <p className="mt-1 text-xs text-ink-600">{t("population.excluded", { n: report.excludedCount })}</p>
        </li>
      </ul>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="surface-paper p-5">
            <h2 className="text-ink-900">{t("population.funnel")}</h2>
            <FunnelChart funnel={report.funnel} />
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink-600">
              <span>
                {t("population.medianRequest")}: <strong className="text-ink-900">{report.medianDaysSignalToRequest ?? "—"}</strong>
              </span>
              <span>
                {t("population.medianAttend")}: <strong className="text-ink-900">{report.medianDaysSignalToAttend ?? "—"}</strong>
              </span>
            </div>
          </div>

          <div className="surface-paper p-5">
            <h2 className="text-ink-900">{t("population.heatmap")}</h2>
            <p className="mb-3 mt-1 text-xs text-ink-400">{t("population.heatmapHint", { k: K_ANONYMITY })}</p>
            <Heatmap cells={report.heatmap} />
          </div>

          <div className="surface-paper p-5 lg:col-span-2">
            <h2 className="text-ink-900">{t("population.equity")}</h2>
            <p className="mt-1 text-xs text-ink-400">{t("population.equityHint")}</p>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              {groups.map((g) => (
                <div key={g}>
                  <p className="label-caps mb-1">{t(`population.groups.${g}`)}</p>
                  <EquityBars rows={report.equity} group={g} />
                </div>
              ))}
            </div>
          </div>

          <div className="surface-paper p-5">
            <h2 className="text-ink-900">{t("population.falseReassurance")}</h2>
            <p className="mt-1 text-sm text-ink-600">
              {t("population.falseReassuranceHint", {
                n: report.falseReassurance.stableThenDiscuss,
                total: report.falseReassurance.evaluated,
              })}
            </p>
            <p className="mt-4 font-display text-5xl text-ink-900">
              {report.falseReassurance.stableThenDiscuss}
              <span className="text-2xl text-ink-400"> / {report.falseReassurance.evaluated}</span>
            </p>
            <p className="mt-4 border-t border-dawn-200 pt-3 text-sm text-ink-600">
              {t("population.falseReassuranceClinician", {
                n: report.falseReassurance.stableThenClinicianOverride,
                total: report.falseReassurance.overrideEvaluated,
              })}
            </p>
            <p className="mt-2 font-display text-3xl text-ink-900">
              {report.falseReassurance.stableThenClinicianOverride}
              <span className="text-lg text-ink-400"> / {report.falseReassurance.overrideEvaluated}</span>
            </p>
          </div>

          <div className="surface-paper p-5">
            <h2 className="text-ink-900">{t("population.metrics")}</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <Metric label={t("population.metricLabels.teachBack")} value={metrics.teachBackCorrectRate === null ? "—" : `${metrics.teachBackCorrectRate}%`} sub={`n=${metrics.teachBackCount}`} />
              <Metric label={t("population.metricLabels.uncertainty")} value={metrics.uncertaintyDisclosureRate === null ? "—" : `${metrics.uncertaintyDisclosureRate}%`} />
              <Metric label={t("population.metricLabels.blocked")} value={String(metrics.blockedAttempts)} />
              <Metric label={t("population.metricLabels.revocations")} value={String(metrics.revocationsHonoured)} />
              <Metric label={t("population.metricLabels.guard")} value={String(metrics.insufficientShownAsUnknown)} />
            </dl>
            <p className="mt-4 text-xs text-slate-600">{t("population.notKpi")}</p>
            <Link href={`/${locale}/about/how-it-works`} className="mt-2 inline-block text-xs text-mist-700 underline-offset-4 hover:underline">
              {t("nav.about")} →
            </Link>
          </div>
        </div>
    </Page>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-600">{label}</dt>
      <dd className="font-display text-2xl text-ink-900">
        {value} {sub ? <span className="text-xs text-ink-400">{sub}</span> : null}
      </dd>
    </div>
  );
}
