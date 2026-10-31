"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import type { Domain } from "@/lib/domain/types";
import { answerTeachBack } from "@/server/actions/patient";

const QUESTIONS = ["q_predict", "q_change"] as const;

export function TeachBackSheet({ domain }: { domain: Domain }) {
  const { t, locale } = useI18n();
  const [pending, start] = useTransition();
  const [results, setResults] = useState<Record<string, boolean | undefined>>({});
  const [escalated, setEscalated] = useState(false);
  const done = QUESTIONS.every((q) => results[q] !== undefined);

  return (
    <section aria-labelledby="tb-h" className="rounded-lg border border-mist-300 bg-mist-100/50 p-5">
      <h2 id="tb-h" className="text-ink-900">
        {t("teachback.title")}
      </h2>
      <p className="mt-1 text-sm text-ink-600">{t("teachback.intro")}</p>
      <ul className="mt-4 space-y-4">
        {QUESTIONS.map((q) => {
          const r = results[q];
          return (
            <li key={q} className="rounded-md bg-dawn-50/80 p-4">
              <p className="text-ink-900">{t(`teachback.questions.${q}`)}</p>
              <div className="mt-2 flex gap-2">
                {(["yes", "no"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    disabled={pending || r !== undefined}
                    onClick={() =>
                      start(async () => {
                        const out = await answerTeachBack(domain, q, a);
                        setResults((s) => ({ ...s, [q]: out.correct }));
                        if (out.escalated) setEscalated(true);
                      })
                    }
                    className="rounded-pill border border-dawn-300 bg-dawn-50 px-4 py-1.5 text-sm text-ink-900 hover:bg-dawn-100 disabled:opacity-60"
                  >
                    {t(`common.${a}`)}
                  </button>
                ))}
              </div>
              <AnimatePresence>
                {r !== undefined ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 space-y-2"
                    aria-live="polite"
                  >
                    <p className={`text-sm ${r ? "text-mist-700" : "text-amber-700"}`}>
                      {r ? t("teachback.correct") : t(`teachback.incorrect.${q}`)}
                    </p>
                    {!r && q === "q_predict" ? (
                      <p className="rounded-md border border-dawn-200 bg-white/80 p-3 text-sm text-ink-700">
                        {t("teachback.reExplain")}
                      </p>
                    ) : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
      {done ? <p className="mt-3 text-sm text-ink-600">{t("teachback.thanks")}</p> : null}
      {escalated ? (
        <div className="mt-4 rounded-xl border border-amber-300/70 bg-amber-100/50 p-4 text-sm text-amber-900" aria-live="polite">
          <p className="font-medium">{t("teachback.escalated")}</p>
          <p className="mt-1">{t("teachback.escalatedBody")}</p>
          <Link
            href={`/${locale}/actions`}
            className="mt-2 inline-flex font-semibold text-mist-700 underline-offset-4 hover:underline"
          >
            {t("teachback.seeCounsel")} →
          </Link>
        </div>
      ) : null}
    </section>
  );
}
