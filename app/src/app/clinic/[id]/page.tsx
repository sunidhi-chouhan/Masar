import Link from "next/link";
import { TrajectoryChart } from "@/components/trajectory-chart";
import { Pill, Shell, URGENCY_PILL, VERDICT_PILL, formatDate } from "@/components/ui";
import { INTENTION_LABEL, SOURCES, TOUCHPOINT_LABEL } from "@/lib/model";
import { OPTION_LABEL, RULES, clinicalReason } from "@/lib/signals";
import { VisitBriefButton } from "@/components/visit-brief";
import { clinicianAttended, clinicianBook, clinicianDecide, clinicianRequestReport } from "@/server/actions";
import { TESTS } from "@/server/ai/reports";
import { requireRole } from "@/server/session";
import { SubmitButton } from "@/components/submit-button";
import { clinicianView } from "@/server/views";
import { ClinicJump } from "@/components/clinic-jump";
import { Icon, type IconName } from "@/components/dashboard/icons";

function H2({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 font-semibold tracking-[-0.025em] text-[1.4rem] text-zinc-950 sm:text-[1.5rem]">
      <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-indigo-600">
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>
      {children}
    </h2>
  );
}

// Per-user page: it reads the session on every request, so it is never prerendered.
export const instant = false;

export default async function Review({ params }: PageProps<"/clinic/[id]">) {
  const { id } = await params;
  const session = await requireRole("clinician");
  const v = clinicianView(id, session);

  if (!v) {
    return (
      <Shell session={session}>
        <div className="card mx-auto max-w-xl p-8 text-center">
          <span aria-hidden className="lock-shake mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-rose-600">
            <Icon name="lock" className="h-8 w-8" />
          </span>
          <Pill tone="clay">Not shared with you</Pill>
          <p className="mt-4 font-semibold tracking-[-0.025em] text-[1.8rem] text-zinc-950">This patient has not shared their summary with you.</p>
          <p className="mt-2 text-[14px] text-zinc-600">The attempt has been recorded in their access log.</p>
          <Link href="/clinic" className="mt-6 inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-medium text-indigo-600">
            <Icon name="back" className="h-4 w-4" />
            Back to the list
          </Link>
        </div>
      </Shell>
    );
  }

  const r = v.resident;
  const req = v.state.request;
  const live = Boolean(r.hero);
  const sharedSources = SOURCES.filter((s) => v.state.sources[s.id]).map((s) => s.label);
  // Synthetic identifiers, masked the way a clinical system shows them.
  const digits = String(Math.abs([...r.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7))).padStart(7, "0");
  const mrn = `AD-${digits.slice(0, 7)}`;
  const eid = `784-••••-•••${digits.slice(-4)}-•`;
  const lastSeen = `${TOUCHPOINT_LABEL[r.touchpoint.kind]}, ${formatDate(r.touchpoint.at)}`;
  const next = req?.bookedFor ? formatDate(req.bookedFor) : req ? "To be booked" : "None";
  const deciding = live && req?.status === "requested";
  const jump: { id: string; label: string; icon: IconName; badge?: string }[] = [
    { id: "why", label: "Why flagged", icon: "flag", badge: String(v.signals.length) },
    { id: "trends", label: "Trends", icon: "chart" },
    { id: "factors", label: "Factors and gaps", icon: "clipboard" },
    { id: "request", label: deciding ? "Your decision" : "Request", icon: "chat", badge: deciding ? "!" : undefined },
    ...(live ? [{ id: "tests", label: "Test results", icon: "flask" as IconName }] : []),
  ];

  return (
    <Shell session={session} wide>
      <Link href="/clinic" className="-ms-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-2 text-[13.5px] font-medium text-zinc-600 hover:text-indigo-600">
        <Icon name="back" className="h-4 w-4" />
        Patients to talk to
      </Link>

      <div className="accent-panel mt-2 p-5 sm:p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-semibold tracking-[-0.025em] text-[clamp(1.9rem,3vw,2.6rem)] leading-tight text-white">
            {r.name}, {r.age}
          </h1>
          {v.urgency ? (
            <span className="rounded-full bg-white px-2.5 py-1 text-[12px] font-medium text-indigo-950">{URGENCY_PILL[v.urgency].label}</span>
          ) : null}
        </div>
        <p className="mt-2 text-[14px] text-white/75">
          {r.sex === "female" ? "Woman" : "Man"} · {v.record.intention ? INTENTION_LABEL[v.record.intention] : "Plans not shared"}
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/15 pt-4 text-[13px] sm:grid-cols-4 sm:gap-x-6">
          {[
            ["Medical record no.", mrn],
            ["Emirates ID", eid],
            ["Last seen", lastSeen],
            ["Next visit", next],
          ].map(([k, val]) => (
            <div key={k}>
              <dt className="text-white/55">{k}</dt>
              <dd className="tabular mt-0.5 font-medium text-white">{val}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 border-t border-white/15 pt-4 text-[13px] text-white/65">
          Shared with you: {sharedSources.join(", ") || "nothing yet"}. Masar suggests a conversation; it does not diagnose. Clinical decisions are yours.
        </p>
        <div className="mt-4">
          <VisitBriefButton patientId={r.id} />
        </div>
      </div>

      {!live ? (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-400/70 bg-white px-5 py-3 text-[13.5px] text-zinc-600">
          <span className="font-semibold text-zinc-900">Example patient, read only.</span> This record fills out the list. Decisions, bookings and test
          requests work for patients who share with you through Masar: Noura, Arjun and Maryam.
        </p>
      ) : null}

      <ClinicJump items={jump} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section id="why" className="reveal card scroll-mt-[190px] md:scroll-mt-36 lg:scroll-mt-24 p-5 sm:p-6">
            <H2 icon="flag">Why this was flagged</H2>
            <ul className="mt-4 space-y-4">
              {v.signals.map((s) => (
                <li key={s.code} className="rounded-2xl border border-zinc-200 p-4">
                  <p className="text-[15px] font-semibold text-zinc-950">{RULES[s.code].clinicalTitle}</p>
                  <ul className="mt-1 text-[14px] text-zinc-800">
                    {s.reasons.map((x) => (
                      <li key={x}>· {clinicalReason(x)}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[12.5px] text-zinc-500">
                    {RULES[s.code].evidence.citation} · {RULES[s.code].evidence.strength} evidence
                  </p>
                  <p className="mt-1 text-[12.5px] text-zinc-500">What the patient is told this cannot show: {RULES[s.code].cannotTell}</p>
                </li>
              ))}
            </ul>
          </section>

          <section id="trends" className="reveal card scroll-mt-[190px] md:scroll-mt-36 lg:scroll-mt-24 p-5 sm:p-6">
            <H2 icon="chart">Trends</H2>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              {v.measures.map((m) => (
                <div key={m.def.code}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[14px] font-semibold text-zinc-950">{m.def.label}</p>
                    <Pill tone={VERDICT_PILL[m.verdict].tone}>{VERDICT_PILL[m.verdict].label}</Pill>
                  </div>
                  <p className="text-[12.5px] text-zinc-500">{m.sentence}</p>
                  <TrajectoryChart view={m} />
                </div>
              ))}
            </div>
          </section>

          <section id="factors" className="reveal card scroll-mt-[190px] md:scroll-mt-36 lg:scroll-mt-24 p-5 sm:p-6">
            <H2 icon="clipboard">Factors and gaps</H2>
            <div className="mt-4 flex flex-wrap gap-2">
              {v.factors.map((f) => (
                <Pill key={f.label + f.value} tone={f.canChange ? "pine" : "stone"}>
                  {f.label}: {f.value}
                </Pill>
              ))}
            </div>
            {v.missing.length ? (
              <ul className="mt-4 space-y-1 text-[13.5px] text-zinc-600">
                {v.missing.map((m) => (
                  <li key={m}>· Missing: {m}</li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>

        <aside className="space-y-6">
          <section id="request" className="card scroll-mt-[190px] md:scroll-mt-36 lg:scroll-mt-24 border-indigo-200/70 p-5 shadow-[0_0_0_4px_var(--color-indigo-50)] sm:p-6">
            <H2 icon="chat">Patient&apos;s request</H2>
            {req ? (
              <>
                <p className="mt-2 text-[15px] font-semibold text-zinc-950">{OPTION_LABEL[req.option].title}</p>
                <p className="text-[12.5px] text-zinc-500">Asked {formatDate(req.at)}</p>
                {req.questions.length ? (
                  <ul className="mt-3 space-y-1.5 text-[13.5px] text-zinc-800">
                    {req.questions.map((q) => (
                      <li key={q}>“{q}”</li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <p className="mt-2 text-[14px] text-zinc-600">No request yet. The patient has been told why Masar suggested a conversation.</p>
            )}

            {live && req && req.status === "requested" ? (
              <form id="decision" action={clinicianDecide.bind(null, r.id)} className="mt-5 scroll-mt-[190px] md:scroll-mt-36 lg:scroll-mt-24 space-y-3 border-t border-zinc-200 pt-5">
                <p className="text-[14px] font-semibold text-zinc-950">Your decision</p>
                <div className="grid grid-cols-3 gap-1 rounded-full bg-zinc-100 p-1 text-[13px]">
                  {[
                    ["Accept", "Accept"],
                    ["Modify", "Add a test"],
                    ["Override", "Disagree"],
                  ].map(([value, label], i) => (
                    <label key={value} className="cursor-pointer">
                      <input type="radio" name="decision" value={value} defaultChecked={i === 0} className="peer sr-only" />
                      <span className="flex min-h-[40px] items-center justify-center rounded-full px-1 text-center leading-tight text-zinc-600 transition-all peer-checked:bg-white peer-checked:font-medium peer-checked:text-indigo-600 peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-400">
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
                <input
                  name="reason"
                  placeholder="Why you disagree (needed if you disagree)"
                  className="w-full min-h-[44px] rounded-xl border border-zinc-300 px-3 py-2 text-[15px] outline-none focus:border-indigo-500"
                />
                <textarea
                  name="note"
                  rows={2}
                  placeholder="Note to the patient (optional)"
                  className="w-full min-h-[44px] rounded-xl border border-zinc-300 px-3 py-2 text-[15px] outline-none focus:border-indigo-500"
                />
                <SubmitButton pendingLabel="Recording" className="w-full min-h-[48px] rounded-full bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Record decision</SubmitButton>
                <p className="text-[12px] text-zinc-500">Your decisions help us learn how often Masar gets it right.</p>
              </form>
            ) : null}

            {live && req?.status === "reviewed" ? (
              <form action={clinicianBook.bind(null, r.id)} className="mt-5 border-t border-zinc-200 pt-5">
                <p className="mb-3 text-[14px] text-zinc-800">
                  Decision recorded: <span className="font-semibold">{{ Accept: "Agreed", Modify: "Agreed, with a test", Override: "Disagreed" }[req.decision ?? "Accept"]}</span>
                </p>
                <SubmitButton pendingLabel="Booking" className="w-full min-h-[48px] rounded-full bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Book a conversation</SubmitButton>
              </form>
            ) : null}

            {live && req?.status === "booked" ? (
              <form action={clinicianAttended.bind(null, r.id)} className="mt-5 border-t border-zinc-200 pt-5">
                <p className="mb-3 text-[14px] text-zinc-800">Booked for {req.bookedFor ? formatDate(req.bookedFor) : "—"}.</p>
                <button className="w-full min-h-[48px] rounded-full border border-zinc-300 bg-white py-2.5 text-sm font-semibold text-zinc-950 hover:border-zinc-400">
                  Mark conversation held
                </button>
              </form>
            ) : null}

            {live && req?.status === "attended" ? <p className="mt-5 border-t border-zinc-200 pt-5 text-[14px] text-indigo-600">Conversation held. Outcome recorded.</p> : null}
          </section>

          {live ? (
            <section id="tests" className="card scroll-mt-[190px] md:scroll-mt-36 lg:scroll-mt-24 p-5 sm:p-6">
              <H2 icon="flask">Test results</H2>
              {!v.state.sources.lab ? (
                <p className="mt-2 rounded-xl bg-zinc-100 px-3.5 py-2.5 text-[13.5px] text-zinc-700">
                  The patient has switched off Lab results, so uploaded reports, their values and files are not shared with you.
                </p>
              ) : v.state.reports.length ? (
                <ul className="mt-4 space-y-4">
                  {v.state.reports.map((rep) => (
                    <li key={rep.id} className="rounded-2xl border border-zinc-200 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[14px] font-semibold text-zinc-950">{rep.test}</p>
                        <Pill tone={rep.status === "requested" ? "gold" : rep.status === "uploaded" ? "slate" : "pine"} dot={false}>
                          {rep.status === "requested" ? "Waiting" : rep.status === "uploaded" ? "Patient checking" : "Confirmed"}
                        </Pill>
                      </div>
                      <p className="text-[12.5px] text-zinc-500">
                        Asked {formatDate(rep.requestedAt)}
                        {rep.uploadedAt ? ` · uploaded ${formatDate(rep.uploadedAt)}` : ""}
                      </p>
                      {rep.forDoctor ? (
                        <div className="mt-3 rounded-xl bg-indigo-50/70 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-indigo-600">
                            {rep.readBy === "ai" ? "Summary (read automatically, check the file)" : "Note"}
                          </p>
                          <p className="mt-1 text-[13.5px] leading-relaxed text-indigo-950">{rep.forDoctor}</p>
                        </div>
                      ) : null}
                      {rep.values?.length ? (
                        <ul className="mt-3 space-y-1 text-[13.5px]">
                          {rep.values.map((x, i) => (
                            <li key={i} className="flex justify-between gap-3">
                              <span className="text-zinc-600">{x.name}</span>
                              <span className="tabular font-semibold text-zinc-950">
                                {x.value} <span className="font-normal text-zinc-500">{x.unit}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {rep.status === "confirmed" ? (
                        <p className="mt-2 text-[12px] text-zinc-500">{rep.values?.length ? "The patient confirmed these values." : "The patient sent you this file."}</p>
                      ) : null}
                      {rep.file ? (
                        <a href={`/api/reports/${r.id}/${rep.id}`} target="_blank" className="mt-3 inline-block text-[13.5px] font-medium text-indigo-600 hover:underline">
                          Open the original file
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[14px] text-zinc-600">Ask the patient to upload a result they already have. They will check the values before you see them.</p>
              )}
              <form action={clinicianRequestReport.bind(null, r.id)} className="mt-5 space-y-3 border-t border-zinc-200 pt-5">
                <p className="text-[14px] font-semibold text-zinc-950">Ask for a test result</p>
                <select name="test" className="w-full min-h-[44px] rounded-xl border border-zinc-300 bg-white px-3 py-2 text-[15px] outline-none focus:border-indigo-500">
                  {TESTS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <input
                  name="note"
                  placeholder="Message to the patient (optional)"
                  className="w-full min-h-[44px] rounded-xl border border-zinc-300 px-3 py-2 text-[15px] outline-none focus:border-indigo-500"
                />
                <SubmitButton pendingLabel="Sending" className="w-full min-h-[48px] rounded-full border border-zinc-300 bg-white py-2.5 text-sm font-semibold text-zinc-950 hover:border-indigo-400">
                  Send request
                </SubmitButton>
              </form>
            </section>
          ) : null}
        </aside>
      </div>

      {deciding ? (
        <a
          href="#decision"
          className="decide-fab fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] end-4 z-30 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-indigo-600 px-5 text-[15px] font-semibold text-white shadow-[0_14px_30px_-10px_rgb(30_91_86/0.6)] lg:hidden"
        >
          <Icon name="check" className="h-5 w-5" />
          Your decision
        </a>
      ) : null}
    </Shell>
  );
}
