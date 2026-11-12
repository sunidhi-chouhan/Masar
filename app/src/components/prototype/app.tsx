"use client";

import { Suspense, use, useEffect, useMemo, useState } from "react";
import { browser } from "react-dom";
import type { Resident } from "@/lib/model";
import type { Report } from "@/lib/evidence";
import { dirOf } from "@/lib/i18n";
import { protoView } from "@/lib/prototype";
import { STORAGE_KEY, initialState, type ProtoState } from "./state";
import { Mark, ProtoCtx, makeTr, useProto, type Ctx, type ProfileInfo } from "./core";
import { DemoControls } from "./controls";
import { PatientApp } from "./patient";
import { ClinicianApp } from "./clinician";
import { SystemApp } from "./system";

// The Masar prototype: patient, clinician and health system in one connected
// application, driven by one shared state and the Demo Controls.

export function PrototypeApp(props: { profiles: ProfileInfo[]; inbox: Resident[]; report: Report; aiMode: "live" | "mock" | "off"; accessKey: string | null }) {
  return (
    <Suspense
      fallback={
        <div className="pt-splash grid min-h-svh place-items-center bg-paper">
          <Mark className="h-12 w-12" />
        </div>
      }
    >
      <Inner {...props} />
    </Suspense>
  );
}

function load(): ProtoState | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as ProtoState;
    return s?.v === 3 ? s : null;
  } catch {
    return null;
  }
}

function Inner(props: { profiles: ProfileInfo[]; inbox: Resident[]; report: Report; aiMode: "live" | "mock" | "off"; accessKey: string | null }) {
  use(browser("The prototype's state lives in this tab's session storage."));
  const [s, setS] = useState<ProtoState>(() => {
    const saved = load();
    return saved && props.profiles.some((p) => p.id === saved.profileId) ? saved : initialState(props.profiles[0].id, props.inbox);
  });
  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      // storage unavailable: the demo still works for this visit
    }
  }, [s]);

  const base = (props.profiles.find((p) => p.id === s.profileId) ?? props.profiles[0]).resident;
  const view = useMemo(
    () => protoView(base, s.sim, s.consent, s.answers, s.knowledge, { request: s.request ? { at: s.request.at, status: s.request.status } : null }),
    [base, s.sim, s.consent, s.answers, s.knowledge, s.request],
  );
  const fns = useMemo(() => makeTr(s.lang), [s.lang]);
  const ctx: Ctx = { s, set: setS, ...fns, profiles: props.profiles, base, view, inbox: props.inbox, report: props.report, aiMode: props.aiMode, accessKey: props.accessKey };

  return (
    <ProtoCtx.Provider value={ctx}>
      <div className="pt-root min-h-svh" dir={dirOf(s.lang)} lang={s.lang}>
        <a href="#pt-main" className="skip-link">
          {fns.tr("Skip to content")}
        </a>
        <div key={s.role} className="pt-role">
          {s.role === "patient" ? <PatientApp /> : s.role === "clinician" ? <ClinicianApp /> : <SystemApp />}
        </div>
        <Toast />
        <DemoControls />
      </div>
    </ProtoCtx.Provider>
  );
}

/** The newest unread notification for the current role, for a few seconds. */
function Toast() {
  const { s, tr } = useProto();
  const n = s.notices.find((x) => x.to === s.role && !x.read);
  const [hidden, setHidden] = useState<string | null>(null);
  useEffect(() => {
    if (!n) return;
    const id = n.id;
    const timer = setTimeout(() => setHidden(id), 6000);
    return () => clearTimeout(timer);
  }, [n]);
  if (!n || hidden === n.id) return null;
  return (
    <div role="status" className="pt-toast fixed end-4 top-20 z-[60] max-w-sm rounded-[16px] border border-rule bg-surface p-4 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.35)]">
      <p className={`text-[12px] font-semibold ${n.tone === "warning" ? "text-soon" : n.tone === "success" ? "text-accent" : "text-ink-2"}`}>{tr("New notification")}</p>
      <p className="mt-1 text-[14px] text-ink">{tr(n.text, n.vars)}</p>
    </div>
  );
}
