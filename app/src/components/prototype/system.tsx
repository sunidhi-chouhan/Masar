"use client";

import { useState } from "react";
import { MIN_GROUP } from "@/lib/evidence";
import { RULES } from "@/lib/signals";
import { Bars, Brand, Pill, Simulated, Stat, Tabs, download, useProto } from "./core";
import { Bell, LangToggle } from "./patient";
import { withAudit, type AuditEntry, type Referral } from "./state";

// The health system: aggregates and workflows only. No screen here shows an
// individual's health information: groups smaller than 10 are hidden,
// referrals carry a reference and a reason category, and the activity log
// names roles, not patients.

type Tab = "overview" | "referrals" | "population" | "clinics" | "activity" | "access" | "reports";

export function SystemApp() {
  const { tr } = useProto();
  const [tab, setTab] = useState<Tab>("overview");
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-rule bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 md:px-6">
          <Brand sub={tr("Health system")} />
          <span className="ms-2 hidden text-[13px] text-ink-3 md:inline">{tr("Department of Health · Pilot oversight")}</span>
          <div className="ms-auto flex items-center gap-1.5">
            <LangToggle />
            <Bell />
          </div>
        </div>
      </header>
      <main id="pt-main" tabIndex={-1} className="mx-auto max-w-[1400px] px-4 pb-28 pt-5 outline-none md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            label={tr("Health system views")}
            value={tab}
            onChange={setTab}
            items={[
              { id: "overview", label: tr("Overview") },
              { id: "referrals", label: tr("Screening and referrals") },
              { id: "population", label: tr("Population insights") },
              { id: "clinics", label: tr("Clinics and clinicians") },
              { id: "activity", label: tr("Activity and audit") },
              { id: "access", label: tr("Access monitoring") },
              { id: "reports", label: tr("Reports") },
            ]}
          />
          <Simulated>{tr("Synthetic, anonymised data")}</Simulated>
        </div>
        <div key={tab} className="pt-enter mt-5">
          {tab === "overview" ? <Overview /> : null}
          {tab === "referrals" ? <ReferralsView /> : null}
          {tab === "population" ? <Population /> : null}
          {tab === "clinics" ? <Clinics /> : null}
          {tab === "activity" ? <Activity /> : null}
          {tab === "access" ? <Access /> : null}
          {tab === "reports" ? <Reports /> : null}
        </div>
      </main>
    </>
  );
}

function Overview() {
  const { report: r, tr, s } = useProto();
  const maxMonth = Math.max(1, ...r.monthly.map((m) => m.signals));
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={tr("Residents in the simulated population")} value={r.population.toLocaleString("en")} />
        <Stat label={tr("Opted in to Masar")} value={r.optedIn.toLocaleString("en")} sub={tr("{pct}% of the population", { pct: Math.round((r.optedIn / r.population) * 100) })} />
        <Stat label={tr("With something worth a conversation")} value={r.signalled.toLocaleString("en")} tone="soon" />
        <Stat label={tr("Referrals completed")} value={`${r.referralCompletionPct}%`} tone="accent" sub={tr("Simulated pilot assumption")} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="pt-card">
          <h2 className="text-[15.5px] font-semibold text-ink">{tr("From check to conversation")}</h2>
          <div className="mt-4">
            <Bars rows={r.funnel.map((f) => ({ label: tr(f.label), n: f.n }))} />
          </div>
        </div>
        <div className="pt-card">
          <h2 className="text-[15.5px] font-semibold text-ink">{tr("Signals and requests per month")}</h2>
          <div className="mt-4 flex h-44 items-end gap-1.5" dir="ltr" role="img" aria-label={tr("Signals and requests per month")}>
            {r.monthly.map((m, i) => (
              <div key={m.month} className="flex h-full flex-1 flex-col justify-end gap-0.5" title={`${m.month}: ${m.signals} / ${m.asked}`}>
                <span className="pt-bar block rounded-t-[4px] bg-indigo-300" style={{ height: `${(m.signals / maxMonth) * 100}%`, ["--i" as string]: i }} />
                <span className="pt-bar block rounded-t-[4px] bg-accent" style={{ height: `${(m.asked / maxMonth) * 100}%`, ["--i" as string]: i }} />
              </div>
            ))}
          </div>
          <p className="mt-2 flex gap-4 text-[12px] text-ink-3">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-indigo-300" />
              {tr("Signals raised")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-accent" />
              {tr("Conversations asked for")}
            </span>
          </p>
        </div>
      </div>
      <div className="pt-card">
        <h2 className="text-[15.5px] font-semibold text-ink">{tr("Live in this demo")}</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-4">
          {[
            [tr("Referrals in the workflow"), s.referrals.length],
            [tr("Waiting to be accepted"), s.referrals.filter((x) => x.status === "new").length],
            [tr("Blocked access attempts"), s.audit.filter((a) => !a.allowed).length],
            [tr("Clinics accepting referrals"), `${s.clinics.filter((c) => c.accepting).length}/${s.clinics.length}`],
          ].map(([k, v]) => (
            <div key={String(k)} className="rounded-[14px] bg-zinc-50 px-3 py-2.5">
              <dt className="text-[12px] text-ink-3">{k}</dt>
              <dd className="tabular mt-0.5 text-[1.4rem] font-semibold text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

const COLS: Referral["status"][] = ["new", "accepted", "booked", "completed"];

function ReferralsView() {
  const { s, set, tr, report: r, date } = useProto();
  const ref = (x: Referral) => `REF-${x.id.replace(/[^a-z0-9]/gi, "").slice(-5).toUpperCase()}`;
  const move = (id: string, status: Referral["status"]) =>
    set((x) => withAudit({ ...x, referrals: x.referrals.map((y) => (y.id === id ? { ...y, status } : y)) }, { role: "system", who: "Referral coordinator", what: "Moved a referral to {status}", vars: { status }, allowed: true }));
  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-4">
        {COLS.map((c) => (
          <div key={c} className="rounded-[20px] bg-zinc-100/70 p-3">
            <p className="flex items-center justify-between px-1 text-[13px] font-semibold text-ink">
              {tr({ new: "New", accepted: "Accepted", booked: "Booked", completed: "Completed" }[c])}
              <span className="tabular rounded-full bg-surface px-2 text-[12px]">{s.referrals.filter((x) => x.status === c).length}</span>
            </p>
            <ul className="mt-2 space-y-2">
              {s.referrals
                .filter((x) => x.status === c)
                .map((x) => (
                  <li key={x.id} className="pt-card !p-3">
                    <p className="font-mono text-[12px] text-ink-3">{ref(x)}</p>
                    <p className="mt-1 text-[13.5px] font-medium text-ink">{tr(Object.values(RULES).find((rule) => rule.title === x.reason)?.clinicalTitle ?? (x.reason || "Pre-pregnancy conversation"))}</p>
                    <p className="mt-0.5 text-[12px] text-ink-2">
                      {x.clinic} · {date(x.at)}
                    </p>
                    {c !== "completed" ? (
                      <button type="button" onClick={() => move(x.id, COLS[COLS.indexOf(c) + 1])} className="link mt-1.5 text-[12.5px]">
                        {tr("Move to {status}", { status: tr({ new: "New", accepted: "Accepted", booked: "Booked", completed: "Completed" }[COLS[COLS.indexOf(c) + 1]]) })}
                      </button>
                    ) : null}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="pt-card overflow-x-auto">
        <h2 className="text-[15.5px] font-semibold text-ink">{tr("Screening by reason")}</h2>
        <table className="mt-3 w-full min-w-[640px] text-[13.5px]">
          <thead>
            <tr className="text-ink-3">
              <th className="py-1.5 text-start font-medium">{tr("Reason")}</th>
              <th className="py-1.5 text-start font-medium">{tr("Residents")}</th>
              <th className="py-1.5 text-start font-medium">{tr("Doctors agreed")}</th>
              <th className="py-1.5 text-start font-medium">{tr("Median days to conversation")}</th>
            </tr>
          </thead>
          <tbody>
            {r.rules.map((x) => (
              <tr key={x.code} className="border-t border-rule">
                <td className="py-2 text-ink">{tr(RULES[x.code].title)}</td>
                <td className="tabular py-2">{x.n < MIN_GROUP ? tr("Fewer than 10") : x.n.toLocaleString("en")}</td>
                <td className="tabular py-2">{x.n < MIN_GROUP ? "—" : `${x.agreePct}%`}</td>
                <td className="tabular py-2">{x.n < MIN_GROUP || x.medianDays === null ? "—" : x.medianDays}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Population() {
  const { report: r, tr } = useProto();
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {r.cohorts.slice(0, 6).map((c) => (
          <div key={c.code} className="pt-card">
            <p className="text-[15px] font-semibold text-ink">{tr(RULES[c.code].title)}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[13px]">
              <div>
                <p className="text-ink-3">{tr("Residents")}</p>
                <p className="tabular text-[1.3rem] font-semibold text-ink">{c.n < MIN_GROUP ? "<10" : c.n}</p>
              </div>
              <div>
                <p className="text-ink-3">{tr("Not yet in conversation")}</p>
                <p className="tabular text-[1.3rem] font-semibold text-ink">{c.n < MIN_GROUP ? "—" : c.notYet}</p>
              </div>
              <div>
                <p className="text-ink-3">{tr("Asked")}</p>
                <p className="tabular text-[1.3rem] font-semibold text-ink">{c.n < MIN_GROUP ? "—" : `${c.askedPct}%`}</p>
              </div>
            </div>
            {c.leastReached ? <p className="mt-2 text-[12.5px] text-ink-2">{tr("Reached least: {group} ({pct}% asked)", { group: tr(c.leastReached.label), pct: c.leastReached.askedPct })}</p> : null}
          </div>
        ))}
      </div>
      {r.equity.map((e) => (
        <div key={e.dimension} className="pt-card">
          <h2 className="text-[15.5px] font-semibold text-ink">{tr("Asked for a conversation, by {dim}", { dim: tr(e.dimension) })}</h2>
          <div className="mt-3">
            <Bars rows={e.rows.map((row) => ({ label: tr(row.label), n: row.suppressed ? 0 : row.requestedPct, note: row.suppressed ? tr("Fewer than 10: hidden") : undefined, muted: row.suppressed }))} max={100} unit="%" />
          </div>
        </div>
      ))}
      <p className="text-[12.5px] text-ink-3">{tr("Groups smaller than {n} are never shown, including their exact size.", { n: MIN_GROUP })}</p>
    </div>
  );
}

function Clinics() {
  const { s, set, tr } = useProto();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {s.clinics.map((c) => (
        <div key={c.id} className="pt-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[15.5px] font-semibold text-ink">{c.name}</p>
              <p className="text-[13px] text-ink-3">
                {c.area} · {tr("{n} clinicians", { n: c.clinicians })}
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-2">
              {tr("Accepting referrals")}
              <input
                type="checkbox"
                role="switch"
                checked={c.accepting}
                onChange={(e) =>
                  set((x) =>
                    withAudit({ ...x, clinics: x.clinics.map((y) => (y.id === c.id ? { ...y, accepting: e.target.checked } : y)) }, { role: "system", who: "Administrator", what: e.target.checked ? "Opened referrals at {clinic}" : "Paused referrals at {clinic}", vars: { clinic: c.name }, allowed: true }),
                  )
                }
                className="peer sr-only"
              />
              <span aria-hidden className={`relative h-6 w-11 rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${c.accepting ? "bg-accent" : "bg-zinc-300"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[inset-inline-start] ${c.accepting ? "start-[22px]" : "start-0.5"}`} />
              </span>
            </label>
          </div>
          <p className="mt-3 text-[13px] text-ink-2">{tr("{n} referrals in the workflow", { n: s.referrals.filter((r) => r.clinic === c.name).length })}</p>
        </div>
      ))}
    </div>
  );
}

/** The activity log as the health system sees it: roles, not patients. */
function masked(a: AuditEntry, tr: (t: string, v?: Record<string, string | number>) => string) {
  const vars = a.vars ? Object.fromEntries(Object.entries(a.vars).map(([k, v]) => [k, k === "name" ? tr("a patient") : v])) : undefined;
  const who = a.role === "patient" ? tr("A patient") : tr(a.who);
  return { who, what: tr(a.what, vars) };
}

function Activity() {
  const { s, tr, date } = useProto();
  const [role, setRole] = useState<"all" | "patient" | "clinician" | "system">("all");
  const rows = s.audit.filter((a) => role === "all" || a.role === role);
  return (
    <div className="pt-card">
      <Tabs
        label={tr("Filter the history")}
        value={role}
        onChange={setRole}
        items={[
          { id: "all", label: tr("All"), count: s.audit.length },
          { id: "patient", label: tr("Patients"), count: s.audit.filter((a) => a.role === "patient").length },
          { id: "clinician", label: tr("Clinicians"), count: s.audit.filter((a) => a.role === "clinician").length },
          { id: "system", label: tr("System"), count: s.audit.filter((a) => a.role === "system").length },
        ]}
      />
      <ul className="mt-4 divide-y divide-rule">
        {rows.map((a, i) => {
          const m = masked(a, tr);
          return (
            <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-[13.5px]">
              <Pill tone={a.allowed ? "accent" : "urgent"}>{a.allowed ? tr("Allowed") : tr("Blocked")}</Pill>
              <span className="font-medium text-ink">{m.who}</span>
              <span className="min-w-0 flex-1 text-ink-2">{m.what}</span>
              <time className="text-[12px] text-ink-3">{date(a.at)}</time>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[12px] text-ink-3">{tr("Patients appear as roles here. Their own access history, with names, is visible only to them.")}</p>
    </div>
  );
}

function Access() {
  const { s, tr, report: r } = useProto();
  const count = (re: RegExp) => s.audit.filter((a) => re.test(a.what)).length;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={tr("Permissions granted")} value={count(/^Allowed|Granted every/)} />
        <Stat label={tr("Permissions withdrawn")} value={count(/^Withdrew|Declined every/)} tone="unknown" />
        <Stat label={tr("Clinician access requests")} value={count(/Requested access/)} tone="soon" />
        <Stat label={tr("Blocked attempts")} value={s.audit.filter((a) => !a.allowed).length} tone="urgent" />
      </div>
      <div className="pt-card">
        <h2 className="text-[15.5px] font-semibold text-ink">{tr("Consent across the simulated population")}</h2>
        <div className="mt-4">
          <Bars rows={r.funnel.slice(0, 3).map((f) => ({ label: tr(f.label), n: f.n }))} />
        </div>
      </div>
      <div className="pt-card">
        <h2 className="text-[15.5px] font-semibold text-ink">{tr("Blocked attempts")}</h2>
        <ul className="mt-3 space-y-2 text-[13.5px]">
          {s.audit
            .filter((a) => !a.allowed)
            .map((a, i) => {
              const m = masked(a, tr);
              return (
                <li key={i} className="flex flex-wrap gap-2">
                  <Pill tone="urgent">{tr("Blocked")}</Pill>
                  <span className="font-medium text-ink">{m.who}</span>
                  <span className="text-ink-2">{m.what}</span>
                </li>
              );
            })}
          {!s.audit.some((a) => !a.allowed) ? <li className="text-ink-3">{tr("None so far.")}</li> : null}
        </ul>
      </div>
    </div>
  );
}

function Reports() {
  const { s, set, tr, report: r } = useProto();
  const csv = (rows: (string | number)[][]) => rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="pt-card">
        <p className="text-[15.5px] font-semibold text-ink">{tr("Screening by reason (CSV)")}</p>
        <p className="mt-1 text-[13.5px] text-ink-2">{tr("Counts per reason, with groups under 10 suppressed.")}</p>
        <button
          type="button"
          onClick={() => {
            download("masar-screening-by-reason.csv", csv([["reason", "residents", "agree_pct", "median_days"], ...r.rules.map((x) => [RULES[x.code].title, x.n < MIN_GROUP ? "<10" : x.n, x.n < MIN_GROUP ? "" : x.agreePct, x.n < MIN_GROUP ? "" : (x.medianDays ?? "")])]), "text/csv");
            set((x) => withAudit(x, { role: "system", who: "Administrator", what: "Exported an aggregate report", allowed: true }));
          }}
          className="btn btn-primary mt-4"
        >
          {tr("Download")}
        </button>
      </div>
      <div className="pt-card">
        <p className="text-[15.5px] font-semibold text-ink">{tr("Activity log (CSV)")}</p>
        <p className="mt-1 text-[13.5px] text-ink-2">{tr("Roles and actions only; no patient names or health details.")}</p>
        <button
          type="button"
          onClick={() => {
            download("masar-activity.csv", csv([["time", "role", "who", "what", "allowed"], ...s.audit.map((a) => { const m = masked(a, (t2, v) => (v ? Object.entries(v).reduce((acc, [k, val]) => acc.replace(`{${k}}`, String(val)), t2) : t2)); return [a.at, a.role, m.who, m.what, a.allowed ? "yes" : "no"]; })]), "text/csv");
            set((x) => withAudit(x, { role: "system", who: "Administrator", what: "Exported the activity log", allowed: true }));
          }}
          className="btn btn-primary mt-4"
        >
          {tr("Download")}
        </button>
      </div>
    </div>
  );
}
