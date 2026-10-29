"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import { DirectionBadge, SimulatedBadge } from "@/components/ui/atoms";
import type { Confidence, Direction, Domain, Intention } from "@/lib/domain/types";
import { LUX } from "@/components/journey/magnetic";
import type { ReactNode } from "react";

export type ConversationArea = {
  domain: Domain;
  direction: Direction;
  confidence: Confidence;
  href: string;
};

export type ConversationStep = {
  title: string;
  body: string;
  cta: string;
  href: string;
};

type Featured = {
  domain: Domain;
  direction: Direction;
  confidence: Confidence;
  observed: string;
  summary: string;
  cannot: string;
  discuss?: string | null;
  assisted?: string | null;
};

/**
 * Personalized conversational spine for the patient trajectory.
 * DaisyUI chat bubbles — calm, necessary messages only. No dashboard chrome.
 */
export function ConversationalView({
  name,
  intention,
  overviewLine,
  featured,
  gaps,
  primaryStep,
  areas,
  intentionControl,
}: {
  name: string;
  intention: Intention;
  overviewLine: string;
  featured: Featured | null;
  gaps: string[];
  primaryStep: ConversationStep | null;
  areas: ConversationArea[];
  intentionControl: ReactNode;
}) {
  const { t } = useI18n();
  const reduce = useReducedMotion() === true;

  const bubbles: { id: string; body: ReactNode; footer?: string }[] = [
    {
      id: "hello",
      body: (
        <>
          <p className="font-medium">{t("dashboard.conversation.hello", { name })}</p>
          <p className="mt-1.5 opacity-90">{overviewLine}</p>
        </>
      ),
      footer: t("dashboard.conversation.tierEducation"),
    },
  ];

  if (featured) {
    bubbles.push({
      id: "focus",
      body: (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="font-semibold">{t(`domains.${featured.domain}`)}</span>
            <DirectionBadge direction={featured.direction} confidence={featured.confidence} compact />
          </div>
          {featured.assisted ? (
            <p>{featured.assisted}</p>
          ) : (
            <>
              <p>
                <span className="opacity-70">{t("dashboard.insights.recorded")}: </span>
                {featured.observed}
              </p>
              <p className="mt-2">
                <span className="opacity-70">{t("dashboard.insights.matters")}: </span>
                {featured.summary}
              </p>
            </>
          )}
          <p className="mt-2 text-sm opacity-85">
            <span className="font-medium">{t("dashboard.insights.cannot")}. </span>
            {featured.cannot}
          </p>
          {featured.discuss ? (
            <p className="mt-2 rounded-field bg-warning/15 px-2.5 py-1.5 text-sm">
              {featured.discuss}
            </p>
          ) : null}
        </>
      ),
      footer: t("dashboard.conversation.tierDecision"),
    });
  } else {
    bubbles.push({
      id: "empty",
      body: (
        <>
          <p className="font-medium">{t("dashboard.insights.noneYetTitle")}</p>
          <p className="mt-1.5 opacity-90">{t("dashboard.insights.noneYetBody")}</p>
        </>
      ),
    });
  }

  if (gaps.length > 0) {
    bubbles.push({
      id: "gaps",
      body: (
        <>
          <p className="font-medium">{t("dashboard.conversation.gapsTitle")}</p>
          <p className="mt-1.5 opacity-90">
            {t("dashboard.conversation.gapsBody", { items: gaps.join("; ") })}
          </p>
        </>
      ),
    });
  }

  bubbles.push({
    id: "intention",
    body: (
      <>
        <p className="font-medium">{t("dashboard.conversation.intentionTitle")}</p>
        <p className="mt-1.5 text-sm opacity-90">
          {t(`dashboard.overview.goalBody.${intention}`)}
        </p>
        <div className="mt-3">{intentionControl}</div>
      </>
    ),
  });

  if (primaryStep) {
    bubbles.push({
      id: "next",
      body: (
        <>
          <p className="font-medium">{primaryStep.title}</p>
          <p className="mt-1.5 opacity-90">{primaryStep.body}</p>
          <Link href={primaryStep.href} className="btn btn-primary btn-sm mt-3">
            {primaryStep.cta}
          </Link>
        </>
      ),
      footer: t("dashboard.conversation.notAdvice"),
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="mb-6 border-b border-base-300 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="label-caps text-primary">{t("dashboard.eyebrow")}</p>
          <SimulatedBadge />
        </div>
        <h1 className="mt-2 font-display text-2xl tracking-tight text-base-content md:text-3xl">
          {t("dashboard.conversation.headline", { name })}
        </h1>
        <p className="mt-1.5 text-sm text-base-content/65">{t("dashboard.conversation.subheadline")}</p>
      </header>

      <div className="space-y-1" role="log" aria-live="polite" aria-relevant="additions">
        {bubbles.map((b, i) => (
          <motion.div
            key={b.id}
            className="chat chat-start"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : i * 0.08, ease: LUX }}
          >
            <div className="chat-image avatar">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {t("common.appName").slice(0, 1)}
              </div>
            </div>
            <div className="chat-header text-xs opacity-60">
              {t("common.appName")}
              {b.footer ? <time className="ms-2 opacity-70">{b.footer}</time> : null}
            </div>
            <div className="chat-bubble chat-bubble-primary max-w-[min(100%,28rem)] text-sm leading-relaxed">
              {b.body}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Compact area strip — scannable, not a second dashboard */}
      {areas.length > 0 ? (
        <section className="mt-8" aria-labelledby="areas-heading">
          <h2 id="areas-heading" className="font-display text-lg tracking-tight">
            {t("dashboard.conversation.areasTitle")}
          </h2>
          <p className="mt-1 text-sm text-base-content/60">{t("dashboard.conversation.areasBody")}</p>
          <ul className="mt-3 divide-y divide-base-300 overflow-hidden rounded-box border border-base-300 bg-base-100">
            {areas.map((a) => (
              <li key={a.domain}>
                <Link
                  href={a.href}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-base-200"
                >
                  <span className="font-medium">{t(`domains.${a.domain}`)}</span>
                  <DirectionBadge direction={a.direction} confidence={a.confidence} compact />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-8 text-xs leading-relaxed text-base-content/50">{t("common.notDiagnosis")}</p>
    </div>
  );
}
