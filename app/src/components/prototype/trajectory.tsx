"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { LEVEL_LABEL, SCOPE_LABEL, SOURCE_LABEL, STAGES, SYMPTOMS, SYMPTOM_LABEL, addDays, daysBetween, laneSentence, type Change, type Lane, type Obs, type ObsType, type Scope, type StageId } from "@/lib/longitudinal";
import { CONDITION_LABEL, type Condition } from "@/lib/model";
import type { ProtoConsent } from "@/lib/prototype";
import { formatDateIn } from "@/lib/i18n";
import { Pill, Simulated, useProto } from "./core";
import { Connector, ConsultScene, CoupleScene, CyclistScene, Reveal, TreadmillScene } from "./scenes";
import { uid, withAudit, withNotice, type ProtoState } from "./state";

// My Trajectory: the person's reproductive-health context over time, one
// domain per lane, every trend with a plain sentence beside it, and the
// changes Masar's rules noticed, each with what supports it, what it can't
// tell and what is missing. Synthetic demonstration data, labelled as such.

export const RANGES = [
  { id: "30d", label: "30 days", days: 30 },
  { id: "3m", label: "3 months", days: 91 },
  { id: "6m", label: "6 months", days: 182 },
  { id: "1y", label: "1 year", days: 365 },
] as const;
export type RangeId = (typeof RANGES)[number]["id"];

export const LANE_TITLE: Record<Lane["id"], string> = {
  cycle: "Reproductive patterns",
  lifestyle: "Lifestyle",
  clinical: "Clinical evidence",
  device: "Wearable signals",
};
const LANE_NOTE: Record<Lane["id"], string> = {
  cycle: "Period starts and symptoms you logged. Cycle length is the days from one start to the next.",
  lifestyle: "Short check-ins you chose to make. Context for your wellbeing, never a measure of reproductive potential.",
  clinical: "Lab results and diagnoses from simulated clinical systems, shown exactly as recorded.",
  device: "A synthetic wearable feed. No real device is connected in this prototype.",
};
/** The permission behind each lane, for switching it on from here. */
const LANE_CONSENT: Record<Lane["id"], (keyof ProtoConsent)[]> = {
  cycle: ["cycles"],
  lifestyle: ["lifestyle"],
  clinical: ["labs", "clinical"],
  device: ["device"],
};
const SCOPE_CONSENT: Record<Scope, keyof ProtoConsent> = {
  cycles: "cycles",
  lifestyle: "lifestyle",
  device: "device",
  labs: "labs",
  clinical: "clinical",
};

export const PROVENANCE_TONE: Record<Obs["provenance"], string> = {
  user: "bg-accent-soft text-accent",
  device: "bg-indigo-100 text-indigo-700",
  imported: "bg-zinc-100 text-ink-2",
  clinician: "bg-soon-soft text-soon",
};

export function ProvenanceTag({ p }: { p: Obs["provenance"] }) {
  const { tr } = useProto();
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${PROVENANCE_TONE[p]}`}>
      {tr(
        {
          user: "You logged",
          device: "Device",
          imported: "Imported record",
          clinician: "Clinician-confirmed",
        }[p],
      )}
    </span>
  );
}

/** An observation's value in words. */
export function valueText(o: Obs, tr: (t: string, v?: Record<string, string | number>) => string): string {
  if (o.type === "cycle_start") return o.value === "heavy" ? tr("Period started · heavier flow") : tr("Period started");
  if (o.type === "symptom") return tr(SYMPTOM_LABEL[String(o.value)] ?? String(o.value));
  if (o.type === "condition") return tr(CONDITION_LABEL[o.value as Condition] ?? String(o.value));
  if (typeof o.value === "number") return `${o.value.toLocaleString("en")} ${tr(o.unit)}`.trim();
  return tr(LEVEL_LABEL[o.value] ?? o.value);
}

export function setStage(stage: StageId) {
  return (x: ProtoState): ProtoState =>
    withAudit(
      { ...x, journey: { ...x.journey, stage } },
      {
        role: "system",
        who: "Demo Controls",
        what: "Moved the synthetic timeline to {stage}",
        vars: { stage: STAGES[stage].label },
        allowed: true,
      },
    );
}

// ---------- the section ----------

export function MyTrajectory() {
  const { s, set, tr, date, journey: jv, base } = useProto();
  const [range, setRange] = useState<RangeId>("6m");
  // A range never reaches back before tracking began (clinical records may, and say so).
  const from = [addDays(jv.asOf, -RANGES.find((r) => r.id === range)!.days), jv.start].sort().at(-1)!;
  const lanes = jv.lanes.filter((l) => l.id !== "cycle" || base.sex === "female");
  const real = jv.changes.filter((c) => c.kind !== "data");
  const gaps = jv.changes.filter((c) => c.kind === "data");

  return (
    <div className="space-y-5">
      <div className="pt-card flex flex-wrap items-end gap-x-5 gap-y-3 !py-4">
        <p className="flex min-w-0 flex-1 basis-64 flex-wrap items-center gap-2 text-[13px] text-ink-2">
          <Simulated>{tr("Synthetic demonstration data")}</Simulated>
          {tr("Tracking since {start} · today in this demo is {today}", { start: date(jv.start), today: date(jv.asOf) })}
        </p>
        <label className="block text-[12.5px] font-medium text-ink-2">
          {tr("Point in the synthetic year")}
          <select value={jv.stage} onChange={(e) => set(setStage(Number(e.target.value) as StageId))} className="pt-input pt-select mt-1 !min-h-[42px] min-w-[11rem] text-[14px] text-ink">
            {STAGES.map((st) => (
              <option key={st.id} value={st.id}>
                {tr(st.label)} · {date(st.asOf)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[12.5px] font-medium text-ink-2">
          {tr("Time range")}
          <select value={range} onChange={(e) => setRange(e.target.value as RangeId)} className="pt-input pt-select mt-1 !min-h-[42px] min-w-[9rem] text-[14px] text-ink">
            {RANGES.map((r) => (
              <option key={r.id} value={r.id}>
                {tr(r.label)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <BaselineCard key={jv.stage === 0 ? "open" : "closed"} defaultOpen={jv.stage === 0} />

      <CoverageRibbon lanes={lanes} />

      {/* Four scenes on one path: they alternate sides, and a stretch of path joins each to the next. */}
      {/* Every account walks the same four scenes. Men have no cycle to track, so their first scene says where reproductive health shows up instead. */}
      <ol aria-label={tr("Four parts of your journey")}>
        {[...(base.sex === "female" ? [] : ["male" as const]), ...lanes].map((l, i) => (
          <li key={l === "male" ? "male" : l.id} id={l === "male" ? "pt-lane-reproductive" : `pt-lane-${l.id}`} className="scroll-mt-36">
            {i ? <Connector flip={i % 2 === 0} /> : null}
            <Reveal className={i ? "mt-4 lg:mt-0" : ""}>{l === "male" ? <MaleReproductiveCard letter="A" /> : <LaneCard lane={l} from={from} scene flip={i % 2 === 1} letter={String.fromCharCode(65 + i)} defaultOpen={false} />}</Reveal>
          </li>
        ))}
      </ol>
      <Legend />

      {/* Today: a quick check-in beside the entries it adds to */}
      <section aria-label={tr("Track today")} className="grid gap-4 rounded-[24px] bg-zinc-50 p-2 md:p-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] [&>*]:min-w-0">
        <QuickLog />
        <MyEntries />
      </section>

      <div id="pt-changes" className="scroll-mt-32">
        <h3 className="display text-[1.45rem] text-ink">{tr("What has changed, and what it may mean")}</h3>
        <p className="mt-1 max-w-3xl text-[14px] text-ink-2">{tr("Masar compares your recent observations with your own earlier ones, using published rules. These are observations, not diagnoses, and each says what it can't tell you.")}</p>
        {real.length ? (
          <Reveal className="pt-stagger mt-4 grid items-start gap-4 lg:grid-cols-2 lg:[&>*:only-child]:col-span-2">
            {real.map((c) => (
              <ChangeCard key={c.id} c={c} />
            ))}
          </Reveal>
        ) : (
          <div className="pt-card mt-4 text-[14.5px] text-ink-2">
            <p className="font-semibold text-ink">{jv.stage === 0 ? tr("It's too early to see changes: this is your baseline.") : tr("Masar hasn't noticed a change in what you've shared so far.")}</p>
            <p className="mt-1">{tr("That only covers what you've shared and isn't a guarantee. Changes appear here as your observations build up.")}</p>
          </div>
        )}
        {gaps.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 md:[&>*:only-child]:col-span-2">
            {gaps.map((c) => (
              <ChangeCard key={c.id} c={c} compact />
            ))}
          </div>
        ) : null}
        <p className="mt-3 text-[12.5px] text-ink-3">{tr("No fertility score, no risk score and no label: Masar shows direction and change over time, with the evidence and the gaps.")}</p>
      </div>
      {jv.withheld.length ? (
        <p className="rounded-[14px] bg-unknown-soft px-4 py-3 text-[13.5px] text-ink">
          {tr("Not used, because you haven't allowed it: {list}. Nothing from these reaches the timeline, the assistant or your doctor.", {
            list: jv.withheld.map((x) => tr(SCOPE_LABEL[x])).join(s.lang === "ar" ? "، " : ", "),
          })}
        </p>
      ) : null}
    </div>
  );
}

function BaselineCard({ defaultOpen }: { defaultOpen: boolean }) {
  const { tr, say, journey: jv } = useProto();
  const [open, setOpen] = useState(defaultOpen);
  const b = jv.baseline;
  return (
    <section className="pt-card border-s-4 border-s-accent" aria-labelledby="pt-baseline">
      <button type="button" aria-expanded={open} aria-controls="pt-baseline-body" onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-3 text-start">
        <span className="min-w-0 flex-1">
          <span className="eyebrow block">{tr("Your baseline")}</span>
          <span id="pt-baseline" className="mt-1 block text-[1.15rem] font-semibold text-ink">
            {tr("Where Masar starts from: what is available, what is missing, and what can't be assessed yet")}
          </span>
          {!open ? <span className="mt-1 block text-[13px] text-ink-2">{tr("{a} available · {m} missing or not shared · {c} can't be assessed yet", { a: b.available.length, m: b.missing.length, c: b.cannot.length })}</span> : null}
        </span>
        <Chevron />
      </button>
      {open ? (
        <div id="pt-baseline-body" className="pt-enter">
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <List title={tr("Available")} tone="accent" items={b.available.map(say)} empty={tr("Nothing yet.")} />
            <List title={tr("Missing or not shared")} tone="unknown" items={b.missing.map(say)} empty={tr("Nothing missing.")} />
            <List title={tr("Can't be assessed yet")} tone="soon" items={b.cannot.map(say)} empty="" />
          </div>
          <p className="mt-3 text-[12.5px] text-ink-3">{tr("Confidence is limited at the start: Masar needs a few months of your own observations before it compares anything.")}</p>
        </div>
      ) : null}
    </section>
  );
}

function Chevron() {
  return (
    <span aria-hidden className="pt-chev mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-rule bg-surface text-ink-2">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  );
}

function List({ title, items, empty, tone }: { title: string; items: string[]; empty: string; tone: "accent" | "unknown" | "soon" }) {
  const dot = {
    accent: "bg-accent",
    unknown: "border border-dashed border-unknown",
    soon: "bg-soon",
  }[tone];
  return (
    <div>
      <p className="text-[13px] font-semibold text-ink">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.length ? (
          items.map((x) => (
            <li key={x} className="flex gap-2 text-[13.5px] leading-snug text-ink-2">
              <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
              {x}
            </li>
          ))
        ) : (
          <li className="text-[13px] text-ink-3">{empty}</li>
        )}
      </ul>
    </div>
  );
}

function Legend() {
  const { tr } = useProto();
  return (
    <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-ink-2">
      <span className="font-semibold text-ink">{tr("How to read this")}:</span>
      <ProvenanceTag p="user" />
      <ProvenanceTag p="device" />
      <ProvenanceTag p="imported" />
      <ProvenanceTag p="clinician" />
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className="pt-hatch inline-block h-3 w-5 rounded-[3px] border border-rule" />
        {tr("No data")}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className="inline-block h-3 w-5 rounded-[3px] bg-accent-soft" />
        {tr("Usual range")}
      </span>
      <span>{tr("AI interpretations are never shown on the timeline.")}</span>
    </div>
  );
}

// ---------- one lane ----------

export function LaneCard({
  lane,
  from,
  readOnly = false,
  only,
  scene = false,
  defaultOpen = true,
  flip = false,
  letter,
}: {
  lane: Lane;
  from: string;
  readOnly?: boolean;
  only?: (o: Obs) => boolean;
  scene?: boolean;
  defaultOpen?: boolean;
  flip?: boolean;
  letter?: string;
}) {
  const { set, tr, say, date, journey: jv, base } = useProto();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(defaultOpen);
  const tableId = useId();
  const obs = jv.obs.filter((o) => lane.scope.includes(o.scope) && (!only || only(o)));
  const shown = obs.filter((o) => o.at >= from || lane.id === "clinical");
  const name = base.name.split(" ")[0];
  const allow = () =>
    set((x) =>
      withAudit(
        {
          ...x,
          consent: {
            ...x.consent,
            ...Object.fromEntries(LANE_CONSENT[lane.id].map((k) => [k, true])),
          },
        },
        {
          role: "patient",
          who: name,
          what: "Allowed: {what}",
          vars: { what: LANE_TITLE[lane.id] },
          allowed: true,
        },
      ),
    );
  const gaps = jv.gaps.filter((g) => lane.scope.includes(g.scope) && g.to >= from);
  return (
    <article className={`pt-card ${scene ? "overflow-hidden !p-0" : ""}`} aria-labelledby={`${tableId}-t`}>
      <div className={scene ? `grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] ${flip ? "lg:[&>*:first-child]:order-2" : ""}` : ""}>
        {scene ? (
          <div className="relative aspect-[16/8] lg:aspect-auto lg:min-h-[300px]">
            <LaneScene lane={lane} />
            {letter ? (
              <span aria-hidden className="absolute start-4 top-4 flex items-center gap-2 rounded-full bg-surface/90 py-1 pe-3 ps-1 text-[12px] font-semibold text-ink shadow-sm backdrop-blur">
                <span className={`grid h-7 w-7 place-items-center rounded-full font-display text-[0.95rem] ${lane.allowed ? "bg-ink text-paper" : "border border-dashed border-unknown text-ink-3"}`}>{letter}</span>
                {tr(LANE_TITLE[lane.id])}
              </span>
            ) : null}
            {!lane.allowed ? <span className="absolute bottom-4 start-4 rounded-full bg-surface/90 px-3 py-1 text-[12px] font-semibold text-unknown shadow-sm">{tr("Not shared: the scene stays neutral")}</span> : null}
          </div>
        ) : null}
        <div className={scene ? "flex min-w-0 flex-col p-5 lg:ps-6" : ""}>
          <header className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 id={`${tableId}-t`} className={scene ? "display text-[1.45rem] leading-tight text-ink" : "text-[15.5px] font-semibold text-ink"}>
                {tr(LANE_TITLE[lane.id])}
              </h4>
              <p className="mt-1 text-[12.5px] text-ink-3">{tr(LANE_NOTE[lane.id])}</p>
            </div>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={`${tableId}-b`}
              onClick={() => setExpanded((e) => !e)}
              aria-label={expanded ? tr("Hide the details of {lane}", { lane: tr(LANE_TITLE[lane.id]) }) : tr("Show the details of {lane}", { lane: tr(LANE_TITLE[lane.id]) })}
              className="shrink-0"
            >
              <Chevron />
            </button>
          </header>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {lane.allowed ? <Pill tone="stone">{tr("{n} observations", { n: obs.length })}</Pill> : <Pill tone="unknown">{tr("Not shared")}</Pill>}
            {lane.allowed && gaps.length ? <Pill tone="unknown">{tr("Has gaps")}</Pill> : null}
          </div>
          {lane.allowed ? <Facts lane={lane.id} from={from} obs={obs} /> : null}
          {lane.allowed && shown.length ? <p className="mt-3 text-[14px] text-ink">{say(laneSentence(jv, lane.id, from))}</p> : null}
          {lane.id === "device" ? <p className="mt-2 text-[12px] text-ink-3">{tr("This synthetic wearable records sleep, steps and resting heart rate. It does not measure blood pressure or oxygen saturation, so Masar never shows them.")}</p> : null}
        </div>
      </div>
      {expanded ? (
        <div id={`${tableId}-b`} className={scene ? "border-t border-rule px-5 pb-5" : ""}>
          {!lane.allowed ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[14px] border border-dashed border-rule-strong px-4 py-3">
              <p className="min-w-0 flex-1 text-[13.5px] text-ink-2">{tr("You haven't allowed Masar to use this. Nothing from it is shown, compared or sent anywhere.")}</p>
              {!readOnly ? (
                <button type="button" onClick={allow} className="btn btn-secondary !min-h-[40px] text-[13px]">
                  {tr("Allow and show it")}
                </button>
              ) : null}
            </div>
          ) : !shown.length ? (
            <p className="mt-4 rounded-[14px] bg-zinc-50 px-4 py-3 text-[13.5px] text-ink-2">
              {lane.id === "clinical" ? tr("No clinical records yet. When a lab result or diagnosis is added, it appears here with its date and source.") : tr("Nothing recorded in this period yet.")}
            </p>
          ) : (
            <>
              <div className="mt-4" dir="ltr">
                <LaneChart lane={lane.id} obs={shown} from={lane.id === "clinical" ? [from, ...shown.map((o) => o.at)].sort()[0] : from} to={jv.asOf} gaps={gaps} />
              </div>
              {!scene ? <p className="mt-3 text-[14px] text-ink">{say(laneSentence(jv, lane.id, from))}</p> : null}
              {lane.id === "clinical" ? <ClinicalList obs={shown} readOnly={readOnly} /> : null}
              {gaps.length ? <p className="mt-1.5 text-[12.5px] text-ink-3">{gaps.map((g) => tr("No data from {from} to {to} ({days} days). Masar doesn't fill gaps in.", { from: date(g.from), to: date(g.to), days: g.days })).join(" ")}</p> : null}
              <button type="button" aria-expanded={open} aria-controls={tableId} onClick={() => setOpen((o) => !o)} className="mt-2 min-h-[36px] text-[13px] font-semibold text-accent underline-offset-4 hover:underline">
                {open ? tr("Hide the values") : tr("Show the values")}
              </button>
              {open ? (
                <div id={tableId} className="mt-2 max-h-72 overflow-auto rounded-[12px] border border-rule">
                  <table className="w-full min-w-[460px] text-[13px]">
                    <caption className="sr-only">{tr(LANE_TITLE[lane.id])}</caption>
                    <thead className="sticky top-0 bg-surface">
                      <tr className="text-ink-3">
                        <th className="px-3 py-1.5 text-start font-medium">{tr("Date")}</th>
                        <th className="px-3 py-1.5 text-start font-medium">{tr("Observation")}</th>
                        <th className="px-3 py-1.5 text-start font-medium">{tr("Value")}</th>
                        <th className="px-3 py-1.5 text-start font-medium">{tr("Source")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...shown]
                        .reverse()
                        .slice(0, 60)
                        .map((o) => (
                          <tr key={o.id} className="border-t border-rule">
                            <td className="whitespace-nowrap px-3 py-1.5 text-ink-2">{date(o.at)}</td>
                            <td className="px-3 py-1.5 text-ink">{tr(o.label)}</td>
                            <td className="tabular px-3 py-1.5 font-medium text-ink">{valueText(o, tr)}</td>
                            <td className="px-3 py-1.5">
                              <ProvenanceTag p={o.provenance} />
                              {o.quality === "estimated" ? <span className="ms-1.5 text-[11.5px] text-ink-3">{tr("estimate")}</span> : null}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </article>
  );
}

function ClinicalList({ obs, readOnly }: { obs: Obs[]; readOnly: boolean }) {
  const { set, tr, date, journey: jv } = useProto();
  return (
    <ul className="mt-3 divide-y divide-rule rounded-[14px] border border-rule">
      {obs.map((o) => (
        <li key={o.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-2.5 text-[13.5px]">
          <span className="w-full shrink-0 text-ink-3 sm:w-28">{date(o.at)}</span>
          <span className="min-w-0 flex-1">
            <span className="font-medium text-ink">{tr(o.label)}</span>
            {o.type === "lab" ? (
              <span className="ms-2 tabular text-ink" dir="ltr">
                {String(o.value)} {o.unit}
              </span>
            ) : (
              <span className="ms-2 text-ink-2">{valueText(o, tr)}</span>
            )}
            <span className="block text-[12px] text-ink-3">
              {tr(o.source)} · {o.ref ? tr("Range on the report: {ref}", { ref: o.ref }) : tr("No reference range on the report; Masar doesn't add one")}
              {o.at < jv.start ? ` · ${tr("Before tracking began")}` : ""}
              {o.id === "lab-sim" ? ` · ${tr("Simulated")}` : ""}
            </span>
          </span>
          <ProvenanceTag p={o.provenance} />
          {readOnly && o.type === "lab" && o.provenance !== "clinician" ? (
            <button
              type="button"
              onClick={() =>
                set((x) =>
                  withNotice(
                    withAudit(
                      {
                        ...x,
                        journey: {
                          ...x.journey,
                          edits: {
                            ...x.journey.edits,
                            confirmed: [...x.journey.edits.confirmed, o.id],
                          },
                        },
                      },
                      {
                        role: "clinician",
                        who: "Dr Layla Al Hashimi",
                        what: "Confirmed a lab result in the patient's timeline",
                        allowed: true,
                      },
                    ),
                    {
                      to: "patient",
                      tone: "info",
                      text: "Dr Layla confirmed one of your lab results.",
                    },
                  ),
                )
              }
              className="btn btn-secondary !min-h-[34px] !px-3 text-[12.5px]"
            >
              {tr("Confirm against the original report")}
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

// ---------- the chart ----------

const W = 640;

function LaneChart({ lane, obs, from, to, gaps }: { lane: Lane["id"]; obs: Obs[]; from: string; to: string; gaps: { from: string; to: string }[] }) {
  const { tr, date, journey: jv } = useProto();
  const hatch = useId().replace(/:/g, "");
  const span = Math.max(1, daysBetween(from, to));
  const x = (at: string) => 8 + (Math.min(span, Math.max(0, daysBetween(from, at))) / span) * (W - 16);
  const H = lane === "clinical" ? 56 : 120;
  const label = tr("{lane} from {from} to {to}", {
    lane: tr(LANE_TITLE[lane]),
    from: date(from),
    to: date(to),
  });
  const ticks = useMemo(() => {
    const out: string[] = [];
    const step = span > 200 ? 60 : span > 80 ? 30 : 7;
    for (let d = 0; d <= span; d += step) out.push(addDays(from, d));
    return out;
  }, [from, span]);
  let body: ReactNode = null;

  if (lane === "cycle") {
    const cyc = jv.cycles.filter((c) => c.to >= from);
    const y = (d: number) => H - 14 - ((Math.min(50, Math.max(15, d)) - 15) / 35) * (H - 26);
    body = (
      <>
        <rect x={0} y={y(35)} width={W} height={y(21) - y(35)} className="fill-accent-soft" />
        {cyc.map((c) => (
          <g key={c.to}>
            <line x1={x(c.from)} x2={x(c.to)} y1={y(c.days)} y2={y(c.days)} strokeWidth={6} strokeLinecap="round" className={c.days > 35 || c.days < 21 ? "stroke-soon" : "stroke-accent"} />
            <text x={(x(c.from) + x(c.to)) / 2} y={y(c.days) - 7} textAnchor="middle" className="fill-ink-2 text-[11px]">
              {c.days}
            </text>
          </g>
        ))}
        {obs
          .filter((o) => o.type === "symptom")
          .map((o) => (
            <rect key={o.id} x={x(o.at) - 3.5} y={H - 9} width={7} height={7} transform={`rotate(45 ${x(o.at)} ${H - 5.5})`} className="fill-indigo-400" />
          ))}
      </>
    );
  } else if (lane === "lifestyle") {
    const row = { low: H - 22, some: H / 2, high: 20 } as Record<string, number>;
    body = (
      <>
        {Object.entries(row).map(([k, yy]) => (
          <g key={k}>
            <line x1={0} x2={W} y1={yy} y2={yy} className="stroke-rule" strokeDasharray="2 4" />
          </g>
        ))}
        {obs
          .filter((o) => o.type === "stress")
          .map((o) => (
            <circle key={o.id} cx={x(o.at)} cy={row[String(o.value)] ?? row.some} r={3.4} className={o.value === "high" ? "fill-soon" : o.value === "some" ? "fill-indigo-300" : "fill-accent"} opacity={0.85} />
          ))}
      </>
    );
  } else if (lane === "device") {
    const nights = obs.filter((o) => o.type === "sleep");
    const weeks = new Map<number, number[]>();
    for (const n of nights) {
      const k = Math.floor(daysBetween(from, n.at) / 7);
      weeks.set(k, [...(weeks.get(k) ?? []), Number(n.value)]);
    }
    const pts = [...weeks.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([k, v]) => ({
        at: addDays(from, k * 7 + 3),
        v: v.reduce((s, z) => s + z, 0) / v.length,
      }));
    const y = (h: number) => H - 12 - ((Math.min(10, Math.max(4, h)) - 4) / 6) * (H - 24);
    const path: string[] = [];
    pts.forEach((p, i) => {
      const prev = pts[i - 1];
      const broken = !prev || daysBetween(prev.at, p.at) > 14;
      path.push(`${broken ? "M" : "L"}${x(p.at).toFixed(1)},${y(p.v).toFixed(1)}`);
    });
    body = (
      <>
        <rect x={0} y={y(9)} width={W} height={y(7) - y(9)} className="fill-accent-soft" />
        <path d={path.join(" ")} fill="none" strokeWidth={2.2} strokeLinejoin="round" className="stroke-indigo-500" />
        {pts.map((p) => (
          <circle key={p.at} cx={x(p.at)} cy={y(p.v)} r={2.4} className="fill-indigo-500" />
        ))}
      </>
    );
  } else {
    body = obs.map((o) => (
      <g key={o.id}>
        <line x1={x(o.at)} x2={x(o.at)} y1={8} y2={H - 14} className="stroke-rule-strong" />
        <circle cx={x(o.at)} cy={H / 2 - 3} r={6} className={o.provenance === "clinician" ? "fill-soon" : "fill-ink"} />
      </g>
    ));
  }

  return (
    <figure>
      {/* On phones the chart keeps a readable size and scrolls sideways inside its card. */}
      <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:thin]">
        <svg viewBox={`0 0 ${W} ${H + 16}`} role="img" aria-label={label} className="h-auto w-full min-w-[540px] overflow-visible">
          <defs>
            <pattern id={hatch} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" className="stroke-zinc-300" strokeWidth="2" />
            </pattern>
          </defs>
          {gaps.map((g) => (
            <rect key={g.from} x={x(g.from)} y={0} width={Math.max(2, x(g.to) - x(g.from))} height={H} fill={`url(#${hatch})`} />
          ))}
          {body}
          <line x1={0} x2={W} y1={H} y2={H} className="stroke-rule" />
          {ticks.map((t) => (
            <text key={t} x={x(t)} y={H + 13} textAnchor="middle" className="fill-ink-3 text-[10.5px]">
              {date(t).replace(/\s\d{4}$/, "")}
            </text>
          ))}
        </svg>
      </div>
      {lane === "cycle" ? (
        <figcaption className="mt-1 text-[12px] text-ink-3">{tr("Each bar is one cycle, placed where it happened; its height and number are its length in days. The shaded band is 21 to 35 days. Diamonds are symptoms you logged.")}</figcaption>
      ) : null}
      {lane === "lifestyle" ? <figcaption className="mt-1 text-[12px] text-ink-3">{tr("Each dot is a check-in: top row high stress, middle some, bottom low.")}</figcaption> : null}
      {lane === "device" ? <figcaption className="mt-1 text-[12px] text-ink-3">{tr("Weekly average sleep in hours. The shaded band is 7 to 9 hours.")}</figcaption> : null}
    </figure>
  );
}

// ---------- a detected change ----------

export function ChangeCard({ c, compact = false, clinician = false }: { c: Change; compact?: boolean; clinician?: boolean }) {
  const { tr, say, date, journey: jv } = useProto();
  const [open, setOpen] = useState(false);
  const id = useId();
  const support = jv.obs.filter((o) => c.supports.includes(o.id));
  const rows: [string, ReactNode][] = [
    [tr("What changed"), say(c.what)],
    [tr("When"), c.from === c.to ? date(c.from) : tr("{from} to {to}", { from: date(c.from), to: date(c.to) })],
    [
      tr("What supports this"),
      <>
        {c.supportLines.map(say).join(" · ")}
        {support.length ? (
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {support.slice(0, 10).map((o) => (
              <li key={o.id} className="rounded-full border border-rule px-2 py-0.5 text-[12px] text-ink-2">
                {date(o.at)} · {valueText(o, tr)}
              </li>
            ))}
          </ul>
        ) : null}
      </>,
    ],
    [tr("What may be relevant"), c.relevant.map(say).join(" ")],
    [tr("What this can't determine"), c.cannot.map(say).join(" ")],
    [tr("What's missing"), c.missing.length ? c.missing.map(say).join(" ") : tr("Nothing noted.")],
    [tr("What may be modifiable"), say(c.modifiable)],
    [clinician ? tr("Suggested to the patient") : tr("A possible next step"), c.next.map(say).join(" ")],
  ];
  return (
    <article id={`chg-${c.id}`} className={`pt-card scroll-mt-32 ${c.kind === "data" ? "!bg-zinc-50" : ""}`} aria-labelledby={`${id}-t`}>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={c.kind === "data" ? "unknown" : c.kind === "clinical" ? "stone" : c.kind === "lifestyle" ? "accent" : "soon"}>
          {tr(
            {
              pattern: "Change in your pattern",
              clinical: "New clinical evidence",
              lifestyle: "Lifestyle context",
              data: "Missing data",
            }[c.kind],
          )}
        </Pill>
        <span className="text-[12px] text-ink-3">{clinician ? tr("Masar observation · not a clinical finding") : tr("Observation, not a diagnosis")}</span>
      </div>
      <h4 id={`${id}-t`} className={`mt-2 font-semibold leading-snug text-ink ${compact ? "text-[15px]" : "text-[16px]"}`}>
        {say(c.title)}
      </h4>
      <p className="mt-1 text-[14px] text-ink-2">{say(c.what)}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-[12.5px]">
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-ink-2">
          {tr("Evidence")}: {tr(c.evidence.citation)} · {tr(c.evidence.strength)}
        </span>
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-ink-2">
          {tr("Confidence")}: {tr(c.confidence.level)}
        </span>
      </div>
      <button type="button" aria-expanded={open} aria-controls={`${id}-d`} onClick={() => setOpen((o) => !o)} className="mt-2 min-h-[36px] text-[13px] font-semibold text-accent underline-offset-4 hover:underline">
        {open ? tr("Hide the explanation") : tr("Why Masar shows this, and its limits")}
      </button>
      {open ? (
        <div id={`${id}-d`} className="pt-enter mt-2">
          <dl className="grid gap-x-6 gap-y-3 md:grid-cols-2">
            {rows.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[12.5px] font-semibold text-ink-3">{k}</dt>
                <dd className="mt-0.5 text-[13.5px] leading-relaxed text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 rounded-[12px] bg-zinc-50 px-3.5 py-2.5 text-[12.5px] text-ink-2">
            <span className="font-semibold text-ink">{tr("The rule")}: </span>
            {say(c.evidence.rule)} {say(c.confidence.why)}
          </p>
          {!clinician ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("masar:ask", {
                      detail: {
                        text: tr("Why did Masar surface “{title}”?", {
                          title: say(c.title),
                        }),
                        intent: {
                          kind: "journey",
                          code: c.id === "new_lab" ? "lab" : "why",
                        },
                      },
                    }),
                  )
                }
                className="btn btn-secondary !min-h-[40px] text-[13px]"
              >
                {tr("Ask the assistant about this")}
              </button>
              <a href="#pt-guide" className="btn btn-secondary !min-h-[40px] text-[13px]">
                {tr("Prepare for a conversation")}
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

// ---------- tracking ----------

const SLEEP_CHOICES = [
  { v: 5.5, label: "Under 6 h" },
  { v: 6.5, label: "6–7 h" },
  { v: 8, label: "7–9 h" },
  { v: 9.5, label: "Over 9 h" },
];

function Chips<T extends string | number>({ label, options, value, onChange, multi = false }: { label: string; options: { v: T; label: string }[]; value: T[]; onChange: (v: T[]) => void; multi?: boolean }) {
  const { tr } = useProto();
  return (
    <fieldset className="mt-3">
      <legend className="text-[13px] font-medium text-ink">{label}</legend>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value.includes(o.v);
          return (
            <button
              key={String(o.v)}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((x) => x !== o.v) : multi ? [...value, o.v] : [o.v])}
              className={`min-h-[36px] rounded-full border px-3 text-[12.5px] font-medium transition-colors ${on ? "border-accent bg-accent text-white" : "border-rule bg-surface text-ink-2 hover:border-rule-strong"}`}
            >
              {tr(o.label)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function QuickLog() {
  const { s, set, tr, date, journey: jv, base } = useProto();
  const [sleep, setSleep] = useState<number[]>([]);
  const [stress, setStress] = useState<string[]>([]);
  const [activity, setActivity] = useState<string[]>([]);
  const [meals, setMeals] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [saved, setSaved] = useState<string | null>(null);
  const female = base.sex === "female";
  const name = base.name.split(" ")[0];
  const at = jv.asOf;
  const entry = (type: ObsType, value: number | string, label: string, scope: Scope): Obs => ({
    id: uid("u"),
    domain: scope === "cycles" ? "cycle" : "lifestyle",
    type,
    at,
    value,
    unit: typeof value === "number" ? "h" : "",
    label,
    source: SOURCE_LABEL.user,
    provenance: "user",
    scope,
    quality: typeof value === "number" ? "estimated" : "complete",
    synthetic: true,
    ref: null,
    editable: true,
  });
  const add = (items: Obs[], what: string) => {
    if (!items.length) return;
    set((x) =>
      withAudit(
        {
          ...x,
          journey: {
            ...x.journey,
            edits: {
              ...x.journey.edits,
              entries: [...x.journey.edits.entries, ...items],
            },
          },
        },
        { role: "patient", who: name, what, allowed: true },
      ),
    );
    setSaved(
      tr("Saved {n} observations for {date}.", {
        n: items.length,
        date: date(at),
      }),
    );
    setSleep([]);
    setStress([]);
    setActivity([]);
    setMeals([]);
    setSymptoms([]);
  };
  const lifeOff = !s.consent.lifestyle;
  const cyclesOff = !s.consent.cycles;
  const allow = (k: keyof ProtoConsent, label: string) =>
    set((x) =>
      withAudit(
        { ...x, consent: { ...x.consent, [k]: true } },
        {
          role: "patient",
          who: name,
          what: "Allowed: {what}",
          vars: { what: label },
          allowed: true,
        },
      ),
    );
  const items: Obs[] = [
    ...(!lifeOff && sleep.length ? [entry("sleep_self", sleep[0], "Sleep (your estimate)", "lifestyle")] : []),
    ...(!lifeOff && stress.length ? [entry("stress", stress[0], "Stress and wellbeing", "lifestyle")] : []),
    ...(!lifeOff && activity.length ? [entry("activity_self", activity[0], "Activity", "lifestyle")] : []),
    ...(!lifeOff && meals.length ? [entry("nutrition", meals[0], "Meals", "lifestyle")] : []),
    ...(!cyclesOff ? symptoms.map((v) => entry("symptom", v, "Symptom", "cycles")) : []),
  ];
  return (
    <section className="pt-card" aria-labelledby="pt-log">
      <p className="eyebrow">{tr("Today")}</p>
      <h4 id="pt-log" className="mt-1 text-[15.5px] font-semibold text-ink">
        {tr("A quick check-in for {date}", { date: date(at) })}
      </h4>
      <p className="mt-0.5 text-[12.5px] text-ink-3">{tr("Choose only what you want to. Skipping is fine: there are no streaks and nothing missing counts against you.")}</p>
      {female ? (
        <div className="mt-3 rounded-[14px] bg-zinc-50 p-3">
          <p className="text-[13px] font-medium text-ink">{tr("This cycle")}</p>
          {cyclesOff ? (
            <button type="button" onClick={() => allow("cycles", "Cycle tracking")} className="mt-1.5 text-[13px] font-semibold text-accent underline underline-offset-4">
              {tr("Cycle tracking is off. Allow it to log your cycle")}
            </button>
          ) : (
            <>
              <p className="mt-0.5 text-[12.5px] text-ink-2">
                {(() => {
                  const last = jv.obs.filter((o) => o.type === "cycle_start").at(-1);
                  return last
                    ? tr("Day {n} since your last period started ({date}).", {
                        n: daysBetween(last.at, at) + 1,
                        date: date(last.at),
                      })
                    : tr("No period start logged yet.");
                })()}
              </p>
              <button type="button" onClick={() => add([entry("cycle_start", "medium", "Period started", "cycles")], "Logged a period start")} className="btn btn-secondary mt-2 !min-h-[40px] text-[13px]">
                {tr("My period started today")}
              </button>
            </>
          )}
        </div>
      ) : null}
      {lifeOff ? (
        <button type="button" onClick={() => allow("lifestyle", "Lifestyle check-ins")} className="mt-3 text-[13px] font-semibold text-accent underline underline-offset-4">
          {tr("Lifestyle check-ins are off. Allow them to log sleep, stress, activity and meals")}
        </button>
      ) : (
        <div className="grid gap-x-6 md:grid-cols-2">
          <Chips label={tr("Sleep last night")} options={SLEEP_CHOICES} value={sleep} onChange={setSleep} />
          <Chips
            label={tr("Stress and wellbeing")}
            options={[
              { v: "low", label: "Low" },
              { v: "some", label: "Some" },
              { v: "high", label: "High" },
            ]}
            value={stress}
            onChange={setStress}
          />
          <Chips
            label={tr("Activity")}
            options={[
              { v: "rest", label: "Rest day" },
              { v: "some_activity", label: "Some activity" },
              { v: "active", label: "Active day" },
            ]}
            value={activity}
            onChange={setActivity}
          />
          <Chips
            label={tr("Meals")}
            options={[
              { v: "regular", label: "Regular meals" },
              { v: "mixed", label: "Some skipped meals" },
              { v: "irregular", label: "Often skipped meals" },
            ]}
            value={meals}
            onChange={setMeals}
          />
        </div>
      )}
      {female && !cyclesOff ? <Chips multi label={tr("Symptoms, if any")} options={SYMPTOMS.map((v) => ({ v, label: SYMPTOM_LABEL[v] }))} value={symptoms} onChange={setSymptoms} /> : null}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" disabled={!items.length} onClick={() => add(items, "Logged a check-in")} className="btn btn-primary !min-h-[42px] text-[13.5px] disabled:opacity-50">
          {tr("Save what I chose")}
        </button>
        <button type="button" onClick={() => setSaved(tr("Skipped. Nothing was recorded."))} className="min-h-[42px] px-2 text-[13px] font-medium text-ink-2 underline-offset-4 hover:underline">
          {tr("Skip today")}
        </button>
      </div>
      <p role="status" className="mt-2 min-h-[1.25rem] text-[12.5px] text-accent">
        {saved}
      </p>
    </section>
  );
}

function MyEntries() {
  const { set, tr, date, journey: jv, base } = useProto();
  const [editing, setEditing] = useState<string | null>(null);
  const mine = jv.obs
    .filter((o) => o.editable && o.provenance === "user")
    .slice(-8)
    .reverse();
  const name = base.name.split(" ")[0];
  const choices = (o: Obs): { v: string | number; label: string }[] =>
    o.type === "stress"
      ? [
          { v: "low", label: "Low" },
          { v: "some", label: "Some" },
          { v: "high", label: "High" },
        ]
      : o.type === "sleep_self"
        ? SLEEP_CHOICES
        : o.type === "symptom"
          ? SYMPTOMS.map((v) => ({ v, label: SYMPTOM_LABEL[v] }))
          : o.type === "nutrition"
            ? [
                { v: "regular", label: "Regular meals" },
                { v: "mixed", label: "Some skipped meals" },
                { v: "irregular", label: "Often skipped meals" },
              ]
            : o.type === "cycle_start"
              ? [
                  { v: "medium", label: "Period started" },
                  { v: "heavy", label: "Period started · heavier flow" },
                ]
              : [
                  { v: "rest", label: "Rest day" },
                  { v: "some_activity", label: "Some activity" },
                  { v: "active", label: "Active day" },
                ];
  return (
    <section className="pt-card" aria-labelledby="pt-mine">
      <h4 id="pt-mine" className="text-[15px] font-semibold text-ink">
        {tr("Your recent entries")}
      </h4>
      <p className="mt-0.5 text-[12.5px] text-ink-3">{tr("You can correct or remove anything you logged. Masar recalculates straight away.")}</p>
      {mine.length ? (
        <ul className="mt-3 divide-y divide-rule">
          {mine.map((o) => (
            <li key={o.id} className="py-2">
              <div className="flex items-center gap-2 text-[13px]">
                <span className="w-24 shrink-0 text-ink-3">{date(o.at)}</span>
                <span className="min-w-0 flex-1 text-ink">
                  {tr(o.label)}: <span className="font-medium">{valueText(o, tr)}</span>
                </span>
                <button type="button" onClick={() => setEditing(editing === o.id ? null : o.id)} className="min-h-[32px] rounded-full px-2 text-[12.5px] font-semibold text-accent hover:bg-accent-soft" aria-expanded={editing === o.id}>
                  {tr("Edit")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    set((x) =>
                      withAudit(
                        {
                          ...x,
                          journey: {
                            ...x.journey,
                            edits: {
                              ...x.journey.edits,
                              hidden: [...x.journey.edits.hidden, o.id],
                              entries: x.journey.edits.entries.filter((e) => e.id !== o.id),
                            },
                          },
                        },
                        {
                          role: "patient",
                          who: name,
                          what: "Removed one of their own observations",
                          allowed: true,
                        },
                      ),
                    )
                  }
                  className="min-h-[32px] rounded-full px-2 text-[12.5px] font-semibold text-ink-2 hover:bg-zinc-100"
                >
                  {tr("Remove")}
                </button>
              </div>
              {editing === o.id ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {choices(o).map((c) => (
                    <button
                      key={String(c.v)}
                      type="button"
                      aria-pressed={o.value === c.v}
                      onClick={() => {
                        set((x) => {
                          const isEntry = x.journey.edits.entries.some((e) => e.id === o.id);
                          const edits = isEntry
                            ? {
                                ...x.journey.edits,
                                entries: x.journey.edits.entries.map((e) => (e.id === o.id ? { ...e, value: c.v } : e)),
                              }
                            : {
                                ...x.journey.edits,
                                edits: {
                                  ...x.journey.edits.edits,
                                  [o.id]: c.v,
                                },
                              };
                          return withAudit(
                            { ...x, journey: { ...x.journey, edits } },
                            {
                              role: "patient",
                              who: name,
                              what: "Corrected one of their own observations",
                              allowed: true,
                            },
                          );
                        });
                        setEditing(null);
                      }}
                      className={`min-h-[32px] rounded-full border px-2.5 text-[12px] ${o.value === c.v ? "border-accent bg-accent text-white" : "border-rule text-ink-2"}`}
                    >
                      {tr(c.label)}
                    </button>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] text-ink-3">{tr("Nothing logged yet.")}</p>
      )}
    </section>
  );
}

export { SCOPE_CONSENT };

// ---------- the scene beside each lane, and its facts in words ----------

/**
 * The first scene for a man: the same couple on the same path, so every account's
 * journey has the same four parts. Masar doesn't track cycles for men, so this
 * card points to where the rest of their record appears instead of showing an empty lane.
 */
function MaleReproductiveCard({ letter }: { letter: string }) {
  const { tr, journey: jv } = useProto();
  const label = tr(LANE_TITLE.cycle);
  const go = (id: string) => document.getElementById(`pt-lane-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const where = (["lifestyle", "clinical", "device"] as const).map((id) => ({ id, lane: jv.lanes.find((l) => l.id === id) }));
  const what: Record<(typeof where)[number]["id"], string> = {
    lifestyle: "Sleep, stress, activity and meals you check in",
    clinical: "Lab results and clinic records, as recorded",
    device: "Sleep, steps and resting heart rate",
  };
  return (
    <article className="pt-card overflow-hidden !p-0" aria-label={label}>
      <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="relative aspect-[16/8] lg:aspect-auto lg:min-h-[300px]">
          <CoupleScene fill allowed cycles={[]} label={label} />
          <span aria-hidden className="absolute start-4 top-4 flex items-center gap-2 rounded-full bg-surface/90 py-1 pe-3 ps-1 text-[12px] font-semibold text-ink shadow-sm backdrop-blur">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-ink font-display text-[0.95rem] text-paper">{letter}</span>
            {label}
          </span>
        </div>
        <div className="flex min-w-0 flex-col p-5 lg:ps-6">
          <h4 className="display text-[1.45rem] leading-tight text-ink">{label}</h4>
          <p className="mt-1 text-[12.5px] text-ink-3">{tr("Masar doesn't track cycles for men. Your reproductive health is read from the three parts of your journey that follow.")}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Pill tone="stone">{tr("No cycle tracking")}</Pill>
          </div>
          <ul className="mt-3 grid gap-2">
            {where.map(({ id, lane }) => (
              <li key={id}>
                <button type="button" onClick={() => go(id)} className="flex w-full min-h-[48px] items-center justify-between gap-3 rounded-[14px] bg-zinc-50 px-3 py-2.5 text-start hover:bg-zinc-100">
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-semibold text-ink">{tr(LANE_TITLE[id])}</span>
                    <span className="block text-[12px] text-ink-3">{tr(what[id])}</span>
                  </span>
                  <span className="shrink-0 text-[12px] font-medium text-ink-2">{lane?.allowed ? tr("{n} observations", { n: lane.count }) : tr("Not shared")}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

function LaneScene({ lane }: { lane: Lane }) {
  const { tr, journey: jv } = useProto();
  const label = tr(LANE_TITLE[lane.id]);
  if (lane.id === "cycle") return <CoupleScene fill allowed={lane.allowed} cycles={lane.allowed ? jv.cycles.map((c) => c.days) : []} label={label} />;
  if (lane.id === "lifestyle") return <CyclistScene fill label={label} />;
  if (lane.id === "clinical") return <ConsultScene fill label={label} />;
  return <TreadmillScene fill connected={lane.allowed && lane.count > 0} label={label} />;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const one = (n: number | null, d = 1) => (n === null ? null : Number.isInteger(n) || d === 0 ? Math.round(n).toLocaleString("en") : n.toFixed(d));

/** What each scene stands for, read straight from the authorised observations in the chosen range. */
function Facts({ lane, from, obs }: { lane: Lane["id"]; from: string; obs: Obs[] }) {
  const { tr, journey: jv } = useProto();
  const inRange = obs.filter((o) => o.at >= from);
  const week = obs.filter((o) => o.at > addDays(jv.asOf, -7));
  const rows: { k: string; v: string | null }[] = [];
  if (lane === "cycle") {
    const c = jv.cycles.filter((x) => x.to >= from);
    rows.push({ k: tr("Cycles in this range"), v: String(c.length) });
    rows.push({ k: tr("Latest cycle"), v: jv.cycles.length ? tr("{n} days", { n: jv.cycles.at(-1)!.days }) : null });
    rows.push({ k: tr("Symptoms logged"), v: String(inRange.filter((o) => o.type === "symptom").length) });
  } else if (lane === "lifestyle") {
    const st = inRange.filter((o) => o.type === "stress");
    const meals = inRange.filter((o) => o.type === "nutrition");
    rows.push({
      k: tr("Sleep (your estimate)"),
      v: one(avg(inRange.filter((o) => o.type === "sleep_self").map((o) => Number(o.value)))) ? tr("{h} h on average", { h: one(avg(inRange.filter((o) => o.type === "sleep_self").map((o) => Number(o.value))))! }) : null,
    });
    rows.push({ k: tr("High-stress check-ins"), v: st.length ? tr("{hi} of {n}", { hi: st.filter((o) => o.value === "high").length, n: st.length }) : null });
    rows.push({ k: tr("Regular meals"), v: meals.length ? tr("{hi} of {n}", { hi: meals.filter((o) => o.value === "regular").length, n: meals.length }) : null });
  } else if (lane === "clinical") {
    rows.push({ k: tr("Lab results"), v: String(obs.filter((o) => o.type === "lab").length) });
    rows.push({ k: tr("Clinician-confirmed"), v: String(obs.filter((o) => o.provenance === "clinician").length) });
    rows.push({ k: tr("Diagnoses on record"), v: String(obs.filter((o) => o.type === "condition").length) });
  } else {
    const steps = avg(week.filter((o) => o.type === "steps").map((o) => Number(o.value)));
    const hr = obs.filter((o) => o.type === "resting_hr").at(-1);
    const sl = avg(week.filter((o) => o.type === "sleep").map((o) => Number(o.value)));
    rows.push({ k: tr("Steps a day, last 7 days"), v: one(steps, 0) });
    rows.push({ k: tr("Resting heart rate, latest"), v: hr ? `${hr.value} bpm` : null });
    rows.push({ k: tr("Sleep, last 7 nights"), v: sl === null ? null : tr("{h} h on average", { h: one(sl)! }) });
  }
  return (
    <dl className="mt-3 grid grid-cols-3 gap-2">
      {rows.map((r) => (
        <div key={r.k} className="rounded-[14px] bg-zinc-50 px-3 py-2.5">
          <dt className="text-[11.5px] leading-tight text-ink-3">{r.k}</dt>
          <dd className={`tabular mt-1 font-display text-[1.15rem] leading-none ${r.v === null ? "text-ink-3" : "text-ink"}`}>{r.v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

// ---------- the shared timeline: what was recorded, month by month ----------

/** One row per part of the journey, one cell per month: how much was recorded, and where it's empty or not shared. */
function CoverageRibbon({ lanes }: { lanes: Lane[] }) {
  const { s, tr, date, journey: jv } = useProto();
  const months: string[] = [];
  for (let m = jv.start.slice(0, 7); m <= jv.asOf.slice(0, 7);) {
    months.push(m);
    const [y, mo] = m.split("-").map(Number);
    m = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
  }
  const count = (l: Lane, m: string) => jv.obs.filter((o) => l.scope.includes(o.scope) && o.at.startsWith(m)).length;
  const go = (id: string) => document.getElementById(`pt-lane-${id}`)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  return (
    <section className="pt-card !p-4 md:!p-5" aria-labelledby="pt-ribbon">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="pt-ribbon" className="text-[15px] font-semibold text-ink">
          {tr("Your year at a glance")}
        </h3>
        <p className="text-[12.5px] text-ink-3">{tr("Darker means more was recorded that month. Empty months are simply empty: nothing is filled in.")}</p>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[520px] border-separate border-spacing-[3px] text-[12px]">
          <caption className="sr-only">{tr("Your year at a glance")}</caption>
          <thead>
            <tr>
              <th className="w-40" />
              {months.map((m) => (
                <th key={m} scope="col" className="font-normal text-ink-3">
                  {formatDateIn(s.lang, `${m}-15`, { month: "short" })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lanes.map((l, i) => (
              <tr key={l.id}>
                <th scope="row" className="text-start font-medium">
                  <button type="button" onClick={() => go(l.id)} className="flex min-h-[32px] items-center gap-2 rounded-full pe-2 text-ink hover:text-accent">
                    <span aria-hidden className={`grid h-6 w-6 place-items-center rounded-full font-display text-[0.8rem] ${l.allowed ? "bg-ink text-paper" : "border border-dashed border-unknown text-ink-3"}`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {tr(LANE_TITLE[l.id])}
                  </button>
                </th>
                {months.map((m) => {
                  const n = l.allowed ? count(l, m) : -1;
                  const level = n <= 0 ? 0 : n < 4 ? 1 : n < 15 ? 2 : 3;
                  return (
                    <td key={m} className="p-0">
                      <span
                        role="img"
                        aria-label={n < 0 ? tr("{lane}, {month}: not shared", { lane: tr(LANE_TITLE[l.id]), month: date(`${m}-15`) }) : tr("{lane}, {month}: {n} observations", { lane: tr(LANE_TITLE[l.id]), month: date(`${m}-15`), n })}
                        className={`block h-6 rounded-[6px] ${n < 0 ? "pt-hatch" : ["border border-rule bg-surface", "bg-accent/25", "bg-accent/55", "bg-accent"][level]}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
