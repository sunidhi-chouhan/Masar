"use client";

import { useEffect, useRef, useState } from "react";
import { OPTION_LABEL } from "@/lib/signals";
import { MEASURE_INFO } from "@/lib/measure-info";
import { SOURCES } from "@/lib/model";
import type { Dashboard, Series } from "@/lib/dashboard";
import { InsightCard, KnowledgeBoard, type Tx } from "@/components/dashboard/sections";
import { SeriesChart } from "@/components/dashboard/series-chart";
import { HealthTimeline } from "@/components/dashboard/health-timeline";
import { PrepareList } from "@/components/dashboard/prepare-list";
import { Timing } from "@/components/editorial";
import { Pill, Simulated, download, useProto } from "./core";
import { withAudit, withNotice } from "./state";

// The patient's dashboard in the prototype: the same model and components as
// My Path, driven by the prototype's permissions and simulated systems.

const VERDICT: Record<Series["verdict"], { label: string; tone: "soon" | "accent" | "unknown" | "stone" }> = {
  meaningful: { label: "A real change", tone: "soon" },
  normal: { label: "Within normal ups and downs", tone: "accent" },
  single: { label: "One reading: no trend yet", tone: "unknown" },
  too_close: { label: "Too close together to compare", tone: "unknown" },
  noRule: { label: "Shown as recorded", tone: "stone" },
};

export function PatientDashboard() {
  const { s, set, tr, say, date, view, base } = useProto();
  const d = view.dashboard;
  const x: Tx = { t: tr, lang: s.lang, date, say };
  const [section, setSection] = useState("overview");
  const name = base.name.split(" ")[0];
  const sections = [
    ["overview", tr("Overview")],
    ["insights", tr("Insights")],
    ["trends", tr("Trends and labs")],
    ["next", tr("Next steps")],
    ["doctor", tr("Your doctor")],
    ["report", tr("Report")],
  ] as const;
  const shared = SOURCES.filter((src) => ({ self: s.consent.answers, malaffi: s.consent.clinical, lab: s.consent.labs, healthAge: s.consent.healthAge, device: s.consent.device })[src.id]).length;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-32 pt-4 md:px-8">
      <nav aria-label={tr("Sections of your dashboard")} className="sticky top-16 z-30 -mx-4 mb-6 border-b border-rule bg-paper/90 px-4 py-2.5 backdrop-blur-md md:-mx-8 md:px-8">
        <ol className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {sections.map(([id, label], i) => (
            <li key={id} className="shrink-0">
              <a
                href={`#pt-${id}`}
                onClick={() => setSection(id)}
                aria-current={section === id ? "location" : undefined}
                className={`flex min-h-[38px] items-center gap-2 rounded-full px-3.5 text-[13.5px] font-medium ${section === id ? "bg-ink text-paper" : "text-ink-2 hover:bg-surface"}`}
              >
                <span className="font-mono text-[11px] opacity-60">{String(i + 1).padStart(2, "0")}</span>
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* Overview */}
      <section id="pt-overview" className="scroll-mt-32">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="pt-card pt-hero relative overflow-hidden lg:col-span-8">
            <p className="eyebrow">{tr("Your reproductive-health overview")}</p>
            <h1 className="display mt-3 max-w-2xl text-[clamp(1.8rem,3.4vw,2.5rem)] leading-[1.1] text-ink">
              {say({ text: d.headline.line.text, vars: { ...d.headline.line.vars, name } })} <em className="text-accent">{tr(d.headline.emphasis.text)}</em>
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] text-ink-2">{tr("This isn't a diagnosis or a prediction. It describes what you shared, what changed by Masar's published rules, and what is still unknown.")}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {d.urgency ? <Timing urgency={d.urgency} lang={s.lang} /> : null}
              <Pill tone="stone">{tr("{n} of 5 sources shared", { n: shared })}</Pill>
              <Pill tone={s.consent.shareClinician ? "accent" : "stone"}>{s.consent.shareClinician ? tr("Dr Layla can see your summary") : tr("Your doctor can't see your summary")}</Pill>
              <Pill tone={s.consent.ai && s.geminiOn ? "accent" : "stone"}>{s.consent.ai && s.geminiOn ? tr("AI processing on") : tr("AI processing off")}</Pill>
            </div>
            {s.summary ? (
              <div className="mt-5 rounded-[16px] border border-rule bg-surface/80 p-4">
                <p className="flex items-center gap-2 text-[12px] text-ink-3">
                  <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${s.summary.source === "masar" ? "bg-ink-3" : "bg-date"}`} />
                  {s.summary.source === "ai" ? tr("Summary written by Gemini, checked by Masar") : s.summary.source === "mock" ? tr("Summary by the Gemini demo mock, checked by Masar") : tr("Summary written by Masar")}
                </p>
                <ul className="mt-2 grid gap-x-6 gap-y-1.5 md:grid-cols-2">
                  {[...s.summary.data.reproductive_goals.slice(0, 1), ...s.summary.data.areas_to_explore.slice(0, 2), ...s.summary.data.missing_information.slice(0, 1)].map((l) => (
                    <li key={l} className="flex gap-2 text-[13.5px] leading-relaxed text-ink-2">
                      <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {s.summary?.source === "ai" ? l : tr(l)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <PictureCard d={d} />
          <div className="grid gap-4 sm:grid-cols-4 lg:col-span-12">
            {[
              [d.insights.length, tr("Worth a conversation"), "#pt-insights"],
              [d.series.length, tr("Measurements on record"), "#pt-trends"],
              [d.unknown.length, tr("Still unknown"), "#pt-insights"],
              [d.prepare.questions.length, tr("Questions to discuss"), "#pt-doctor"],
            ].map(([n, label, href]) => (
              <a key={String(label)} href={String(href)} className="pt-card pt-lift !py-4">
                <span className="tabular block font-display text-[2rem] leading-none text-ink">{n}</span>
                <span className="mt-1 block text-[13px] text-ink-2">{label}</span>
              </a>
            ))}
          </div>
        </div>
        {s.messages.length ? (
          <div className="pt-card mt-4 border-s-4 border-s-accent">
            <p className="text-[13px] font-semibold text-accent">{tr("Message from Dr Layla Al Hashimi")}</p>
            <p className="mt-1 text-[14.5px] text-ink">{s.messages.filter((m) => m.from === "clinician").at(-1)?.text}</p>
          </div>
        ) : null}
      </section>

      {/* Insights */}
      <section id="pt-insights" className="scroll-mt-32 pt-12">
        <SectionTitle n={2} title={tr("Your health insights")} body={tr("From Masar's published rules only. Each says why it was raised, how strong the evidence is, and what it can't tell you.")} />
        {d.insights.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {d.insights.map((i) => (
              <InsightCard key={i.code} i={i} x={x} />
            ))}
          </div>
        ) : (
          <div className="pt-card text-[15px] text-ink-2">
            <p className="font-semibold text-ink">{tr("Nothing in what you've shared needs a conversation right now.")}</p>
            <p className="mt-1">{tr("That isn't a guarantee: it only covers what Masar can see. The gaps below are what would help Masar say more.")}</p>
          </div>
        )}
        {d.context.map((c) => (
          <div key={c.id} className="pt-card mt-4">
            <Pill tone="unknown">{tr("Context, not a finding")}</Pill>
            <p className="mt-2 text-[15px] font-semibold text-ink">{say(c.title)}</p>
            <p className="mt-1 text-[14px] text-ink-2">{c.body.map((b) => say(b.text)).join(" ")}</p>
          </div>
        ))}
        <h3 className="display mb-4 mt-10 text-[1.45rem] text-ink">{tr("Known, unknown and worth exploring")}</h3>
        <KnowledgeBoard d={d} x={x} />
      </section>

      {/* Trends and labs */}
      <section id="pt-trends" className="scroll-mt-32 pt-12">
        <SectionTitle n={3} title={tr("Trends and lab results")} body={tr("Real readings only. A change is called real only when it passes Masar's published rule; one reading is never a trend.")} />
        <Trends d={d} />
      </section>

      {/* Next steps */}
      <section id="pt-next" className="scroll-mt-32 pt-12">
        <SectionTitle n={4} title={tr("What you could explore next")} body={tr("Suggestions to explore, not medical instructions. Each says why it's there.")} />
        <div className="grid gap-3 md:grid-cols-2">
          {d.actions.map((a) => (
            <div key={a.id} className="pt-card pt-lift !p-4">
              <Pill tone={a.group === "understand" ? "soon" : a.group === "missing" ? "unknown" : a.group === "learn" ? "accent" : "stone"}>
                {tr({ understand: "Understand better", missing: "Information still missing", records: "Results or records to ask about", discuss: "Questions to discuss", learn: "Learn more" }[a.group])}
              </Pill>
              <p className="mt-2 text-[15px] font-medium text-ink">{say(a.title)}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
                <span className="font-medium text-ink-3">{tr("Why it's suggested")}: </span>
                {say(a.why)}
              </p>
            </div>
          ))}
          {[...new Set(d.insights.flatMap((i) => i.options))].map((o) => (
            <div key={o} className="pt-card !p-4">
              <Pill tone="accent">{tr("An option you could discuss")}</Pill>
              <p className="mt-2 text-[15px] font-medium text-ink">{tr(OPTION_LABEL[o].title)}</p>
              <p className="mt-1 text-[13px] text-ink-2">{tr(OPTION_LABEL[o].body)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Doctor */}
      <section id="pt-doctor" className="scroll-mt-32 pt-12">
        {/* The insight cards link to #prepare. */}
        <span id="prepare" aria-hidden className="block scroll-mt-32" />
        <SectionTitle n={5} title={tr("Prepare for your doctor")} body={tr("Questions to ask, what to bring, and a request your doctor can act on.")} />
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="pt-card pt-dark lg:col-span-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/60">{tr("Questions to bring")}</p>
            <div className="mt-3">
              <PrepareList dark copyable storageKey={`pt-q-${s.profileId}`} items={d.prepare.questions.map((q) => tr(q))} labels={{ copy: tr("Copy my questions"), copied: tr("Copied"), heading: tr("My questions:") }} />
            </div>
          </div>
          <div className="pt-card lg:col-span-5">
            <p className="eyebrow">{tr("What to bring")}</p>
            <div className="mt-3">
              <PrepareList storageKey={`pt-b-${s.profileId}`} items={d.prepare.bring.map((b) => say(b))} labels={{ copy: "", copied: "", heading: "" }} />
            </div>
          </div>
        </div>
        <RequestCard d={d} />
      </section>

      {/* Report */}
      <section id="pt-report" className="scroll-mt-32 pt-12">
        <SectionTitle n={6} title={tr("Your personal health report")} body={tr("Everything above in one readable document, with where each statement came from.")} />
        <div className="pt-card flex flex-wrap items-center gap-4">
          <p className="min-w-0 flex-1 text-[14.5px] text-ink-2">{tr("Download it to bring to an appointment, or keep it for yourself. It contains only what you chose to share.")}</p>
          <button
            type="button"
            onClick={() => {
              download(`masar-health-report-${s.profileId}.html`, reportHtml(d, base.name, base.age, tr, say, date, s.lang), "text/html");
              set((y) => withAudit(y, { role: "patient", who: name, what: "Downloaded their health report", allowed: true }));
            }}
            className="btn btn-primary"
          >
            {tr("Download my health report")}
          </button>
        </div>
      </section>

      <Assistant d={d} />
    </div>
  );
}

function SectionTitle({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <header className="mb-5 flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-ink font-mono text-[12px] text-paper">{String(n).padStart(2, "0")}</span>
      <div>
        <h2 className="display text-[clamp(1.5rem,2.8vw,1.95rem)] leading-tight text-ink">{title}</h2>
        <p className="mt-0.5 text-[14.5px] text-ink-2">{body}</p>
      </div>
    </header>
  );
}

function PictureCard({ d }: { d: Dashboard }) {
  const { tr } = useProto();
  const total = d.picture.items.length;
  const R = 44;
  const C = 2 * Math.PI * R;
  const seg = (n: number) => (n / Math.max(1, total)) * C;
  return (
    <div className="pt-card lg:col-span-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{tr("Your picture")}</p>
          <p className="mt-1 text-[15px] font-semibold text-ink">{tr("{on} of {total} pieces on record", { on: d.picture.on, total })}</p>
        </div>
        <svg viewBox="0 0 110 110" className="h-24 w-24 shrink-0 -rotate-90" aria-hidden>
          <circle cx="55" cy="55" r={R} fill="none" strokeWidth="11" className="stroke-zinc-100" />
          <circle cx="55" cy="55" r={R} fill="none" strokeWidth="11" className="ring-seg stroke-accent" strokeDasharray={`${seg(d.picture.on)} ${C}`} />
          <circle cx="55" cy="55" r={R} fill="none" strokeWidth="11" className="ring-seg stroke-indigo-300" strokeDasharray={`${seg(d.picture.missing)} ${C}`} strokeDashoffset={-seg(d.picture.on)} />
        </svg>
      </div>
      <ul className="mt-3 space-y-2">
        {d.picture.items.map((c) => (
          <li key={c.label} className="flex items-center gap-2.5 text-[13.5px]">
            <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${c.status === "on" ? "bg-accent" : c.status === "missing" ? "bg-indigo-300" : "border border-dashed border-unknown"}`} />
            <span className="min-w-0 flex-1 text-ink">{tr(c.label)}</span>
            <span className={`text-[12px] ${c.status === "on" ? "text-accent" : "text-unknown"}`}>{c.status === "on" ? tr("On record") : c.status === "off" ? tr("Not shared") : tr("Not on record yet")}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[12px] text-ink-3">{tr("A list, not a score. Missing information is never counted against you.")}</p>
    </div>
  );
}

function Trends({ d }: { d: Dashboard }) {
  const { s, tr, say, date } = useProto();
  const labels = { usual: tr("Usual range"), printedRange: tr("Range printed on your report"), showValues: tr("Show values"), hideValues: tr("Hide values"), date: tr("Date"), value: tr("Value"), source: tr("Source") };
  const labs = d.series.flatMap((x) => x.points.filter((p) => p.source === "Lab results").map((p) => ({ ...p, label: x.label, unit: x.unit, code: x.code })));
  return (
    <div className="space-y-4">
      {s.sim.labs === "missing" ? (
        <p className="flex flex-wrap items-center gap-2 rounded-[14px] bg-unknown-soft px-4 py-3 text-[13.5px] text-ink">
          <Simulated>{tr("Simulated")}</Simulated>
          {tr("The lab system has no results for you right now, so none are shown.")}
        </p>
      ) : null}
      {d.series.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {d.series.map((x) => (
            <article key={x.code} className="pt-card" aria-label={tr(x.label)}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-[15.5px] font-semibold text-ink">{tr(x.label)}</h3>
                <Pill tone={VERDICT[x.verdict].tone}>{tr(VERDICT[x.verdict].label)}</Pill>
              </div>
              {x.points.length >= 2 ? (
                <div className="mt-3">
                  <SeriesChart points={x.points.map((p) => ({ at: p.at, date: date(p.at), value: p.value, source: tr(p.source) }))} unit={tr(x.unit)} band={x.band} bars={x.code === "cycle_length"} title={tr(x.label)} labels={labels} />
                </div>
              ) : (
                <p className="mt-3">
                  <span className="tabular font-display text-[2rem] text-ink" dir="ltr">
                    {x.points[0]?.value}
                  </span>{" "}
                  <span className="text-[13px] text-ink-3">{tr(x.unit)}</span>
                </p>
              )}
              <p className="mt-2 text-[13.5px] text-ink-2">{say(x.sentence)}</p>
              <p className="mt-1 text-[12.5px] text-ink-3">
                {tr(MEASURE_INFO[x.code].what)} {tr(MEASURE_INFO[x.code].limits)}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="pt-card text-[14.5px] text-ink-2">{tr("Nothing you shared has readings over time yet, so no change can be described.")}</div>
      )}
      {labs.length ? (
        <div className="pt-card overflow-x-auto">
          <h3 className="text-[15.5px] font-semibold text-ink">{tr("Laboratory results")}</h3>
          <table className="mt-3 w-full min-w-[520px] text-[13.5px]">
            <thead>
              <tr className="text-ink-3">
                <th className="py-1.5 text-start font-medium">{tr("Test")}</th>
                <th className="py-1.5 text-start font-medium">{tr("Result")}</th>
                <th className="py-1.5 text-start font-medium">{tr("Date")}</th>
                <th className="py-1.5 text-start font-medium">{tr("Source")}</th>
              </tr>
            </thead>
            <tbody>
              {labs
                .sort((a, b) => b.at.localeCompare(a.at))
                .map((l) => (
                  <tr key={l.code + l.at} className="border-t border-rule">
                    <td className="py-2 text-ink">{tr(l.label)}</td>
                    <td className="tabular py-2 font-semibold text-ink">
                      <span dir="ltr">{l.value}</span> {tr(l.unit)}
                    </td>
                    <td className="py-2 text-ink-2">{date(l.at)}</td>
                    <td className="py-2 text-ink-2">
                      {tr(l.source)}
                      {s.sim.extraLab && l.at === "2026-11-02" ? (
                        <span className="ms-2">
                          <Simulated>{tr("Simulated")}</Simulated>
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {d.timeline.length >= 2 ? (
        <div className="pt-card">
          <h3 className="text-[15.5px] font-semibold text-ink">{tr("Your health timeline")}</h3>
          <div className="mt-3">
            <HealthTimeline
              label={tr("Your health timeline")}
              labels={{ earlier: tr("Earlier"), later: tr("Later") }}
              items={d.timeline.map((e) => ({
                at: e.at,
                year: e.at.slice(0, 4),
                date: date(e.at),
                kind: e.kind,
                kindLabel: tr({ lab: "Lab result", device: "Phone and wearable", healthAge: "Health Age check", malaffi: "Clinic records", self: "You told us", check: "Check", request: "Your doctor", report: "Report" }[e.kind]),
                title: say(e.title),
                detail: e.detail ? say(e.detail) : undefined,
              }))}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

const STEPS = ["requested", "reviewed", "booked", "attended"] as const;

function RequestCard({ d }: { d: Dashboard }) {
  const { s, set, tr, base } = useProto();
  const name = base.name.split(" ")[0];
  if (!s.request) {
    return (
      <div className="pt-card mt-4 flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[15.5px] font-semibold text-ink">{tr("Ask Dr Layla for a conversation")}</p>
          <p className="mt-0.5 text-[13.5px] text-ink-2">
            {s.consent.shareClinician ? tr("She'll see your summary and your questions, nothing else.") : tr("She can only see your summary if you share it with her. Asking will share it.")}
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            set((x) =>
              withAudit(
                withNotice(
                  { ...x, consent: { ...x.consent, shareClinician: true }, request: { at: new Date().toISOString(), status: "requested", questions: d.prepare.questions.slice(0, 3) } },
                  { to: "clinician", tone: "info", text: "{name} asked for a conversation.", vars: { name } },
                ),
                { role: "patient", who: name, what: "Asked Dr Layla for a conversation, and shared their summary", allowed: true },
              ),
            )
          }
          className="btn btn-primary"
        >
          {tr("Ask for a conversation")}
        </button>
      </div>
    );
  }
  const at = STEPS.indexOf(s.request.status);
  return (
    <div className="pt-card mt-4">
      <p className="text-[15.5px] font-semibold text-ink">{tr("Your request to Dr Layla")}</p>
      <ol className="mt-4 grid gap-2 sm:grid-cols-4">
        {STEPS.map((st, i) => (
          <li key={st}>
            <span className={`block h-1.5 rounded-full transition-colors duration-500 ${i <= at ? "bg-accent" : "bg-rule"}`} />
            <span className={`mt-2 block text-[12.5px] ${i <= at ? "font-medium text-ink" : "text-ink-3"}`}>{tr({ requested: "You asked", reviewed: "Your doctor reviewed", booked: "Appointment booked", attended: "Conversation held" }[st])}</span>
          </li>
        ))}
      </ol>
      {s.request.decision ? (
        <p className="mt-4 rounded-[12px] bg-zinc-50 px-4 py-3 text-[14px] text-ink">
          {s.request.decision === "Accept" && tr("Dr Layla agreed and will arrange it.")}
          {s.request.decision === "Modify" && tr("Dr Layla agreed and added a test first, so the conversation can tell you more.")}
          {s.request.decision === "Override" && tr("Dr Layla suggested a different approach: {reason}", { reason: s.request.reason ?? "" })}
        </p>
      ) : null}
    </div>
  );
}

// ---------- the assistant ----------

type Msg = { role: "user" | "masar"; text: string };

function Assistant({ d }: { d: Dashboard }) {
  const { tr, say } = useProto();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const answer = (q: string, intent?: { kind: string; code?: string }) => {
    const text = q.toLowerCase();
    const ins = (intent?.kind === "insight" && d.insights.find((i) => i.code === intent.code)) || d.insights.find((i) => text.includes(tr(i.title).toLowerCase()));
    const ser = (intent?.kind === "measure" && d.series.find((x) => x.code === intent.code)) || d.series.find((x) => text.includes(tr(x.label).toLowerCase()) || /amh|bmi|cycle|دورة/.test(text) && (text.includes(x.code.split("_")[0]) || (x.code === "cycle_length" && /cycle|دورة/.test(text))));
    if (ins) return [tr("{title}.", { title: tr(ins.title) }), tr("Why it matters: {why}", { why: tr(ins.why) }), tr("What it can't tell you: {cannot}", { cannot: tr(ins.cannot) })].join("\n\n");
    if (ser) return [tr("{label}: {what}", { label: tr(ser.label), what: tr(MEASURE_INFO[ser.code].what) }), say(ser.sentence), tr("Its limits: {limits}", { limits: tr(MEASURE_INFO[ser.code].limits) })].join("\n\n");
    if (intent?.kind === "unknown" || /unknown|missing|مجهول|ناقص/.test(text)) return d.unknown.length ? tr("Still unknown: {list}", { list: d.unknown.map((f) => say(f.text)).join(" ") }) : tr("Nothing Masar looks at is missing from your record.");
    if (intent?.kind === "questions" || /doctor|ask|طبيب|أسأل/.test(text)) return d.prepare.questions.map((x, i) => `${i + 1}. ${tr(x)}`).join("\n");
    return d.known.length ? tr("From what you shared, Masar has: {list}", { list: d.known.map((f) => say(f.text)).join(" ") }) : tr("You haven't shared anything Masar can use yet. You can change that in My data.");
  };
  const ask = (q: string, intent?: { kind: string; code?: string }) => {
    setOpen(true);
    setMsgs((m) => [...m, { role: "user", text: q }, { role: "masar", text: answer(q, intent) }]);
  };
  useEffect(() => {
    const on = (e: Event) => {
      const det = (e as CustomEvent<{ text?: string; intent?: { kind: string; code?: string } }>).detail ?? {};
      if (det.text) ask(det.text, det.intent);
      else setOpen(true);
    };
    window.addEventListener("masar:ask", on);
    return () => window.removeEventListener("masar:ask", on);
  });
  useEffect(() => end.current?.scrollIntoView({ block: "end" }), [msgs]);
  const starters = [
    ...(d.insights[0] ? [{ q: tr("Why does “{title}” matter for me?", { title: tr(d.insights[0].title) }), intent: { kind: "insight", code: d.insights[0].code } }] : []),
    { q: tr("What's still unknown about me?"), intent: { kind: "unknown" } },
    ...(d.series[0] ? [{ q: tr("What does the {test} measure, and what can't it tell me?", { test: tr(d.series[0].label) }), intent: { kind: "measure", code: d.series[0].code } }] : []),
    { q: tr("What should I ask my doctor?"), intent: { kind: "questions" } },
  ];
  return (
    <>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="fixed bottom-4 end-4 z-[65] flex min-h-[48px] items-center gap-2 rounded-full border border-rule bg-surface px-4 text-[13.5px] font-semibold text-ink shadow-[0_18px_40px_-14px_rgb(0_0_0/0.35)]">
        <span aria-hidden className="orb" style={{ width: 22, height: 22 }}>
          <span className="orb__core" />
        </span>
        {tr("Ask about your health picture")}
      </button>
      {open ? (
        <div role="dialog" aria-label={tr("Masar assistant")} className="pt-pop fixed bottom-20 end-4 z-[65] flex max-h-[min(70svh,620px)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[22px] border border-rule bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0/0.4)]">
          <header className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3">
            <div>
              <p className="text-[14.5px] font-semibold text-ink">{tr("Masar assistant")}</p>
              <p className="text-[11.5px] text-ink-3">{tr("Explains your authorised picture with Masar's own words. It never diagnoses.")}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={tr("Close")} className="grid h-8 w-8 place-items-center rounded-full text-ink-3 hover:bg-zinc-100">
              ✕
            </button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {!msgs.length ? (
              <div className="grid gap-2">
                {starters.map((x) => (
                  <button key={x.q} type="button" onClick={() => ask(x.q, x.intent)} className="rounded-[14px] border border-rule px-3.5 py-2.5 text-start text-[13.5px] font-medium text-ink hover:border-accent hover:bg-accent-soft">
                    {x.q}
                  </button>
                ))}
              </div>
            ) : null}
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <p key={i} className="ms-auto max-w-[85%] rounded-[16px] bg-accent px-3.5 py-2 text-[14px] text-white">
                  {m.text}
                </p>
              ) : (
                <div key={i} className="max-w-[92%]">
                  <p className="whitespace-pre-line rounded-[16px] bg-zinc-100 px-3.5 py-2.5 text-[14px] leading-relaxed text-ink">{m.text}</p>
                  <p className="mt-1 px-1 text-[11px] text-ink-3">{tr("Masar's own words, from your authorised information")}</p>
                </div>
              ),
            )}
            <div ref={end} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget).get("q");
              if (typeof f === "string" && f.trim()) ask(f.trim());
              e.currentTarget.reset();
            }}
            className="border-t border-rule p-3"
          >
            <label className="sr-only" htmlFor="pt-ask">
              {tr("Ask anything about your results")}
            </label>
            <input id="pt-ask" name="q" placeholder={tr("Ask anything about your results")} className="pt-input" />
            <p className="mt-1.5 text-[11px] text-ink-3">{tr("It explains; it doesn't diagnose. In an emergency, call 999.")}</p>
          </form>
        </div>
      ) : null}
    </>
  );
}

// ---------- the downloadable report ----------

function esc(x: string) {
  return x.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

export function reportHtml(d: Dashboard, name: string, age: number, tr: (t: string, v?: Record<string, string | number>) => string, say: (l: { text: string; vars?: Record<string, string | number> }) => string, date: (iso: string) => string, lang: "en" | "ar") {
  const li = (xs: string[]) => `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  return `<!doctype html><html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(tr("Personal health report"))} · ${esc(name)}</title>
<style>body{font:15px/1.6 system-ui,sans-serif;color:#1c1b18;background:#fff;max-width:760px;margin:40px auto;padding:0 20px}h1{font:600 28px Georgia,serif;margin:0}h2{font:600 19px Georgia,serif;border-bottom:2px solid #1c1b18;padding-bottom:6px;margin-top:32px}small,.m{color:#625e55}li{margin:4px 0}.tag{font:600 11px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em;color:#1e5b56}table{border-collapse:collapse;width:100%}td,th{border-top:1px solid #e2ddd3;padding:6px 8px 6px 0;text-align:start;vertical-align:top}</style></head><body>
<p class="tag">${esc(tr("Personal health report"))} · Masar</p><h1>${esc(name)}</h1><p class="m">${esc(tr("Age {age}", { age }))} · ${esc(tr("Prepared {date}", { date: date(new Date().toISOString()) }))} · ${esc(tr("Synthetic prototype data"))}</p>
<p class="m">${esc(tr("Masar provides educational information and decision support. It does not diagnose, predict fertility or recommend treatment; clinical decisions stay with qualified professionals. Pilot environment: records shown are synthetic."))}</p>
<h2>${esc(tr("What you shared"))}</h2>${li(d.known.map((f) => `${say(f.text)} (${tr(f.source)}${f.date ? ` · ${date(f.date)}` : ""})`))}
<h2>${esc(tr("What Masar found"))}</h2>${d.insights.length ? d.insights.map((i) => `<h3>${esc(tr(i.title))}</h3>${li([...i.because.map((b) => say(b.text)), `${tr("Why it matters")}: ${tr(i.why)} (${tr(i.evidence.citation)})`, `${tr("What this can't tell you")}: ${tr(i.cannot)}`])}`).join("") : `<p>${esc(tr("Nothing in what you've shared needs a conversation right now. That isn't a guarantee: it only covers what Masar can see."))}</p>`}
<h2>${esc(tr("Results over time"))}</h2>${d.series.length ? `<table><tr><th>${esc(tr("Measurement"))}</th><th>${esc(tr("Results"))}</th><th>${esc(tr("What Masar can say"))}</th></tr>${d.series.map((x) => `<tr><td>${esc(tr(x.label))}</td><td>${x.points.map((p) => `${esc(date(p.at))}: ${p.value} ${esc(tr(x.unit))}`).join("<br>")}</td><td>${esc(say(x.sentence))}</td></tr>`).join("")}</table>` : `<p>${esc(tr("Nothing you shared has readings over time yet, so no change can be described."))}</p>`}
<h2>${esc(tr("What remains uncertain"))}</h2>${li([...d.unknown.map((f) => say(f.text)), ...new Set(d.insights.map((i) => tr(i.cannot)))])}
<h2>${esc(tr("Next steps you could discuss"))}</h2>${li(d.actions.map((a) => `${say(a.title)}: ${say(a.why)}`))}
<h2>${esc(tr("Questions to discuss with a healthcare professional"))}</h2><ol>${d.prepare.questions.map((q) => `<li>${esc(tr(q))}</li>`).join("")}</ol>
<h2>${esc(tr("Sources and how to read this"))}</h2>${li([tr("Findings come only from Masar's published rules, applied to the sources you shared. Each cites the guideline behind it."), tr("A change over time is called real only when it passes Masar's published rule; one reading is never a trend.")])}
</body></html>`;
}
