"use client";

import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n/format";
import type { ActionState } from "@/lib/domain/types";
import type { ActionRow } from "./action-card";

const STEPS: { state: ActionState; at: (a: ActionRow) => string | null }[] = [
  { state: "Suggested", at: (a) => a.suggestedAt },
  { state: "Requested", at: (a) => a.requestedAt },
  { state: "Confirmed", at: (a) => a.confirmedAt },
  { state: "Attended", at: (a) => a.attendedAt },
  { state: "OutcomeRecorded", at: (a) => a.outcomeAt },
];

/**
 * The real state of one care action. Every date shown is a timestamp that was
 * written when that transition actually happened; a step that has not
 * happened says so. Nothing here is inferred or animated.
 */
export function CarePathway({ action }: { action: ActionRow }) {
  const { t, locale } = useI18n();
  const a = action;

  if (a.state === "Declined" || a.state === "Expired") {
    return (
      <div className="rounded-md border border-dawn-200 bg-dawn-50 p-3 text-xs text-ink-600" aria-live="polite">
        <p className="font-medium text-ink-900">{t(`actions.states.${a.state}`)}</p>
        <p className="mt-0.5">{t(`dashboard.carePath.next.${a.state}`)}</p>
      </div>
    );
  }

  const current = STEPS.findIndex((s) => s.state === a.state);

  return (
    <div>
      <ol className="grid gap-2 sm:grid-cols-5" aria-label={t("actions.trackerTitle")}>
        {STEPS.map((s, i) => {
          const at = s.at(a);
          const reached = i <= current;
          const status = i < current ? "done" : i === current ? "current" : "pending";
          return (
            <li
              key={s.state}
              className={`rounded-lg border px-2.5 py-2.5 text-xs transition-colors ${
                status === "current"
                  ? "border-mist-500 bg-mist-100/70 shadow-sm ring-1 ring-mist-500/20"
                  : status === "done"
                    ? "border-mist-300/60 bg-mist-100/25"
                    : "border-dashed border-dawn-300 bg-white"
              }`}
              aria-current={status === "current" ? "step" : undefined}
            >
              <p className="flex items-center gap-1.5 font-medium text-ink-900">
                <span
                  aria-hidden
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-pill text-[10px] ${
                    status === "done"
                      ? "bg-mist-700 text-white"
                      : status === "current"
                        ? "bg-mist-500 text-white"
                        : "border border-dawn-300 text-ink-400"
                  }`}
                >
                  {status === "done" ? "✓" : status === "current" ? "●" : ""}
                </span>
                {s.state === "OutcomeRecorded" ? t("dashboard.carePath.followUp") : t(`actions.states.${s.state}`)}
              </p>
              <p className={`mt-1 ${reached ? "text-ink-600" : "text-ink-400"}`}>
                {reached
                  ? at
                    ? formatDate(at, locale)
                    : t("dashboard.carePath.noDate")
                  : t("dashboard.carePath.notYet")}
              </p>
              {s.state === "Confirmed" && a.scheduledFor ? (
                <p className="mt-0.5 text-ink-600">{t("dashboard.carePath.scheduled", { date: formatDate(a.scheduledFor, locale) })}</p>
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 rounded-md border border-dawn-200 bg-dawn-50/70 px-3 py-2 text-xs text-ink-600" aria-live="polite">
        <span className="font-medium text-ink-900">{t("dashboard.carePath.whatNext")}</span> {t(`dashboard.carePath.next.${a.state}`)}
      </p>
    </div>
  );
}
