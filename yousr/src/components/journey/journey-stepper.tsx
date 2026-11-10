"use client";

import { useState, useTransition, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
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
import {
  JourneyButtonLoader,
  JourneyPulseDots,
  useDelayedFlag,
  useJourneyMotion,
} from "@/components/journey/journey-loaders";
import { JourneyStepTracker } from "@/components/journey/journey-progress";
import { JourneySurface } from "@/components/journey/journey-surface";

const LUX = [0.16, 1, 0.3, 1] as const;

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
  const { animate, dur } = useJourneyMotion();
  const steps = stepsFor(sex);
  const [i, setI] = useState(Math.min(Math.max(0, initialIndex), steps.length - 1));
  const [pending, start] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  /** Veil waits 300ms; buttons show loader immediately so clicks feel responsive. */
  const showVeil = useDelayedFlag(pending, 300);
  const step = steps[i];
  const shortLabels = steps.map((s) => t(`journey.stepper.short.${s}`));
  const chipLoading = (key: string) => pending && busyKey === key;

  const goNext = () => {
    setBusyKey("skip");
    start(async () => {
      if (i >= steps.length - 1) {
        await advanceStepper(locale, i + 1, true);
      } else {
        await advanceStepper(locale, i + 1, false);
        setI((x) => x + 1);
        setBusyKey(null);
      }
    });
  };

  const run = (key: string, fn: () => Promise<void>) => {
    setBusyKey(key);
    start(async () => {
      await fn();
      if (i >= steps.length - 1) {
        await advanceStepper(locale, i + 1, true);
      } else {
        await advanceStepper(locale, i + 1, false);
        setI((x) => x + 1);
        setBusyKey(null);
      }
    });
  };

  return (
    <div>
      <JourneyStepTracker steps={steps.length} current={i} labels={shortLabels} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={animate ? { opacity: 0, y: -8 } : undefined}
          transition={{ duration: dur(0.36), ease: LUX }}
        >
          <h1 className="mt-10 text-[clamp(2rem,3.8vw,2.6rem)] leading-[1.05] tracking-[-0.02em] text-ink-900">
            {t(`journey.stepper.titles.${step}`)}
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-600">{t(`journey.stepper.bodies.${step}`)}</p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-dawn-100 px-2.5 py-1 text-[12px] text-ink-500">
            <span aria-hidden className="dot bg-dawn-400" />
            {t("journey.stepper.optional")}
          </p>

          <div className={`relative mt-6 ${pending ? "pointer-events-none" : ""}`}>
            <JourneySurface
              tone={step === "labs" || step === "medications" ? "dawn" : "mist"}
              showMotif={step === "intention" || step === "cycle"}
              busy={showVeil}
              busyLabel={t("journey.saving")}
              footer={
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={goNext}
                    aria-busy={chipLoading("skip")}
                    className="inline-flex min-h-10 min-w-[7rem] items-center justify-center rounded-full border border-dawn-300 bg-white px-4 text-sm font-medium text-ink-700 transition-colors hover:border-dawn-400 hover:text-ink-900 disabled:opacity-60"
                  >
                    {chipLoading("skip") ? (
                      <JourneyButtonLoader label={t("journey.loading")} withLabel={false} />
                    ) : (
                      t("common.skip")
                    )}
                  </button>
                  {pending && busyKey && busyKey !== "skip" ? (
                    <JourneyPulseDots label={t("journey.saving")} withLabel />
                  ) : null}
                </div>
              }
            >
              {step === "intention" ? (
                <IntentionBlock
                  current={intention}
                  isBusy={chipLoading}
                  onPick={(v) => run(`intention:${v}`, () => updateIntention(v))}
                />
              ) : null}
              {step === "cycle" ? (
                <CycleBlock
                  isBusy={chipLoading}
                  onSave={(key, lengths, absent) => run(key, () => saveCycles(lengths, absent))}
                />
              ) : null}
              {step === "conditions" ? (
                <ConditionsBlock
                  initialC={conditions}
                  initialF={familyHistory}
                  saving={chipLoading("conditions:save")}
                  onSave={(c, f) => run("conditions:save", () => saveConditions(c, f))}
                />
              ) : null}
              {step === "lifestyle" ? (
                <LifestyleBlock
                  isBusy={chipLoading}
                  onSave={(key, v) => run(key, () => saveCheckin(v))}
                />
              ) : null}
              {step === "labs" ? (
                <LabsBlock
                  codes={sex === "female" ? [...LAB_CODES_F] : [...LAB_CODES_M]}
                  isBusy={chipLoading}
                  onSave={(key, c, v, d) => run(key, () => saveLab(c, v, d))}
                />
              ) : null}
              {step === "medications" ? (
                <MedsBlock
                  isBusy={chipLoading}
                  onSave={(key, m) => run(key, () => saveMedications(m))}
                />
              ) : null}
            </JourneySurface>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ChipRow({ children }: { children: ReactNode }) {
  const { animate } = useJourneyMotion();
  return (
    <motion.div
      className="mt-1 grid gap-2.5 sm:grid-cols-2"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: animate ? 0.045 : 0 } },
      }}
    >
      {children}
    </motion.div>
  );
}

function OptionChip({
  on,
  onClick,
  label,
  loading = false,
  multi = false,
}: {
  on?: boolean;
  onClick: () => void;
  label: string;
  loading?: boolean;
  /** Checkbox marker for multi-select questions; radio marker otherwise */
  multi?: boolean;
}) {
  const { animate, dur } = useJourneyMotion();
  const { t } = useI18n();
  return (
    <motion.button
      type="button"
      aria-pressed={on}
      aria-busy={loading}
      disabled={loading}
      onClick={onClick}
      variants={{
        hidden: { opacity: 0, y: 6 },
        show: { opacity: 1, y: 0, transition: { duration: dur(0.3), ease: LUX } },
      }}
      whileHover={animate && !loading ? { y: -2 } : undefined}
      whileTap={animate && !loading ? { scale: 0.97 } : undefined}
      className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-start text-[14.5px] transition-[background-color,border-color,box-shadow] ${
        loading || on
          ? "border-mist-500 bg-mist-100/60 font-medium text-mist-700 shadow-[0_0_0_3px_var(--mist-100)]"
          : "border-dawn-200 bg-white text-ink-900 hover:border-mist-300 hover:bg-dawn-50"
      }`}
    >
      <span
        aria-hidden
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center border-[1.5px] transition-colors ${multi ? "rounded-[5px]" : "rounded-full"} ${
          loading || on ? "border-mist-700 bg-mist-700" : "border-dawn-400 bg-white"
        }`}
      >
        {loading || on ? (
          multi ? (
            <svg viewBox="0 0 16 16" className="h-3 w-3 text-white" fill="none">
              <path d="m4 8.4 2.6 2.6L12 5.4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          )
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        {loading ? <JourneyButtonLoader label={t("journey.loading")} withLabel={false} /> : label}
      </span>
    </motion.button>
  );
}

function IntentionBlock({
  current,
  onPick,
  isBusy,
}: {
  current: Intention;
  onPick: (v: Intention) => void;
  isBusy: (key: string) => boolean;
}) {
  const { t } = useI18n();
  return (
    <ChipRow>
      {INTENTIONS.map((v) => (
        <OptionChip
          key={v}
          on={v === current}
          onClick={() => onPick(v)}
          label={t(`intentions.${v}`)}
          loading={isBusy(`intention:${v}`)}
        />
      ))}
    </ChipRow>
  );
}

function CycleBlock({
  onSave,
  isBusy,
}: {
  onSave: (key: string, lengths: number[], absent?: number) => void;
  isBusy: (key: string) => boolean;
}) {
  const { t } = useI18n();
  const presets = [
    { key: "cycle:regular", label: t("journey.stepper.cyclePresets.regular"), lengths: [28, 29, 28] },
    { key: "cycle:longer", label: t("journey.stepper.cyclePresets.longer"), lengths: [35, 38, 42] },
    { key: "cycle:irregular", label: t("journey.stepper.cyclePresets.irregular"), lengths: [24, 41, 33] },
  ];
  return (
    <div>
      <p className="mb-3 text-[14.5px] font-semibold text-ink-900">{t("profile.cycleQ")}</p>
      <ChipRow>
        {presets.map((p) => (
          <OptionChip
            key={p.key}
            onClick={() => onSave(p.key, p.lengths)}
            label={p.label}
            loading={isBusy(p.key)}
          />
        ))}
      </ChipRow>
    </div>
  );
}

function ConditionsBlock({
  initialC,
  initialF,
  onSave,
  saving,
}: {
  initialC: string[];
  initialF: string[];
  onSave: (c: string[], f: string[]) => void;
  saving: boolean;
}) {
  const { t } = useI18n();
  const { animate } = useJourneyMotion();
  const [c, setC] = useState(initialC);
  const [f, setF] = useState(initialF);
  const toggle = (set: typeof setC, v: string) =>
    set((arr) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]));
  return (
    <div>
      <p className="mb-3 text-[14.5px] font-semibold text-ink-900">{t("profile.conditionsQ")}</p>
      <ChipRow>
        {CONDITION_CODES.map((v) => (
          <OptionChip key={v} multi on={c.includes(v)} onClick={() => toggle(setC, v)} label={t(`factors.${v}`)} />
        ))}
        <OptionChip on={c.length === 0} onClick={() => setC([])} label={t("common.ratherNot")} />
      </ChipRow>
      <p className="mb-3 mt-7 text-[14.5px] font-semibold text-ink-900">{t("profile.familyQ")}</p>
      <ChipRow>
        {FAMILY_HISTORY_CODES.map((v) => (
          <OptionChip key={v} multi on={f.includes(v)} onClick={() => toggle(setF, v)} label={t(`factors.family_${v}`)} />
        ))}
      </ChipRow>
      <motion.button
        type="button"
        disabled={saving}
        aria-busy={saving}
        onClick={() => onSave(c, f)}
        whileHover={animate && !saving ? { y: -1 } : undefined}
        whileTap={animate && !saving ? { scale: 0.98 } : undefined}
        className="mt-5 inline-flex min-h-11 min-w-[10rem] items-center justify-center rounded-full bg-mist-700 px-6 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_6px_16px_-8px_rgba(11,74,68,0.6)] transition-colors hover:bg-mist-600 disabled:opacity-80"
      >
        {saving ? <JourneyButtonLoader label={t("journey.saving")} onDark /> : t("common.continue")}
      </motion.button>
    </div>
  );
}

function LifestyleBlock({
  onSave,
  isBusy,
}: {
  onSave: (key: string, v: Parameters<typeof saveCheckin>[0]) => void;
  isBusy: (key: string) => boolean;
}) {
  const { t } = useI18n();
  const presets = [
    {
      key: "life:steady",
      label: t("journey.stepper.lifestylePresets.steady"),
      v: { sleep: 7.5, activity: 150, smoking: "never" as const, alcohol: 0, stress: 4, laughter: 4, heat: "low" as const },
    },
    {
      key: "life:busy",
      label: t("journey.stepper.lifestylePresets.busy"),
      v: { sleep: 6, activity: 60, smoking: "never" as const, alcohol: 2, stress: 7, laughter: 2, heat: "low" as const },
    },
    {
      key: "life:smoking",
      label: t("journey.stepper.lifestylePresets.smoking"),
      v: { sleep: 6.5, activity: 90, smoking: "current" as const, alcohol: 4, stress: 6, laughter: 2, heat: "high" as const },
    },
  ];
  return (
    <div>
      <p className="mb-3 text-[14.5px] font-semibold text-ink-900">{t("profile.lifestyleQ")}</p>
      <ChipRow>
        {presets.map((p) => (
          <OptionChip
            key={p.key}
            onClick={() => onSave(p.key, p.v)}
            label={p.label}
            loading={isBusy(p.key)}
          />
        ))}
      </ChipRow>
    </div>
  );
}

function LabsBlock({
  codes,
  onSave,
  isBusy,
}: {
  codes: string[];
  onSave: (key: string, code: string, value: number, date: string) => void;
  isBusy: (key: string) => boolean;
}) {
  const { t } = useI18n();
  const today = new Date().toISOString().slice(0, 10);
  const presets: { key: string; code: string; value: number; label: string }[] = codes.slice(0, 4).map((code) => {
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
      key: `lab:${code}`,
      code,
      value: defaults[code] ?? 1,
      label: t(`factors.${LAB_FACTOR[code] ?? code}`),
    };
  });
  return (
    <div>
      <p className="mb-3 text-[14.5px] font-semibold text-ink-900">{t("profile.labsQ")}</p>
      <p className="mt-1 text-xs text-ink-400">{t("journey.stepper.labsHint")}</p>
      <ChipRow>
        {presets.map((p) => (
          <OptionChip
            key={p.key}
            onClick={() => onSave(p.key, p.code, p.value, today)}
            label={`${p.label} · ${p.value}${OBS_CODES[p.code as keyof typeof OBS_CODES] !== "text" ? ` ${OBS_CODES[p.code as keyof typeof OBS_CODES]}` : ""}`}
            loading={isBusy(p.key)}
          />
        ))}
      </ChipRow>
    </div>
  );
}

function MedsBlock({
  onSave,
  isBusy,
}: {
  onSave: (key: string, m: string[]) => void;
  isBusy: (key: string) => boolean;
}) {
  const { t } = useI18n();
  const options = [
    { key: "meds:none", label: t("journey.stepper.medsPresets.none"), meds: [] as string[] },
    { key: "meds:metformin", label: t("journey.stepper.medsPresets.metformin"), meds: ["Metformin"] },
    { key: "meds:thyroid", label: t("journey.stepper.medsPresets.thyroid"), meds: ["Levothyroxine"] },
  ];
  return (
    <div>
      <p className="mb-3 text-[14.5px] font-semibold text-ink-900">{t("profile.medsQ")}</p>
      <ChipRow>
        {options.map((o) => (
          <OptionChip
            key={o.key}
            onClick={() => onSave(o.key, o.meds)}
            label={o.label}
            loading={isBusy(o.key)}
          />
        ))}
      </ChipRow>
    </div>
  );
}
