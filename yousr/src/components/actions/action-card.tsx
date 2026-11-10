"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n/format";
import type { ActionState, ActionType, Domain } from "@/lib/domain/types";
import { moveAction } from "@/server/actions/patient";
import { Button, TierRibbon } from "@/components/ui/atoms";
import { JourneyButtonLoader, useJourneyMotion } from "@/components/journey/journey-loaders";
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

function TypeGlyph({ type }: { type: ActionType }) {
  const common = "h-5 w-5";
  if (type === "Refer" || type === "Counsel" || type === "PreserveDiscuss" || type === "TestDiscuss") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M8 5h8a2 2 0 0 1 2 2v12l-3-1.5L12 19l-3-1.5L6 19V7a2 2 0 0 1 2-2Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (type === "Optimise") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 4v4M12 16v4M4 12h4M16 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 19V6.5A2.5 2.5 0 0 1 6.5 4H20v12H7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 16v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

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
  const { animate } = useJourneyMotion();
  const [pending, start] = useTransition();
  const [whyOpen, setWhyOpen] = useState(false);
  const a = action;
  const move = (to: ActionState) => start(() => moveAction(a.id, to));
  const isLearn = a.type === "Learn";
  const tier = a.type === "Learn" || a.type === "Optimise" ? "Education" : "DecisionSupport";

  const actionLabel = (key: string, onDark = true) =>
    pending ? (
      <JourneyButtonLoader label={t("journey.loading")} onDark={onDark} withLabel={false} />
    ) : (
      t(`actions.buttons.${key}`)
    );

  return (
    <article
      className={`overflow-hidden card p-5 ${
        quiet ? "ring-1 ring-mist-300/60" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mist-100 text-mist-700">
            <TypeGlyph type={a.type} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-md px-2.5 py-0.5 text-xs font-medium ${TYPE_TONE[a.type]}`}>
                {t(`actions.types.${a.type}`)}
              </span>
              <span className="text-xs text-ink-400">{t(`domains.short.${a.domain}`)}</span>
            </div>
            <h3 className="mt-1.5 font-display text-xl tracking-tight text-ink-900">
              {t(`actions.titles.${a.titleKey}`)}
            </h3>
          </div>
        </div>
        {quiet ? null : <TierRibbon tier={tier} />}
      </div>

      <button
        type="button"
        aria-expanded={whyOpen}
        onClick={() => setWhyOpen((v) => !v)}
        className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl bg-dawn-50/90 px-3 py-2 text-start text-sm text-ink-600 hover:bg-dawn-100"
      >
        <span className="font-medium text-ink-900">{t("dashboard.insights.matters")}</span>
        <motion.span animate={{ rotate: whyOpen ? 180 : 0 }} aria-hidden className="text-ink-400">
          ⌄
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {whyOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: animate ? 0.25 : 0 }}
            className="overflow-hidden"
          >
            <p className="mt-2 px-1 text-sm leading-relaxed text-ink-600">
              {t(`actions.reasons.${a.reasonKey}`)}
            </p>
            <p className="mt-1.5 px-1 text-xs text-ink-400">{t(`actions.expect.${a.type}`)}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!isLearn && a.type !== "Optimise" ? (
        <div className="mt-4">
          <CarePathway action={a} />
        </div>
      ) : null}
      {a.type === "Optimise" ? (
        <div className="mt-4">
          <PathStepper state={a.state} />
          <p className="mt-1 text-xs text-ink-400">{formatDate(a.suggestedAt, locale)}</p>
          {a.requestedAt && a.state === "Requested" ? (
            <p className="mt-2 rounded-xl bg-mist-100/60 px-3 py-2 text-xs text-mist-700" aria-live="polite">
              {t("actions.requestedOn", { date: formatDate(a.requestedAt, locale) })}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {isLearn ? (
          <Link
            href={livingWellHref}
            className="inline-flex min-h-10 items-center rounded-lg bg-mist-700 px-4 text-sm font-semibold text-white hover:bg-mist-500"
          >
            {t("actions.buttons.open")}
          </Link>
        ) : null}
        {a.type === "Optimise" && a.state === "Suggested" ? (
          <Button tone="secondary" disabled={pending} onClick={() => move("Requested")} className="min-w-[7rem]">
            {actionLabel("request", false)}
          </Button>
        ) : null}
        {!isLearn && a.type !== "Optimise" ? (
          <>
            {a.state === "Suggested" ? (
              <Button disabled={pending} onClick={() => move("Requested")} className="min-w-[7rem]">
                {actionLabel("request")}
              </Button>
            ) : null}
            {a.state === "Requested" ? (
              <Button tone="secondary" disabled={pending} onClick={() => move("Confirmed")} className="min-w-[7rem]">
                {actionLabel("confirm", false)}
              </Button>
            ) : null}
            {a.state === "Confirmed" ? (
              <Button tone="secondary" disabled={pending} onClick={() => move("Attended")} className="min-w-[7rem]">
                {actionLabel("attended", false)}
              </Button>
            ) : null}
            {a.state === "Attended" ? (
              <Button tone="secondary" disabled={pending} onClick={() => move("OutcomeRecorded")} className="min-w-[7rem]">
                {actionLabel("outcome", false)}
              </Button>
            ) : null}
          </>
        ) : null}
        {!isLearn && ["Suggested", "Requested", "Confirmed"].includes(a.state) ? (
          <Button tone="ghost" disabled={pending} onClick={() => move("Declined")}>
            {pending ? (
              <JourneyButtonLoader label={t("journey.loading")} withLabel={false} />
            ) : (
              t("actions.buttons.decline")
            )}
          </Button>
        ) : null}
      </div>
    </article>
  );
}
