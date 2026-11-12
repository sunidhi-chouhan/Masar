"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CHAPTERS, EXTRA_STATEMENT, visibleQuestions, type JAnswer } from "@/lib/journey";
import { beliefItems } from "@/lib/checks";
import { PERMISSION_TEXT } from "@/lib/permissions";
import { QuestionCard } from "@/components/journey/question-card";
import { uaePassSignIn, geminiFollowUps, geminiSummary } from "./adapters";
import { Brand, Pill, Simulated, useProto } from "./core";
import { withAudit, withNotice, type ProtoState, type Stage } from "./state";
import { PatientDashboard } from "./dashboard";

// The patient: sign in (simulated UAE PASS or an account), choose what to
// share, answer one question at a time, check what they know, answer two
// final questions, watch the analysis, then use their dashboard.

const ONBOARDING: { stage: Stage; label: string }[] = [
  { stage: "consent", label: "Your permissions" },
  { stage: "about", label: "About you" },
  { stage: "quick", label: "Quick check" },
  { stage: "final", label: "Final questions" },
  { stage: "analysis", label: "Analysis" },
];

export function PatientApp() {
  const { s } = useProto();
  return (
    <>
      <PatientBar />
      <main id="pt-main" tabIndex={-1} className="outline-none">
        {s.stage === "landing" ? <Landing /> : null}
        {s.stage === "uaepass" ? <UaePass /> : null}
        {s.stage === "create" ? <CreateAccount /> : null}
        {ONBOARDING.some((o) => o.stage === s.stage) ? (
          <div className="mx-auto max-w-3xl px-4 pb-28 pt-6 md:px-8">
            <Progress />
            <div key={s.stage} className="pt-enter mt-6">
              {s.stage === "consent" ? <Consent /> : null}
              {s.stage === "about" ? <About /> : null}
              {s.stage === "quick" ? <Quick /> : null}
              {s.stage === "final" ? <FinalTwo /> : null}
              {s.stage === "analysis" ? <Analysis /> : null}
            </div>
          </div>
        ) : null}
        {s.stage === "dashboard" ? <PatientDashboard /> : null}
      </main>
    </>
  );
}

export function LangToggle({ dark = false }: { dark?: boolean }) {
  const { s, set } = useProto();
  return (
    <button
      type="button"
      lang={s.lang === "ar" ? "en" : "ar"}
      onClick={() => set((x) => ({ ...x, lang: x.lang === "ar" ? "en" : "ar" }))}
      className={`min-h-[38px] rounded-full px-3 text-[13.5px] font-semibold ${dark ? "text-white hover:bg-white/10" : "text-accent hover:bg-accent-soft"}`}
    >
      {s.lang === "ar" ? "English" : "العربية"}
    </button>
  );
}

export function Bell({ dark = false }: { dark?: boolean }) {
  const { s, set, tr, date } = useProto();
  const [open, setOpen] = useState(false);
  const mine = s.notices.filter((n) => n.to === s.role);
  const unread = mine.filter((n) => !n.read).length;
  const allow = () =>
    set((x) =>
      withAudit(
        withNotice({ ...x, consent: { ...x.consent, shareClinician: true }, accessRequested: false }, { to: "clinician", tone: "success", text: "{name} allowed you to see their summary.", vars: { name: x.profileId === "arjun" ? "Arjun" : x.profileId === "maryam" ? "Maryam" : x.profileId === "noura" ? "Noura" : "Patient" } }),
        { role: "patient", who: "Patient", what: "Allowed Dr Layla to see their summary", allowed: true },
      ),
    );
  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          if (!open) set((x) => ({ ...x, notices: x.notices.map((n) => (n.to === x.role ? { ...n, read: true } : n)) }));
        }}
        aria-label={tr("Notifications ({n} unread)", { n: unread })}
        className={`relative grid h-10 w-10 place-items-center rounded-full ${dark ? "text-white hover:bg-white/10" : "text-ink hover:bg-surface"}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0" />
        </svg>
        {unread ? <span className="absolute end-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-urgent px-1 text-[10px] font-bold text-white">{unread}</span> : null}
      </button>
      {open ? (
        <div className="pt-pop absolute end-0 top-12 z-50 w-[min(340px,calc(100vw-2rem))] rounded-[18px] border border-rule bg-surface p-2 text-ink shadow-[0_24px_60px_-20px_rgb(0_0_0/0.35)]">
          <p className="px-2 py-1.5 text-[12.5px] font-semibold text-ink-3">{tr("Notifications")}</p>
          {mine.length ? (
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {mine.map((n) => (
                <li key={n.id} className="rounded-[12px] px-2.5 py-2 hover:bg-zinc-50">
                  <p className="text-[13.5px]">{tr(n.text, n.vars)}</p>
                  <p className="mt-0.5 text-[11.5px] text-ink-3">{date(n.at)}</p>
                  {n.action === "allowAccess" && !s.consent.shareClinician ? (
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={allow} className="rounded-full bg-accent px-3 py-1 text-[12.5px] font-semibold text-white">
                        {tr("Allow")}
                      </button>
                      <button type="button" onClick={() => set((x) => withAudit({ ...x, accessRequested: false }, { role: "patient", who: "Patient", what: "Declined Dr Layla's access request", allowed: true }))} className="rounded-full border border-rule-strong px-3 py-1 text-[12.5px] font-semibold">
                        {tr("Decline")}
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 pb-2 text-[13px] text-ink-3">{tr("Nothing new.")}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function PatientBar() {
  const { s, set, tr, base } = useProto();
  const signedIn = s.auth.status === "in";
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:px-8">
        <Brand sub={tr("Patient")} />
        <div className="ms-auto flex items-center gap-1.5">
          {signedIn ? <span className="hidden text-[13px] font-medium text-ink sm:inline">{base.name}</span> : null}
          <LangToggle />
          {signedIn ? <Bell /> : null}
          {signedIn ? (
            <button type="button" onClick={() => set((x) => withAudit({ ...x, auth: { status: "out", method: null }, stage: "landing" }, { role: "patient", who: "Patient", what: "Signed out", allowed: true }))} className="btn btn-secondary !min-h-[38px] !px-3.5 text-[13px]">
              {tr("Sign out")}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

// ---------- entry ----------

function Landing() {
  const { set, tr } = useProto();
  return (
    <div className="pt-landing relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-28 pt-10 md:px-8 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pt-16">
        <div className="pt-enter">
          <p className="eyebrow">{tr("Reproductive health · Abu Dhabi · Pilot")}</p>
          <h1 className="display mt-4 text-[clamp(2.4rem,5.4vw,4rem)] leading-[1.03] text-ink">
            {tr("Your reproductive health changes over time.")} <em className="text-accent">{tr("See it early. Choose calmly.")}</em>
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-2">
            {tr("Masar reads only the records you choose to share, shows what is known and what isn't, and helps you prepare for the right conversation with a doctor.")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => set((x) => ({ ...x, stage: "uaepass", auth: { status: "pending", method: "uaepass" } }))} className="btn btn-primary !min-h-[52px] !px-6 text-[15px]">
              <span aria-hidden className="grid h-6 w-6 place-items-center rounded-full bg-white/15 font-mono text-[10px]">UP</span>
              {tr("Sign in with UAE PASS")}
            </button>
            <button type="button" onClick={() => set((x) => ({ ...x, stage: "create", auth: { status: "out", method: "email" } }))} className="btn btn-secondary !min-h-[52px] !px-6 text-[15px]">
              {tr("Create an account")}
            </button>
          </div>
          <p className="mt-4 flex flex-wrap items-center gap-2 text-[12.5px] text-ink-3">
            <Simulated>{tr("Simulated")}</Simulated>
            {tr("UAE PASS is simulated in this prototype. No real identity is checked.")}
          </p>
          <ul className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
            {["Not a score", "Not a prediction", "Not a diagnosis"].map((x) => (
              <li key={x} className="rounded-[16px] border border-rule bg-surface px-4 py-3 text-[14px] font-medium text-ink">
                {tr(x)}
              </li>
            ))}
          </ul>
        </div>
        <LandingArt />
      </div>
    </div>
  );
}

function LandingArt() {
  const { tr } = useProto();
  return (
    <div className="pt-enter relative mx-auto w-full max-w-[520px]" aria-hidden>
      <div className="pt-orb absolute -inset-6 rounded-full" />
      <div className="relative grid gap-3">
        <div className="pt-float pt-card ms-auto w-[78%] !p-4">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">{tr("Your picture")}</p>
          <div className="mt-2 flex items-end gap-1.5">
            {[28, 29, 28, 30, 29, 28].map((v, i) => (
              <span key={i} className="pt-bar w-full rounded-t-[6px] bg-indigo-300" style={{ height: `${v * 2.2}px`, ["--i" as string]: i }} />
            ))}
          </div>
          <p className="mt-2 text-[12.5px] text-ink-2">{tr("Cycle length · within the usual range")}</p>
        </div>
        <div className="pt-float pt-card w-[82%] !p-4" style={{ ["--d" as string]: "1.2s" }}>
          <div className="flex items-center gap-2">
            <Pill tone="soon">{tr("Worth discussing soon")}</Pill>
          </div>
          <p className="mt-2 font-display text-[1.2rem] leading-snug text-ink">{tr("A change worth a conversation, explained with its limits.")}</p>
        </div>
        <div className="pt-float pt-card ms-auto w-[70%] !p-4" style={{ ["--d" as string]: "2.2s" }}>
          <p className="text-[12.5px] font-semibold text-ink">{tr("You decide what Masar may use")}</p>
          <div className="mt-2 space-y-1.5">
            {["Your answers", "Clinic records", "Lab results"].map((x, i) => (
              <div key={x} className="flex items-center justify-between text-[12.5px] text-ink-2">
                {tr(x)}
                <span className={`h-4 w-7 rounded-full ${i === 1 ? "bg-zinc-300" : "bg-accent"}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UaePass() {
  const { s, set, tr, base } = useProto();
  const [phase, setPhase] = useState<"waiting" | "fail" | "cancel">("waiting");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    uaePassSignIn(s.uaePassOutcome).then((r) => {
      if (!live) return;
      if (r === "success") {
        set((x) =>
          withAudit({ ...x, auth: { status: "in", method: "uaepass" }, account: { ...x.account, created: true }, stage: "consent" }, { role: "patient", who: base.name.split(" ")[0], what: "Signed in with UAE PASS (simulated)", allowed: true }),
        );
      } else {
        setPhase(r);
        set((x) => withAudit({ ...x, auth: { status: r === "fail" ? "failed" : "cancelled", method: "uaepass" } }, { role: "patient", who: "UAE PASS (simulated)", what: r === "fail" ? "Sign-in failed" : "Sign-in cancelled", allowed: false }));
      }
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);
  return (
    <div className="mx-auto grid max-w-md px-4 pb-28 pt-12">
      <div className="pt-card pt-enter text-center">
        <div className="flex justify-center">
          <Simulated>{tr("UAE PASS · simulated")}</Simulated>
        </div>
        {phase === "waiting" ? (
          <>
            <div className="pt-pulse mx-auto mt-6 grid h-24 w-24 place-items-center rounded-[28px] bg-ink text-paper" aria-hidden>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
                <path d="M10 18.5h4M9 8.5l2 2 4-4" />
              </svg>
            </div>
            <h1 className="display mt-6 text-[1.7rem] text-ink">{tr("Approve the sign-in on your phone")}</h1>
            <p className="mt-2 text-[14.5px] text-ink-2">{tr("A request was sent to the UAE PASS app for {name}. This is a simulation: nothing leaves this browser.", { name: base.name })}</p>
            <p role="status" className="mt-5 flex items-center justify-center gap-2 text-[13.5px] text-ink-3">
              <span className="jr-spinner" aria-hidden />
              {tr("Waiting for approval")}…
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mt-6 grid h-20 w-20 place-items-center rounded-full bg-urgent-soft text-[1.8rem] text-urgent" aria-hidden>
              !
            </div>
            <h1 className="display mt-5 text-[1.6rem] text-ink">{phase === "fail" ? tr("Sign-in didn't work") : tr("Sign-in was cancelled")}</h1>
            <p role="alert" className="mt-2 text-[14.5px] text-ink-2">
              {phase === "fail" ? tr("UAE PASS couldn't confirm your identity (simulated failure). Nothing was shared.") : tr("You cancelled the request in the app. Nothing was shared.")}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setPhase("waiting");
                  set((x) => ({ ...x, uaePassOutcome: "success", auth: { status: "pending", method: "uaepass" } }));
                  setAttempt((a) => a + 1);
                }}
                className="btn btn-primary"
              >
                {tr("Try again")}
              </button>
              <button type="button" onClick={() => set((x) => ({ ...x, stage: "landing", auth: { status: "out", method: null } }))} className="btn btn-secondary">
                {tr("Back")}
              </button>
            </div>
            <p className="mt-3 text-[12px] text-ink-3">{tr("Trying again uses a successful sign-in. Change this in Demo Controls.")}</p>
          </>
        )}
      </div>
    </div>
  );
}

function CreateAccount() {
  const { s, set, tr, base } = useProto();
  const [email, setEmail] = useState(s.account.email || `${base.name.split(" ")[0].toLowerCase()}@example.ae`);
  const [phone, setPhone] = useState(s.account.phone || "+971 50 000 0000");
  const [agree, setAgree] = useState(false);
  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-10">
      <form
        className="pt-card pt-enter"
        onSubmit={(e) => {
          e.preventDefault();
          if (!agree) return;
          set((x) => withAudit({ ...x, account: { created: true, email, phone }, auth: { status: "in", method: "email" }, stage: "consent" }, { role: "patient", who: base.name.split(" ")[0], what: "Created an account", allowed: true }));
        }}
      >
        <p className="eyebrow">{tr("Create your account")}</p>
        <h1 className="display mt-2 text-[1.8rem] text-ink">{tr("A private space for your reproductive health")}</h1>
        <p className="mt-1 text-[13.5px] text-ink-3">{tr("Synthetic details are pre-filled. Nothing is sent anywhere.")}</p>
        <div className="mt-5 space-y-3">
          <label className="block text-[13px] font-medium text-ink-2">
            {tr("Full name")}
            <input value={base.name} readOnly className="pt-input mt-1" />
          </label>
          <label className="block text-[13px] font-medium text-ink-2">
            {tr("Email")}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pt-input mt-1" dir="ltr" required />
          </label>
          <label className="block text-[13px] font-medium text-ink-2">
            {tr("Mobile")}
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="pt-input mt-1" dir="ltr" />
          </label>
          <label className="flex items-start gap-2.5 text-[13.5px] text-ink">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]" />
            {tr("I understand Masar explains and supports; it doesn't diagnose, predict fertility or recommend treatment.")}
          </label>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="submit" disabled={!agree} className="btn btn-primary disabled:opacity-50">
            {tr("Create my account")}
          </button>
          <button type="button" onClick={() => set((x) => ({ ...x, stage: "landing" }))} className="btn btn-secondary">
            {tr("Back")}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------- onboarding ----------

function Progress() {
  const { s, tr } = useProto();
  const at = ONBOARDING.findIndex((o) => o.stage === s.stage);
  return (
    <ol className="grid grid-cols-5 gap-1.5" aria-label={tr("Your progress")}>
      {ONBOARDING.map((o, i) => (
        <li key={o.stage} aria-current={i === at ? "step" : undefined}>
          <span className={`block h-1.5 rounded-full transition-colors duration-500 ${i < at ? "bg-accent" : i === at ? "bg-accent/55" : "bg-rule"}`} />
          <span className={`mt-1.5 hidden text-[12px] sm:block ${i === at ? "font-semibold text-ink" : i < at ? "text-accent" : "text-ink-3"}`}>{tr(o.label)}</span>
        </li>
      ))}
    </ol>
  );
}

function Nav({ back, next, nextLabel, disabled, extra }: { back?: () => void; next: () => void; nextLabel: string; disabled?: boolean; extra?: ReactNode }) {
  const { tr } = useProto();
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      {back ? (
        <button type="button" onClick={back} className="btn btn-secondary">
          {tr("Back")}
        </button>
      ) : null}
      {extra}
      <button type="button" onClick={next} disabled={disabled} className="btn btn-primary ms-auto disabled:opacity-50">
        {nextLabel}
      </button>
    </div>
  );
}

const go = (stage: Stage) => (x: ProtoState): ProtoState => ({ ...x, stage });

function Consent() {
  const { s, set, tr, aiMode } = useProto();
  const rows: { k: keyof ProtoState["consent"]; text: keyof typeof PERMISSION_TEXT; group: string }[] = [
    { k: "answers", text: "self", group: "Your information" },
    { k: "device", text: "device", group: "Your information" },
    { k: "clinical", text: "malaffi", group: "Clinical records" },
    { k: "labs", text: "lab", group: "Clinical records" },
    { k: "healthAge", text: "healthAge", group: "Clinical records" },
    { k: "ai", text: "assistant", group: "AI processing" },
    { k: "shareClinician", text: "share", group: "Sharing" },
  ];
  const groups = [...new Set(rows.map((r) => r.group))];
  return (
    <section aria-labelledby="pt-consent-title">
      <p className="eyebrow">{tr("Privacy and permissions")}</p>
      <h1 id="pt-consent-title" className="display mt-2 text-[clamp(1.9rem,4vw,2.6rem)] leading-tight text-ink">
        {tr("You decide what Masar may use.")}
      </h1>
      <p className="mt-2 text-[15px] text-ink-2">{tr("Each permission is separate and off until you switch it on. You can change any of them later.")}</p>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {groups.map((g) => (
          <div key={g} className="pt-card !p-4">
            <h2 className="text-[14.5px] font-semibold text-ink">{tr(g)}</h2>
            <ul className="mt-1 divide-y divide-rule">
              {rows
                .filter((r) => r.group === g)
                .map((r) => {
                  const c = PERMISSION_TEXT[r.text];
                  const on = s.consent[r.k];
                  return (
                    <li key={r.k} className="py-2.5">
                      <label className="flex cursor-pointer items-start gap-3">
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-medium text-ink">{tr(c.label)}</span>
                          <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-3">{tr(c.involves)}</span>
                        </span>
                        <input
                          type="checkbox"
                          role="switch"
                          checked={on}
                          onChange={(e) => set((x) => withAudit({ ...x, consent: { ...x.consent, [r.k]: e.target.checked } }, { role: "patient", who: "Patient", what: e.target.checked ? "Allowed: {what}" : "Withdrew: {what}", vars: { what: c.label }, allowed: true }))}
                          className="peer sr-only"
                        />
                        <span aria-hidden className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${on ? "bg-accent" : "bg-zinc-300"}`}>
                          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[inset-inline-start] ${on ? "start-[22px]" : "start-0.5"}`} />
                        </span>
                      </label>
                      {on ? <p className="pt-enter mt-1.5 text-[12px] text-accent">{tr(c.does)}</p> : null}
                    </li>
                  );
                })}
            </ul>
            {g === "AI processing" ? (
              <p className="mt-1 text-[11.5px] text-ink-3">
                {aiMode === "live" ? tr("Google Gemini, through Masar's adapter. Masar checks every output.") : aiMode === "mock" ? tr("Demo: Gemini runs as a labelled mock; no live model call is made.") : tr("Gemini isn't connected here, so Masar writes these itself.")}
              </p>
            ) : null}
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-[14px] bg-soon-soft px-4 py-3 text-[13px] text-ink">{tr("Never, by design: employers, insurers and marketing. No setting exists that would allow it.")}</p>
      <Nav back={() => set(go("landing"))} next={() => set(go("about"))} nextLabel={tr("Continue")} />
    </section>
  );
}

function About() {
  const { s, set, tr, base } = useProto();
  const visible = visibleQuestions(base.sex, s.answers);
  const order = visible.map((q) => q.id);
  const current = s.qpos && order.includes(s.qpos) ? s.qpos : order[0];
  const idx = order.indexOf(current);
  const q = visible[idx];
  const chapterIndex = CHAPTERS.findIndex((c) => c.id === q.chapter);
  const inChapter = visible.filter((x) => x.chapter === q.chapter);
  const n = inChapter.findIndex((x) => x.id === q.id) + 1;
  const setAnswer = (v: JAnswer | null) =>
    set((x) => {
      const answers = { ...x.answers };
      if (v === null || (Array.isArray(v) && !v.length)) delete answers[q.id];
      else answers[q.id] = v;
      const keep = new Set(visibleQuestions(base.sex, answers).map((y) => y.id));
      for (const k of Object.keys(answers)) if (!keep.has(k)) delete answers[k];
      return { ...x, answers };
    });
  const move = (i: number) => (i < 0 ? set(go("consent")) : i >= order.length ? set(go("quick")) : set((x) => ({ ...x, qpos: order[i] })));
  return (
    <section aria-label={tr("About you")}>
      {!s.consent.answers ? (
        <p className="mb-4 rounded-[14px] bg-soon-soft px-4 py-3 text-[13px] text-ink">{tr("“Your answers” is off: you can still answer, but Masar won't keep or use them. Switch it on in your permissions or Demo Controls.")}</p>
      ) : null}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="eyebrow">{tr("About you")}</p>
        <p className="font-mono text-[12px] text-ink-3">
          {String.fromCharCode(65 + chapterIndex)} · {tr(CHAPTERS[chapterIndex].title)} · {tr("{n} of {total}", { n, total: inChapter.length })}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5" aria-hidden>
        {CHAPTERS.map((c, i) => (
          <span key={c.id} className="block h-1 overflow-hidden rounded-full bg-rule">
            <span className="jr-progress block h-full rounded-full bg-accent" style={{ width: `${i < chapterIndex ? 100 : i > chapterIndex ? 0 : Math.max(8, ((n - 1) / inChapter.length) * 100)}%` }} />
          </span>
        ))}
      </div>
      <div key={q.id} className="jr-q mt-7">
        <QuestionCard
          name={`pt-${q.id}`}
          title={tr(q.text)}
          why={tr(q.why)}
          whyLabel={tr("Why we ask")}
          kind={q.multi ? "multi" : "single"}
          options={q.options.map((o) => ({ value: o.value, label: tr(o.label), exclusive: o.exclusive }))}
          value={s.answers[q.id] as string | string[] | undefined}
          onChange={setAnswer}
          foot={q.sensitive ? tr("This is a sensitive question. You can skip it, and your answer is only used as you choose.") : q.multi ? tr("Choose any that apply.") : null}
        />
      </div>
      <Nav
        back={() => move(idx - 1)}
        next={() => move(idx + 1)}
        nextLabel={idx === order.length - 1 ? tr("Continue to the quick check") : tr("Continue")}
        extra={
          <button
            type="button"
            onClick={() => {
              setAnswer(null);
              move(idx + 1);
            }}
            className="min-h-[44px] px-3 text-[14px] font-medium text-ink-2 underline-offset-4 hover:underline"
          >
            {tr("Skip")}
          </button>
        }
      />
    </section>
  );
}

function Quick() {
  const { s, set, tr, base } = useProto();
  const items = [...beliefItems(base.sex), EXTRA_STATEMENT];
  const [i, setI] = useState(() => Math.max(0, s.knowledge.findIndex((k) => !k)));
  const item = items[i] ?? items[0];
  const a = s.knowledge[i];
  return (
    <section aria-label={tr("Quick check")}>
      <p className="eyebrow">{tr("Quick check")}</p>
      <h1 className="display mt-2 text-[clamp(1.9rem,4vw,2.5rem)] leading-tight text-ink">{tr("Let's explore what you already know.")}</h1>
      <p className="mt-2 text-[15px] text-ink-2">{tr("There are no wrong answers, and nothing is scored.")}</p>
      <div className="mt-6 flex items-center gap-3">
        <span className="font-mono text-[12px] text-ink-3">{tr("Question {n} of {total}", { n: i + 1, total: items.length })}</span>
        <span className="flex flex-1 gap-1.5" aria-hidden>
          {items.map((_, k) => (
            <span key={k} className={`h-1 flex-1 rounded-full ${k < i || s.knowledge[k] ? "bg-accent" : k === i ? "bg-accent/50" : "bg-rule"}`} />
          ))}
        </span>
      </div>
      <fieldset key={i} className="jr-q mt-5" aria-labelledby="pt-kq">
        <p id="pt-kq" className="display text-[clamp(1.35rem,2.8vw,1.8rem)] leading-snug text-ink">
          {tr(item.text)}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2.5 sm:max-w-lg">
          {[
            ["true", "True"],
            ["false", "False"],
            ["unsure", "Not sure"],
          ].map(([v, l]) => (
            <label key={v}>
              <input type="radio" name={`pt-k-${i}`} checked={a === v} onChange={() => set((x) => ({ ...x, knowledge: x.knowledge.map((y, j) => (j === i ? v : y)) }))} className="sr-only" />
              <span className="kc-choice">{tr(l)}</span>
            </label>
          ))}
        </div>
        {a ? (
          <p className="jr-note mt-5 rounded-[16px] border border-rule bg-surface px-4 py-3.5 text-[14.5px] leading-relaxed text-ink-2" aria-live="polite">
            <span className="font-semibold text-ink">
              {tr("What the evidence says")}: {item.correct === "true" ? tr("True") : tr("False")}.
            </span>{" "}
            {tr(item.explain)}
          </p>
        ) : null}
      </fieldset>
      <Nav back={() => (i === 0 ? set(go("about")) : setI(i - 1))} next={() => (i === items.length - 1 ? set(go("final")) : setI(i + 1))} nextLabel={i === items.length - 1 ? tr("Continue") : tr("Next")} disabled={!a} />
    </section>
  );
}

function FinalTwo() {
  const { s, set, tr, base, accessKey } = useProto();
  const [i, setI] = useState(0);
  const loading = useRef(false);
  useEffect(() => {
    if (s.final || loading.current) return;
    loading.current = true;
    let live = true;
    geminiFollowUps(s, base, accessKey).then((r) => {
      if (!live) return;
      set((x) =>
        withAudit(
          { ...x, final: { source: r.source, questions: r.questions, answers: {} } },
          {
            role: "system",
            who: r.source === "ai" ? "Gemini (via Masar's adapter)" : r.source === "mock" ? "Gemini demo mock" : "Masar",
            what: r.source === "fallback" ? "Chose two final questions from Masar's own bank" : "Wrote two final questions from authorised answers",
            allowed: true,
          },
        ),
      );
    });
    return () => {
      live = false;
      loading.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.final]);
  const f = s.final;
  const q = f?.questions[i];
  const show = (x: string) => (f?.source === "ai" ? x : tr(x));
  const label = !f ? "" : f.source === "ai" ? tr("Personalized with Gemini") : f.source === "mock" ? tr("Personalized with Gemini · demo mock, no live model call") : !s.consent.ai ? tr("Chosen by Masar: AI processing is off") : !s.geminiOn ? tr("Chosen by Masar: Gemini is unavailable") : tr("Chosen by Masar around what you've shared");
  return (
    <section aria-label={tr("Final questions")}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="eyebrow">{tr("Two final questions")}</p>
        {f ? (
          <span className="inline-flex items-center gap-2 text-[12px] text-ink-2">
            <span aria-hidden className={`h-2 w-2 rounded-full ${f.source === "fallback" ? "bg-ink-3" : "bg-date"}`} />
            {label}
          </span>
        ) : null}
      </div>
      {!f ? (
        <div role="status" className="pt-card mt-6 flex items-center gap-4">
          <span className="pt-spark grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent" aria-hidden>
            ✦
          </span>
          <div>
            <p className="text-[15.5px] font-semibold text-ink">{tr("Choosing two questions around what you've shared")}…</p>
            <p className="text-[13px] text-ink-3">{s.consent.ai && s.geminiOn ? tr("Through Masar's Gemini adapter. Masar checks what comes back.") : tr("Masar's own question bank: AI processing isn't allowed or available.")}</p>
          </div>
        </div>
      ) : q ? (
        <div key={q.id} className="jr-q mt-6">
          <QuestionCard
            name={`pt-fu-${q.id}`}
            title={show(q.text)}
            why={show(q.why)}
            whyLabel={tr("Why we ask")}
            kind="single"
            options={q.options.map((o) => ({ value: o.value, label: show(o.label) }))}
            value={f.answers[q.id]}
            onChange={(v) => set((x) => (x.final ? { ...x, final: { ...x.final, answers: { ...x.final.answers, ...(typeof v === "string" ? { [q.id]: v } : {}) } } } : x))}
            foot={tr("Question {n} of {total}", { n: i + 1, total: f.questions.length })}
          />
        </div>
      ) : null}
      <Nav
        back={() => (i === 0 ? set(go("quick")) : setI(i - 1))}
        next={() => (!f || i >= f.questions.length - 1 ? set(go("analysis")) : setI(i + 1))}
        nextLabel={!f || i >= (f?.questions.length ?? 1) - 1 ? tr("Analyse my information") : tr("Continue")}
        disabled={!f}
      />
    </section>
  );
}

const STEPS = [
  "Collecting the information you authorised",
  "Reviewing your reproductive-health context",
  "Identifying what is known and what is unknown",
  "Analysing available records",
  "Preparing your personalised insights",
  "Writing a concise summary",
];

function Analysis() {
  const { s, set, tr, base, view, accessKey } = useProto();
  const [done, setDone] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    (async () => {
      await Promise.resolve();
      if (!live) return;
      setDone([]);
      setFailed(false);
      const d = view.dashboard;
      const shared = Object.entries(s.consent).filter(([k, v]) => v && k !== "ai" && k !== "shareClinician").length;
      const tick = async (text: string) => {
        // Each step is real work; the pause only lets the screen show it.
        await new Promise((r) => setTimeout(r, 420));
        if (live) setDone((x) => [...x, text]);
      };
      try {
        await tick(tr("{n} of 5 kinds of information shared", { n: shared }));
        await tick(tr("{n} things from your answers and records", { n: d.known.length }));
        await tick(tr("{known} known · {unknown} still unknown", { known: d.picture.on, unknown: d.unknown.length }));
        await tick(d.series.length ? tr("{n} measurements over time", { n: d.series.length }) : tr("No readings over time shared"));
        await tick(d.insights.length ? tr("Masar's published rules found {n} things worth a conversation", { n: d.insights.length }) : tr("Masar's published rules found nothing that needs a conversation right now"));
        const finals = (s.final?.questions ?? []).flatMap((q) => {
          const o = q.options.find((x) => x.value === s.final?.answers[q.id]);
          return o ? [`${q.text} ${o.label}`] : [];
        });
        const sum = await geminiSummary(s, base, accessKey, finals);
        if (!live) return;
        setDone((x) => [...x, sum.source === "ai" ? tr("Summary written by Gemini, checked by Masar") : sum.source === "mock" ? tr("Summary by the Gemini demo mock, checked by Masar") : tr("Summary written by Masar")]);
        set((x) =>
          withAudit(withNotice({ ...x, summary: { ...sum, at: new Date().toISOString() }, analysedAt: new Date().toISOString() }, { to: "patient", tone: "success", text: "Your health picture is ready." }), {
            role: "system",
            who: sum.source === "masar" ? "Masar" : sum.source === "mock" ? "Gemini demo mock" : "Gemini (via Masar's adapter)",
            what: "Summarised the authorised information",
            allowed: true,
          }),
        );
        await new Promise((r) => setTimeout(r, 900));
        if (live) set((x) => ({ ...x, stage: "dashboard" }));
      } catch {
        if (live) setFailed(true);
      }
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);
  const pct = Math.round((done.length / STEPS.length) * 100);
  const R = 70;
  const C = 2 * Math.PI * R;
  return (
    <section aria-labelledby="pt-analysis" className="grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
      <div className="relative mx-auto h-48 w-48" aria-hidden>
        <svg viewBox="0 0 170 170" className="h-full w-full -rotate-90">
          <circle cx="85" cy="85" r={R} fill="none" strokeWidth="8" className="stroke-rule" />
          <circle cx="85" cy="85" r={R} fill="none" strokeWidth="8" strokeLinecap="round" className="prep-ring-fill stroke-accent" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} />
          <circle cx="85" cy="85" r={R + 12} fill="none" strokeWidth="2" className="pt-orbit stroke-date" strokeDasharray={`${C * 0.12} ${C * 2}`} />
        </svg>
        <span className="absolute inset-0 grid place-items-center">
          <span className="text-center">
            <span className="tabular block font-display text-[2.4rem] leading-none text-ink">{done.length}/{STEPS.length}</span>
            <span className="text-[12px] text-ink-3">{tr("steps done")}</span>
          </span>
        </span>
      </div>
      <div>
        <p className="eyebrow">{tr("Health analysis")}</p>
        <h1 id="pt-analysis" className="display mt-2 text-[clamp(1.8rem,3.6vw,2.4rem)] text-ink">
          {done.length === STEPS.length ? tr("Your health picture is ready.") : tr("Preparing your health picture")}
        </h1>
        <ol className="prep-steps mt-5" aria-live="polite">
          {STEPS.map((st, i) => {
            const state = done[i] ? "done" : failed && i === done.length ? "failed" : i === done.length ? "active" : "waiting";
            return (
              <li key={st} className={`prep-step prep-step--${state}`}>
                <span aria-hidden className="prep-mark">
                  {state === "done" ? "✓" : state === "active" ? <span className="jr-spinner !h-3 !w-3" /> : <span className="font-mono text-[11px]">{i + 1}</span>}
                </span>
                <span className="min-w-0 flex-1 pt-[3px]">
                  <span className="prep-label block text-[15.5px] leading-snug">{tr(st)}…</span>
                  {done[i] ? <span className="prep-result mt-0.5 block text-[13.5px] text-ink-2">{done[i]}</span> : null}
                </span>
              </li>
            );
          })}
        </ol>
        {failed ? (
          <button type="button" onClick={() => setAttempt((a) => a + 1)} className="btn btn-primary mt-5">
            {tr("Try again")}
          </button>
        ) : null}
        <p className="mt-5 text-[12.5px] text-ink-3">{tr("No fertility score and no prediction: Masar describes what is shared, what changed by its published rules, and what is still unknown.")}</p>
      </div>
    </section>
  );
}
