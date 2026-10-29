"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { Domain, ObsCode, ObservationLite } from "@/lib/domain/types";
import { assessDomain, type AssessInput } from "@/lib/engine/assess";
import { DirectionBadge } from "@/components/ui/atoms";

export interface SerialObs {
  code: ObsCode;
  valueNum: number | null;
  valueText: string | null;
  unit: string | null;
  effectiveAt: string;
  dataSourceId: ObservationLite["dataSourceId"];
}

type SliderKey = "sleep" | "activity" | "stress" | "laughter" | "bmi";
interface SliderSpec {
  key: SliderKey;
  code: ObsCode;
  min: number;
  max: number;
  step: number;
}

const LIFESTYLE: SliderSpec[] = [
  { key: "sleep", code: "sleep_hours", min: 4, max: 10, step: 0.5 },
  { key: "activity", code: "activity_minutes_week", min: 0, max: 400, step: 10 },
  { key: "stress", code: "stress_level", min: 1, max: 10, step: 1 },
  { key: "laughter", code: "laughter_days_week", min: 0, max: 7, step: 1 },
];
const METABOLIC: SliderSpec[] = [{ key: "bmi", code: "bmi", min: 17, max: 42, step: 0.5 }];

/**
 * Education only. Re-runs the same deterministic engine in the browser with a
 * hypothetical new reading. The banner is fixed and cannot be dismissed.
 */
const NO_SPECS: SliderSpec[] = [];

export function SimulateSlider({
  domain,
  profile,
  observations,
  nowIso,
}: {
  domain: Domain;
  profile: AssessInput;
  observations: SerialObs[];
  nowIso: string;
}) {
  const { t } = useI18n();
  const specs = domain === "lifestyle" ? LIFESTYLE : domain === "metabolic" ? METABOLIC : NO_SPECS;
  const nowMs = new Date(nowIso).getTime();
  const obs = useMemo<ObservationLite[]>(
    () => observations.map((o) => ({ ...o, effectiveAt: new Date(o.effectiveAt) })),
    [observations],
  );
  const latestOf = (code: ObsCode) => [...obs].reverse().find((o) => o.code === code)?.valueNum ?? undefined;
  const initial = Object.fromEntries(specs.map((s) => [s.key, latestOf(s.code) ?? (s.min + s.max) / 2])) as Record<SliderKey, number>;
  const [values, setValues] = useState(initial);
  const [smoking, setSmoking] = useState<string>(() => [...obs].reverse().find((o) => o.code === "smoking")?.valueText ?? "never");

  const result = useMemo(() => {
    if (!specs.length) return null;
    const lastAt = obs.length ? Math.max(...obs.map((o) => o.effectiveAt.getTime())) : nowMs;
    const gapDays = domain === "metabolic" ? 200 : 46;
    const simAt = new Date(Math.max(nowMs, lastAt + gapDays * 86_400_000));
    const extra: ObservationLite[] = specs.map((s) => ({
      code: s.code,
      valueNum: values[s.key],
      valueText: null,
      unit: null,
      effectiveAt: simAt,
      dataSourceId: "SelfReport",
    }));
    if (domain === "lifestyle") {
      extra.push({ code: "smoking", valueNum: null, valueText: smoking, unit: null, effectiveAt: simAt, dataSourceId: "SelfReport" });
    }
    return assessDomain(domain, profile, [...obs, ...extra], simAt);
  }, [specs, obs, values, smoking, domain, profile, nowMs]);

  if (!specs.length || !result) return null;

  return (
    <div className="rounded-lg border border-amber-400/50 bg-amber-100/40 p-5">
      <p className="label-caps">{t("domainDetail.simulate")}</p>
      <p role="note" className="mt-1 rounded-md border border-amber-400/60 bg-dawn-50 px-3 py-2 text-sm text-amber-700">
        {t("domainDetail.simulateBanner")}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {specs.map((s) => (
          <label key={s.key} className="block text-sm">
            <span className="flex justify-between text-ink-900">
              <span>{t(`domainDetail.sliders.${s.key}`)}</span>
              <span className="tabular-nums text-ink-600">{values[s.key]}</span>
            </span>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={values[s.key]}
              onChange={(e) => setValues((v) => ({ ...v, [s.key]: Number(e.target.value) }))}
              className="mt-1 w-full accent-peach-500"
            />
          </label>
        ))}
        {domain === "lifestyle" ? (
          <label className="block text-sm">
            <span className="text-ink-900">{t("domainDetail.sliders.smoking")}</span>
            <select value={smoking} onChange={(e) => setSmoking(e.target.value)} className="mt-1 w-full rounded-md border border-dawn-300 bg-dawn-50 px-2 py-1.5">
              {(["never", "former", "current"] as const).map((o) => (
                <option key={o} value={o}>
                  {t(`profile.smokingOptions.${o}`)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <DirectionBadge direction={result.direction} confidence={result.confidence} />
        <p className="text-sm text-ink-600">
          {t("domainDetail.simulateResult", {
            direction: t(`directions.${result.direction}`),
            confidence: t(`confidence.${result.confidence}`).toLowerCase(),
          })}
        </p>
        <button
          type="button"
          onClick={() => {
            setValues(initial);
          }}
          className="ms-auto text-sm text-mist-700 underline-offset-4 hover:underline"
        >
          {t("domainDetail.simulateReset")}
        </button>
      </div>
    </div>
  );
}
