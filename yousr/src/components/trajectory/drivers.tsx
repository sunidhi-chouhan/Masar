"use client";

import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n/format";
import type { Driver, Modifiability, Unknown } from "@/lib/domain/types";
import { EvidenceChip } from "@/components/ui/atoms";
import { getEvidence } from "@/lib/evidence/library";

const GROUPS: { key: Modifiability; label: string }[] = [
  { key: "Modifiable", label: "groupModifiable" },
  { key: "NonModifiable", label: "groupNon" },
  { key: "Unknown", label: "groupUnknown" },
];

export function DriverGroups({ drivers }: { drivers: Driver[] }) {
  const { t, locale } = useI18n();
  if (!drivers.length) return <p className="text-sm text-ink-400">{t("domainDetail.noDrivers")}</p>;
  return (
    <div className="space-y-6">
      {GROUPS.map((g) => {
        const items = drivers.filter((d) => d.modifiability === g.key);
        if (!items.length) return null;
        return (
          <div key={g.key}>
            <p className="label-caps mb-2">{t(`domainDetail.${g.label}`)}</p>
            <ul className="grid gap-2">
              {items.map((d, i) => {
                const ev = getEvidence(d.evidenceId);
                return (
                  <li
                    key={`${d.factor}-${i}`}
                    className={`rounded-md border p-3 ${
                      g.key === "Modifiable" ? "border-mist-300 bg-mist-100/50" : g.key === "NonModifiable" ? "border-dawn-200 bg-dawn-100/60" : "border-dashed border-slate-400 bg-slate-200/30"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-ink-900">
                        {t(`factors.${d.factor}`)}
                        {d.valueLabel ? <span className="ms-2 font-normal text-ink-600">{d.valueLabel}</span> : null}
                      </p>
                      <EvidenceChip strength={d.strength} />
                    </div>
                    <p className="mt-1 text-xs text-ink-400">
                      {d.source ? `${t(`privacy.sources.${d.source}`)}` : null}
                      {d.effectiveAt ? ` · ${formatDate(d.effectiveAt, locale)}` : null}
                      {ev ? ` · ${ev.organisation} ${ev.year}` : null}
                    </p>
                    {d.note ? <p className="mt-1 text-sm text-ink-600">{t(`driverNotes.${d.note}`)}</p> : null}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function UnknownCards({ unknowns, addHref }: { unknowns: Unknown[]; addHref: string }) {
  const { t } = useI18n();
  if (!unknowns.length) return <p className="text-sm text-ink-600">{t("insights.nothingUnknown")}</p>;
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {unknowns.map((u, i) => (
        <li key={`${u.missing}-${i}`} className="rounded-md border border-dashed border-slate-400 bg-dawn-50/60 p-3">
          <p className="text-sm text-ink-900">{t(`missing.${u.missing}`)}</p>
          <p className="text-xs text-ink-400">{t("missing.wouldNarrow", { domain: t(`domains.${u.wouldNarrow}`) })}</p>
          <a href={addHref} className="mt-2 inline-block text-xs text-mist-700 underline-offset-4 hover:underline">
            {t("trajectory.addData")} →
          </a>
        </li>
      ))}
    </ul>
  );
}

export function EvidenceList({ ids }: { ids: string[] }) {
  const { t, locale } = useI18n();
  const unique = [...new Set(ids)].map(getEvidence).filter((e): e is NonNullable<typeof e> => Boolean(e));
  if (!unique.length) return null;
  return (
    <ul className="grid gap-2">
      {unique.map((e) => (
        <li key={e.id} className="rounded-md border border-dawn-200 bg-dawn-50/70 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <a href={e.url} target="_blank" rel="noreferrer" className="font-medium text-ink-900 underline-offset-4 hover:underline">
              {e.title}
            </a>
            <EvidenceChip strength={e.strength} />
          </div>
          <p className="mt-1 text-xs text-ink-400">
            {e.organisation} · {e.year} · {t("strength.reviewed", { date: formatDate(e.reviewedAt, locale) })}
          </p>
          <p className="mt-1 text-ink-600">{e.summary}</p>
        </li>
      ))}
    </ul>
  );
}
