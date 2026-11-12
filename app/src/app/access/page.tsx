import type { Metadata } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";
import { Brand } from "@/components/ui";
import { StudioJourney } from "@/components/studio/studio-journey";
import { ConfirmAction, CopyLink } from "@/components/studio/studio-client";
import { ACCOUNTS, createLoginToken, type Account } from "@/lib/accounts";
import { POPULATION_SIZE } from "@/lib/population";
import { MIN_GROUP } from "@/lib/evidence";
import { resetData, startFresh } from "@/server/actions";
import { accessAllowed, accessEnabled } from "@/server/access";
import { AccessGate } from "@/components/access-gate";
import { accessLog, person } from "@/server/store";
import { personView } from "@/server/views";
import { getSession } from "@/server/session";
import "./studio.css";

// Demo Studio. Linked from the landing page and sign-in as Demo access.
// Hidden from search engines. Key verification is off for now, so this page
// opens directly. Every action is the existing server action, which checks
// the same switch again. Every status shown here is read from the stored
// demo state at request time.

export const instant = false;
export const metadata: Metadata = { title: "Demo Studio · Masar", robots: { index: false, follow: false } };

const RESIDENTS = ACCOUNTS.filter((a) => a.role === "person");
const CLINICIAN = ACCOUNTS.find((a) => a.role === "clinician")!;
const SYSTEM = ACCOUNTS.find((a) => a.role === "system")!;

/** What each account is for in the demo story. */
const SCENARIO: Record<string, string> = {
  noura: "34, after her Health Age check. Her record has things worth a conversation; the story has her ask Dr Layla to talk.",
  arjun: "37, planning children soon. A lifestyle finding; the story has him share but not ask yet.",
  maryam: "29, nothing on record worth a conversation. Starts as a first-time visitor, to show onboarding and consent.",
  layla: "Family physician. Sees only patients who share with her, and records decisions on their requests.",
  analyst: "Department of Health. Sees the practice-run report on synthetic residents, with small groups hidden.",
};

const SHORT: Record<string, string> = { noura: "Noura", arjun: "Arjun", maryam: "Maryam", layla: "Dr Layla", analyst: "analyst" };

const REQUEST_STATUS: Record<string, string> = {
  requested: "asked for a conversation, waiting for review",
  reviewed: "request reviewed, waiting to be booked",
  booked: "conversation booked",
  attended: "conversation held",
};

/** A resident's status, from the stored state. */
function residentStatus(id: string): { line: string; tone: "fresh" | "ready" | "active" } {
  const p = person(id);
  if (!p.onboarded) return { line: "First visit: nothing shared yet", tone: "fresh" };
  const shared = Object.values(p.sources).filter(Boolean).length;
  const findings = personView(id).signals.length;
  const parts = [
    `${shared} of 5 sources shared`,
    p.shareWithClinician ? "doctor can see summary" : "summary private",
    findings === 0 ? "no findings to discuss" : findings === 1 ? "1 finding to discuss" : `${findings} findings to discuss`,
  ];
  if (p.request) parts.push(REQUEST_STATUS[p.request.status] ?? p.request.status);
  if (p.reports.length) parts.push(`${p.reports.length} test result request${p.reports.length > 1 ? "s" : ""}`);
  return { line: parts.join(" · "), tone: p.request ? "active" : "ready" };
}

/** Dr Layla's status: requests from residents who share with her. */
function clinicianStatus() {
  const shared = RESIDENTS.map((r) => ({ r, p: person(r.id) })).filter(({ p }) => p.shareWithClinician);
  const waiting = shared.filter(({ p }) => p.request?.status === "requested");
  const decided = shared.filter(({ p }) => p.request?.decision);
  if (!shared.length) return { line: "No resident is sharing with her yet", tone: "fresh" as const, waiting, decided };
  const parts = [`${shared.length} resident${shared.length > 1 ? "s" : ""} sharing`];
  parts.push(waiting.length ? `${waiting.length} request${waiting.length > 1 ? "s" : ""} waiting` : "no requests waiting");
  if (decided.length) parts.push(`${decided.length} decision${decided.length > 1 ? "s" : ""} recorded`);
  return { line: parts.join(" · "), tone: waiting.length ? ("active" as const) : ("ready" as const), waiting, decided };
}

const hasData = (id: string) => {
  const p = person(id);
  return p.onboarded || Boolean(p.request) || p.reports.length > 0 || accessLog(id).length > 0;
};

const ROLE_LABEL = { person: "Resident", clinician: "Clinician", system: "Health system" } as const;

function AccountRow({ a, url, status, tone, k }: { a: Account; url: string; status: string; tone: "fresh" | "ready" | "active"; k: string }) {
  const fresh = a.role === "person";
  return (
    <li className="studio-row">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="text-[16.5px] font-semibold text-ink">{a.name}</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">{ROLE_LABEL[a.role]}</span>
        </div>
        <p className="mt-1 text-[14px] leading-snug text-ink-2">{SCENARIO[a.id] ?? a.description}</p>
        <p className="mt-2 flex items-start gap-2 text-[13px] text-ink">
          <span aria-hidden className={`studio-status studio-status--${tone}`} />
          <span>
            <span className="sr-only">Current status: </span>
            {status}
          </span>
        </p>
      </div>
      <div className="studio-row-actions">
        <a href={url} className="studio-btn studio-btn--primary">
          Sign in as {SHORT[a.id] ?? a.name}
        </a>
        <CopyLink url={url} who={a.name} />
        {fresh ? (
          <ConfirmAction
            action={startFresh.bind(null, k, a.id)}
            label="Start fresh"
            pendingLabel="Starting fresh"
            tone="quiet"
            confirm={hasData(a.id)}
            title={`Start ${SHORT[a.id]} fresh?`}
            points={[
              `Clears ${SHORT[a.id]}'s choices, answers, request, uploaded files and access-log entries.`,
              "Then signs you in as them, as a first-time visitor.",
              "Other accounts are not changed.",
            ]}
            confirmLabel="Clear and sign in"
          />
        ) : null}
      </div>
    </li>
  );
}

export default async function Access({ searchParams }: PageProps<"/access">) {
  await connection();
  const { key, reset } = await searchParams;
  const k = typeof key === "string" ? key : undefined;
  if (!accessAllowed(k)) return <AccessGate action="/access" wrongKey={k !== undefined} enabled={accessEnabled()} />;
  const keyArg = k ?? "";

  const h = await headers();
  const base = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const urls = Object.fromEntries(ACCOUNTS.map((a) => [a.id, `${base}/auth/${encodeURIComponent(createLoginToken(a))}`]));

  const session = await getSession();
  const signedInAs = session ? ACCOUNTS.find((a) => a.role === session.role && a.id === session.id) : undefined;

  const residents = RESIDENTS.map((a) => ({ a, ...residentStatus(a.id) }));
  const clinic = clinicianStatus();
  const anyData = RESIDENTS.some((r) => hasData(r.id));

  return (
    <div className="studio min-h-dvh bg-paper" lang="en" dir="ltr">
      {/* A. Header */}
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 md:px-8">
          <Brand />
          <span className="hidden h-5 w-px bg-rule-strong sm:block" aria-hidden />
          <span className="text-[14px] font-medium text-ink-2">Demo Studio</span>
          <span className="ms-auto inline-flex items-center gap-2 rounded-full border border-soon/40 bg-soon-soft px-3 py-1 text-[12.5px] font-semibold text-soon">
            <span aria-hidden className="studio-live h-1.5 w-1.5 rounded-full bg-soon" />
            Demo environment
          </span>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-24 md:px-8">
        <section className="pt-12 md:pt-16">
          <p className="eyebrow">Team only · synthetic demo environment</p>
          <h1 className="display mt-4 text-[clamp(2.4rem,6vw,4.2rem)] leading-[1.03] text-ink">Masar Demo Studio</h1>
          <p className="mt-4 max-w-2xl text-[18px] leading-relaxed text-ink-2">
            Your workspace for exploring Masar&apos;s resident, clinical and health-system experiences.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-ink-2">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
              All profiles and records in this environment are synthetic.
            </span>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ink-3" />
              {signedInAs ? `This browser is signed in as ${signedInAs.name}.` : "This browser is not signed in to any account."}
            </span>
          </div>

          <section aria-labelledby="experience-title" className="mt-12 border-t border-rule pt-10">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="eyebrow">The demo story</p>
                <h2 id="experience-title" className="display mt-3 text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.06] text-ink">
                  One resident. The whole challenge.
                </h2>
                <p className="mt-3 text-[16px] leading-relaxed text-ink-2">
                  The interactive Masar prototype: a resident signs in, shares what they choose, gets their path, and Dr Layla and the health system respond. Demo Controls drive every step. Synthetic people only; it does not change the accounts or records below.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a className="studio-btn studio-btn--primary" href={k ? `/prototype?key=${encodeURIComponent(k)}` : "/prototype"}>
                  View the demo story
                </a>
              </div>
            </div>
          </section>

          {reset ? (
            <div role="status" className="studio-note studio-note--ok mt-8">
              <p className="font-semibold">All demo data was reset.</p>
              <p className="mt-1">
                {anyData
                  ? "Some resident data is present again since the reset."
                  : "Every resident is back to a first visit with no access log, and this browser was signed out."}
              </p>
            </div>
          ) : null}
        </section>

        {/* B. Presentation scenario */}
        <section aria-labelledby="scenario-title" className="mt-16 border-t border-rule pt-14 md:mt-20">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div>
              <p className="eyebrow">Presentation scenario</p>
              <h2 id="scenario-title" className="display mt-3 text-[clamp(2rem,4.4vw,3.2rem)] leading-[1.06] text-ink">
                One health journey. <em className="text-accent">Three perspectives.</em>
              </h2>
            </div>
            <p className="max-w-xl text-[16.5px] leading-relaxed text-ink-2">
              Explore how an individual understands changes in their health, how a clinician responds, and how the health system learns from aggregated insights.
            </p>
          </div>

          <div className="mt-12">
            <StudioJourney
              stages={[
                { n: "01", title: "Resident experience", body: "Noura sees what changed in her record, how sure Masar is, and asks for a conversation." },
                { n: "02", title: "Clinical review", body: "Dr Layla sees only what Noura shared, and records a decision on her request." },
                { n: "03", title: "Health-system insights", body: "The Department of Health sees aggregated results, with every group under ten hidden." },
              ]}
            />
          </div>

        </section>

        {/* C. Accounts */}
        <section id="accounts" aria-labelledby="accounts-title" className="mt-20 border-t border-rule pt-14">
          <p className="eyebrow">Explore accounts</p>
          <h2 id="accounts-title" className="display mt-3 text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.08] text-ink">
            Who to open, and what they will see.
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] text-ink-2">
            Each sign-in link opens one account and expires after 30 days. Opening one replaces this browser&apos;s current sign-in.
          </p>

          <div className="mt-10 grid gap-10 lg:grid-cols-[12rem_1fr] lg:gap-x-12">
            <h3 className="studio-group">Residents</h3>
            <ul className="studio-rows">
              {residents.map(({ a, line, tone }) => (
                <AccountRow key={a.id} a={a} url={urls[a.id]} status={line} tone={tone} k={keyArg} />
              ))}
            </ul>
            <h3 className="studio-group">Clinical team</h3>
            <ul className="studio-rows">
              <AccountRow a={CLINICIAN} url={urls[CLINICIAN.id]} status={clinic.line} tone={clinic.tone} k={keyArg} />
            </ul>
            <h3 className="studio-group">Health system</h3>
            <ul className="studio-rows">
              <AccountRow
                a={SYSTEM}
                url={urls[SYSTEM.id]}
                status={`Practice-run report on ${POPULATION_SIZE.toLocaleString("en")} synthetic residents · groups under ${MIN_GROUP} hidden`}
                tone="ready"
                k={keyArg}
              />
            </ul>
          </div>
        </section>

        {/* D. Resources */}
        <section aria-labelledby="res-title" className="mt-20 border-t border-rule pt-14">
          <div className="grid gap-8 lg:grid-cols-[12rem_1fr] lg:gap-x-12">
            <div>
              <p className="eyebrow">Demo resources</p>
              <h2 id="res-title" className="mt-3 text-[18px] font-semibold text-ink">
                Sample test reports
              </h2>
            </div>
            <div>
              <p className="max-w-2xl text-[14.5px] leading-relaxed text-ink-2">
                Made-up lab reports for trying the upload. As Dr Layla, ask a patient for a test result; then, as that patient, upload the matching file.
              </p>
              <ul className="mt-5 divide-y divide-rule border-y border-rule">
                {[
                  ["noura-amh-follow-up.pdf", "AMH follow-up", "For Noura"],
                  ["arjun-semen-analysis.pdf", "Sperm test", "For Arjun"],
                  ["thyroid-and-sugar.pdf", "Thyroid and blood sugar", "For Maryam"],
                ].map(([file, label, who]) => (
                  <li key={file} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                    <svg width="18" height="22" viewBox="0 0 18 22" aria-hidden className="shrink-0 text-ink-3">
                      <path d="M2 2h9l5 5v13H2z M11 2v5h5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    </svg>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium text-ink">{label}</span>
                      <span className="block text-[12.5px] text-ink-3">
                        {who} · PDF · synthetic
                      </span>
                    </span>
                    <a href={`/samples/${file}`} target="_blank" rel="noopener" className="studio-btn studio-btn--quiet">
                      Open<span className="sr-only"> {label} (opens in a new tab)</span>
                    </a>
                    <a href={`/samples/${file}`} download className="studio-btn studio-btn--quiet">
                      Download<span className="sr-only"> {label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* F. Maintenance */}
        <section aria-labelledby="maint-title" className="studio-maint mt-20">
          <div className="grid gap-8 lg:grid-cols-[12rem_1fr] lg:gap-x-12">
            <div>
              <p className="eyebrow text-urgent">Demo maintenance</p>
              <h2 id="maint-title" className="mt-3 text-[18px] font-semibold text-ink">
                Reset and clean-up
              </h2>
              <p className="mt-2 text-[13px] text-ink-3">Nothing here runs without a confirmation.</p>
            </div>
            <div className="space-y-8">
              <div>
                <h3 className="text-[15.5px] font-semibold text-ink">Start one resident fresh</h3>
                <p className="mt-1 max-w-2xl text-[14px] text-ink-2">
                  Clears that resident&apos;s choices, answers, request, uploads and access-log entries, then signs you in as them as a first-time visitor.
                </p>
                <ul className="mt-4 flex flex-wrap gap-3">
                  {RESIDENTS.map((a) => (
                    <li key={a.id} className="min-w-[14rem] flex-1">
                      <ConfirmAction
                        action={startFresh.bind(null, keyArg, a.id)}
                        label={`Start ${SHORT[a.id]} fresh`}
                        pendingLabel="Starting fresh"
                        tone="quiet"
                        confirm
                        title={`Start ${SHORT[a.id]} fresh?`}
                        points={[
                          `Clears ${SHORT[a.id]}'s choices, answers, request, uploaded files and access-log entries.`,
                          "Then signs you in as them, as a first-time visitor.",
                        ]}
                        confirmLabel="Clear and sign in"
                      />
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-rule pt-8">
                <h3 className="text-[15.5px] font-semibold text-ink">Reset all demo data</h3>
                <p className="mt-1 max-w-2xl text-[14px] text-ink-2">
                  Removes every resident&apos;s choices, answers, requests, decisions, uploaded files and the whole access log, and signs this browser out.
                  Sign-in links and the generated population are not affected.
                </p>
                <div className="mt-4 max-w-xl">
                  <ConfirmAction
                    action={resetData.bind(null, keyArg)}
                    label="Reset all demo data"
                    pendingLabel="Resetting"
                    tone="danger"
                    confirm
                    title="Reset all demo data?"
                    points={[
                      "Every resident goes back to a first visit with nothing shared.",
                      "All requests, decisions, uploaded files and access-log entries are deleted.",
                      "This browser is signed out. This can't be undone.",
                    ]}
                    confirmLabel="Yes, reset everything"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
