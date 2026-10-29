"use client";

import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n/format";
import type { TimelineEvent } from "@/server/patient";
import { DirectionBadge } from "@/components/ui/atoms";
import { CODE_FACTOR } from "@/lib/engine/trajectory";

function Tag({ tone, children }: { tone: "new" | "outdated" | "change" | "recorded"; children: string }) {
  const cls =
    tone === "new"
      ? "border-mist-300 bg-mist-100 text-mist-700"
      : tone === "outdated"
        ? "border-amber-400/60 bg-amber-100 text-amber-700"
        : tone === "change"
          ? "border-peach-300 bg-peach-200/70 text-peach-700"
          : "border-dawn-300 bg-dawn-100 text-ink-600";
  return <span className={`inline-flex rounded-pill border px-1.5 py-px text-[11px] ${cls}`}>{children}</span>;
}

/**
 * "Your health story, over time." Snapshots of what Masar said sit on the
 * same line as the readings that arrived, so a person can tell apart what
 * was already there, what is new, what actually changed, and what has aged.
 */
export function Timeline({
  events: allEvents,
  limit = 14,
  measurementsOnly = false,
}: {
  events: TimelineEvent[];
  limit?: number;
  /** show only recorded readings; recalculated summaries are listed elsewhere */
  measurementsOnly?: boolean;
}) {
  const { t, locale } = useI18n();
  const events = measurementsOnly ? allEvents.filter((e) => e.kind === "observation") : allEvents;
  if (!events.length) return <p className="text-sm text-ink-400">{t("timeline.empty")}</p>;

  const readings = events.filter((e) => e.kind === "observation");
  const snapshots = events.filter((e) => e.kind === "snapshot");
  const changes = snapshots.filter((e) => e.kind === "snapshot" && e.changed);
  const shown = events.slice(-limit).reverse();

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600" aria-label={t("timeline.legend")}>
        <li className="flex items-center gap-1.5">
          <Tag tone="recorded">{t("timeline.tags.recorded")}</Tag>
        </li>
        <li className="flex items-center gap-1.5">
          <Tag tone="new">{t("timeline.tags.new")}</Tag>
        </li>
        {measurementsOnly ? null : (
          <li className="flex items-center gap-1.5">
            <Tag tone="change">{t("timeline.tags.change")}</Tag>
          </li>
        )}
        <li className="flex items-center gap-1.5">
          <Tag tone="outdated">{t("timeline.tags.outdated")}</Tag>
        </li>
      </ul>
      {readings.length < 2 ? <p className="mb-3 text-sm text-ink-600">{t("timeline.noTrend")}</p> : null}
      {snapshots.length >= 2 && changes.length === 0 && readings.length >= 2 ? (
        <p className="mb-3 text-sm text-ink-600">{t("timeline.noChange")}</p>
      ) : null}

      <ol className="relative ms-2 border-s border-dawn-300 ps-5">
        {shown.map((e) => (
          <li key={e.id} className="relative pb-4 last:pb-0">
            <span
              aria-hidden
              className={`absolute -start-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-pill border border-dawn-50 ${
                e.kind === "snapshot" ? (e.changed ? "bg-peach-300" : "bg-dawn-300") : e.isNew ? "bg-mist-500" : e.isOutdated ? "bg-amber-400" : "bg-ink-400/50"
              }`}
            />
            <p className="text-xs text-ink-400">{formatDate(e.at, locale)}</p>
            {e.kind === "snapshot" ? (
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-ink-900">
                <span className="text-ink-600">{t("timeline.said")}</span>
                <DirectionBadge direction={e.direction} confidence={e.confidence} />
                {e.first ? (
                  <Tag tone="recorded">{t("timeline.tags.first")}</Tag>
                ) : e.changed ? (
                  <Tag tone="change">{t("timeline.tags.change")}</Tag>
                ) : (
                  <Tag tone="recorded">{t("timeline.tags.unchanged")}</Tag>
                )}
              </p>
            ) : (
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-ink-900">
                <span className="font-medium">{t(`factors.${CODE_FACTOR[e.code] ?? e.code}`)}</span>
                <span className="text-ink-600">
                  {e.valueNum !== null ? `${e.valueNum}${e.unit ? ` ${e.unit}` : ""}` : e.valueText ? t(`timeline.values.${e.valueText}`) : ""}
                </span>
                <span className="text-xs text-ink-400">· {t(`privacy.sources.${e.source}`)}</span>
                {e.isNew ? <Tag tone="new">{t("timeline.tags.new")}</Tag> : <Tag tone="recorded">{t("timeline.tags.recorded")}</Tag>}
                {e.isOutdated ? <Tag tone="outdated">{t("timeline.tags.outdated")}</Tag> : null}
              </p>
            )}
          </li>
        ))}
      </ol>
      {events.length > limit ? <p className="mt-2 text-xs text-ink-400">{t("timeline.more", { n: events.length - limit })}</p> : null}
    </div>
  );
}
