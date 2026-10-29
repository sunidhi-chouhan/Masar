"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import type { Domain } from "@/lib/domain/types";
import { answerTeachBack } from "@/server/actions/patient";

const QUESTIONS = ["q_predict", "q_change"] as const;

export function TeachBackSheet({ domain }: { domain: Domain }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const [results, setResults] = useState<Record<string, boolean | undefined>>({});
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
                        const ok = await answerTeachBack(domain, q, a);
                        setResults((s) => ({ ...s, [q]: ok }));
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
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-2 text-sm ${r ? "text-mist-700" : "text-amber-700"}`}
                    aria-live="polite"
                  >
                    {r ? t("teachback.correct") : t(`teachback.incorrect.${q}`)}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
      {done ? <p className="mt-3 text-sm text-ink-600">{t("teachback.thanks")}</p> : null}
    </section>
  );
}
