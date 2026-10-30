"use client";

import { motion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n/format";
import type { ActionState } from "@/lib/domain/types";
import { useJourneyMotion } from "@/components/journey/journey-loaders";
import type { ActionRow } from "./action-card";

const STEPS: { state: ActionState; at: (a: ActionRow) => string | null }[] = [
  { state: "Suggested", at: (a) => a.suggestedAt },
  { state: "Requested", at: (a) => a.requestedAt },
  { state: "Confirmed", at: (a) => a.confirmedAt },
  { state: "Attended", at: (a) => a.attendedAt },
  { state: "OutcomeRecorded", at: (a) => a.outcomeAt },
];

/**
 * Vertical care pathway — no horizontal scroll.
 * Only the current step is expanded; past/future stay compact.
 */
export function CarePathway({ action }: { action: ActionRow }) {
  const { t, locale } = useI18n();
  const { animate, dur } = useJourneyMotion();
  const a = action;

  if (a.state === "Declined" || a.state === "Expired") {
    return (
      <div className="rounded-xl bg-dawn-50 p-3 text-xs text-ink-600" aria-live="polite">
        <p className="font-medium text-ink-900">{t(`actions.states.${a.state}`)}</p>
        <p className="mt-0.5">{t(`dashboard.carePath.next.${a.state}`)}</p>
      </div>
    );
  }

  const current = STEPS.findIndex((s) => s.state === a.state);
  const progress = ((current + 1) / STEPS.length) * 100;

  return (
    <div>
      {/* Compact progress rail */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-ink-900">
            {a.state === "OutcomeRecorded"
              ? t("dashboard.carePath.followUp")
              : t(`actions.states.${a.state}`)}
          </span>
          <span className="tabular-nums text-ink-400">
            {current + 1}/{STEPS.length}
          </span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-pill bg-dawn-200"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label={t("actions.trackerTitle")}
        >
          <motion.div
            className="h-full rounded-pill bg-mist-500"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={animate ? { type: "spring", stiffness: 120, damping: 22 } : { duration: 0 }}
          />
        </div>
        <ol className="mt-2 flex justify-between gap-1" aria-hidden>
          {STEPS.map((s, i) => (
            <li key={s.state} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={`h-2 w-2 rounded-pill ${
                  i < current
                    ? "bg-mist-700"
                    : i === current
                      ? "bg-mist-500 ring-2 ring-mist-300"
                      : "bg-dawn-300"
                }`}
              />
            </li>
          ))}
        </ol>
      </div>

      {/* Vertical step list — no side scroll */}
      <ol className="relative space-y-0 border-s-2 border-dawn-200 ms-2.5 ps-4">
        {STEPS.map((s, i) => {
          const at = s.at(a);
          const status = i < current ? "done" : i === current ? "current" : "pending";
          const label =
            s.state === "OutcomeRecorded"
              ? t("dashboard.carePath.followUp")
              : t(`actions.states.${s.state}`);
          return (
            <li key={s.state} className="relative pb-4 last:pb-0">
              <span
                aria-hidden
                className={`absolute -start-[1.4rem] top-0.5 flex h-5 w-5 items-center justify-center rounded-pill text-[10px] font-bold ${
                  status === "done"
                    ? "bg-mist-700 text-white"
                    : status === "current"
                      ? "bg-mist-500 text-white"
                      : "border border-dawn-300 bg-white text-ink-400"
                }`}
              >
                {status === "done" ? "✓" : i + 1}
              </span>
              <div
                className={`rounded-xl px-3 py-2.5 text-xs transition-colors ${
                  status === "current"
                    ? "bg-mist-100/80 ring-1 ring-mist-300/60"
                    : status === "done"
                      ? "bg-dawn-50/80"
                      : "bg-transparent"
                }`}
                aria-current={status === "current" ? "step" : undefined}
              >
                <p
                  className={`font-medium ${
                    status === "pending" ? "text-ink-400" : "text-ink-900"
                  }`}
                >
                  {label}
                </p>
                <p className={`mt-0.5 ${status === "pending" ? "text-ink-400" : "text-ink-600"}`}>
                  {status === "pending"
                    ? t("dashboard.carePath.notYet")
                    : at
                      ? formatDate(at, locale)
                      : t("dashboard.carePath.noDate")}
                </p>
                {s.state === "Confirmed" && a.scheduledFor ? (
                  <p className="mt-0.5 text-ink-600">
                    {t("dashboard.carePath.scheduled", {
                      date: formatDate(a.scheduledFor, locale),
                    })}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <motion.p
        className="mt-3 rounded-xl bg-dawn-50/90 px-3 py-2.5 text-xs text-ink-600"
        aria-live="polite"
        initial={animate ? { opacity: 0, y: 4 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: dur(0.3) }}
      >
        <span className="font-medium text-ink-900">{t("dashboard.carePath.whatNext")}</span>{" "}
        {t(`dashboard.carePath.next.${a.state}`)}
      </motion.p>
    </div>
  );
}
