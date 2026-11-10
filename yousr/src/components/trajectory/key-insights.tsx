"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n/format";
import type { Domain, DomainResult } from "@/lib/domain/types";
import type { Connection } from "@/lib/engine/connections";
import { DirectionBadge, EvidenceChip } from "@/components/ui/atoms";
import { INSIGHT_ORDER, pickFeatured } from "@/lib/engine/featured";
import { useJourneyMotion } from "@/components/journey/journey-loaders";
import { EvidenceList } from "./drivers";
import { InsightHalo } from "./section-figures";

export interface InsightItem {
  result: DomainResult;
  next: { label: string; href: string };
}

function StanzaIcon({ kind }: { kind: "observed" | "matter" | "limit" | "discuss" }) {
  const common = "h-4 w-4 shrink-0";
  if (kind === "observed") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="8" cy="8" r="2" fill="currentColor" />
      </svg>
    );
  }
  if (kind === "matter") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M3 11 L8 3 L13 11 Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === "discuss") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M3 4.5h10v6.5H8.5L5.5 13.5V11H3V4.5Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2.5 2" />
      <path d="M8 5.5v3M8 10.5h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
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
  const { animate } = useJourneyMotion();
  const [open, setOpen] = useState(false);
  const r = item.result;
  const flagged = r.direction === "Discuss" || r.direction === "Shifting" || r.triggers.length > 0;
  const shownDrivers = r.drivers.filter((d) => d.valueLabel || d.factor !== "age");
  const preview = shownDrivers.filter((d) => d.valueLabel).slice(0, 2);
  const notes = [...new Set(r.drivers.map((d) => d.note).filter((n): n is string => Boolean(n)))];

  const stanzas: { kind: "observed" | "matter" | "limit" | "discuss"; title: string; body: string }[] = [
    {
      kind: "observed",
      title: t("dashboard.insights.recorded"),
      body: t(`observed.${r.observedKey}`),
    },
    {
      kind: "matter",
      title: t("dashboard.insights.matters"),
      body: t(`summaries.${r.summaryKey}`),
    },
    {
      kind: "limit",
      title: t("dashboard.insights.cannot"),
      body: t(`dashboard.insights.cannotByDomain.${r.domain}`),
    },
  ];
  if (flagged) {
    stanzas.push({
      kind: "discuss",
      title: t("dashboard.insights.discuss"),
      body:
        r.triggers.length > 0
          ? t("dashboard.insights.discussFlagged", {
              items: r.triggers.map((id) => t(`triggers.${id}`)).join("; "),
            })
          : t("dashboard.insights.discussDirection"),
    });
  }

  return (
    <motion.article
      id={`insight-${r.domain}`}
      whileHover={animate && featured ? { y: -2 } : undefined}
      className={`relative flex flex-col overflow-hidden rounded-[18px] border bg-white shadow-[var(--shadow-soft)] ${
        featured ? "border-amber-400/40 shadow-[0_0_0_4px_var(--amber-100)]" : "border-dawn-200"
      }`}
    >
      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-dawn-200/80 px-4 py-3 md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          {featured ? <InsightHalo direction={r.direction} /> : null}
          <div className="min-w-0">
            <h3 className="font-display text-lg tracking-tight text-ink-900">{t(`domains.${r.domain}`)}</h3>
            <div className="mt-1">
              <DirectionBadge direction={r.direction} confidence={r.confidence} compact />
            </div>
          </div>
        </div>
      </div>

      {assistedExplanation ? (
        <p className="mx-4 mt-3 rounded-xl bg-mist-100/50 px-3 py-2.5 text-sm text-ink-600 md:mx-5">
          <span className="label-caps mb-1 block text-mist-700">{t("dashboard.insights.assisted")}</span>
          {assistedExplanation}
        </p>
      ) : null}

      {preview.length > 0 ? (
        <div className="mx-4 mt-3 flex flex-wrap gap-2 md:mx-5">
          {preview.map((d) => (
            <span
              key={d.factor}
              className="inline-flex items-center gap-1.5 rounded-lg bg-dawn-50 px-2.5 py-1.5 text-xs text-ink-600"
            >
              <span className="font-medium text-ink-900">{t(`factors.${d.factor}`)}</span>
              <span>{d.valueLabel}</span>
              {d.effectiveAt ? (
                <span className="text-ink-400">{formatDate(d.effectiveAt, locale)}</span>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}

      <ul className="mt-3 space-y-0 px-2 pb-2 md:px-3">
        {stanzas.map((s) => (
          <li key={s.kind} className="flex gap-3 rounded-xl px-2 py-2.5 hover:bg-dawn-50/60">
            <span
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                s.kind === "discuss"
                  ? "bg-amber-100 text-amber-700"
                  : s.kind === "limit"
                    ? "bg-slate-200/70 text-slate-600"
                    : "bg-mist-100 text-mist-700"
              }`}
            >
              <StanzaIcon kind={s.kind} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{s.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-700">{s.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-auto border-t border-dawn-200/80 px-4 py-3 md:px-5">
        <Link
          href={item.next.href}
          className="inline-flex min-h-10 items-center text-sm font-semibold text-mist-700 underline-offset-4 hover:underline"
        >
          {t("dashboard.insights.nextLabel")}: {item.next.label} →
        </Link>

        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="mt-2 flex w-full items-center justify-between rounded-lg px-1 py-2 text-start text-sm font-medium text-ink-600 hover:bg-dawn-50"
        >
          {featured ? t("dashboard.insights.explanationToggle") : t("dashboard.insights.evidenceToggle")}
          <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-ink-400" aria-hidden>
            ⌄
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: animate ? 0.28 : 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 border-t border-dawn-200 pb-2 pt-3 text-xs">
                <div>
                  <p className="label-caps">{t("dashboard.insights.evidenceRecords")}</p>
                  {shownDrivers.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {shownDrivers.map((d, i) => (
                        <li
                          key={`${d.factor}-${i}`}
                          className="rounded-xl bg-dawn-50 px-3 py-2.5"
                        >
                          <p className="font-medium text-ink-900">{t(`factors.${d.factor}`)}</p>
                          {d.valueLabel ? <p className="text-ink-600">{d.valueLabel}</p> : null}
                          <p className="mt-1 text-ink-400">
                            {d.effectiveAt ? formatDate(d.effectiveAt, locale) : t("dashboard.insights.noDate")}
                            {" · "}
                            {d.source ? t(`privacy.sources.${d.source}`) : t("dashboard.insights.fromProfile")}
                          </p>
                          <div className="mt-1.5">
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

                {notes.length > 0 ? (
                  <div>
                    <p className="label-caps">{t("dashboard.insights.limitations")}</p>
                    <ul className="mt-2 space-y-1 text-ink-600">
                      {notes.map((n) => (
                        <li key={n} className="flex gap-2">
                          <span aria-hidden className="text-mist-500">
                            ·
                          </span>
                          {t(`driverNotes.${n}`)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div>
                  <p className="label-caps">{t("dashboard.insights.uncertainty")}</p>
                  <p className="mt-2 text-ink-600">{t(`confidence.hint.${r.confidence}`)}</p>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

function ThinCard({ item }: { item: InsightItem }) {
  const { t } = useI18n();
  const { animate } = useJourneyMotion();
  const r = item.result;
  return (
    <motion.li
      whileHover={animate ? { y: -2 } : undefined}
      className="rounded-2xl border border-dashed border-dawn-300 bg-dawn-50/50 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium text-ink-900">{t(`domains.${r.domain}`)}</h3>
        <DirectionBadge direction={r.direction} confidence={r.confidence} compact />
      </div>
      <p className="mt-2 text-sm text-ink-600">
        {r.domain === "reserve"
          ? t("dashboard.card.noLabs")
          : r.domain === "metabolic"
            ? t("dashboard.insights.metabolicEmpty")
            : t("dashboard.insights.genericEmpty")}
      </p>
      {r.unknowns.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {r.unknowns.slice(0, 3).map((u) => (
            <span key={u.missing} className="rounded-pill bg-white px-2 py-0.5 text-[11px] text-ink-600">
              {t(`missing.${u.missing}`)}
            </span>
          ))}
        </div>
      ) : null}
      <Link
        href={item.next.href}
        className="mt-3 inline-block text-sm font-semibold text-mist-700 underline-offset-4 hover:underline"
      >
        {item.next.label} →
      </Link>
    </motion.li>
  );
}

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
  const { animate } = useJourneyMotion();
  const [moreOpen, setMoreOpen] = useState(false);
  const featured = pickFeatured(items);
  const others = items
    .filter((i) => i.result.confidence !== "InsufficientData" && i !== featured)
    .sort(
      (a, b) =>
        INSIGHT_ORDER.indexOf(a.result.direction) - INSIGHT_ORDER.indexOf(b.result.direction),
    );
  const without = items.filter((i) => i.result.confidence === "InsufficientData");
  const moreCount = others.length + without.length + connections.length;

  return (
    <div className="space-y-4">
      {featured ? (
        <InsightCard item={featured} featured assistedExplanation={assistedExplanation} />
      ) : (
        <div className="rounded-2xl border border-dashed border-dawn-300 bg-dawn-50/80 p-5">
          <p className="font-semibold text-ink-900">{t("dashboard.insights.noneYetTitle")}</p>
          <p className="mt-1 text-sm text-ink-600">{t("dashboard.insights.noneYetBody")}</p>
        </div>
      )}

      {moreCount > 0 ? (
        <div className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-soft)]">
          <button
            type="button"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-start text-sm font-medium text-ink-900 hover:bg-dawn-50/80"
          >
            <span className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-pill bg-mist-100 text-xs font-bold tabular-nums text-mist-700">
                {moreCount}
              </span>
              {t("dashboard.insights.moreToggle", { n: moreCount })}
            </span>
            <motion.span animate={{ rotate: moreOpen ? 180 : 0 }} aria-hidden className="text-ink-400">
              ⌄
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {moreOpen ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: animate ? 0.3 : 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-6 border-t border-dawn-200 p-4">
                  {others.length > 0 ? (
                    <div className="grid gap-3">
                      {others.map((i) => (
                        <InsightCard key={i.result.domain} item={i} />
                      ))}
                    </div>
                  ) : null}

                  {connections.length > 0 ? (
                    <section aria-labelledby="connections-heading">
                      <h3 id="connections-heading" className="font-display text-base text-ink-900">
                        {t("dashboard.connections.title")}
                      </h3>
                      <p className="mt-1 text-sm text-ink-600">{t("dashboard.connections.subtitle")}</p>
                      <ul className="mt-3 grid gap-3">
                        {connections.map((c) => (
                          <li
                            key={c.key}
                            className="rounded-xl bg-gradient-to-br from-dawn-50 to-white p-3 shadow-[var(--shadow-soft)]"
                          >
                            <p className="text-sm font-medium text-ink-900">
                              {t(`dashboard.connections.items.${c.key}.title`)}
                            </p>
                            <p className="mt-1 text-xs text-ink-600">
                              {t(`dashboard.connections.items.${c.key}.body`)}
                            </p>
                            <p className="mt-2 flex flex-wrap gap-1.5">
                              {c.domains.map((d: Domain) => (
                                <span
                                  key={d}
                                  className="rounded-pill bg-mist-100 px-2 py-0.5 text-[11px] text-mist-700"
                                >
                                  {t(`domains.${d}`)}
                                </span>
                              ))}
                            </p>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-xs text-ink-400">{t("dashboard.connections.caution")}</p>
                    </section>
                  ) : null}

                  {without.length > 0 ? (
                    <section aria-labelledby="no-info-heading">
                      <h3 id="no-info-heading" className="font-display text-base text-ink-900">
                        {t("dashboard.insights.noInfoTitle")}
                      </h3>
                      <p className="mt-1 mb-3 text-sm text-ink-600">{t("dashboard.insights.noInfoBody")}</p>
                      <ul className="grid gap-3">
                        {without.map((i) => (
                          <ThinCard key={i.result.domain} item={i} />
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}
    </div>
  );
}
