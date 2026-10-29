"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/client";
import { INTENTIONS, type Intention } from "@/lib/domain/types";
import { updateIntention } from "@/server/actions/patient";

export function IntentionPicker({ current }: { current: Intention }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-ink-600">{t("trajectory.intentionLabel", { intention: t(`intentions.${current}`) })}</span>
      <button type="button" onClick={() => setOpen((o) => !o)} className="text-mist-700 underline-offset-4 hover:underline">
        {t("trajectory.changeIntention")}
      </button>
      {open ? (
        <div className="flex w-full flex-wrap gap-2 pt-2">
          {INTENTIONS.map((i) => (
            <button
              key={i}
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await updateIntention(i);
                  setOpen(false);
                })
              }
              className={`rounded-pill border px-3 py-1 text-sm ${
                i === current ? "border-peach-500 bg-peach-200/60 text-ink-900" : "border-dawn-300 bg-dawn-50 text-ink-600 hover:bg-dawn-100"
              }`}
              title={t(`intentions.hint.${i}`)}
            >
              {t(`intentions.${i}`)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
