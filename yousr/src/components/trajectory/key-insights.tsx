"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n/format";
import type { Domain, DomainResult } from "@/lib/domain/types";
import type { Connection } from "@/lib/engine/connections";
import { DirectionBadge, EvidenceChip } from "@/components/ui/atoms";
import { INSIGHT_ORDER, pickFeatured } from "@/lib/engine/featured";
import { EvidenceList } from "./drivers";

export interface InsightItem {
  result: DomainResult;
  next: { label: string; href: string };
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="label-caps">{title}</dt>
      <dd className="mt-1 text-sm text-ink-600">{children}</dd>
    </div>
  );
}

function InsightCard({
  item,
  featured = false,
  assistedExplanation,
}: {
  item: InsightItem;
  featured?: boolean;
  assistedExplanation?: string | null;
}) {
  const { t, locale } = useI18n();
  const r = item.result;
  const flagged = r.direction === "Discuss" || r.direction === "Shifting" || r.triggers.length > 0;
  const shownDrivers = r.drivers.filter((d) => d.valueLabel || d.factor !== "age");
  const preview = shownDrivers.filter((d) => d.valueLabel).slice(0, 3);
  const notes = [...new Set(r.drivers.map((d) => d.note).filter((n): n is string => Boolean(n)))];

  return (
    <article
      id={`insight-${r.domain}`}
      className={`flex flex-col p-4 md:p-5 ${
        featured
          ? "surface-paper border-s-4 border-s-mist-500 bg-gradient-to-br from-white to-mist-100/30"
          : "surface-paper"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dawn-200 pb-3">
        <h3 className="text-ink-900">{t(`domains.${r.domain}`)}</h3>
        <DirectionBadge direction={r.direction} confidence={r.confidence} compact />
      </div>

      {assistedExplanation ? (
        <p className="mt-4 rounded-md border border-dawn-200 bg-dawn-50/80 px-3 py-2.5 text-sm text-ink-600">
          <span className="label-caps mb-1 block text-mist-700">{t("dashboard.insights.assisted")}</span>
          {assistedExplanation}
        </p>
      ) : null}

      <dl className="mt-4 space-y-3.5">
        <Block title={t("dashboard.insights.recorded")}>
          <span className="font-medium text-ink-900">{t(`observed.${r.observedKey}`)}</span>
          {preview.length > 0 ? (
            <span className="mt-1.5 block rounded-md bg-dawn-50 px-2.5 py-1.5 text-xs leading-relaxed text-ink-600">
              {preview
                .map((d) => `${t(`factors.${d.factor}`)}: ${d.valueLabel}${d.effectiveAt ? ` (${formatDate(d.effectiveAt, locale)})` : ""}`)
                .join(" · ")}
            </span>
          ) : null}
        </Block>
        <Block title={t("dashboard.insights.matters")}>{t(`summaries.${r.summaryKey}`)}</Block>
        <Block title={t("dashboard.insights.cannot")}>{t(`dashboard.insights.cannotByDomain.${r.domain}`)}</Block>
        {flagged ? (
          <Block title={t("dashboard.insights.discuss")}>
            {r.triggers.length > 0
              ? t("dashboard.insights.discussFlagged", { items: r.triggers.map((id) => t(`triggers.${id}`)).join("; ") })
              : t("dashboard.insights.discussDirection")}
          </Block>
        ) : null}
      </dl>

      <Link
        href={item.next.href}
        className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-mist-700 underline-offset-4 transition-colors hover:text-mist-500 hover:underline"
      >
        {t("dashboard.insights.nextLabel")}: {item.next.label} →
      </Link>

      <details className="group mt-4 overflow-hidden rounded-md border border-dawn-200 bg-dawn-50/60">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-ink-900 [&::-webkit-details-marker]:hidden">
          {featured ? t("dashboard.insights.explanationToggle") : t("dashboard.insights.evidenceToggle")}
          <span aria-hidden className="text-ink-400 transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="space-y-4 border-t border-dawn-200 px-3 py-3 text-xs">
          <div>
            <p className="label-caps">{t("dashboard.insights.evidenceRecords")}</p>
            {shownDrivers.length > 0 ? (
              <ul className="mt-2 divide-y divide-dawn-200 rounded-md border border-dawn-200 bg-white">
                {shownDrivers.map((d, i) => (
                  <li key={`${d.factor}-${i}`} className="grid gap-1 px-3 py-2 sm:grid-cols-[1.2fr_1fr_1fr]">
                    <div>
                      <p className="font-medium text-ink-900">{t(`factors.${d.factor}`)}</p>
                      {d.valueLabel ? <p className="text-ink-600">{d.valueLabel}</p> : null}
                    </div>
                    <div className="text-ink-600">
                      <p>
                        <span className="text-ink-400">{t("dashboard.insights.observedOn")}:</span>{" "}
                        {d.effectiveAt ? formatDate(d.effectiveAt, locale) : t("dashboard.insights.noDate")}
                      </p>
                      <p>
                        <span className="text-ink-400">{t("common.source")}:</span>{" "}
                        {d.source ? t(`privacy.sources.${d.source}`) : t("dashboard.insights.fromProfile")}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-start gap-1.5">
                      <span className="text-ink-600">{t(`modifiability.${d.modifiability}`)}</span>
                      <EvidenceChip strength={d.strength} compact />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-ink-600">{t("dashboard.insights.noRecordsUsed")}</p>
            )}
          </div>

          {r.drivers.length > 0 ? (
            <div>
              <p className="label-caps">{t("dashboard.insights.evidenceBase")}</p>
              <div className="mt-2">
                <EvidenceList ids={r.drivers.map((d) => d.evidenceId)} />
              </div>
            </div>
          ) : null}

          <div>
            <p className="label-caps">{t("dashboard.insights.limitations")}</p>
            <ul className="mt-2 list-disc space-y-1 ps-4 text-ink-600">
              <li>{t(`dashboard.insights.cannotByDomain.${r.domain}`)}</li>
              {notes.map((n) => (
                <li key={n}>{t(`driverNotes.${n}`)}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="label-caps">{t("dashboard.insights.uncertainty")}</p>
            <p className="mt-2 text-ink-600">{t(`confidence.hint.${r.confidence}`)}</p>
            {r.unknowns.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 ps-4 text-ink-600">
                {r.unknowns.map((u) => (
                  <li key={u.missing}>
                    {t(`missing.${u.missing}`)} — {t("missing.wouldNarrow", { domain: t(`domains.${u.wouldNarrow}`) })}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </details>
    </article>
  );
}

function ThinCard({ item }: { item: InsightItem }) {
  const { t } = useI18n();
  const r = item.result;
  return (
    <li className="surface-paper border-dashed border-slate-400 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-ink-900">{t(`domains.${r.domain}`)}</h3>
        <DirectionBadge direction={r.direction} confidence={r.confidence} compact />
      </div>
      <p className="mt-2 text-sm text-ink-600">
        {r.domain === "reserve"
          ? t("dashboard.card.noLabs")
          : r.domain === "metabolic"
            ? t("dashboard.insights.metabolicEmpty")
            : t("dashboard.insights.genericEmpty")}
      </p>
      {r.triggers.length > 0 ? (
        <p className="mt-2 text-xs text-ink-600">
          <span className="font-medium text-ink-900">{t("dashboard.insights.flaggedBecause")}:</span>{" "}
          {r.triggers.map((id) => t(`triggers.${id}`)).join("; ")}
        </p>
      ) : null}
      {r.unknowns.length > 0 ? (
        <p className="mt-2 text-xs text-ink-600">
          <span className="font-medium text-ink-900">{t("dashboard.insights.wouldHelp")}:</span>{" "}
          {r.unknowns.slice(0, 3).map((u) => t(`missing.${u.missing}`)).join(" · ")}
        </p>
      ) : null}
      <Link href={item.next.href} className="mt-3 inline-block text-sm font-semibold text-mist-700 underline-offset-4 hover:underline">
        {item.next.label} →
      </Link>
    </li>
  );
}

/**
 * One insight first. Everything else (other areas, how they connect, areas
 * with nothing recorded) is one toggle away.
 */
export function KeyInsights({
  items,
  connections,
  assistedExplanation,
}: {
  items: InsightItem[];
  connections: Connection[];
  assistedExplanation?: string | null;
}) {
  const { t } = useI18n();
  const featured = pickFeatured(items);
  const others = items
    .filter((i) => i.result.confidence !== "InsufficientData" && i !== featured)
    .sort((a, b) => INSIGHT_ORDER.indexOf(a.result.direction) - INSIGHT_ORDER.indexOf(b.result.direction));
  const without = items.filter((i) => i.result.confidence === "InsufficientData");
  const moreCount = others.length + without.length + connections.length;

  return (
    <div className="space-y-4">
      {featured ? (
        <InsightCard item={featured} featured assistedExplanation={assistedExplanation} />
      ) : (
        <div className="surface-paper border-dashed border-slate-400 p-5">
          <p className="font-semibold text-ink-900">{t("dashboard.insights.noneYetTitle")}</p>
          <p className="mt-1 text-sm text-ink-600">{t("dashboard.insights.noneYetBody")}</p>
        </div>
      )}

      {moreCount > 0 ? (
        <details className="group rounded-md border border-dawn-200 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-ink-900 [&::-webkit-details-marker]:hidden">
            {t("dashboard.insights.moreToggle", { n: moreCount })}
            <span aria-hidden className="text-ink-400 transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="space-y-6 border-t border-dawn-200 p-4">
            {others.length > 0 ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {others.map((i) => (
                  <InsightCard key={i.result.domain} item={i} />
                ))}
              </div>
            ) : null}

            {connections.length > 0 ? (
              <section aria-labelledby="connections-heading" className="rounded-md border border-dawn-200 bg-dawn-50/60 p-4">
                <h3 id="connections-heading" className="text-ink-900">{t("dashboard.connections.title")}</h3>
                <p className="mt-1 text-sm text-ink-600">{t("dashboard.connections.subtitle")}</p>
                <ul className="mt-3 grid gap-3 md:grid-cols-2">
                  {connections.map((c) => (
                    <li key={c.key} className="rounded-md border border-dawn-200 bg-white p-3">
                      <p className="text-sm font-medium text-ink-900">{t(`dashboard.connections.items.${c.key}.title`)}</p>
                      <p className="mt-1 text-xs text-ink-600">{t(`dashboard.connections.items.${c.key}.body`)}</p>
                      <p className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-ink-600">
                        {c.domains.map((d: Domain) => (
                          <span key={d} className="rounded-sm border border-dawn-300 bg-dawn-50 px-1.5 py-0.5">
                            {t(`domains.${d}`)}
                          </span>
                        ))}
                      </p>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 border-t border-dawn-200 pt-3 text-xs text-ink-600">{t("dashboard.connections.caution")}</p>
              </section>
            ) : null}

            {without.length > 0 ? (
              <section aria-labelledby="no-info-heading">
                <h3 id="no-info-heading" className="text-ink-900">{t("dashboard.insights.noInfoTitle")}</h3>
                <p className="mt-1 mb-3 text-sm text-ink-600">{t("dashboard.insights.noInfoBody")}</p>
                <ul className="grid gap-3 md:grid-cols-2">
                  {without.map((i) => (
                    <ThinCard key={i.result.domain} item={i} />
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </details>
      ) : null}
    </div>
  );
}
