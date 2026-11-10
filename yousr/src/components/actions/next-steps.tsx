"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n/format";
import type { Domain } from "@/lib/domain/types";
import { useJourneyMotion } from "@/components/journey/journey-loaders";
import { ActionCard, type ActionRow } from "./action-card";

export interface NextStep {
  key: "complete" | "review" | "prepare" | "learn";
  vars: Record<string, string | number>;
  href: string;
}

export interface ReviewRow {
  id: string;
  decision: string;
  at: string;
  clinicianName: string;
  clinicianNameAr: string;
}

const IN_FLIGHT = ["Requested", "Confirmed", "Attended"];
const LUX = [0.16, 1, 0.3, 1] as const;

const STEP_ICON: Record<NextStep["key"], ReactNode> = {
  complete: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8v4l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  review: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path d="M5 7h14M5 12h10M5 17h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  prepare: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M8 5h8a2 2 0 0 1 2 2v12l-3-1.5L12 19l-3-1.5L6 19V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  ),
  learn: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path d="M4 19V6.5A2.5 2.5 0 0 1 6.5 4H20v12H7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 16v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

function StepCard({ step, primary = false }: { step: NextStep; primary?: boolean }) {
  const { t } = useI18n();
  const { animate } = useJourneyMotion();
  const items =
    step.key === "complete" && typeof step.vars.items === "string"
      ? String(step.vars.items)
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  return (
    <motion.div
      whileHover={animate ? { y: -2 } : undefined}
      className={`overflow-hidden card p-4 ${
        primary ? "ring-1 ring-mist-300/70" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mist-100 text-mist-700">
          {STEP_ICON[step.key]}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`font-semibold text-ink-900 ${primary ? "text-base" : "text-sm"}`}>
            {t(`dashboard.steps.items.${step.key}.title`)}
          </p>
          {items.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {items.slice(0, 3).map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 rounded-lg bg-dawn-50 px-2.5 py-1.5 text-xs text-ink-600"
                >
                  <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-pill bg-mist-500" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm leading-relaxed text-ink-600">
              {t(`dashboard.steps.items.${step.key}.body`, step.vars)}
            </p>
          )}
          <Link
            href={step.href}
            className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-mist-700 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-mist-500"
          >
            {t(`dashboard.steps.items.${step.key}.cta`)} →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export function NextSteps({
  steps,
  actions,
  featuredDomain,
  hubHrefByDomain,
  reviews,
  moreCount,
  actionsHref,
}: {
  steps: NextStep[];
  actions: ActionRow[];
  featuredDomain: Domain | null;
  hubHrefByDomain: Record<string, string>;
  reviews: ReviewRow[];
  moreCount: number;
  actionsHref: string;
}) {
  const { t, locale } = useI18n();
  const { animate, live, dur } = useJourneyMotion();

  const open = actions.filter((a) => a.state !== "OutcomeRecorded");
  const inFlight = open.find((a) => IN_FLIGHT.includes(a.state));
  const forInsight = open.find((a) => a.state === "Suggested" && a.domain === featuredDomain);
  const primaryAction = inFlight ?? forInsight ?? null;
  const primaryStep = primaryAction ? null : steps.find((s) => s.key !== "prepare") ?? steps[0] ?? null;

  const remainingSteps = steps.filter((s) => s !== primaryStep);
  const finished = actions.filter((a) => a.state === "OutcomeRecorded").length;
  const otherSteps = remainingSteps.slice(0, 1);
  const remainingActions = open.filter((a) => a !== primaryAction);
  const hiddenCount = moreCount + remainingActions.length + finished;
  const latestReview = reviews[0];

  if (!primaryAction && !primaryStep) {
    return (
      <div className="rounded-2xl border border-dashed border-dawn-300 bg-dawn-50/80 p-5">
        <p className="font-semibold text-ink-900">{t("dashboard.steps.noneTitle")}</p>
        <p className="mt-1 text-sm text-ink-600">{t("dashboard.steps.noneBody")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={live && animate ? { opacity: 0, y: 8 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: dur(0.4), ease: LUX }}
      >
        {primaryAction ? (
          <div>
            <p className="mb-2 text-sm text-ink-600">{t("dashboard.steps.pathwayBody")}</p>
            <ActionCard
              quiet
              action={primaryAction}
              livingWellHref={hubHrefByDomain[primaryAction.domain] ?? `/${locale}/living-well`}
            />
          </div>
        ) : primaryStep ? (
          <StepCard step={primaryStep} primary />
        ) : null}
      </motion.div>

      {latestReview ? (
        <p className="rounded-xl bg-dawn-50 px-3 py-2 text-xs text-ink-600">
          <span className="font-medium text-ink-900">{t("dashboard.steps.reviewsTitle")}:</span>{" "}
          {locale === "ar" ? latestReview.clinicianNameAr : latestReview.clinicianName} ·{" "}
          {t(`clinician.${latestReview.decision}`)} · {formatDate(latestReview.at, locale)}.{" "}
          {t("dashboard.steps.reviewsHint")}
        </p>
      ) : null}

      {otherSteps.length > 0 ? (
        <div>
          <p className="label-caps mb-2">{t("dashboard.steps.alsoTitle")}</p>
          <ul className="grid gap-3">
            {otherSteps.map((s) => (
              <li key={s.key}>
                <StepCard step={s} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hiddenCount > 0 ? (
        <Link
          href={actionsHref}
          className="inline-flex text-sm font-semibold text-mist-700 underline-offset-4 hover:underline"
        >
          {t("dashboard.steps.all")} →
        </Link>
      ) : null}
    </div>
  );
}
