"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n/format";
import type { CategoryStatus, MetabolicCategory } from "@/lib/engine/breakdown";
import { useJourneyMotion } from "@/components/journey/journey-loaders";
import { MetabolicOrbit, StatusOrb } from "./section-figures";

const STATUS_TONE: Record<CategoryStatus, string> = {
  available: "bg-mist-100/80 text-mist-700",
  single: "bg-dawn-100 text-ink-900",
  outdated: "bg-amber-100 text-amber-700",
  missing: "bg-slate-200/50 text-slate-600",
};

export function MetabolicStatusChip({ status }: { status: CategoryStatus }) {
  const { t } = useI18n();
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TONE[status]}`}>
      <StatusOrb status={status} />
      {t(`metabolic.status.${status}`)}
    </span>
  );
}

/**
 * Full block for the metabolic section: orbital figure + circular category cells.
 */
export function MetabolicBreakdown({
  categories,
  compactHeader = false,
}: {
  categories: MetabolicCategory[];
  compactHeader?: boolean;
}) {
  const { t, locale } = useI18n();
  const { animate, live, dur } = useJourneyMotion();

  return (
    <div>
      <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-white via-white to-mist-100/50 p-4 shadow-[var(--shadow-soft)] md:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -start-16 top-0 h-48 w-48 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--color-mist-300, #9dd4c8) 75%, transparent), transparent 70%)",
          }}
        />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-xl">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              {compactHeader ? (
                <h3 className="font-display text-xl tracking-tight text-ink-900">{t("metabolic.whatIs")}</h3>
              ) : (
                <h2 className="font-display text-2xl tracking-tight text-ink-900">{t("metabolic.whatIs")}</h2>
              )}
              <span className="rounded-full bg-dawn-100 px-2.5 py-0.5 text-xs font-medium text-ink-500">
                {t("metabolic.noScore")}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">{t("metabolic.whatIsBody")}</p>
          </div>
          <MetabolicOrbit className="mx-auto sm:mx-0" />
        </div>

        <ul className="relative mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c, i) => (
            <motion.li
              key={c.id}
              initial={live && animate ? { opacity: 0, y: 8 } : false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: dur(0.35), delay: animate ? i * 0.05 : 0 }}
              whileHover={animate ? { y: -2 } : undefined}
              className={`relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] p-4 ${
                c.status === "missing"
                  ? "border border-dashed border-slate-400/70 bg-dawn-50/40"
                  : "bg-white/80 shadow-[var(--shadow-soft)] ring-1 ring-dawn-200/50"
              }`}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -end-6 -top-6 h-20 w-20 rounded-full opacity-50"
                style={{
                  background:
                    c.status === "available"
                      ? "radial-gradient(circle, color-mix(in srgb, var(--color-mist-300, #9dd4c8) 80%, transparent), transparent 70%)"
                      : c.status === "outdated"
                        ? "radial-gradient(circle, color-mix(in srgb, var(--color-amber-300, #f0d78c) 80%, transparent), transparent 70%)"
                        : "radial-gradient(circle, color-mix(in srgb, var(--color-dawn-300, #ddd4c6) 80%, transparent), transparent 70%)",
                }}
              />
              <div className="relative">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <p className="text-sm font-semibold text-ink-900">{t(`metabolic.categories.${c.id}.title`)}</p>
                  <MetabolicStatusChip status={c.status} />
                </div>
                <p className="mt-1.5 text-xs text-ink-600">{t(`metabolic.categories.${c.id}.body`)}</p>
                {c.latest ? (
                  <div className="mt-3 rounded-full bg-mist-100/60 px-3 py-2 text-xs text-ink-900">
                    <span className="font-semibold">
                      {c.latest.value}
                      {c.latest.unit ? ` ${c.latest.unit}` : ""}
                    </span>
                    <span className="text-ink-600">
                      {" · "}
                      {formatDate(c.latest.at, locale)}
                      {" · "}
                      {t(`privacy.sources.${c.latest.source}`)}
                    </span>
                    {c.count > 1 ? (
                      <span className="ms-1 text-ink-400">({t("metabolic.readings", { n: c.count })})</span>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 rounded-2xl border border-dashed border-slate-400/60 bg-slate-200/20 px-3 py-2 text-xs text-slate-600">
                    {t(`metabolic.statusHint.${c.status}`, { months: c.staleMonths })}
                  </p>
                )}
                {c.latest ? (
                  <p className="mt-1.5 text-[11px] text-ink-600">
                    {t(`metabolic.statusHint.${c.status}`, { months: c.staleMonths })}
                  </p>
                ) : null}
              </div>

              {c.status !== "available" ? (
                <div className="relative mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-dawn-200/70 pt-2 text-xs font-medium">
                  <Link href={`/${locale}${c.addHref}`} className="text-mist-700 underline-offset-4 hover:underline">
                    {t(`metabolic.add.${c.id}`)} →
                  </Link>
                  {c.id !== "activity" ? (
                    <Link href={`/${locale}/privacy`} className="text-ink-600 underline-offset-4 hover:underline">
                      {t("metabolic.connect")}
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Compact version for the DomainCard on the overview. */
export function MetabolicMiniGrid({ categories }: { categories: MetabolicCategory[] }) {
  const { t } = useI18n();
  return (
    <ul className="mt-2.5 grid grid-cols-2 gap-1.5" aria-label={t("metabolic.whatIs")}>
      {categories.map((c) => (
        <li
          key={c.id}
          className="flex items-center gap-1.5 rounded-full bg-dawn-50 px-2 py-1 text-[11px] text-ink-600"
        >
          <StatusOrb status={c.status} />
          <span className="truncate font-medium text-ink-900">{t(`metabolic.categories.${c.id}.short`)}</span>
          <span className="ms-auto shrink-0 text-ink-500">{t(`metabolic.status.${c.status}`)}</span>
        </li>
      ))}
    </ul>
  );
}
