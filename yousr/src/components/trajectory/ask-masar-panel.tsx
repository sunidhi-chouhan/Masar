"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";
import { TierRibbon, Button } from "@/components/ui/atoms";
import { submitAskMasar, type HandoffResult } from "@/server/actions/handoff";

/**
 * Decision-support catch for personal medical / distress questions.
 * Never invents clinical answers — only hands off to a human pathway.
 */
export function AskMasarPanel() {
  const { t, locale } = useI18n();
  const [text, setText] = useState("");
  const [result, setResult] = useState<HandoffResult | null>(null);
  const [pending, start] = useTransition();

  return (
    <section
      aria-labelledby="ask-masar-h"
      className="rounded-[1.5rem] border border-dawn-200/80 bg-gradient-to-br from-white via-white to-mist-100/40 p-5 shadow-[var(--shadow-soft)]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="ask-masar-h" className="font-display text-xl text-ink-900">
          {t("askMasar.title")}
        </h2>
        <TierRibbon tier="DecisionSupport" />
      </div>
      <p className="mt-1 text-sm text-ink-600">{t("askMasar.intro")}</p>
      <label className="mt-4 block">
        <span className="sr-only">{t("askMasar.placeholder")}</span>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setResult(null);
          }}
          rows={3}
          maxLength={500}
          placeholder={t("askMasar.placeholder")}
          className="w-full rounded-xl border border-dawn-300 bg-dawn-50/80 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-mist-500 focus:outline-none"
        />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          disabled={pending || !text.trim()}
          onClick={() =>
            start(async () => {
              const r = await submitAskMasar(text);
              setResult(r);
            })
          }
        >
          {t("askMasar.submit")}
        </Button>
        <p className="text-xs text-ink-400">{t("askMasar.neverAnswers")}</p>
      </div>

      {result ? (
        <div
          className={`mt-4 rounded-xl p-4 text-sm ${
            result.handedOff ? "border border-amber-300/70 bg-amber-100/50 text-amber-900" : "border border-dawn-200 bg-dawn-50 text-ink-700"
          }`}
          aria-live="polite"
        >
          {result.handedOff ? (
            <>
              <p className="font-medium">
                {result.kind === "distress" ? t("askMasar.distress") : t("askMasar.handoff")}
              </p>
              <p className="mt-1">{t("askMasar.handoffBody")}</p>
              <Link
                href={`/${locale}/actions`}
                className="mt-3 inline-flex text-sm font-semibold text-mist-700 underline-offset-4 hover:underline"
              >
                {t("askMasar.cta")} →
              </Link>
            </>
          ) : (
            <p>{t("askMasar.general")}</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
