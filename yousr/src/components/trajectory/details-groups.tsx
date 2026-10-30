"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import { useJourneyMotion } from "@/components/journey/journey-loaders";
import { GroupConstellation } from "./section-figures";

type GroupKey = "reproductive" | "history" | "context";

const GROUP_SHELL: Record<GroupKey, string> = {
  reproductive: "from-white via-white to-mist-100/50",
  history: "from-white via-white to-amber-100/40",
  context: "from-white via-white to-peach-200/35",
};

export function DetailsGroup({
  groupKey,
  children,
  footer,
}: {
  groupKey: GroupKey;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { t } = useI18n();
  const { animate, live, dur } = useJourneyMotion();

  return (
    <motion.section
      initial={live && animate ? { opacity: 0, y: 12 } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: dur(0.45), ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br ${GROUP_SHELL[groupKey]} p-4 shadow-[var(--shadow-soft)] md:p-6`}
      aria-labelledby={`details-group-${groupKey}`}
    >
      {/* soft sphere wash in corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute -end-10 -top-12 h-40 w-40 rounded-full opacity-40 blur-2xl"
        style={{
          background:
            groupKey === "history"
              ? "radial-gradient(circle, color-mix(in srgb, var(--color-amber-300, #f0d78c) 70%, transparent), transparent 70%)"
              : groupKey === "context"
                ? "radial-gradient(circle, color-mix(in srgb, var(--color-peach-300, #efc4b0) 70%, transparent), transparent 70%)"
                : "radial-gradient(circle, color-mix(in srgb, var(--color-mist-300, #9dd4c8) 70%, transparent), transparent 70%)",
        }}
      />

      <header className="relative mb-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="label-caps text-ink-400">{t(`dashboard.details.groups.${groupKey}.tag`)}</p>
          <h3 id={`details-group-${groupKey}`} className="font-display text-2xl tracking-tight text-ink-900">
            {t(`dashboard.details.groups.${groupKey}.title`)}
          </h3>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-600">
            {t(`dashboard.details.groups.${groupKey}.body`)}
          </p>
        </div>
        <GroupConstellation groupKey={groupKey} className="hidden sm:block" />
      </header>

      <div className="relative grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
      {footer ? <div className="relative mt-6">{footer}</div> : null}
    </motion.section>
  );
}
