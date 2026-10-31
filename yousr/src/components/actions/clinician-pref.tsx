"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/client";
import { setPreferSameGenderClinician } from "@/server/actions/patient";

/** Education / DecisionSupport preference — not a booking integration. */
export function ClinicianGenderPref({ initial }: { initial: boolean }) {
  const { t } = useI18n();
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();

  return (
    <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-dawn-200 bg-white/80 p-4 text-sm text-ink-700">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-dawn-300 text-mist-700 focus:ring-mist-500"
        checked={on}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          setOn(next);
          start(() => setPreferSameGenderClinician(next));
        }}
      />
      <span>
        <span className="font-medium text-ink-900">{t("actions.sameGender.title")}</span>
        <span className="mt-0.5 block text-xs text-ink-600">{t("actions.sameGender.body")}</span>
      </span>
    </label>
  );
}
