"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n/format";
import type { CategoryStatus, MetabolicCategory } from "@/lib/engine/breakdown";

const STATUS_TONE: Record<CategoryStatus, string> = {
  available: "border-mist-300 bg-mist-100/70 text-mist-700",
  single: "border-dawn-300 bg-dawn-100 text-ink-900",
  outdated: "border-amber-400/70 bg-amber-100 text-amber-700",
  missing: "border-dashed border-slate-400 bg-slate-200/50 text-slate-600",
};

const STATUS_ICON: Record<CategoryStatus, string> = {
  available: "●",
  single: "◐",
  outdated: "◷",
  missing: "◌",
};

export function MetabolicStatusChip({ status }: { status: CategoryStatus }) {
  const { t } = useI18n();
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${STATUS_TONE[status]}`}>
      <span aria-hidden className="text-[10px]">{STATUS_ICON[status]}</span>
      {t(`metabolic.status.${status}`)}
    </span>
  );
}

/**
 * Full block for the metabolic section and detail page: a plain-language
 * explainer, then one card per category saying what is recorded, how recent
 * it is, and where to add it. Every link goes to a working workflow.
 */
export function MetabolicBreakdown({
  categories,
  compactHeader = false,
}: {
  categories: MetabolicCategory[];
  compactHeader?: boolean;
}) {
  const { t, locale } = useI18n();
  return (
    <div>
      <div className="surface-paper p-4 md:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          {compactHeader ? (
            <h3 className="text-ink-900">{t("metabolic.whatIs")}</h3>
          ) : (
            <h2 className="text-ink-900">{t("metabolic.whatIs")}</h2>
          )}
          <span className="text-xs font-medium text-ink-400">{t("metabolic.noScore")}</span>
        </div>
        <p className="mt-1.5 text-sm text-ink-600">{t("metabolic.whatIsBody")}</p>

        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <li
              key={c.id}
              className={`flex flex-col justify-between rounded-md border p-3.5 ${
                c.status === "missing"
                  ? "border-dashed border-slate-400/80 bg-dawn-50/50"
                  : "border-dawn-200 bg-dawn-50/60"
              }`}
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <p className="text-sm font-semibold text-ink-900">{t(`metabolic.categories.${c.id}.title`)}</p>
                  <MetabolicStatusChip status={c.status} />
                </div>
                <p className="mt-1 text-xs text-ink-600">{t(`metabolic.categories.${c.id}.body`)}</p>
                {c.latest ? (
                  <div className="mt-2.5 rounded-sm border border-dawn-200 bg-white px-2.5 py-1.5 text-xs text-ink-900">
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
                  <p className="mt-2.5 rounded-sm border border-dashed border-slate-400/60 bg-slate-200/30 px-2.5 py-1.5 text-xs text-slate-600">
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
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-dawn-200/70 pt-2 text-xs font-medium">
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
            </li>
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
        <li key={c.id} className="flex items-center gap-1.5 rounded-sm bg-dawn-50 px-1.5 py-0.5 text-[11px] text-ink-600">
          <span aria-hidden className="text-[9px] text-ink-600">{STATUS_ICON[c.status]}</span>
          <span className="truncate font-medium text-ink-900">{t(`metabolic.categories.${c.id}.short`)}</span>
          <span className="ms-auto shrink-0 text-ink-600">{t(`metabolic.status.${c.status}`)}</span>
        </li>
      ))}
    </ul>
  );
}
