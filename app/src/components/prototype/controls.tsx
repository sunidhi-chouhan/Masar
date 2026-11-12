"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { answersFromRecords } from "@/lib/profile";
import { fromRuleAnswers, deterministicSummary } from "@/lib/journey";
import { beliefItems } from "@/lib/checks";
import { ALL_CONSENT, NO_CONSENT, protoSummaryInput, protoView, type ProtoConsent } from "@/lib/prototype";
import { RULES } from "@/lib/signals";
import { initialState, uid, withAudit, withNotice, type ProtoState, type Role } from "./state";
import { useProto } from "./core";

// Demo Controls: a floating panel that changes the prototype's real state.
// Every control here changes what the screens show; nothing is cosmetic.

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-white/10 py-3.5 first:border-t-0 first:pt-0">
      <h3 className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-white/55">{title}</h3>
      {children}
    </section>
  );
}

function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-1 rounded-[12px] bg-white/[0.06] p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={`min-h-[34px] rounded-[9px] px-2 text-[12.5px] font-medium transition-colors ${value === o.id ? "bg-white text-ink" : "text-white/80 hover:bg-white/10"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex min-h-[34px] cursor-pointer items-center justify-between gap-3 text-[13px] text-white/90">
      {label}
      <input type="checkbox" role="switch" checked={on} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span aria-hidden className={`relative h-5 w-9 shrink-0 rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white ${on ? "bg-date" : "bg-white/20"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-[inset-inline-start] ${on ? "start-[18px]" : "start-0.5"}`} />
      </span>
    </label>
  );
}

function Btn({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="min-h-[34px] rounded-[10px] border border-white/15 px-3 text-start text-[12.5px] font-medium text-white/90 transition-colors hover:border-white/40 hover:bg-white/5">
      {children}
    </button>
  );
}

export function DemoControls() {
  const { s, set, tr, profiles, base, inbox, aiMode, view } = useProto();
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!s.controlsOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && set((x) => ({ ...x, controlsOpen: false }));
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [s.controlsOpen, set]);

  const go = (fn: (x: ProtoState) => ProtoState) => set(fn);
  const consentKeys: { k: keyof ProtoConsent; label: string }[] = [
    { k: "answers", label: tr("Questionnaire answers") },
    { k: "clinical", label: tr("Clinical records") },
    { k: "labs", label: tr("Lab results") },
    { k: "device", label: tr("Phone and wearable") },
    { k: "healthAge", label: tr("Health Age check") },
    { k: "ai", label: tr("AI processing (Gemini)") },
    { k: "shareClinician", label: tr("Share with Dr Layla") },
  ];
  const name = base.name.split(" ")[0];
  const sample = () =>
    go((x) => {
      const a = fromRuleAnswers(base.sex, answersFromRecords(base));
      return { ...x, answers: { ...a, concern: "overall", prepareQuestions: "yes" }, knowledge: [...beliefItems(base.sex).map((b) => (b.correct === "true" ? "true" : "unsure")), "unsure"] };
    });
  const toDashboard = () =>
    go((x) => {
      const tr2 = (t2: string) => t2;
      const v = protoView(base, x.sim, x.consent, x.answers, x.knowledge);
      const sum = deterministicSummary(protoSummaryInput(v, x.consent, x.answers, [], tr2), tr2);
      return withAudit(
        { ...x, auth: { status: "in", method: x.auth.method ?? "uaepass" }, account: { ...x.account, created: true }, role: "patient", stage: "dashboard", analysedAt: new Date().toISOString(), summary: x.summary ?? { source: "masar", data: sum, at: new Date().toISOString() } },
        { role: "system", who: "Demo Controls", what: "Opened the patient dashboard", allowed: true },
      );
    });

  return (
    <>
      <button
        type="button"
        onClick={() => set((x) => ({ ...x, controlsOpen: !x.controlsOpen }))}
        aria-expanded={s.controlsOpen}
        aria-controls="pt-controls"
        className="pt-controls-fab fixed bottom-4 start-4 z-[70] flex min-h-[48px] items-center gap-2.5 rounded-full bg-ink px-4 text-[13.5px] font-semibold text-paper shadow-[0_18px_40px_-14px_rgb(0_0_0/0.55)]"
      >
        <span aria-hidden className="grid h-6 w-6 place-items-center rounded-full bg-date text-ink">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
            <circle cx="16" cy="7" r="2" />
            <circle cx="10" cy="17" r="2" />
          </svg>
        </span>
        {tr("Demo Controls")}
      </button>

      {s.controlsOpen ? (
        <div
          ref={panel}
          id="pt-controls"
          role="dialog"
          aria-label={tr("Demo Controls")}
          className="pt-controls fixed bottom-20 start-4 z-[70] flex max-h-[min(78svh,760px)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[22px] bg-[#16231f] text-white shadow-[0_30px_80px_-20px_rgb(0_0_0/0.6)]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-[14.5px] font-semibold">{tr("Demo Controls")}</p>
              <p className="text-[11.5px] text-white/60">{tr("Every control changes the prototype's real state. Synthetic data only.")}</p>
            </div>
            <button type="button" onClick={() => set((x) => ({ ...x, controlsOpen: false }))} aria-label={tr("Close")} className="grid h-8 w-8 place-items-center rounded-full text-white/70 hover:bg-white/10">
              ✕
            </button>
          </header>
          <div className="overflow-y-auto px-4 py-3.5">
            <Section title={tr("Who is using Masar")}>
              <Seg<Role>
                label={tr("Role")}
                value={s.role}
                onChange={(role) => go((x) => withAudit({ ...x, role }, { role: "system", who: "Demo Controls", what: "Switched to {role}", vars: { role: role === "patient" ? "Patient" : role === "clinician" ? "Clinician" : "Health system" }, allowed: true }))}
                options={[
                  { id: "patient", label: tr("Patient: {name}", { name }) },
                  { id: "clinician", label: tr("Dr Layla") },
                  { id: "system", label: tr("Health system") },
                ]}
              />
              <label className="mt-2 block text-[12px] text-white/60">
                {tr("Synthetic patient profile")}
                <select
                  value={s.profileId}
                  onChange={(e) => {
                    const id = e.target.value;
                    go((x) => ({ ...initialState(id, inbox, x.lang), role: x.role, geminiOn: x.geminiOn, controlsOpen: true }));
                  }}
                  className="mt-1 block min-h-[36px] w-full rounded-[10px] border border-white/15 bg-[#0f1a17] px-2 text-[13px] text-white"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.resident.name} ·{" "}
                      {tr({ labs: "Lab results over time", lifestyle: "Lifestyle factors", limited: "Very little on record", history: "Relevant medical history" }[p.story])}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-2">
                <Seg label={tr("Language")} value={s.lang} onChange={(lang) => go((x) => ({ ...x, lang }))} options={[{ id: "en", label: "English" }, { id: "ar", label: "العربية" }]} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Btn onClick={() => go((x) => ({ ...initialState(x.profileId, inbox, x.lang), controlsOpen: true }))}>{tr("Reset the demo")}</Btn>
                <Btn onClick={toDashboard}>{tr("Jump to dashboard")}</Btn>
              </div>
            </Section>

            <Section title={tr("UAE PASS (simulated)")}>
              <Seg
                label={tr("Next sign-in result")}
                value={s.uaePassOutcome}
                onChange={(uaePassOutcome) => go((x) => ({ ...x, uaePassOutcome }))}
                options={[
                  { id: "success", label: tr("Succeeds") },
                  { id: "fail", label: tr("Fails") },
                  { id: "cancel", label: tr("Cancelled") },
                ]}
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Btn
                  onClick={() =>
                    go((x) =>
                      withAudit(
                        { ...x, role: "patient", auth: { status: "in", method: "uaepass" }, account: { ...x.account, created: true }, stage: x.stage === "landing" || x.stage === "uaepass" || x.stage === "create" ? "consent" : x.stage },
                        { role: "patient", who: name, what: "Signed in with UAE PASS (simulated)", allowed: true },
                      ),
                    )
                  }
                >
                  {tr("Sign in now")}
                </Btn>
                <Btn onClick={() => go((x) => ({ ...x, role: "patient", auth: { status: "out", method: null }, stage: "landing" }))}>{tr("Sign out")}</Btn>
              </div>
            </Section>

            <Section title={tr("Consent")}>
              <div className="mb-2 grid grid-cols-2 gap-2">
                <Btn onClick={() => go((x) => withAudit({ ...x, consent: { ...ALL_CONSENT } }, { role: "patient", who: name, what: "Granted every permission", allowed: true }))}>{tr("Grant all")}</Btn>
                <Btn onClick={() => go((x) => withAudit({ ...x, consent: { ...NO_CONSENT } }, { role: "patient", who: name, what: "Declined every permission", allowed: true }))}>{tr("Decline all")}</Btn>
              </div>
              {consentKeys.map(({ k, label }) => (
                <Toggle
                  key={k}
                  label={label}
                  on={s.consent[k]}
                  onChange={(on) =>
                    go((x) => withAudit({ ...x, consent: { ...x.consent, [k]: on } }, { role: "patient", who: name, what: on ? "Allowed: {what}" : "Withdrew: {what}", vars: { what: label }, allowed: true }))
                  }
                />
              ))}
            </Section>

            <Section title={tr("Gemini adapter")}>
              <Toggle on={s.geminiOn} onChange={(geminiOn) => go((x) => ({ ...x, geminiOn }))} label={tr("Gemini available")} />
              <p className="mt-1 text-[11.5px] text-white/55">
                {aiMode === "live" ? tr("Server: live Gemini key configured.") : aiMode === "mock" ? tr("Server: labelled demo mock, no live model call.") : tr("Server: no Gemini key, so Masar's own versions are used.")}
              </p>
            </Section>

            <Section title={tr("Clinical systems (simulated)")}>
              <Seg
                label={tr("Clinical records")}
                value={s.sim.clinical}
                onChange={(clinical) => go((x) => ({ ...x, sim: { ...x.sim, clinical } }))}
                options={[
                  { id: "available", label: tr("Records available") },
                  { id: "missing", label: tr("Records missing") },
                ]}
              />
              <div className="mt-2">
                <Seg
                  label={tr("Lab results")}
                  value={s.sim.labs}
                  onChange={(labs) => go((x) => ({ ...x, sim: { ...x.sim, labs } }))}
                  options={[
                    { id: "available", label: tr("Labs available") },
                    { id: "missing", label: tr("Labs missing") },
                  ]}
                />
              </div>
              <div className="mt-2">
                <Toggle
                  on={s.sim.extraLab}
                  label={tr("A new lab result arrives")}
                  onChange={(extraLab) =>
                    go((x) => {
                      const y = { ...x, sim: { ...x.sim, extraLab } };
                      return extraLab
                        ? withAudit(withNotice(y, { to: "patient", tone: "info", text: "A new lab result arrived from your lab (simulated)." }), { role: "system", who: "Lab system (simulated)", what: "Sent a new result", allowed: true })
                        : y;
                    })
                  }
                />
              </div>
            </Section>

            <Section title={tr("Journey")}>
              <div className="grid grid-cols-2 gap-2">
                <Btn onClick={sample}>{tr("Fill sample answers")}</Btn>
                <Btn onClick={() => go((x) => ({ ...x, role: "patient", auth: { status: "in", method: x.auth.method ?? "uaepass" }, account: { ...x.account, created: true }, stage: "analysis" }))}>{tr("Run health analysis")}</Btn>
              </div>
            </Section>

            <Section title={tr("Clinician and referrals")}>
              <div className="grid grid-cols-2 gap-2">
                <Btn
                  onClick={() =>
                    go((x) =>
                      withAudit(
                        withNotice(withNotice({ ...x, accessRequested: true }, { to: "patient", tone: "info", text: "Dr Layla Al Hashimi asked to see your summary.", action: "allowAccess" }), { to: "clinician", tone: "info", text: "Access request sent to {name}.", vars: { name } }),
                        { role: "clinician", who: "Dr Layla Al Hashimi", what: "Requested access to {name}'s summary", vars: { name }, allowed: true },
                      ),
                    )
                  }
                >
                  {tr("Dr Layla requests access")}
                </Btn>
                <Btn
                  onClick={() =>
                    go((x) => {
                      const top = view.dashboard.insights[0];
                      return withAudit(
                        withNotice(
                          { ...x, referrals: [{ id: uid("r"), patientId: x.profileId, reason: top ? top.title : "Pre-pregnancy conversation", clinic: x.clinics.find((c) => c.accepting)?.name ?? x.clinics[0].name, status: "new", at: new Date().toISOString() }, ...x.referrals] },
                          { to: "system", tone: "info", text: "New referral received." },
                        ),
                        { role: "clinician", who: "Dr Layla Al Hashimi", what: "Created a referral", allowed: true },
                      );
                    })
                  }
                >
                  {tr("Create a referral")}
                </Btn>
                <Btn
                  onClick={() =>
                    go((x) => ({
                      ...x,
                      referrals: x.referrals.map((r) => ({ ...r, status: r.status === "new" ? "accepted" : r.status === "accepted" ? "booked" : r.status === "booked" ? "completed" : r.status })),
                    }))
                  }
                >
                  {tr("Advance referrals")}
                </Btn>
                <Btn
                  onClick={() =>
                    go((x) =>
                      x.request
                        ? { ...x, request: { ...x.request, status: x.request.status === "requested" ? "reviewed" : x.request.status === "reviewed" ? "booked" : "attended" } }
                        : withNotice(x, { to: "patient", tone: "warning", text: "There's no request yet: ask for a conversation from your dashboard first." }),
                    )
                  }
                >
                  {tr("Advance the patient's request")}
                </Btn>
              </div>
            </Section>

            <Section title={tr("Notifications and events")}>
              <div className="grid grid-cols-2 gap-2">
                <Btn onClick={() => go((x) => withNotice(x, { to: "patient", tone: "info", text: "Reminder: your conversation with Dr Layla is coming up. Your questions are ready in Masar." }))}>{tr("Patient reminder")}</Btn>
                <Btn onClick={() => go((x) => withAudit(withNotice(x, { to: "system", tone: "warning", text: "Ruwais Community Clinic reached referral capacity." }), { role: "system", who: "Masar", what: "Capacity alert raised", allowed: true }))}>
                  {tr("Capacity alert")}
                </Btn>
                <Btn
                  onClick={() =>
                    go((x) =>
                      withAudit(withNotice(x, { to: "system", tone: "warning", text: "Blocked: an unauthorised attempt to open a patient summary." }), {
                        role: "system",
                        who: "Unknown account",
                        what: "Tried to open a patient summary without permission",
                        allowed: false,
                      }),
                    )
                  }
                >
                  {tr("Blocked access attempt")}
                </Btn>
                <Btn onClick={() => go((x) => withNotice(x, { to: "clinician", tone: "info", text: "{n} new patients shared their summary with you.", vars: { n: 2 } }))}>{tr("New shared patients")}</Btn>
              </div>
            </Section>
            <p className="pb-1 text-[11px] leading-relaxed text-white/50">
              {tr("Findings always come from Masar's published rules: the controls change what is shared and available, never the rules.")}{" "}
              {view.dashboard.insights.length ? tr("Right now: {list}.", { list: view.dashboard.insights.map((i) => tr(RULES[i.code].title)).join(s.lang === "ar" ? "، " : ", ") }) : tr("Right now: nothing worth a conversation in what is shared.")}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
