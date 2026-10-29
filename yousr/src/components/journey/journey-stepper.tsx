"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import {
  CONDITION_CODES,
  FAMILY_HISTORY_CODES,
  INTENTIONS,
  OBS_CODES,
  type Intention,
  type Sex,
} from "@/lib/domain/types";
import {
  saveCheckin,
  saveConditions,
  saveCycles,
  saveLab,
  saveMedications,
  updateIntention,
} from "@/server/actions/patient";
import { advanceStepper } from "@/server/actions/journey";
import { Button } from "@/components/ui/atoms";
import { JourneyPulseDots, useDelayedFlag } from "@/components/journey/journey-loaders";
import { JourneyStepTracker } from "@/components/journey/journey-progress";

type Step = "intention" | "cycle" | "conditions" | "lifestyle" | "labs" | "medications";

const LAB_CODES_F = ["amh", "tsh", "hba1c", "bmi", "bp_systolic"] as const;
const LAB_CODES_M = ["semen_concentration", "semen_motility", "semen_volume", "tsh", "hba1c", "bmi"] as const;
const LAB_FACTOR: Record<string, string> = {
  amh: "amh",
  tsh: "thyroid",
  hba1c: "glycaemic",
  bmi: "weight_trend",
  bp_systolic: "blood_pressure",
  semen_concentration: "semen_concentration",
  semen_motility: "semen_motility",
  semen_volume: "semen_volume",
};

function stepsFor(sex: Sex): Step[] {
  return sex === "female"
    ? ["intention", "cycle", "conditions", "lifestyle", "labs", "medications"]
    : ["intention", "conditions", "lifestyle", "labs", "medications"];
}

export function JourneyStepper({
  locale,
  sex,
  initialIndex = 0,
  conditions = [],
  familyHistory = [],
  intention,
}: {
  locale: string;
  sex: Sex;
  initialIndex?: number;
  conditions?: string[];
  familyHistory?: string[];
  intention: Intention;
}) {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const steps = stepsFor(sex);
  const [i, setI] = useState(Math.min(Math.max(0, initialIndex), steps.length - 1));
  const [pending, start] = useTransition();
  const showLoader = useDelayedFlag(pending);
  const step = steps[i];
  const shortLabels = steps.map((s) => t(`journey.stepper.short.${s}`));

  const goNext = () => {
    start(async () => {
      if (i >= steps.length - 1) {
        await advanceStepper(locale, i + 1, true);
      } else {
        await advanceStepper(locale, i + 1, false);
        setI((x) => x + 1);
      }
    });
  };

  const run = (fn: () => Promise<void>) =>
    start(async () => {
      await fn();
      if (i >= steps.length - 1) {
        await advanceStepper(locale, i + 1, true);
      } else {
        await advanceStepper(locale, i + 1, false);
        setI((x) => x + 1);
      }
    });

  return (
    <div>
      <JourneyStepTracker steps={steps.length} current={i} labels={shortLabels} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-ink-900">{t(`journey.stepper.titles.${step}`)}</h1>
          <p className="mt-1.5 max-w-xl text-sm text-ink-600">{t(`journey.stepper.bodies.${step}`)}</p>
          <p className="mt-2 text-xs text-ink-400">{t("journey.stepper.optional")}</p>

          {/* Card: border only — ui-design-brain (no shadow + border) */}
          <div
            className={`relative mt-6 rounded-lg border border-dawn-200 bg-white p-5 md:p-6 ${
              pending ? "pointer-events-none opacity-80" : ""
            }`}
          >
            {step === "intention" ? (
              <IntentionBlock
                current={intention}
                onPick={(v) => run(() => updateIntention(v))}
              />
            ) : null}
            {step === "cycle" ? (
              <CycleBlock onSave={(lengths, absent) => run(() => saveCycles(lengths, absent))} />
            ) : null}
            {step === "conditions" ? (
              <ConditionsBlock
                initialC={conditions}
                initialF={familyHistory}
                onSave={(c, f) => run(() => saveConditions(c, f))}
              />
            ) : null}
            {step === "lifestyle" ? (
              <LifestyleBlock onSave={(v) => run(() => saveCheckin(v))} />
            ) : null}
            {step === "labs" ? (
              <LabsBlock
                codes={sex === "female" ? [...LAB_CODES_F] : [...LAB_CODES_M]}
                onSave={(c, v, d) => run(() => saveLab(c, v, d))}
              />
            ) : null}
            {step === "medications" ? (
              <MedsBlock onSave={(m) => run(() => saveMedications(m))} />
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-dawn-200 pt-4">
              <button
                type="button"
                disabled={pending}
                onClick={goNext}
                className="inline-flex min-h-11 items-center px-1 text-sm font-medium text-ink-600 underline-offset-4 hover:underline disabled:opacity-50"
              >
                {t("common.skip")}
              </button>
              <JourneyPulseDots label={t("journey.loading")} active={showLoader} />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function OptionChip({
  on,
  onClick,
  label,
}: {
  on?: boolean;
  onClick: () => void;
  label: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      className={`inline-flex min-h-11 items-center rounded-md border px-3.5 py-2 text-sm transition-colors ${
        on
          ? "border-mist-500 bg-mist-100 text-mist-700"
          : "border-dawn-300 bg-white text-ink-900 hover:bg-dawn-100"
      }`}
    >
      {label}
    </motion.button>
  );
}

function IntentionBlock({ current, onPick }: { current: Intention; onPick: (v: Intention) => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap gap-2">
      {INTENTIONS.map((v) => (
        <OptionChip key={v} on={v === current} onClick={() => onPick(v)} label={t(`intentions.${v}`)} />
      ))}
    </div>
  );
}

function CycleBlock({ onSave }: { onSave: (lengths: number[], absent?: number) => void }) {
  const { t } = useI18n();
  const presets = [
    { label: t("journey.stepper.cyclePresets.regular"), lengths: [28, 29, 28] },
    { label: t("journey.stepper.cyclePresets.longer"), lengths: [35, 38, 42] },
    { label: t("journey.stepper.cyclePresets.irregular"), lengths: [24, 41, 33] },
  ];
  return (
    <div>
      <p className="text-sm text-ink-600">{t("profile.cycleQ")}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {presets.map((p) => (
          <OptionChip key={p.label} onClick={() => onSave(p.lengths)} label={p.label} />
        ))}
      </div>
    </div>
  );
}

function ConditionsBlock({
  initialC,
  initialF,
  onSave,
}: {
  initialC: string[];
  initialF: string[];
  onSave: (c: string[], f: string[]) => void;
}) {
  const { t } = useI18n();
  const [c, setC] = useState(initialC);
  const [f, setF] = useState(initialF);
  const toggle = (set: typeof setC, v: string) =>
    set((arr) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]));
  return (
    <div>
      <p className="text-sm font-medium text-ink-900">{t("profile.conditionsQ")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {CONDITION_CODES.map((v) => (
          <OptionChip key={v} on={c.includes(v)} onClick={() => toggle(setC, v)} label={t(`factors.${v}`)} />
        ))}
        <OptionChip on={c.length === 0} onClick={() => setC([])} label={t("common.ratherNot")} />
      </div>
      <p className="mt-5 text-sm font-medium text-ink-900">{t("profile.familyQ")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {FAMILY_HISTORY_CODES.map((v) => (
          <OptionChip key={v} on={f.includes(v)} onClick={() => toggle(setF, v)} label={t(`factors.family_${v}`)} />
        ))}
      </div>
      <Button className="mt-5" onClick={() => onSave(c, f)}>
        {t("common.continue")}
      </Button>
    </div>
  );
}

function LifestyleBlock({ onSave }: { onSave: (v: Parameters<typeof saveCheckin>[0]) => void }) {
  const { t } = useI18n();
  const presets = [
    {
      label: t("journey.stepper.lifestylePresets.steady"),
      v: { sleep: 7.5, activity: 150, smoking: "never" as const, alcohol: 0, stress: 4, laughter: 4, heat: "low" as const },
    },
    {
      label: t("journey.stepper.lifestylePresets.busy"),
      v: { sleep: 6, activity: 60, smoking: "never" as const, alcohol: 2, stress: 7, laughter: 2, heat: "low" as const },
    },
    {
      label: t("journey.stepper.lifestylePresets.smoking"),
      v: { sleep: 6.5, activity: 90, smoking: "current" as const, alcohol: 4, stress: 6, laughter: 2, heat: "high" as const },
    },
  ];
  return (
    <div>
      <p className="text-sm text-ink-600">{t("profile.lifestyleQ")}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {presets.map((p) => (
          <OptionChip key={p.label} onClick={() => onSave(p.v)} label={p.label} />
        ))}
      </div>
    </div>
  );
}

function LabsBlock({
  codes,
  onSave,
}: {
  codes: string[];
  onSave: (code: string, value: number, date: string) => void;
}) {
  const { t } = useI18n();
  const today = new Date().toISOString().slice(0, 10);
  const presets: { code: string; value: number; label: string }[] = codes.slice(0, 4).map((code) => {
    const defaults: Record<string, number> = {
      amh: 2.1,
      tsh: 2.4,
      hba1c: 5.4,
      bmi: 26,
      bp_systolic: 118,
      semen_concentration: 40,
      semen_motility: 45,
      semen_volume: 2.5,
    };
    return {
      code,
      value: defaults[code] ?? 1,
      label: t(`factors.${LAB_FACTOR[code] ?? code}`),
    };
  });
  return (
    <div>
      <p className="text-sm text-ink-600">{t("profile.labsQ")}</p>
      <p className="mt-1 text-xs text-ink-400">{t("journey.stepper.labsHint")}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {presets.map((p) => (
          <OptionChip
            key={p.code}
            onClick={() => onSave(p.code, p.value, today)}
            label={`${p.label} · ${p.value}${OBS_CODES[p.code as keyof typeof OBS_CODES] !== "text" ? ` ${OBS_CODES[p.code as keyof typeof OBS_CODES]}` : ""}`}
          />
        ))}
      </div>
    </div>
  );
}

function MedsBlock({ onSave }: { onSave: (m: string[]) => void }) {
  const { t } = useI18n();
  const options = [
    { label: t("journey.stepper.medsPresets.none"), meds: [] as string[] },
    { label: t("journey.stepper.medsPresets.metformin"), meds: ["Metformin"] },
    { label: t("journey.stepper.medsPresets.thyroid"), meds: ["Levothyroxine"] },
  ];
  return (
    <div>
      <p className="text-sm text-ink-600">{t("profile.medsQ")}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((o) => (
          <OptionChip key={o.label} onClick={() => onSave(o.meds)} label={o.label} />
        ))}
      </div>
    </div>
  );
}
