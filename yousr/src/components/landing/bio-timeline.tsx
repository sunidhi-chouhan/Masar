"use client";

import Image from "next/image";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { LUX } from "@/components/journey/magnetic";

const NODES = [
  { id: "signal" as const },
  { id: "pattern" as const },
  { id: "option" as const },
  { id: "counsel" as const },
];

const STEP_MS = 1100;

/** Editorial over-time story — numbered progress, not a daisyUI steps strip. */
export function BioTimeline() {
  const { t } = useI18n();
  const reduce = useReducedMotion() === true;
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.28 });
  const startedRef = useRef(false);
  const [autoStep, setAutoStep] = useState(0);
  const [manualStep, setManualStep] = useState<number | null>(null);

  useEffect(() => {
    if (!inView || reduce || startedRef.current) return;
    startedRef.current = true;
    const timers: number[] = [];
    for (let i = 1; i < NODES.length; i++) {
      timers.push(window.setTimeout(() => setAutoStep(i), i * STEP_MS));
    }
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [inView, reduce]);

  const active = manualStep ?? (reduce && inView ? NODES.length - 1 : autoStep);
  const progress = NODES.length <= 1 ? 1 : active / (NODES.length - 1);
  const current = NODES[active]!;

  return (
    <section
      ref={sectionRef}
      id="timeline"
      className="relative overflow-hidden border-y border-dawn-200 bg-ink-900 py-16 text-white md:py-24"
      aria-labelledby="timeline-heading"
    >
      <div className="absolute inset-0 opacity-40" aria-hidden>
        <Image src="/landing/calm.jpg" alt="" fill sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-ink-900/75" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 md:px-8">
        <motion.div
          className="max-w-2xl"
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: reduce ? 0 : 0.5, ease: LUX }}
        >
          <p className="label-caps text-mist-300">{t("landing.bio.timelineEyebrow")}</p>
          <h2 id="timeline-heading" className="mt-2 font-display text-3xl tracking-tight md:text-4xl">
            {t("landing.bio.timelineTitle")}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-white/70">{t("landing.bio.timelineBody")}</p>
        </motion.div>

        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-8">
          <ol className="flex gap-2 overflow-x-auto pb-1 lg:col-span-4 lg:flex-col lg:gap-0 lg:overflow-visible" aria-label={t("landing.bio.timelineEyebrow")}>
            {NODES.map((node, i) => {
              const state = i < active ? "done" : i === active ? "current" : "upcoming";
              return (
                <li key={node.id} className="relative flex min-w-[9.5rem] flex-1 lg:min-w-0">
                  {i < NODES.length - 1 ? (
                    <span
                      aria-hidden
                      className={`absolute start-3.5 top-7 hidden h-[calc(100%-0.5rem)] w-px lg:block ${
                        i < active ? "bg-mist-500" : "bg-white/15"
                      }`}
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setManualStep(i)}
                    aria-current={state === "current" ? "step" : undefined}
                    className="flex w-full items-start gap-3 rounded-md p-2 text-start transition-colors hover:bg-white/5"
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-pill text-xs font-semibold tabular-nums ${
                        state === "done"
                          ? "bg-mist-500 text-white"
                          : state === "current"
                            ? "border-2 border-mist-300 bg-transparent text-mist-300"
                            : "border border-white/25 text-white/40"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block text-[11px] font-semibold uppercase tracking-wide ${
                          state === "upcoming" ? "text-white/35" : "text-mist-300"
                        }`}
                      >
                        {t(`landing.bio.nodes.${node.id}.tag`)}
                      </span>
                      <span
                        className={`mt-0.5 block font-display text-base leading-snug ${
                          state === "current" ? "text-white" : state === "done" ? "text-white/80" : "text-white/40"
                        }`}
                      >
                        {t(`landing.bio.nodes.${node.id}.title`)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="lg:col-span-8">
            <div className="mb-5 h-1 overflow-hidden rounded-pill bg-white/10" aria-hidden>
              <motion.div
                className="h-full origin-left rounded-pill bg-mist-500 rtl:origin-right"
                initial={false}
                animate={{ scaleX: inView || reduce ? Math.max(progress, 0.06) : 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.75, ease: LUX }}
              />
            </div>

            <div className="relative min-h-[11rem]" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.article
                  key={current.id}
                  className="rounded-lg border border-white/12 bg-white/5 p-5 backdrop-blur-md md:p-7"
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: reduce ? 0 : 0.35, ease: LUX }}
                >
                  <p className="text-xs font-medium text-mist-300">
                    {t("landing.bio.stepOf", { n: active + 1, total: NODES.length })}
                  </p>
                  <h3 className="mt-2 font-display text-2xl tracking-tight md:text-3xl">
                    {t(`landing.bio.nodes.${current.id}.title`)}
                  </h3>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/75">
                    {t(`landing.bio.nodes.${current.id}.body`)}
                  </p>
                </motion.article>
              </AnimatePresence>
            </div>

            <aside className="mt-6 rounded-lg border border-mist-500/30 bg-mist-700/25 px-4 py-3 md:px-5">
              <p className="font-display text-lg text-white">{t("landing.bio.evidence.title")}</p>
              <p className="mt-1 text-sm text-white/75">{t("landing.bio.evidence.body")}</p>
              <p className="mt-2 text-xs font-medium text-mist-300">{t("landing.bio.evidence.disclaimer")}</p>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
