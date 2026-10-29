"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n/format";
import type { ActionState, ActionType, Domain } from "@/lib/domain/types";
import { moveAction } from "@/server/actions/patient";
import { Button, TierRibbon } from "@/components/ui/atoms";
import { CarePathway } from "./care-pathway";

export interface ActionRow {
  id: string;
  type: ActionType;
  domain: Domain;
  state: ActionState;
  titleKey: string;
  reasonKey: string;
  suggestedAt: string;
  requestedAt: string | null;
  confirmedAt: string | null;
  scheduledFor: string | null;
  attendedAt: string | null;
  outcomeAt: string | null;
}

const STEPS: ActionState[] = ["Suggested", "Requested", "Confirmed", "Attended", "OutcomeRecorded"];

const TYPE_TONE: Record<ActionType, string> = {
  Learn: "bg-dawn-200 text-ink-900",
  Optimise: "bg-mist-100 text-mist-700",
  TestDiscuss: "bg-peach-200 text-peach-700",
  Counsel: "bg-amber-100 text-amber-700",
  PreserveDiscuss: "bg-amber-100 text-amber-700",
  Refer: "bg-peach-300/60 text-peach-700",
};

export function PathStepper({ state }: { state: ActionState }) {
  const { t } = useI18n();
  const idx = STEPS.indexOf(state);
  if (state === "Declined" || state === "Expired") {
    return <p className="text-xs text-slate-600">{t(`actions.states.${state}`)}</p>;
  }
  return (
    <ol className="flex items-center gap-1" aria-label={t("actions.trackerTitle")}>
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-1">
          <span
            title={t(`actions.states.${s}`)}
            className={`h-2.5 w-2.5 rounded-pill ${i < idx ? "bg-mist-500" : i === idx ? "bg-amber-400 ring-2 ring-amber-400/40" : "bg-dawn-300"}`}
          />
          {i < STEPS.length - 1 ? <span className={`h-px w-5 ${i < idx ? "bg-mist-500" : "bg-dawn-300"}`} /> : null}
        </li>
      ))}
      <li className="ms-2 text-xs text-ink-600">{t(`actions.states.${state}`)}</li>
    </ol>
  );
}

export function ActionCard({ action, livingWellHref, quiet = false }: { action: ActionRow; livingWellHref: string; quiet?: boolean }) {
  const { t, locale } = useI18n();
  const [pending, start] = useTransition();
  const a = action;
  const move = (to: ActionState) => start(() => moveAction(a.id, to));
  const isLearn = a.type === "Learn";
  const tier = a.type === "Learn" || a.type === "Optimise" ? "Education" : "DecisionSupport";

  return (
    <article className={`surface-paper p-5 ${quiet ? "border-s-4 border-s-mist-500" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-md px-2.5 py-0.5 text-xs font-medium ${TYPE_TONE[a.type]}`}>{t(`actions.types.${a.type}`)}</span>
          <span className="text-xs text-ink-400">{t(`domains.${a.domain}`)}</span>
        </div>
        {quiet ? null : <TierRibbon tier={tier} />}
      </div>
      <h3 className="mt-2.5 text-ink-900">{t(`actions.titles.${a.titleKey}`)}</h3>
      <p className="mt-1.5 text-sm text-ink-600">{t(`actions.reasons.${a.reasonKey}`)}</p>
      <p className="mt-2 text-xs text-ink-400">{t(`actions.expect.${a.type}`)}</p>

      {!isLearn && a.type !== "Optimise" ? (
        <div className="mt-4">
          <CarePathway action={a} />
        </div>
      ) : null}
      {a.type === "Optimise" ? (
        <div className="mt-4">
          <PathStepper state={a.state} />
          <p className="mt-1 text-xs text-ink-400">{formatDate(a.suggestedAt, locale)}</p>
          {/* Confirmation comes from the persisted record, never from local state. */}
          {a.requestedAt && a.state === "Requested" ? (
            <p className="mt-2 rounded-md border border-mist-300 bg-mist-100/60 px-3 py-2 text-xs text-mist-700" aria-live="polite">
              {t("actions.requestedOn", { date: formatDate(a.requestedAt, locale) })}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {isLearn ? (
          <Link href={livingWellHref} className="inline-flex items-center rounded-pill bg-ink-900 px-4 py-2 text-sm text-dawn-50 hover:bg-peach-700">
            {t("actions.buttons.open")}
          </Link>
        ) : null}
        {a.type === "Optimise" && a.state === "Suggested" ? (
          <Button tone="secondary" disabled={pending} onClick={() => move("Requested")}>
            {t("actions.buttons.request")}
          </Button>
        ) : null}
        {!isLearn && a.type !== "Optimise" ? (
          <>
            {a.state === "Suggested" ? (
              <Button disabled={pending} onClick={() => move("Requested")}>
                {t("actions.buttons.request")}
              </Button>
            ) : null}
            {a.state === "Requested" ? (
              <Button tone="secondary" disabled={pending} onClick={() => move("Confirmed")}>
                {t("actions.buttons.confirm")}
              </Button>
            ) : null}
            {a.state === "Confirmed" ? (
              <Button tone="secondary" disabled={pending} onClick={() => move("Attended")}>
                {t("actions.buttons.attended")}
              </Button>
            ) : null}
            {a.state === "Attended" ? (
              <Button tone="secondary" disabled={pending} onClick={() => move("OutcomeRecorded")}>
                {t("actions.buttons.outcome")}
              </Button>
            ) : null}
          </>
        ) : null}
        {!isLearn && ["Suggested", "Requested", "Confirmed"].includes(a.state) ? (
          <Button tone="ghost" disabled={pending} onClick={() => move("Declined")}>
            {t("actions.buttons.decline")}
          </Button>
        ) : null}
      </div>
    </article>
  );
}
