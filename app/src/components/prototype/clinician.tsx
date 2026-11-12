"use client";

import { useMemo, useState } from "react";
import type { Resident } from "@/lib/model";
import { INTENTION_LABEL } from "@/lib/model";
import { OPTION_LABEL, RULES, clinicalReason } from "@/lib/signals";
import { ALL_CONSENT, protoView, type ProtoView } from "@/lib/prototype";
import { PERMISSION_TEXT } from "@/lib/permissions";
import { SeriesChart } from "@/components/dashboard/series-chart";
import { Timing } from "@/components/editorial";
import { Brand, Pill, Simulated, Tabs, useProto } from "./core";
import { Bell, LangToggle } from "./patient";
import { reportBlocks } from "./dashboard";
import { downloadPdf } from "./report-pdf";
import { uid, withAudit, withNotice } from "./state";

// Dr Layla's practice view. The prototype patient appears only as far as they
// have shared: before that, the row is locked and every look is logged as
// blocked. The other patients are synthetic residents of the simulated
// practice, shown as having shared with her.

type Tab = "summary" | "records" | "insights" | "labs" | "consent" | "consult" | "notes" | "followup" | "messages" | "report";

const SYNTH = { clinical: "available" as const, labs: "available" as const, extraLab: false };

export function ClinicianApp() {
  const { s, set, tr, base, view, inbox } = useProto();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "review" | "requests">("all");
  const patients = useMemo(() => inbox.map((r) => ({ r, v: protoView(r, SYNTH, ALL_CONSENT, {}, null) })), [inbox]);
  const me = { r: base, v: view, shared: s.consent.shareClinician };
  const selected = s.selected ?? s.profileId;
  const rows = [
    { id: base.id, name: base.name, age: base.age, sex: base.sex, shared: me.shared, v: me.shared ? view : null, live: true, request: !!s.request },
    ...patients.map((p) => ({ id: p.r.id, name: p.r.name, age: p.r.age, sex: p.r.sex, shared: true, v: p.v, live: false, request: false })),
  ].filter((p) => (!q || p.name.toLowerCase().includes(q.toLowerCase())) && (filter === "all" || (filter === "review" ? (p.v?.dashboard.insights.length ?? 0) > 0 : p.request)));
  const open = (id: string, shared: boolean) =>
    set((x) => {
      const y = { ...x, selected: id };
      return id === x.profileId && !shared ? withAudit(y, { role: "clinician", who: "Dr Layla Al Hashimi", what: "Tried to open a patient summary that isn't shared", allowed: false }) : y;
    });

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#12201c] text-white">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 md:px-6">
          <Brand inverted sub={tr("Clinician")} />
          <div className="ms-auto flex items-center gap-1.5">
            <span className="hidden text-end leading-tight sm:block">
              <span className="block text-[13px] font-medium">Dr Layla Al Hashimi</span>
              <span className="block text-[11.5px] text-white/60">{tr("Family physician · Al Bateen")}</span>
            </span>
            <LangToggle dark />
            <Bell dark />
          </div>
        </div>
      </header>
      <main id="pt-main" tabIndex={-1} className="mx-auto grid max-w-[1400px] gap-4 px-4 pb-28 pt-4 outline-none md:px-6 lg:grid-cols-[320px_1fr]">
        <aside aria-label={tr("Your patients")} className="pt-card !p-3 lg:sticky lg:top-20 lg:max-h-[calc(100svh-6rem)] lg:overflow-y-auto">
          <label className="sr-only" htmlFor="pt-search">
            {tr("Search patients")}
          </label>
          <input id="pt-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("Search patients")} className="pt-input" />
          <div className="mt-2">
            <Tabs
              label={tr("Filter patients")}
              value={filter}
              onChange={setFilter}
              items={[
                { id: "all", label: tr("All") },
                { id: "review", label: tr("Needs review") },
                { id: "requests", label: tr("Requests") },
              ]}
            />
          </div>
          <ul className="mt-3 space-y-1.5">
            {rows.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => open(p.id, p.shared)}
                  aria-current={selected === p.id ? "true" : undefined}
                  className={`w-full rounded-[14px] border px-3 py-2.5 text-start transition-colors ${selected === p.id ? "border-accent bg-accent-soft/60" : "border-transparent hover:bg-zinc-50"}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-semibold text-ink">{p.name}</span>
                    {!p.shared ? <Pill tone="stone">🔒 {tr("Not shared")}</Pill> : p.request ? <Pill tone="soon">{tr("Request")}</Pill> : null}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-ink-3">
                    {tr(p.sex === "female" ? "Woman" : "Man")}, {p.age} · {p.live ? tr("Uses Masar in this demo") : tr("Synthetic resident")}
                  </span>
                  {p.v?.dashboard.insights.length ? <span className="mt-1 block truncate text-[12px] text-ink-2">{p.v.dashboard.insights.map((i) => tr(RULES[i.code].clinicalTitle)).join(" · ")}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section aria-label={tr("Patient")}>
          {selected === base.id ? (
            me.shared ? (
              <Patient r={base} v={view} live />
            ) : (
              <Locked />
            )
          ) : (
            (() => {
              const p = patients.find((x) => x.r.id === selected);
              return p ? <Patient r={p.r} v={p.v} live={false} /> : null;
            })()
          )}
        </section>
      </main>
    </>
  );
}

function Locked() {
  const { s, set, tr, base } = useProto();
  const name = base.name.split(" ")[0];
  return (
    <div className="pt-card pt-enter grid place-items-center py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-zinc-100 text-[1.6rem]" aria-hidden>
        🔒
      </span>
      <h1 className="display mt-4 text-[1.7rem] text-ink">{tr("{name} hasn't shared a summary with you", { name })}</h1>
      <p className="mt-2 max-w-md text-[14.5px] text-ink-2">{tr("You can't see their results, answers or findings. This look was recorded in their access history as blocked.")}</p>
      <button
        type="button"
        disabled={s.accessRequested}
        onClick={() =>
          set((x) =>
            withAudit(withNotice({ ...x, accessRequested: true }, { to: "patient", tone: "info", text: "Dr Layla Al Hashimi asked to see your summary.", action: "allowAccess" }), {
              role: "clinician",
              who: "Dr Layla Al Hashimi",
              what: "Requested access to {name}'s summary",
              vars: { name },
              allowed: true,
            }),
          )
        }
        className="btn btn-primary mt-6 disabled:opacity-60"
      >
        {s.accessRequested ? tr("Access requested: waiting for {name}", { name }) : tr("Ask {name} for access", { name })}
      </button>
      <p className="mt-2 text-[12.5px] text-ink-3">{tr("Switch to the patient (Demo Controls) to allow or decline it.")}</p>
    </div>
  );
}

function Patient({ r, v, live }: { r: Resident; v: ProtoView; live: boolean }) {
  const { s, set, tr, say, date } = useProto();
  const [tab, setTab] = useState<Tab>("summary");
  const d = v.dashboard;
  const name = r.name.split(" ")[0];
  const top = d.urgency;
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "summary", label: tr("Summary") },
    { id: "records", label: tr("History and records") },
    { id: "insights", label: tr("Insights and uncertainty"), count: d.insights.length },
    { id: "labs", label: tr("Labs and trends"), count: d.series.length },
    { id: "consent", label: tr("Consent and access") },
    { id: "consult", label: tr("Consultation prep") },
    { id: "notes", label: tr("Notes"), count: (s.notes[r.id] ?? []).length },
    { id: "followup", label: tr("Follow-up") },
    { id: "messages", label: tr("Messages") },
    { id: "report", label: tr("Report") },
  ];
  return (
    <div className="pt-enter space-y-4">
      <div className="pt-card pt-hero">
        <div className="flex flex-wrap items-start gap-4">
          <span aria-hidden className="grid h-14 w-14 place-items-center rounded-full bg-ink font-display text-[1.3rem] text-paper">
            {r.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="display text-[1.8rem] leading-tight text-ink">{r.name}</h1>
            <p className="mt-0.5 text-[13.5px] text-ink-2">
              {tr(r.sex === "female" ? "Woman" : "Man")}, {r.age} · {v.record.intention ? tr(INTENTION_LABEL[v.record.intention]) : tr("Plans not shared")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {top ? <Timing urgency={top} lang={s.lang} /> : <Pill tone="accent">{tr("Nothing worth a conversation in what was shared.")}</Pill>}
              {live ? <Pill tone="accent">{tr("Shared with you by the patient")}</Pill> : <Simulated>{tr("Synthetic resident")}</Simulated>}
              {live && s.request ? <Pill tone="soon">{tr("Asked for a conversation")}</Pill> : null}
            </div>
          </div>
        </div>
      </div>
      <Tabs label={tr("Patient record")} value={tab} onChange={setTab} items={tabs} />

      <div key={tab} className="pt-enter">
        {tab === "summary" ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="pt-card lg:col-span-2">
              <p className="eyebrow">{tr("What Masar found")}</p>
              {d.insights.length ? (
                <ul className="mt-3 space-y-3">
                  {d.insights.map((i) => (
                    <li key={i.code} className="rounded-[14px] border border-rule p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Timing urgency={i.urgency} lang={s.lang} />
                      </div>
                      <p className="mt-2 text-[15px] font-semibold text-ink">{tr(RULES[i.code].clinicalTitle)}</p>
                      <p className="mt-1 text-[13px] text-ink-2">{i.because.map((b) => tr(clinicalReason(b.text.text))).join(" · ")}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[14px] text-ink-2">{tr("Nothing worth a conversation in what was shared.")}</p>
              )}
            </div>
            <div className="pt-card">
              <p className="eyebrow">{tr("At a glance")}</p>
              <dl className="mt-3 space-y-2 text-[13.5px]">
                {[
                  [tr("On record"), d.known.length],
                  [tr("Still unknown"), d.unknown.length],
                  [tr("Measurements"), d.series.length],
                  [tr("Sources shared"), `${d.sourcesShared}/5`],
                ].map(([k, val]) => (
                  <div key={String(k)} className="flex justify-between gap-3 border-b border-rule pb-1.5">
                    <dt className="text-ink-3">{k}</dt>
                    <dd className="tabular font-semibold text-ink">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        ) : null}

        {tab === "records" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="pt-card">
              <p className="eyebrow">{tr("On record")}</p>
              <ul className="mt-3 space-y-2">
                {d.known.map((f, i) => (
                  <li key={i} className="flex flex-wrap justify-between gap-2 border-b border-rule pb-2 text-[14px]">
                    <span className="text-ink">{say(f.text)}</span>
                    <span className="text-[12px] text-ink-3">
                      {tr(f.source)}
                      {f.date ? ` · ${date(f.date)}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-card">
              <p className="eyebrow">{tr("Timeline")}</p>
              <ol className="mt-3 space-y-2 border-s-2 border-rule ps-4">
                {[...d.timeline].reverse().map((e, i) => (
                  <li key={i} className="relative text-[13.5px]">
                    <span aria-hidden className="absolute -start-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
                    <span className="font-medium text-ink">{say(e.title)}</span> <span className="text-ink-3">· {date(e.at)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}

        {tab === "insights" ? (
          <div className="space-y-4">
            {d.insights.map((i) => (
              <div key={i.code} className="pt-card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[15.5px] font-semibold text-ink">{tr(RULES[i.code].clinicalTitle)}</p>
                  <Timing urgency={i.urgency} lang={s.lang} />
                </div>
                <p className="mt-2 text-[14px] text-ink-2">
                  <span className="font-medium text-ink">{tr("Why it matters")}: </span>
                  {tr(i.why)}
                </p>
                <p className="mt-1 text-[13px] text-ink-3">
                  {tr(i.evidence.citation)} · {tr("{strength} evidence", { strength: tr(i.evidence.strength) })}
                </p>
                <p className="mt-2 rounded-[12px] bg-unknown-soft px-3 py-2 text-[13.5px] text-ink">
                  <span className="font-medium">{tr("What this can't tell")}: </span>
                  {tr(i.cannot)}
                </p>
              </div>
            ))}
            <div className="pt-card">
              <p className="eyebrow">{tr("Uncertainties")}</p>
              <ul className="mt-2 space-y-1.5 text-[14px] text-ink-2">
                {d.unknown.map((f, i) => (
                  <li key={i}>· {say(f.text)}</li>
                ))}
                {!d.unknown.length ? <li>{tr("Nothing missing from what Masar looks at.")}</li> : null}
              </ul>
            </div>
          </div>
        ) : null}

        {tab === "labs" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {d.series.map((x) => (
              <div key={x.code} className="pt-card">
                <p className="text-[15px] font-semibold text-ink">{tr(x.label)}</p>
                {x.points.length >= 2 ? (
                  <div className="mt-2">
                    <SeriesChart
                      points={x.points.map((p) => ({ at: p.at, date: date(p.at), value: p.value, source: tr(p.source) }))}
                      unit={tr(x.unit)}
                      band={x.band}
                      bars={x.code === "cycle_length"}
                      title={tr(x.label)}
                      labels={{ usual: tr("Usual range"), printedRange: tr("Range printed on your report"), showValues: tr("Show values"), hideValues: tr("Hide values"), date: tr("Date"), value: tr("Value"), source: tr("Source") }}
                    />
                  </div>
                ) : (
                  <p className="tabular mt-2 font-display text-[1.8rem] text-ink" dir="ltr">
                    {x.points[0]?.value} <span className="text-[13px] text-ink-3">{tr(x.unit)}</span>
                  </p>
                )}
                <p className="mt-2 text-[13px] text-ink-2">{say(x.sentence)}</p>
              </div>
            ))}
            {!d.series.length ? <div className="pt-card text-[14px] text-ink-2">{tr("No results shared.")}</div> : null}
          </div>
        ) : null}

        {tab === "consent" ? <ConsentTab live={live} name={name} /> : null}

        {tab === "consult" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="pt-card pt-dark">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/60">{tr("The patient's questions")}</p>
              <ol className="mt-3 list-decimal space-y-1.5 ps-5 text-[14.5px] text-white/90">
                {(live && s.request ? s.request.questions : d.prepare.questions).map((x) => (
                  <li key={x}>{tr(x)}</li>
                ))}
              </ol>
            </div>
            <div className="pt-card">
              <p className="eyebrow">{tr("Options attached to these findings")}</p>
              <ul className="mt-3 space-y-2 text-[14px]">
                {[...new Set(d.insights.flatMap((i) => i.options))].map((o) => (
                  <li key={o}>
                    <span className="font-medium text-ink">{tr(OPTION_LABEL[o].title)}.</span> <span className="text-ink-2">{tr(OPTION_LABEL[o].next)}</span>
                  </li>
                ))}
                {!d.insights.length ? <li className="text-ink-2">{tr("Nothing worth a conversation in what was shared.")}</li> : null}
              </ul>
              <p className="eyebrow mt-5">{tr("Still unknown")}</p>
              <ul className="mt-2 space-y-1 text-[13.5px] text-ink-2">
                {d.unknown.map((f, i) => (
                  <li key={i}>· {say(f.text)}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {tab === "notes" ? <Notes pid={r.id} /> : null}
        {tab === "followup" ? <FollowUp pid={r.id} live={live} topReason={d.insights[0]?.title ?? "Pre-pregnancy conversation"} name={name} /> : null}
        {tab === "messages" ? <Messages live={live} name={name} /> : null}
        {tab === "report" ? (
          <div className="pt-card">
            <p className="text-[14.5px] text-ink-2">{tr("The same report the patient can download: only what they shared, with sources and limits.")}</p>
            <button
              type="button"
              onClick={() => {
                void downloadPdf(`masar-report-${r.id}.pdf`, reportBlocks(d, r.name, r.age, tr, say, date, s.lang), s.lang);
                set((x) => withAudit(x, { role: "clinician", who: "Dr Layla Al Hashimi", what: "Downloaded a patient report", allowed: true }));
              }}
              className="btn btn-primary mt-4"
            >
              {tr("Download the patient's report")}
            </button>
            {live ? null : <p className="mt-2 text-[12.5px] text-ink-3">{tr("Synthetic resident")}</p>}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ConsentTab({ live, name }: { live: boolean; name: string }) {
  const { s, tr, date } = useProto();
  if (!live) {
    return (
      <div className="pt-card text-[14.5px] text-ink-2">
        <Simulated>{tr("Synthetic resident")}</Simulated>
        <p className="mt-2">{tr("Part of the simulated practice: treated as having shared every source with you. Real patients choose each one.")}</p>
      </div>
    );
  }
  const rows: [string, boolean][] = [
    [PERMISSION_TEXT.self.label, s.consent.answers],
    [PERMISSION_TEXT.malaffi.label, s.consent.clinical],
    [PERMISSION_TEXT.lab.label, s.consent.labs],
    [PERMISSION_TEXT.device.label, s.consent.device],
    [PERMISSION_TEXT.healthAge.label, s.consent.healthAge],
    [PERMISSION_TEXT.assistant.label, s.consent.ai],
    [PERMISSION_TEXT.share.label, s.consent.shareClinician],
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="pt-card">
        <p className="eyebrow">{tr("{name}'s permissions", { name })}</p>
        <ul className="mt-3 space-y-2">
          {rows.map(([label, on]) => (
            <li key={label} className="flex items-center justify-between gap-3 border-b border-rule pb-2 text-[14px]">
              <span className="text-ink">{tr(label)}</span>
              <Pill tone={on ? "accent" : "stone"}>{on ? tr("Shared") : tr("Not shared")}</Pill>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12.5px] text-ink-3">{tr("Anything not shared is absent from every view here, not hidden behind a click.")}</p>
      </div>
      <div className="pt-card">
        <p className="eyebrow">{tr("Access history")}</p>
        <ul className="mt-3 space-y-2 text-[13.5px]">
          {s.audit
            .filter((a) => a.role === "clinician" || a.role === "patient")
            .slice(0, 12)
            .map((a, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2">
                <Pill tone={a.allowed ? "accent" : "urgent"}>{a.allowed ? tr("Allowed") : tr("Blocked")}</Pill>
                <span className="text-ink">{tr(a.what, a.vars)}</span>
                <span className="text-[12px] text-ink-3">{date(a.at)}</span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

function Notes({ pid }: { pid: string }) {
  const { s, set, tr, date } = useProto();
  const [text, setText] = useState("");
  const notes = s.notes[pid] ?? [];
  return (
    <div className="pt-card">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          set((x) => withAudit({ ...x, notes: { ...x.notes, [pid]: [{ at: new Date().toISOString(), text: text.trim() }, ...(x.notes[pid] ?? [])] } }, { role: "clinician", who: "Dr Layla Al Hashimi", what: "Added a clinical note", allowed: true }));
          setText("");
        }}
      >
        <label htmlFor="pt-note" className="text-[13.5px] font-semibold text-ink">
          {tr("Add a note")}
        </label>
        <textarea id="pt-note" value={text} onChange={(e) => setText(e.target.value)} rows={3} className="pt-input mt-1 resize-y" placeholder={tr("Visible to you and the care team. Not shown to the patient.")} />
        <button type="submit" className="btn btn-primary mt-2">
          {tr("Save note")}
        </button>
      </form>
      <ul className="mt-4 space-y-2">
        {notes.map((n, i) => (
          <li key={i} className="rounded-[12px] bg-zinc-50 px-3 py-2 text-[14px] text-ink">
            {n.text}
            <span className="mt-0.5 block text-[11.5px] text-ink-3">{date(n.at)}</span>
          </li>
        ))}
        {!notes.length ? <li className="text-[13.5px] text-ink-3">{tr("No notes yet.")}</li> : null}
      </ul>
    </div>
  );
}

function FollowUp({ pid, live, topReason, name }: { pid: string; live: boolean; topReason: string; name: string }) {
  const { s, set, tr } = useProto();
  const [reason, setReason] = useState("");
  const [error, setError] = useState(false);
  const [clinic, setClinic] = useState(s.clinics.find((c) => c.accepting)?.name ?? s.clinics[0].name);
  const decide = (decision: "Accept" | "Modify" | "Override") => {
    if (decision === "Override" && !reason.trim()) return setError(true);
    setError(false);
    set((x) => {
      let y = withAudit(x, { role: "clinician", who: "Dr Layla Al Hashimi", what: "Recorded a decision: {d}", vars: { d: decision === "Accept" ? "Agree" : decision === "Modify" ? "Add a test first" : "Suggest a different approach" }, allowed: true });
      if (live && y.request) {
        y = withNotice({ ...y, request: { ...y.request, status: "reviewed", decision, reason: reason.trim() || undefined } }, { to: "patient", tone: "info", text: "Dr Layla reviewed your request." });
      } else {
        y = { ...y, notes: { ...y.notes, [pid]: [{ at: new Date().toISOString(), text: `${tr("Decision")}: ${decision}${reason ? ` · ${reason}` : ""}` }, ...(y.notes[pid] ?? [])] } };
      }
      return y;
    });
  };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="pt-card">
        <p className="eyebrow">{tr("Your decision")}</p>
        {live && !s.request ? <p className="mt-2 text-[13.5px] text-ink-3">{tr("{name} hasn't asked for a conversation yet. You can still record a decision.", { name })}</p> : null}
        {live && s.request?.decision ? <p className="mt-2 text-[13.5px] text-accent">{tr("Recorded: {d}", { d: tr({ Accept: "Agree", Modify: "Add a test first", Override: "Different approach" }[s.request.decision]) })}</p> : null}
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <button type="button" onClick={() => decide("Accept")} className="btn btn-primary">
            {tr("Agree")}
          </button>
          <button type="button" onClick={() => decide("Modify")} className="btn btn-secondary">
            {tr("Add a test first")}
          </button>
          <button type="button" onClick={() => decide("Override")} className="btn btn-secondary">
            {tr("Different approach")}
          </button>
        </div>
        <label htmlFor="pt-reason" className="mt-3 block text-[13px] font-medium text-ink-2">
          {tr("Reason (required for a different approach)")}
        </label>
        <input id="pt-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="pt-input mt-1" aria-invalid={error} />
        {error ? (
          <p role="alert" className="mt-1 text-[13px] text-urgent">
            {tr("Please give a reason: the patient sees it.")}
          </p>
        ) : null}
      </div>
      <div className="pt-card">
        <p className="eyebrow">{tr("Refer")}</p>
        <label htmlFor="pt-clinic" className="mt-2 block text-[13px] font-medium text-ink-2">
          {tr("Clinic")}
        </label>
        <select id="pt-clinic" value={clinic} onChange={(e) => setClinic(e.target.value)} className="pt-input mt-1">
          {s.clinics.map((c) => (
            <option key={c.id} value={c.name} disabled={!c.accepting}>
              {c.name}
              {c.accepting ? "" : ` (${tr("not accepting")})`}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() =>
            set((x) =>
              withAudit(withNotice({ ...x, referrals: [{ id: uid("r"), patientId: pid, reason: topReason, clinic, status: "new", at: new Date().toISOString() }, ...x.referrals] }, { to: "system", tone: "info", text: "New referral received." }), {
                role: "clinician",
                who: "Dr Layla Al Hashimi",
                what: "Created a referral",
                allowed: true,
              }),
            )
          }
          className="btn btn-primary mt-3"
        >
          {tr("Create referral")}
        </button>
        <ul className="mt-4 space-y-1.5 text-[13.5px]">
          {s.referrals
            .filter((r) => r.patientId === pid)
            .map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2">
                <span className="text-ink">{r.clinic}</span>
                <Pill tone={r.status === "completed" ? "accent" : r.status === "new" ? "soon" : "stone"}>{tr({ new: "New", accepted: "Accepted", booked: "Booked", completed: "Completed" }[r.status])}</Pill>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

function Messages({ live, name }: { live: boolean; name: string }) {
  const { s, set, tr, date } = useProto();
  const [text, setText] = useState("");
  if (!live) return <div className="pt-card text-[14px] text-ink-2">{tr("Messaging is available for the patient using Masar in this demo.")}</div>;
  return (
    <div className="pt-card">
      <ul className="space-y-2">
        {s.messages.map((m, i) => (
          <li key={i} className={`max-w-[80%] rounded-[16px] px-3.5 py-2 text-[14px] ${m.from === "clinician" ? "ms-auto bg-accent text-white" : "bg-zinc-100 text-ink"}`}>
            {m.text}
            <span className="mt-0.5 block text-[11px] opacity-70">{date(m.at)}</span>
          </li>
        ))}
        {!s.messages.length ? <li className="text-[13.5px] text-ink-3">{tr("No messages yet.")}</li> : null}
      </ul>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          set((x) =>
            withAudit(withNotice({ ...x, messages: [...x.messages, { at: new Date().toISOString(), from: "clinician", text: text.trim() }] }, { to: "patient", tone: "info", text: "New message from Dr Layla." }), {
              role: "clinician",
              who: "Dr Layla Al Hashimi",
              what: "Sent a message to {name}",
              vars: { name },
              allowed: true,
            }),
          );
          setText("");
        }}
      >
        <label htmlFor="pt-msg" className="sr-only">
          {tr("Message")}
        </label>
        <input id="pt-msg" value={text} onChange={(e) => setText(e.target.value)} className="pt-input" placeholder={tr("Write to {name}", { name })} />
        <button type="submit" className="btn btn-primary shrink-0">
          {tr("Send")}
        </button>
      </form>
    </div>
  );
}
