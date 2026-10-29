"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import { CONDITION_CODES, FAMILY_HISTORY_CODES, INTENTIONS, OBS_CODES, type Intention, type Sex } from "@/lib/domain/types";
import { saveCheckin, saveConditions, saveCycles, saveLab, saveMedications, updateIntention } from "@/server/actions/patient";
import { Button, LinkButton } from "@/components/ui/atoms";

type Step = "intention" | "cycle" | "conditions" | "lifestyle" | "labs" | "medications";

interface Props {
  sex: Sex;
  intention: Intention;
  completed: string[];
  conditions: string[];
  familyHistory: string[];
  medications: string[];
  trajectoryHref: string;
  /** deep link, e.g. /profile?step=labs from an "add this" action */
  initialStep?: string;
}

const LAB_CODES_F = ["amh", "tsh", "hba1c", "bmi", "bp_systolic", "fsh"] as const;
const LAB_CODES_M = ["semen_concentration", "semen_motility", "semen_volume", "tsh", "hba1c", "bmi", "bp_systolic"] as const;
const LAB_FACTOR: Record<string, string> = { amh: "amh", tsh: "thyroid", hba1c: "glycaemic", bmi: "weight_trend", bp_systolic: "blood_pressure" };

export function ProfileWizard(p: Props) {
  const { t } = useI18n();
  const steps: Step[] = p.sex === "female" ? ["intention", "cycle", "conditions", "lifestyle", "labs", "medications"] : ["intention", "conditions", "lifestyle", "labs", "medications"];
  const initial = Math.max(0, steps.indexOf(p.initialStep as Step));
  const [i, setI] = useState(initial);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const step = steps[i];
  const done = new Set(p.completed);
  const next = () => {
    setSaved(false);
    setI((x) => Math.min(x + 1, steps.length - 1));
  };
  const run = (fn: () => Promise<void>) =>
    start(async () => {
      await fn();
      setSaved(true);
      setTimeout(next, 600);
    });

  return (
    <div>
      <ol className="flex flex-wrap gap-2" aria-label="Steps">
        {steps.map((s, idx) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => {
                setSaved(false);
                setI(idx);
              }}
              aria-current={idx === i ? "step" : undefined}
              className={`rounded-pill border px-3 py-1 text-xs ${
                idx === i ? "border-peach-500 bg-peach-200/60 text-ink-900" : done.has(s) || s === "intention" ? "border-mist-300 bg-mist-100 text-mist-700" : "border-dawn-300 text-ink-600"
              }`}
            >
              {t(`profile.steps.${s}`)}
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-ink-400">{t("profile.completeness", { done: done.size, total: steps.length - 1 })}</p>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.3 }}
          className="surface-paper mt-6 p-6"
        >
          {step === "intention" ? <IntentionStep current={p.intention} onPick={(v) => run(() => updateIntention(v))} /> : null}
          {step === "cycle" ? <CycleStep onSave={(lengths, absent) => run(() => saveCycles(lengths, absent))} /> : null}
          {step === "conditions" ? (
            <ConditionsStep initialC={p.conditions} initialF={p.familyHistory} onSave={(c, f) => run(() => saveConditions(c, f))} />
          ) : null}
          {step === "lifestyle" ? <CheckinStep onSave={(v) => run(() => saveCheckin(v))} /> : null}
          {step === "labs" ? <LabStep codes={p.sex === "female" ? [...LAB_CODES_F] : [...LAB_CODES_M]} onSave={(c, v, d) => run(() => saveLab(c, v, d))} /> : null}
          {step === "medications" ? <MedsStep initial={p.medications} onSave={(m) => run(() => saveMedications(m))} /> : null}

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-dawn-200 pt-4">
            <button type="button" onClick={next} className="text-sm text-ink-600 underline-offset-4 hover:underline">
              {t("common.skip")}
            </button>
            {saved ? (
              <span className="text-sm text-mist-700" aria-live="polite">
                {t("profile.saved")}
              </span>
            ) : null}
            {pending ? <span className="text-sm text-ink-400">…</span> : null}
            <LinkButton href={p.trajectoryHref} tone="ghost" className="ms-auto">
              {t("profile.finish")} →
            </LinkButton>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function IntentionStep({ current, onPick }: { current: Intention; onPick: (v: Intention) => void }) {
  const { t } = useI18n();
  return (
    <div>
      <h2 className="text-ink-900">{t("welcome.whereAreYou")}</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {INTENTIONS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onPick(v)}
            title={t(`intentions.hint.${v}`)}
            className={`rounded-pill border px-4 py-2 text-sm ${v === current ? "border-peach-500 bg-peach-200/60" : "border-dawn-300 bg-dawn-50 hover:bg-dawn-100"}`}
          >
            {t(`intentions.${v}`)}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-600">{t(`intentions.hint.${current}`)}</p>
    </div>
  );
}

function CycleStep({ onSave }: { onSave: (lengths: number[], absent?: number) => void }) {
  const { t } = useI18n();
  const [lengths, setLengths] = useState<string[]>(["", "", ""]);
  const [absent, setAbsent] = useState("");
  return (
    <div>
      <h2 className="text-ink-900">{t("profile.cycleQ")}</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {lengths.map((v, idx) => (
          <input
            key={idx}
            type="number"
            inputMode="numeric"
            min={10}
            max={120}
            value={v}
            placeholder="28"
            aria-label={`${t("profile.steps.cycle")} ${idx + 1}`}
            onChange={(e) => setLengths((l) => l.map((x, j) => (j === idx ? e.target.value : x)))}
            className="w-24 rounded-md border border-dawn-300 bg-dawn-50 px-3 py-2"
          />
        ))}
        <button type="button" onClick={() => setLengths((l) => [...l, ""])} className="text-sm text-mist-700 underline-offset-4 hover:underline">
          + {t("profile.addCycle")}
        </button>
      </div>
      <label className="mt-5 block text-sm text-ink-600">
        {t("profile.cycleAbsentQ")}
        <input type="number" min={0} value={absent} onChange={(e) => setAbsent(e.target.value)} className="mt-1 block w-32 rounded-md border border-dawn-300 bg-dawn-50 px-3 py-2" />
      </label>
      <Button className="mt-5" onClick={() => onSave(lengths.map(Number).filter((n) => n > 0), absent ? Number(absent) : undefined)}>
        {t("common.save")}
      </Button>
    </div>
  );
}

function ConditionsStep({ initialC, initialF, onSave }: { initialC: string[]; initialF: string[]; onSave: (c: string[], f: string[]) => void }) {
  const { t } = useI18n();
  const [c, setC] = useState<string[]>(initialC);
  const [f, setF] = useState<string[]>(initialF);
  const toggle = (set: typeof setC, v: string) => set((arr) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]));
  return (
    <div>
      <h2 className="text-ink-900">{t("profile.conditionsQ")}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {CONDITION_CODES.map((v) => (
          <Chip key={v} on={c.includes(v)} onClick={() => toggle(setC, v)} label={t(`factors.${v}`)} />
        ))}
      </div>
      <h3 className="mt-6 text-ink-900">{t("profile.familyQ")}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {FAMILY_HISTORY_CODES.map((v) => (
          <Chip key={v} on={f.includes(v)} onClick={() => toggle(setF, v)} label={t(`factors.family_${v}`)} />
        ))}
      </div>
      <Button className="mt-5" onClick={() => onSave(c, f)}>
        {t("common.save")}
      </Button>
    </div>
  );
}

function Chip({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded-pill border px-3 py-1.5 text-sm ${on ? "border-peach-500 bg-peach-200/60 text-ink-900" : "border-dawn-300 bg-dawn-50 text-ink-600 hover:bg-dawn-100"}`}
    >
      {label}
    </button>
  );
}

type CheckinValues = { sleep: number; activity: number; smoking: "never" | "former" | "current"; alcohol: number; stress: number; laughter: number; heat: "low" | "high" };
type RangeKey = "sleep" | "activity" | "alcohol" | "stress" | "laughter";

function Range({ k, min, max, step = 1, label, value, onChange }: { k: RangeKey; min: number; max: number; step?: number; label: string; value: number; onChange: (k: RangeKey, v: number) => void }) {
  return (
    <label className="block text-sm">
      <span className="flex justify-between text-ink-900">
        <span>{label}</span>
        <span className="tabular-nums text-ink-600">{value}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(k, Number(e.target.value))} className="mt-1 w-full accent-peach-500" />
    </label>
  );
}

function CheckinStep({ onSave }: { onSave: (v: Parameters<typeof saveCheckin>[0]) => void }) {
  const { t } = useI18n();
  const [v, setV] = useState<CheckinValues>({ sleep: 7, activity: 120, smoking: "never", alcohol: 0, stress: 5, laughter: 3, heat: "low" });
  const set = (k: RangeKey, val: number) => setV((s) => ({ ...s, [k]: val }));
  return (
    <div>
      <h2 className="text-ink-900">{t("profile.lifestyleQ")}</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <Range k="sleep" min={4} max={10} step={0.5} label={t("profile.sleep")} value={v.sleep} onChange={set} />
        <Range k="activity" min={0} max={400} step={10} label={t("profile.activity")} value={v.activity} onChange={set} />
        <Range k="alcohol" min={0} max={30} label={t("profile.alcohol")} value={v.alcohol} onChange={set} />
        <Range k="stress" min={1} max={10} label={t("profile.stress")} value={v.stress} onChange={set} />
        <Range k="laughter" min={0} max={7} label={t("profile.laughter")} value={v.laughter} onChange={set} />
        <label className="block text-sm">
          <span className="text-ink-900">{t("profile.smoking")}</span>
          <select value={v.smoking} onChange={(e) => setV((s) => ({ ...s, smoking: e.target.value as typeof v.smoking }))} className="mt-1 w-full rounded-md border border-dawn-300 bg-dawn-50 px-2 py-1.5">
            {(["never", "former", "current"] as const).map((o) => (
              <option key={o} value={o}>
                {t(`profile.smokingOptions.${o}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-ink-900">{t("profile.heat")}</span>
          <select value={v.heat} onChange={(e) => setV((s) => ({ ...s, heat: e.target.value as typeof v.heat }))} className="mt-1 w-full rounded-md border border-dawn-300 bg-dawn-50 px-2 py-1.5">
            {(["low", "high"] as const).map((o) => (
              <option key={o} value={o}>
                {t(`profile.heatOptions.${o}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Button className="mt-5" onClick={() => onSave(v)}>
        {t("common.save")}
      </Button>
    </div>
  );
}

function LabStep({ codes, onSave }: { codes: string[]; onSave: (code: string, value: number, date: string) => void }) {
  const { t } = useI18n();
  const [code, setCode] = useState(codes[0]);
  const [value, setValue] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  return (
    <div>
      <h2 className="text-ink-900">{t("profile.labsQ")}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="text-ink-900">{t("profile.labCode")}</span>
          <select value={code} onChange={(e) => setCode(e.target.value)} className="mt-1 w-full rounded-md border border-dawn-300 bg-dawn-50 px-2 py-1.5">
            {codes.map((c) => (
              <option key={c} value={c}>
                {t(`factors.${LAB_FACTOR[c] ?? c}`)} ({OBS_CODES[c as keyof typeof OBS_CODES]})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-ink-900">{t("profile.labValue")}</span>
          <input type="number" step="0.1" value={value} onChange={(e) => setValue(e.target.value)} className="mt-1 w-full rounded-md border border-dawn-300 bg-dawn-50 px-3 py-1.5" />
        </label>
        <label className="block text-sm">
          <span className="text-ink-900">{t("profile.labDate")}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-md border border-dawn-300 bg-dawn-50 px-3 py-1.5" />
        </label>
      </div>
      <Button className="mt-5" disabled={!value} onClick={() => onSave(code, Number(value), date)}>
        {t("profile.addLab")}
      </Button>
    </div>
  );
}

function MedsStep({ initial, onSave }: { initial: string[]; onSave: (m: string[]) => void }) {
  const { t } = useI18n();
  const [text, setText] = useState(initial.join(", "));
  return (
    <div>
      <h2 className="text-ink-900">{t("profile.medsQ")}</h2>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="mt-4 w-full rounded-md border border-dawn-300 bg-dawn-50 px-3 py-2" />
      <Button className="mt-4" onClick={() => onSave(text.split(",").map((s) => s.trim()).filter(Boolean))}>
        {t("common.save")}
      </Button>
    </div>
  );
}
