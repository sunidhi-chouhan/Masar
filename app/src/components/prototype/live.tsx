"use client";

import { useContext, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Resident, SourceId } from "@/lib/model";
import { dirOf } from "@/lib/i18n";
import { journeyFor, protoView, type ProtoConsent } from "@/lib/prototype";
import { STAGES, type StageId } from "@/lib/longitudinal";
import { setAssistantConsent, setSharing, setSource } from "@/server/actions";
import { confirmTimelineLab, saveExperience, setTrackingConsent } from "@/server/experience-actions";
import { ProtoCtx, makeTr, type Ctx, type LiveHooks } from "./core";
import { PatientDashboard } from "./dashboard";
import { ClinicianTrajectory } from "./clinician-trajectory";
import { setStage } from "./trajectory";
import type { ProtoState } from "./state";

// The latest resident experience on a signed-in demo account. The dashboard,
// trajectory, assistant and guide are exactly the components /prototype uses;
// this provider supplies the account's own stored data instead of the
// prototype's browser state, and sends every change back to the server:
// permissions through the existing consent actions (so the access history
// reads as before), everything longitudinal through saveExperience.

type Extras = Parameters<typeof protoView>[5];

interface Props {
  resident: Resident;
  initial: ProtoState;
  extras: Extras;
  aiMode: "live" | "mock" | "off";
  /** changes when the server's copy changes (permissions, request, language), so the screen starts again from it */
  stamp: string;
}

const SOURCE_OF: Partial<Record<keyof ProtoConsent, SourceId>> = { answers: "self", clinical: "malaffi", labs: "lab", device: "device", healthAge: "healthAge" };

function useLiveCtx({ resident, initial, extras, aiMode }: Props, live: LiveHooks, onChange: (prev: ProtoState, next: ProtoState) => void) {
  const [s, set] = useState(initial);
  // Changes are sent once each, after they render (never from inside a state updater, which may run twice).
  const prevRef = useRef(s);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = s;
    if (prev !== s) onChangeRef.current(prev, s);
  }, [s]);
  const journey = useMemo(() => journeyFor(resident, s.sim, s.consent, s.journey), [resident, s.sim, s.consent, s.journey]);
  const view = useMemo(() => protoView(resident, s.sim, s.consent, s.answers, s.knowledge, { ...extras, journey }), [resident, s.sim, s.consent, s.answers, s.knowledge, extras, journey]);
  const fns = useMemo(() => makeTr(s.lang), [s.lang]);
  const ctx: Ctx = { s, set, ...fns, profiles: [{ id: resident.id, resident, story: "labs" }], base: resident, view, journey, inbox: [], aiMode, accessKey: null, live };
  return ctx;
}

/** The resident's own dashboard on /me. A new server copy (permissions, request, language) starts it afresh. */
export function LiveResident(props: Props & { slots: LiveHooks["slots"] }) {
  return <LiveResidentInner key={props.stamp} {...props} />;
}

function LiveResidentInner(props: Props & { slots: LiveHooks["slots"] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<{ journey?: unknown; guide?: unknown; chat?: unknown }>({});
  const flush = async () => {
    const patch = pending.current;
    pending.current = {};
    if (Object.keys(patch).length) await saveExperience(patch);
  };
  useEffect(
    () => () => {
      void flush();
    },
    [],
  );
  const onChange = (prev: ProtoState, next: ProtoState) => {
    // Permissions: through the existing actions, then refresh the server-rendered parts that depend on them.
    const changed = (Object.keys(next.consent) as (keyof ProtoConsent)[]).filter((k) => prev.consent[k] !== next.consent[k]);
    if (changed.length) {
      startTransition(async () => {
        for (const k of changed) {
          const on = next.consent[k];
          const src = SOURCE_OF[k];
          if (src) await setSource(src, on);
          else if (k === "ai") await setAssistantConsent(on);
          else if (k === "shareClinician") await setSharing(on);
          else if (k === "cycles" || k === "lifestyle") await setTrackingConsent(k, on);
        }
        // Save any tracking first, so the refreshed copy already includes it.
        if (prev.journey !== next.journey) pending.current.journey = next.journey;
        if (prev.guide !== next.guide) pending.current.guide = next.guide;
        await flush();
        router.refresh();
      });
    }
    if (prev.journey !== next.journey) pending.current.journey = next.journey;
    if (prev.guide !== next.guide) pending.current.guide = next.guide;
    if (prev.chat !== next.chat) pending.current.chat = next.chat;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 500);
  };
  const ctx = useLiveCtx(props, { api: "/api/me/trajectory", slots: props.slots }, onChange);
  return (
    <ProtoCtx.Provider value={ctx}>
      <div className="pt-root" dir={dirOf(ctx.s.lang)} lang={ctx.s.lang}>
        <PatientDashboard />
        <LiveDemoPanel />
      </div>
    </ProtoCtx.Provider>
  );
}

/** Dr Layla's read-only view of the timeline a signed-in resident chose to share. */
export function LiveClinicianTimeline(props: Props & { personId: string }) {
  return <LiveClinicianInner key={props.stamp} {...props} />;
}

function LiveClinicianInner(props: Props & { personId: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const onChange = (prev: ProtoState, next: ProtoState) => {
    // The only change a clinician can make here: confirming a lab result against the original report.
    const added = next.journey.edits.confirmed.filter((id) => !prev.journey.edits.confirmed.includes(id));
    if (added.length)
      startTransition(async () => {
        for (const id of added) await confirmTimelineLab(props.personId, id);
        router.refresh();
      });
  };
  const ctx = useLiveCtx(props, { api: "", slots: {} }, onChange);
  // Clinician screens record each opening on the server; the shared component's own log entry stays local.
  return (
    <ProtoCtx.Provider value={{ ...ctx, s: { ...ctx.s, role: "clinician" } }}>
      <div className="pt-root">
        <ClinicianTrajectory />
      </div>
    </ProtoCtx.Provider>
  );
}

/** The presentation controls that make sense on a real account: the demo clock and two simulated events. */
function LiveDemoPanel() {
  const ctx = useContext(ProtoCtx);
  const [open, setOpen] = useState(false);
  if (!ctx) return null;
  const { s, set, tr } = ctx;
  return (
    <div className="fixed bottom-4 start-4 z-[70]">
      {open ? (
        <div role="dialog" aria-label={tr("Demo Controls")} className="pt-pop mb-2 w-[min(320px,calc(100vw-2rem))] rounded-[20px] bg-[#16231f] p-4 text-white shadow-[0_30px_80px_-20px_rgb(0_0_0/0.6)]">
          <p className="text-[14px] font-semibold">{tr("Demo Controls")}</p>
          <p className="mt-0.5 text-[11.5px] text-white/60">{tr("For presenting this synthetic account. Changes are saved to this account only.")}</p>
          <label className="mt-3 block text-[12px] text-white/70">
            {tr("Point in the synthetic year")}
            <select value={s.journey.stage} onChange={(e) => set(setStage(Number(e.target.value) as StageId))} className="mt-1 block min-h-[36px] w-full rounded-[10px] border border-white/15 bg-[#0f1a17] px-2 text-[13px] text-white">
              {STAGES.map((st) => (
                <option key={st.id} value={st.id}>
                  {tr(st.label)}
                </option>
              ))}
            </select>
          </label>
          {(
            [
              ["extraObs", "Simulate a new observation"],
              ["wearableGap", "Simulate missing wearable data"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="mt-2 flex min-h-[34px] cursor-pointer items-center justify-between gap-3 text-[13px]">
              {tr(label)}
              <input type="checkbox" role="switch" checked={s.journey[k]} onChange={(e) => set((x) => ({ ...x, journey: { ...x.journey, [k]: e.target.checked } }))} className="h-4 w-4 accent-[var(--color-date)]" />
            </label>
          ))}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("masar:ask", { detail: { text: tr("What has changed over the last six months?"), intent: { kind: "journey", code: "changes" } } }))} className="min-h-[34px] rounded-[10px] border border-white/15 px-2 text-[12.5px] hover:bg-white/5">
              {tr("Show AI interpretation")}
            </button>
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("masar:guide"))} className="min-h-[34px] rounded-[10px] border border-white/15 px-2 text-[12.5px] hover:bg-white/5">
              {tr("Generate preparation guide")}
            </button>
          </div>
        </div>
      ) : null}
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex min-h-[48px] items-center gap-2 rounded-full bg-ink px-4 text-[13.5px] font-semibold text-paper shadow-[0_18px_40px_-14px_rgb(0_0_0/0.55)]">
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-date" />
        {tr("Demo Controls")}
      </button>
    </div>
  );
}
