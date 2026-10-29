"use client";

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

const STEP_MS = 900;

const LANE = "mx-auto w-full max-w-6xl px-4 md:px-8";

/**
 * Over Time — daisyUI steps + smooth one-shot progress line.
 */
export function BioTimeline() {
  const { t } = useI18n();
  const reduce = useReducedMotion() === true;
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.3 });
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
      className="border-b border-base-300 bg-base-100 py-9 md:py-11"
      aria-labelledby="timeline-heading"
    >
      <div className={LANE}>
        <motion.div
          className="max-w-2xl"
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: reduce ? 0 : 0.45, ease: LUX }}
        >
          <p className="label-caps text-primary">{t("landing.bio.timelineEyebrow")}</p>
          <h2 id="timeline-heading" className="mt-1 font-display text-2xl tracking-tight md:text-3xl">
            {t("landing.bio.timelineTitle")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-base-content/70 md:text-[0.95rem]">
            {t("landing.bio.timelineBody")}
          </p>
        </motion.div>

        {/* Progress line — visible on all breakpoints, synced to active step */}
        <div className="mt-7 mb-1" aria-hidden>
          <div className="h-1.5 w-full overflow-hidden rounded-pill bg-base-300">
            <motion.div
              className="masar-journey-line h-full origin-left rounded-pill bg-primary rtl:origin-right"
              initial={false}
              animate={{ scaleX: inView || reduce ? Math.max(progress, 0.08) : 0 }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { duration: 0.85, ease: [0.16, 1, 0.3, 1] }
              }
            />
          </div>
        </div>

        <ul className="steps steps-vertical mt-4 w-full max-w-xl lg:steps-horizontal lg:max-w-none">
          {NODES.map((node, i) => (
            <li
              key={node.id}
              className={`step transition-colors duration-500 ${i <= active ? "step-primary" : ""}`}
              data-content={String(i + 1)}
            >
              <button
                type="button"
                className={`bg-transparent text-start text-sm transition-opacity duration-400 ${
                  i <= active ? "opacity-100" : "opacity-45"
                }`}
                onClick={() => setManualStep(i)}
              >
                {t(`landing.bio.nodes.${node.id}.title`)}
              </button>
            </li>
          ))}
        </ul>

        <div className="relative mt-6 min-h-[9.5rem]" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.article
              key={current.id}
              className="rounded-box border border-base-300 bg-base-200/50 p-4 md:p-6"
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: reduce ? 0 : 0.35, ease: LUX }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge badge-primary badge-sm">
                  {t("landing.bio.stepOf", { n: active + 1, total: NODES.length })}
                </span>
                <span className="badge badge-soft badge-primary badge-sm">
                  {t(`landing.bio.nodes.${current.id}.tag`)}
                </span>
              </div>
              <h3 className="mt-2.5 font-display text-xl tracking-tight md:text-2xl">
                {t(`landing.bio.nodes.${current.id}.title`)}
              </h3>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-base-content/70 md:text-[0.95rem]">
                {t(`landing.bio.nodes.${current.id}.body`)}
              </p>

              <div
                className="mt-4 flex flex-wrap gap-2"
                role="tablist"
                aria-label={t("landing.bio.timelineEyebrow")}
              >
                {NODES.map((node, i) => (
                  <button
                    key={node.id}
                    type="button"
                    role="tab"
                    aria-selected={i === active}
                    aria-label={t("landing.bio.stepOf", { n: i + 1, total: NODES.length })}
                    className={`h-2.5 w-2.5 rounded-full transition-all duration-300 focus-visible:outline-offset-2 ${
                      i === active
                        ? "scale-125 bg-primary"
                        : i < active
                          ? "bg-primary/45"
                          : "bg-base-300"
                    }`}
                    onClick={() => setManualStep(i)}
                  />
                ))}
              </div>
            </motion.article>
          </AnimatePresence>
        </div>

        <motion.aside
          className="alert mt-6 bg-primary/8 py-2.5 text-base-content"
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: reduce ? 0 : 0.4, ease: LUX }}
        >
          <div className="text-sm">
            <p className="font-display text-base">{t("landing.bio.evidence.title")}</p>
            <p className="mt-0.5 opacity-80">{t("landing.bio.evidence.body")}</p>
            <p className="mt-1 text-xs font-medium text-primary">{t("landing.bio.evidence.disclaimer")}</p>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
