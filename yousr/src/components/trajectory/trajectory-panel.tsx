"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n/format";
import type { Confidence, Direction, Domain, Unknown } from "@/lib/domain/types";
import type { Band } from "@/lib/engine/bands";
import type { MeasureRow, Pt } from "@/lib/engine/trajectory";
import type { TimelineEvent } from "@/server/patient";
import { ConfidenceBand, type ChartPoint } from "@/components/charts/confidence-band";
import { DirectionBadge } from "@/components/ui/atoms";
import { Timeline } from "./timeline";

export interface TrajectoryArea {
  domain: Domain;
  direction: Direction;
  confidence: Confidence;
  rows: MeasureRow[];
  chart: { points: ChartPoint[]; band: Band; staleMonths: number } | null;
  timeline: TimelineEvent[];
  unknowns: (Unknown & { href: string })[];
}

function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

function avg(xs: number[]): number {
  return Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
}

/**
 * The centre of the dashboard. By default: one area, a chart only if the
 * readings support one, and the latest reading beside the one before it.
 * Reading-by-reading comparisons and recalculation history sit behind a toggle.
 */
export function TrajectoryPanel({ areas, initialDomain, nowIso }: { areas: TrajectoryArea[]; initialDomain: Domain; nowIso: string }) {
  const { t, locale } = useI18n();
  const [selected, setSelected] = useState<Domain>(initialDomain);
  const area = areas.find((a) => a.domain === selected) ?? areas[0];

  const value = (p: Pt) =>
    p.value !== null ? `${fmtNum(p.value)}${p.unit ? ` ${p.unit}` : ""}` : p.text ? t(`timeline.values.${p.text}`) : "—";

  const pointCell = (p: Pt | null, empty: string) =>
    p ? (
      <>
        <p className="font-medium text-ink-900">{value(p)}</p>
        <p className="mt-0.5 text-ink-600">
          {formatDate(p.at, locale)} · {t(`privacy.sources.${p.source}`)}
        </p>
        {p.outdated ? <p className="mt-0.5 text-amber-700">{t("timeline.tags.outdated")}</p> : null}
      </>
    ) : (
      <p className="text-ink-400">{empty}</p>
    );

  const cyclePrevious = (r: MeasureRow) =>
    r.cycleSets && r.cycleSets.earlier.length > 0 ? (
      <>
        <p className="font-medium text-ink-900">
          {r.cycleSets.earlier.join(" · ")} {t("dashboard.trajectory.days")}
        </p>
        <p className="mt-0.5 text-ink-600">{t("dashboard.trajectory.cycleEarlier")}</p>
      </>
    ) : (
      <p className="text-ink-400">{t("dashboard.trajectory.noEarlier")}</p>
    );

  const cycleLatest = (r: MeasureRow) =>
    r.cycleSets ? (
      <>
        <p className="font-medium text-ink-900">
          {r.cycleSets.recent.join(" · ")} {t("dashboard.trajectory.days")}
        </p>
        <p className="mt-0.5 text-ink-600">
          {t("dashboard.trajectory.cycleRecent")} · {t("dashboard.trajectory.lastOn", { date: formatDate(r.latest.at, locale) })}
          {r.latest.outdated ? ` · ${t("timeline.tags.outdated")}` : ""}
        </p>
      </>
    ) : null;

  const comparison = (r: MeasureRow): string => {
    if (r.cycleSets) {
      const { recent, earlier } = r.cycleSets;
      if (recent.length < 3) return t("dashboard.trajectory.cmp.cycleFew", { n: recent.length });
      if (earlier.length < 3) return t("dashboard.trajectory.cmp.cycleNoEarlier");
      return t("dashboard.trajectory.cmp.cycleSets", { recent: avg(recent), earlier: avg(earlier) });
    }
    if (!r.previous) return t("dashboard.trajectory.cmp.single");
    if (!r.comparable) return t("dashboard.trajectory.cmp.tooClose", { days: r.gapDays ?? 0 });
    if (r.delta !== null) {
      if (r.delta === 0) return t("dashboard.trajectory.cmp.same", { days: r.gapDays ?? 0 });
      return t("dashboard.trajectory.cmp.delta", {
        change: `${r.delta > 0 ? "+" : "−"}${fmtNum(Math.abs(r.delta))}${r.latest.unit ? ` ${r.latest.unit}` : ""}`,
        days: r.gapDays ?? 0,
      });
    }
    if (r.textChanged !== null) {
      return r.textChanged
        ? t("dashboard.trajectory.cmp.textChanged", {
            from: r.previous.text ? t(`timeline.values.${r.previous.text}`) : "—",
            to: r.latest.text ? t(`timeline.values.${r.latest.text}`) : "—",
          })
        : t("dashboard.trajectory.cmp.textSame");
    }
    return t("dashboard.trajectory.cmp.single");
  };

  // Recalculated summaries, from stored interpretation events (never from readings).
  const snapshots = area.timeline.filter((e) => e.kind === "snapshot");
  const interpretation = snapshots
    .map((s, i) => ({ s, prev: i > 0 ? snapshots[i - 1] : null }))
    .filter(({ s }) => s.kind === "snapshot" && (s.first || s.changed))
    .reverse();
  const shownChanges = interpretation.slice(0, 5);

  const primary = area.rows.find((r) => r.code === area.chart?.band.code) ?? area.rows[0];
  const hasPair = primary ? (primary.cycleSets ? primary.cycleSets.earlier.length >= 3 && primary.cycleSets.recent.length >= 3 : primary.comparable) : false;
  const oneReading = primary && !primary.cycleSets && primary.count === 1;

  return (
    <div className="surface-paper overflow-hidden">
      <div
        role="group"
        aria-label={t("dashboard.trajectory.areaPicker")}
        className="flex gap-1 overflow-x-auto border-b border-dawn-200 bg-dawn-50/90 p-2"
      >
        {areas.map((a) => {
          const none = a.confidence === "InsufficientData";
          const on = a.domain === selected;
          return (
            <button
              key={a.domain}
              type="button"
              aria-pressed={on}
              onClick={() => setSelected(a.domain)}
              className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                on
                  ? "bg-mist-700 text-white shadow-sm"
                  : none
                    ? "border border-dashed border-dawn-300 bg-transparent text-ink-600 hover:bg-dawn-100"
                    : "bg-transparent text-ink-700 hover:bg-dawn-100 hover:text-ink-900"
              }`}
            >
              {t(`domains.${a.domain}`)}
            </button>
          );
        })}
      </div>

      <div className="p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-ink-900">{t(`domains.${area.domain}`)}</h3>
          <DirectionBadge direction={area.direction} confidence={area.confidence} compact />
        </div>

        {/* Simple trajectory: a chart only when the readings can support one */}
        {area.chart && area.chart.points.length >= 2 ? (
          <div className="mt-3">
            <p className="mb-2 text-xs text-ink-600">{t("domainDetail.chartLegend")}</p>
            <ConfidenceBand points={area.chart.points} band={area.chart.band} staleMonths={area.chart.staleMonths} nowIso={nowIso} />
          </div>
        ) : area.rows.length === 0 ? (
          <div className="mt-3 rounded-md border border-dashed border-slate-400 bg-dawn-50/70 p-4 text-sm">
            <p className="font-medium text-ink-900">{t("dashboard.trajectory.nothingRecorded")}</p>
            <p className="mt-1 text-xs text-ink-600">{t("dashboard.trajectory.nothingRecordedBody")}</p>
          </div>
        ) : (
          <div className="mt-3 rounded-md border border-dashed border-slate-400 bg-dawn-50/70 p-4 text-sm">
            <p className="font-medium text-ink-900">
              {oneReading
                ? t("dashboard.trajectory.oneMeasurement", { date: formatDate(primary.latest.at, locale) })
                : t("dashboard.trajectory.noChart")}
            </p>
            {oneReading ? null : <p className="mt-1 text-xs text-ink-600">{t("dashboard.trajectory.noChartBody")}</p>}
          </div>
        )}

        {/* Latest next to the one before it, for the main measure */}
        {primary ? (
          <div className="mt-4">
            <p className="text-sm font-medium text-ink-900">{t(`factors.${primary.factor}`)}</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-dawn-200 bg-dawn-50/50 p-3.5 text-xs">
                <p className="label-caps">{t("dashboard.trajectory.previousLine")}</p>
                <div className="mt-1.5">{primary.cycleSets ? cyclePrevious(primary) : pointCell(primary.previous, t("dashboard.trajectory.noEarlier"))}</div>
              </div>
              <div className="rounded-lg border border-mist-300 bg-mist-100/50 p-3.5 text-xs ring-1 ring-mist-300/40">
                <p className="label-caps text-mist-700">{t("dashboard.trajectory.latestLine")}</p>
                <div className="mt-1.5">{primary.cycleSets ? cycleLatest(primary) : pointCell(primary.latest, "—")}</div>
              </div>
            </div>
            {hasPair || !oneReading ? <p className="mt-2 text-xs text-ink-600">{comparison(primary)}</p> : null}
          </div>
        ) : null}

        {area.unknowns.length > 0 ? (
          <p className="mt-4 text-xs text-ink-600">
            <span className="font-medium text-ink-900">{t("dashboard.trajectory.cannotTitle")}:</span>{" "}
            {area.unknowns.slice(0, 2).map((u, i) => (
              <span key={u.missing}>
                {i > 0 ? " · " : ""}
                <Link href={u.href} className="text-mist-700 underline-offset-4 hover:underline">
                  {t(`missing.${u.missing}`)}
                </Link>
              </span>
            ))}
          </p>
        ) : null}

        {/* Provenance and history, on demand */}
        <details className="group mt-5 rounded-md border border-dawn-200 bg-dawn-50/60">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-ink-900 [&::-webkit-details-marker]:hidden">
            <span>
              {t("dashboard.trajectory.detailsToggle")}
              <span className="block text-xs font-normal text-ink-600">{t("dashboard.trajectory.detailsHint")}</span>
            </span>
            <span aria-hidden className="text-ink-400 transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="space-y-5 border-t border-dawn-200 p-3">
            <p className="text-xs text-ink-600">{t("dashboard.trajectory.measuredVsInterpreted")}</p>

            {area.rows.length > 0 ? (
              <>
                <div className="hidden overflow-x-auto rounded-md border border-dawn-200 md:block">
                  <table className="w-full text-xs">
                    <thead className="border-b border-dawn-200 bg-dawn-100/60 text-ink-600">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-start font-medium">{t("dashboard.trajectory.measure")}</th>
                        <th scope="col" className="px-3 py-2 text-start font-medium">{t("dashboard.trajectory.previous")}</th>
                        <th scope="col" className="px-3 py-2 text-start font-medium">{t("dashboard.trajectory.latest")}</th>
                        <th scope="col" className="px-3 py-2 text-start font-medium">{t("dashboard.trajectory.comparison")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dawn-200 bg-white align-top">
                      {area.rows.map((r) => (
                        <tr key={r.code}>
                          <th scope="row" className="px-3 py-2.5 text-start font-medium text-ink-900">
                            {t(`factors.${r.factor}`)}
                            <span className="mt-0.5 block font-normal text-ink-400">{t("dashboard.trajectory.readings", { n: r.count })}</span>
                          </th>
                          <td className="px-3 py-2.5">{r.cycleSets ? cyclePrevious(r) : pointCell(r.previous, t("dashboard.trajectory.noEarlier"))}</td>
                          <td className="px-3 py-2.5">{r.cycleSets ? cycleLatest(r) : pointCell(r.latest, "—")}</td>
                          <td className="px-3 py-2.5 text-ink-600">
                            {comparison(r)}
                            {!r.cycleSets && r.previous?.outdated && r.comparable ? (
                              <span className="mt-1 block text-amber-700">{t("dashboard.trajectory.cmp.previousOutdated")}</span>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="space-y-3 md:hidden">
                  {area.rows.map((r) => (
                    <li key={r.code} className="rounded-md border border-dawn-200 bg-white p-3 text-xs">
                      <p className="text-sm font-medium text-ink-900">
                        {t(`factors.${r.factor}`)}
                        <span className="ms-2 font-normal text-ink-400">{t("dashboard.trajectory.readings", { n: r.count })}</span>
                      </p>
                      <dl className="mt-2 space-y-2">
                        <div>
                          <dt className="label-caps">{t("dashboard.trajectory.previous")}</dt>
                          <dd className="mt-0.5">{r.cycleSets ? cyclePrevious(r) : pointCell(r.previous, t("dashboard.trajectory.noEarlier"))}</dd>
                        </div>
                        <div>
                          <dt className="label-caps">{t("dashboard.trajectory.latest")}</dt>
                          <dd className="mt-0.5">{r.cycleSets ? cycleLatest(r) : pointCell(r.latest, "—")}</dd>
                        </div>
                        <div>
                          <dt className="label-caps">{t("dashboard.trajectory.comparison")}</dt>
                          <dd className="mt-0.5 text-ink-600">{comparison(r)}</dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-ink-400">{t("dashboard.trajectory.cmp.disclaimer")}</p>
              </>
            ) : null}

            <div>
              <p className="label-caps">{t("dashboard.trajectory.logTitle")}</p>
              <div className="mt-2">
                <Timeline events={area.timeline} limit={8} measurementsOnly />
              </div>
            </div>

            <div>
              <p className="label-caps">{t("dashboard.trajectory.interpretationTitle")}</p>
              <p className="mt-1 text-xs text-ink-400">{t("dashboard.trajectory.interpretationNote")}</p>
              {shownChanges.length === 0 ? (
                <p className="mt-2 text-sm text-ink-600">{t("dashboard.trajectory.noInterpretation")}</p>
              ) : (
                <ul className="mt-2 space-y-2.5 text-sm">
                  {shownChanges.map(({ s, prev }) =>
                    s.kind !== "snapshot" ? null : (
                      <li key={s.id} className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-ink-600">{formatDate(s.at, locale)}</span>
                        {s.first || !prev || prev.kind !== "snapshot" ? (
                          <>
                            <span className="text-xs text-ink-600">{t("dashboard.trajectory.firstRead")}</span>
                            <DirectionBadge direction={s.direction} confidence={s.confidence} compact />
                          </>
                        ) : (
                          <>
                            <DirectionBadge direction={prev.direction} confidence={prev.confidence} compact />
                            <span aria-hidden className="text-ink-400 rtl:-scale-x-100">→</span>
                            <DirectionBadge direction={s.direction} confidence={s.confidence} compact />
                          </>
                        )}
                        <span className="text-xs text-ink-400">· {t(`dashboard.trajectory.reason.${s.reason ?? "unknown"}`)}</span>
                      </li>
                    ),
                  )}
                </ul>
              )}
              {interpretation.length > shownChanges.length ? (
                <p className="mt-2 text-xs text-ink-400">{t("timeline.more", { n: interpretation.length - shownChanges.length })}</p>
              ) : null}
              {interpretation.length === 1 ? <p className="mt-2 text-xs text-ink-600">{t("dashboard.trajectory.noChangeSince")}</p> : null}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
