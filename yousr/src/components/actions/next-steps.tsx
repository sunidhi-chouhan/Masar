"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n/format";
import type { Domain } from "@/lib/domain/types";
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

function StepRow({ step, primary = false }: { step: NextStep; primary?: boolean }) {
  const { t } = useI18n();
  return (
    <div className={`surface-paper p-4 ${primary ? "border-s-4 border-s-mist-500 md:p-5" : ""}`}>
      <p className={`font-semibold text-ink-900 ${primary ? "text-base" : "text-sm"}`}>{t(`dashboard.steps.items.${step.key}.title`)}</p>
      <p className="mt-1 text-sm text-ink-600">{t(`dashboard.steps.items.${step.key}.body`, step.vars)}</p>
      <Link href={step.href} className="mt-2 inline-block text-sm font-semibold text-mist-700 underline-offset-4 hover:underline">
        {t(`dashboard.steps.items.${step.key}.cta`)} →
      </Link>
    </div>
  );
}

/**
 * One next step, with why and where it stands. Anything already under way
 * comes first, so the person can keep track of it; otherwise the step that
 * belongs to the main insight; otherwise the most useful thing to add.
 * A couple of other steps are available underneath.
 */
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

  const open = actions.filter((a) => a.state !== "OutcomeRecorded");
  const inFlight = open.find((a) => IN_FLIGHT.includes(a.state));
  const forInsight = open.find((a) => a.state === "Suggested" && a.domain === featuredDomain);
  const primaryAction = inFlight ?? forInsight ?? null;
  const primaryStep = primaryAction ? null : steps.find((s) => s.key !== "prepare") ?? steps[0] ?? null;

  const remainingActions = open.filter((a) => a !== primaryAction);
  const remainingSteps = steps.filter((s) => s !== primaryStep);
  const finished = actions.filter((a) => a.state === "OutcomeRecorded").length;
  const otherSteps = remainingSteps.slice(0, 1);
  const hiddenCount = moreCount + remainingActions.length + finished;
  const latestReview = reviews[0];

  if (!primaryAction && !primaryStep) {
    return (
      <div className="surface-paper p-5">
        <p className="font-semibold text-ink-900">{t("dashboard.steps.noneTitle")}</p>
        <p className="mt-1 text-sm text-ink-600">{t("dashboard.steps.noneBody")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {primaryAction ? (
        <div>
          <p className="mb-2 text-sm text-ink-600">{t("dashboard.steps.pathwayBody")}</p>
          <ActionCard quiet action={primaryAction} livingWellHref={hubHrefByDomain[primaryAction.domain] ?? `/${locale}/living-well`} />
        </div>
      ) : primaryStep ? (
        <StepRow step={primaryStep} primary />
      ) : null}

      {latestReview ? (
        <p className="text-xs text-ink-600">
          <span className="font-medium text-ink-900">{t("dashboard.steps.reviewsTitle")}:</span>{" "}
          {locale === "ar" ? latestReview.clinicianNameAr : latestReview.clinicianName} · {t(`clinician.${latestReview.decision}`)} ·{" "}
          {formatDate(latestReview.at, locale)}. {t("dashboard.steps.reviewsHint")}
        </p>
      ) : null}

      {otherSteps.length > 0 ? (
        <div>
          <p className="label-caps">{t("dashboard.steps.alsoTitle")}</p>
          <ul className="mt-2 grid gap-2.5 md:grid-cols-2">
            {otherSteps.map((s) => (
              <li key={s.key}>
                <StepRow step={s} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hiddenCount > 0 ? (
        <Link href={actionsHref} className="inline-block text-xs font-semibold text-mist-700 underline-offset-4 hover:underline">
          {t("dashboard.steps.all")} →
        </Link>
      ) : null}
    </div>
  );
}
