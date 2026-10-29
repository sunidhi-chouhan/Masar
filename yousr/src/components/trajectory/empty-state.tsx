"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";
import type { DataSourceId, Domain, Unknown } from "@/lib/domain/types";
import { DATA_SOURCES } from "@/lib/domain/types";
import { MISSING_ADD_PATH, type MetabolicCategory } from "@/lib/engine/breakdown";

interface Props {
  domain: Domain;
  unknowns: Unknown[];
  breakdown: MetabolicCategory[] | null;
  sourcesOn: DataSourceId[];
}

/**
 * Replaces the "we won't call this stable" guard note when an area has no
 * usable readings. It says plainly that there is not enough information yet,
 * then lists only actions that really add information on a real screen.
 */
export function EmptyState({ domain, unknowns, breakdown, sourcesOn }: Props) {
  const { t, locale } = useI18n();

  // Only unknowns that map to a real screen; one card per missing thing.
  const seen = new Set<string>();
  const adds = unknowns
    .map((u) => ({ u, href: MISSING_ADD_PATH[u.missing] }))
    .filter((x): x is { u: Unknown; href: string } => Boolean(x.href))
    .filter((x) => {
      if (seen.has(x.u.missing)) return false;
      seen.add(x.u.missing);
      return true;
    });
  const recordSourcesOff = DATA_SOURCES.filter((s) => s !== "SelfReport" && !sourcesOn.includes(s));
  const missingCategories = breakdown?.filter((c) => c.status !== "available") ?? [];

  return (
    <section className="surface-paper border border-dashed border-slate-400/70 p-5" aria-labelledby="empty-state-title">
      <p className="label-caps text-slate-600">{t("confidence.notEnough")}</p>
      <h2 id="empty-state-title" className="mt-1 text-ink-900">
        {t("emptyState.title", { domain: t(`domains.${domain}`) })}
      </h2>
      <p className="mt-2 text-ink-600">{t("emptyState.body")}</p>
      <p className="mt-2 text-sm text-ink-400">{t("emptyState.noStable")}</p>

      <h3 className="mt-5 text-ink-900">{t("emptyState.improve")}</h3>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {adds.map(({ u, href }) => (
          <li key={u.missing}>
            <Link href={`/${locale}${href}`} className="surface lift flex h-full flex-col justify-between p-3">
              <span className="text-sm text-ink-900">{t(`missing.${u.missing}`)}</span>
              <span className="mt-2 text-xs text-mist-700">{t("emptyState.addYourself")} →</span>
            </Link>
          </li>
        ))}
        {missingCategories.length && !adds.length
          ? missingCategories.map((c) => (
              <li key={c.id}>
                <Link href={`/${locale}${c.addHref}`} className="surface lift flex h-full flex-col justify-between p-3">
                  <span className="text-sm text-ink-900">{t(`metabolic.categories.${c.id}.title`)}</span>
                  <span className="mt-2 text-xs text-mist-700">{t(`metabolic.add.${c.id}`)} →</span>
                </Link>
              </li>
            ))
          : null}
        {recordSourcesOff.length ? (
          <li>
            <Link href={`/${locale}/privacy`} className="surface lift flex h-full flex-col justify-between p-3">
              <span className="text-sm text-ink-900">{recordSourcesOff.length === 1 ? t("emptyState.connectOne") : t("emptyState.connect", { n: recordSourcesOff.length })}</span>
              <span className="mt-2 text-xs text-mist-700">{t("emptyState.connectCta")} →</span>
            </Link>
          </li>
        ) : null}
        <li>
          <Link href={`/${locale}/import`} className="surface lift flex h-full flex-col justify-between p-3">
            <span className="text-sm text-ink-900">{t("emptyState.import")}</span>
            <span className="mt-2 text-xs text-mist-700">{t("import.title")} →</span>
          </Link>
        </li>
      </ul>
      <p className="mt-4 text-xs text-ink-400">{t("emptyState.footnote")}</p>
    </section>
  );
}
