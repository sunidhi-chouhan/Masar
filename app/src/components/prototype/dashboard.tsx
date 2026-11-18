"use client";

import { useEffect, useState } from "react";
import { OPTION_LABEL } from "@/lib/signals";
import { MEASURE_INFO } from "@/lib/measure-info";
import type { Dashboard, Series } from "@/lib/dashboard";
import { InsightCard, KnowledgeBoard, type Tx } from "@/components/dashboard/sections";
import { SeriesChart } from "@/components/dashboard/series-chart";
import { HealthTimeline } from "@/components/dashboard/health-timeline";
import { Timing } from "@/components/editorial";
import { Pill, Simulated, download, useProto } from "./core";
import { downloadPdf, type PdfBlock } from "./report-pdf";
import { withAudit, withNotice } from "./state";
import { MyTrajectory } from "./trajectory";
import { PrepareGuide } from "./prepare-guide";
import { Assistant } from "./assistant";
import { DoorScene, HERO_T, LanternScene, PathHero, Reveal, ReportSheets, heroPoint } from "./scenes";

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
  const { s, set, tr, say, date, view, base, journey, live } = useProto();
  const d = view.dashboard;
  const changes = journey.changes.filter((c) => c.kind !== "data");
  const x: Tx = { t: tr, lang: s.lang, date, say };
  const [section, setSection] = useState("overview");
  const name = base.name.split(" ")[0];
  const sections = [
    ["overview", tr("Overview")],
    ["trajectory", tr("My trajectory")],
    ["insights", tr("What stood out")],
    ["trends", tr("Trends and labs")],
    ["next", tr("Next steps")],
    ["doctor", tr("Prepare")],
    ["report", tr("Report")],
  ] as const;
  // The current chapter follows the reader's scrolling (no scroll handlers: one observer).
  useEffect(() => {
    const els = sections.map(([id]) => document.getElementById(`pt-${id}`)).filter((e): e is HTMLElement => !!e);
    if (typeof IntersectionObserver === "undefined" || !els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setSection(hit.target.id.replace(/^pt-/, ""));
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const go = (id: string) => document.getElementById(`pt-${id}`)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 md:px-8">
      <nav aria-label={tr("Sections of your dashboard")} className="sticky top-16 z-30 -mx-4 mb-5 overflow-hidden border-b border-rule bg-paper/90 px-4 py-2.5 backdrop-blur-md md:-mx-8 md:px-8">
        <ol className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {sections.map(([id, label], i) => (
            <li key={id} className="shrink-0">
              <a
                href={`#pt-${id}`}
                onClick={() => setSection(id)}
                aria-current={section === id ? "location" : undefined}
                className={`flex min-h-[38px] items-center gap-2 rounded-full px-3.5 text-[13.5px] font-medium transition-colors duration-300 ${section === id ? "bg-ink text-paper" : "text-ink-2 hover:bg-surface hover:text-ink"}`}
              >
                <span className="font-mono text-[11px] opacity-60">{String(i + 1).padStart(2, "0")}</span>
                {label}
              </a>
            </li>
          ))}
        </ol>
        <span aria-hidden className="pt-progress absolute inset-x-0 bottom-0 h-[2px] bg-accent" />
      </nav>

      {live?.slots.banner}
      {/* 01 Overview: the starting point, and the path through all seven chapters */}
      <section id="pt-overview" className="scroll-mt-32">
        <div className="overflow-hidden rounded-[28px] border border-rule bg-surface">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="relative z-10 p-6 md:p-8">
              <p className="eyebrow">{tr("Your reproductive health at a glance")}</p>
              <h1 className="display mt-3 max-w-xl text-[clamp(1.8rem,3.2vw,2.45rem)] leading-[1.08] text-ink">
                {say({ text: d.headline.line.text, vars: { ...d.headline.line.vars, name } })} <em className="text-accent">{tr(d.headline.emphasis.text)}</em>
              </h1>
              <p className="mt-3 max-w-xl text-[15px] text-ink-2">{tr("This isn't a diagnosis or a prediction. It's a simple picture of what you shared, what has changed, and what we don't know yet.")}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {d.urgency ? <Timing urgency={d.urgency} lang={s.lang} /> : null}
                <Pill tone={s.consent.shareClinician ? "accent" : "stone"}>{s.consent.shareClinician ? tr("Dr Layla can see your summary") : tr("Your doctor can't see your summary")}</Pill>
                <Pill tone={s.consent.ai && s.geminiOn ? "accent" : "stone"}>{s.consent.ai && s.geminiOn ? tr("AI help is on") : tr("AI help is off")}</Pill>
              </div>
              {s.summary ? (
                <div className="mt-5 border-s-2 border-date ps-4">
                  <p className="text-[12px] text-ink-3">
                    {s.summary.source === "ai" ? tr("Summary written by Gemini, checked by Masar") : s.summary.source === "mock" ? tr("Summary by the Gemini demo mock, checked by Masar") : tr("Summary written by Masar")}
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {[...s.summary.data.areas_to_explore.slice(0, 2), ...s.summary.data.missing_information.slice(0, 1)].map((l) => (
                      <li key={l} className="text-[13.5px] leading-relaxed text-ink-2">
                        {s.summary?.source === "ai" ? l : tr(l)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <JourneyHero
              active={section}
              onGo={go}
              chapters={sections.map(([id, label]) => ({
                id,
                label,
                lit: { overview: true, trajectory: journey.obs.length > 0, insights: d.insights.length > 0, trends: d.series.length > 0, next: d.actions.length > 0, doctor: !!s.guide, report: true }[id] ?? false,
              }))}
            />
          </div>
          {/* one band of facts instead of a wall of cards */}
          <div className="grid border-t border-rule lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4 md:px-8">
              <span className="text-[13px] font-semibold text-ink">{tr("We have {on} of {total} things that help", { on: d.picture.on, total: d.picture.items.length })}</span>
              {d.picture.items.map((c) => (
                <span key={c.label} className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-2">
                  <span aria-hidden className={`h-2 w-2 rounded-full ${c.status === "on" ? "bg-accent" : c.status === "missing" ? "bg-indigo-300" : "border border-dashed border-unknown"}`} />
                  {tr(c.label)}
                  <span className="sr-only">: {c.status === "on" ? tr("On record") : c.status === "off" ? tr("Not shared") : tr("We don't have this yet")}</span>
                </span>
              ))}
              <span className="text-[12px] text-ink-3">{tr("A checklist, not a score.")}</span>
            </div>
            <ul className="grid grid-cols-5 divide-x divide-rule border-t border-rule rtl:divide-x-reverse lg:border-s lg:border-t-0">
              {[
                [changes.length, tr("Changes over time"), "trajectory"],
                [d.insights.length, tr("Worth talking about"), "insights"],
                [d.series.length, tr("Results over time"), "trends"],
                [d.unknown.length, tr("Not known yet"), "insights"],
                [d.prepare.questions.length, tr("Questions"), "doctor"],
              ].map(([n, label, id]) => (
                <li key={String(label)}>
                  <a href={`#pt-${id}`} className="block h-full px-3 py-3 text-center hover:bg-zinc-50 lg:min-w-[104px]">
                    <span className="tabular block font-display text-[1.6rem] leading-none text-ink">{n}</span>
                    <span className="mt-1 block text-[11.5px] leading-tight text-ink-2">{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {s.messages.length ? (
          <div className="pt-card mt-4 border-s-4 border-s-accent">
            <p className="text-[13px] font-semibold text-accent">{tr("Message from Dr Layla Al Hashimi")}</p>
            <p className="mt-1 text-[14.5px] text-ink">{s.messages.filter((m) => m.from === "clinician").at(-1)?.text}</p>
          </div>
        ) : null}
      </section>

      {/* Chapters 2–7 hang on one spine: the same path, continued down the page */}
      <div className="relative lg:ps-16">
        <div aria-hidden className="absolute bottom-24 start-[18px] top-14 hidden w-[3px] overflow-hidden rounded-full bg-rule lg:block">
          <div className="pt-spine-fill h-full w-full rounded-full bg-accent" />
        </div>

        <section id="pt-trajectory" className="pt-chapter scroll-mt-32 pt-10" style={{ ["--tint" as string]: "rgb(200 150 46 / 0.10)", ["--cx" as string]: "80%" }}>
          <SectionTitle n={2} title={tr("My trajectory")} body={tr("How your information has developed since you started tracking: patterns, lifestyle, clinical evidence and wearable signals, each in its own lane.")} />
          <MyTrajectory />
        </section>

        {/* 03 What stood out: a light on the path */}
        <section id="pt-insights" className="pt-chapter scroll-mt-32 pt-12" style={{ ["--tint" as string]: "rgb(30 91 86 / 0.07)", ["--cx" as string]: "15%" }}>
          <SectionTitle n={3} title={tr("What stood out in your record")} body={tr("Each one says why it came up, how strong the evidence is, and what it can't tell you.")} />
          <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="space-y-3 self-start lg:sticky lg:top-36">
              <LanternScene />
              <p className="display text-[1.5rem] leading-tight text-ink">{d.insights.length ? tr("{n} things are worth a conversation", { n: d.insights.length }) : tr("Nothing needs a conversation right now")}</p>
              <p className="text-[13.5px] text-ink-2">{tr("Found by Masar's published rules, only in what you chose to share. A light on part of the path, not the whole of it.")}</p>
            </aside>
            <div className="min-w-0 space-y-4">
              <Reveal className="pt-stagger grid items-start gap-4 xl:grid-cols-2 xl:[&>*:only-child]:col-span-2 [&>*]:min-w-0">
                {d.insights.length ? (
                  d.insights.map((i) => <InsightCard key={i.code} i={i} x={x} />)
                ) : (
                  <div className="pt-card text-[15px] text-ink-2 xl:col-span-2">
                    <p className="font-semibold text-ink">{tr("Nothing in what you've shared needs a conversation right now.")}</p>
                    <p className="mt-1">{tr("That isn't a guarantee: it only covers what we can see. The gaps below are what would help us tell you more.")}</p>
                  </div>
                )}
              </Reveal>
              {d.context.map((c) => (
                <div key={c.id} className="rounded-[18px] border border-dashed border-rule-strong px-5 py-4">
                  <Pill tone="unknown">{tr("Context, not a finding")}</Pill>
                  <p className="mt-2 text-[15px] font-semibold text-ink">{say(c.title)}</p>
                  <p className="mt-1 text-[14px] text-ink-2">{c.body.map((b) => say(b.text)).join(" ")}</p>
                </div>
              ))}
            </div>
          </div>
          <h3 className="display mb-4 mt-8 text-[1.35rem] text-ink">{tr("What we know, what we don't, and what to ask about")}</h3>
          <KnowledgeBoard d={d} x={x} />
        </section>

        {/* 04 Trends and labs */}
        <section id="pt-trends" className="pt-chapter scroll-mt-32 pt-12" style={{ ["--tint" as string]: "rgb(141 185 175 / 0.16)", ["--cx" as string]: "85%" }}>
          <SectionTitle n={4} title={tr("Trends and lab results")} body={tr("These are your actual results. We only call something a real change when it's bigger than the usual ups and downs, and one result on its own can't show a trend.")} />
          <Trends d={d} />
          {live?.slots.reports ? <div className="mt-4">{live.slots.reports}</div> : null}
        </section>

        {/* 05 Next steps: stepping stones from understanding to choices */}
        <section id="pt-next" className="pt-chapter scroll-mt-32 pt-12" style={{ ["--tint" as string]: "rgb(200 150 46 / 0.08)", ["--cx" as string]: "20%" }}>
          <SectionTitle n={5} title={tr("What you could do next")} body={tr("These are ideas, not medical instructions. Each one says why it's here.")} />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <Reveal className="pt-stagger-list">
              <ol className="relative space-y-3">
                <span aria-hidden className="absolute bottom-6 start-[17px] top-6 w-0 border-s-2 border-dashed border-rule-strong" />
                {d.actions.map((a, i) => (
                  <li key={a.id} className="relative flex gap-4">
                    <span aria-hidden className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface font-display text-[1rem] text-ink shadow-[0_0_0_4px_var(--color-paper)] ring-1 ring-rule-strong">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1 rounded-[18px] bg-surface px-4 py-3 ring-1 ring-rule">
                      <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                        {tr({ understand: "Understand better", missing: "Information still missing", records: "Results or records to ask about", discuss: "Questions to discuss", learn: "Learn more" }[a.group])}
                      </p>
                      <p className="mt-1 text-[15px] font-medium text-ink">{say(a.title)}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
                        <span className="font-medium text-ink-3">{tr("Why it's suggested")}: </span>
                        {say(a.why)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
            <div className="self-start rounded-[24px] bg-ink p-5 text-paper lg:sticky lg:top-36">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/60">{tr("Options you could discuss")}</p>
              {[...new Set(d.insights.flatMap((i) => i.options))].length ? (
                <ul className="mt-3 space-y-3">
                  {[...new Set(d.insights.flatMap((i) => i.options))].map((o) => (
                    <li key={o} className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0">
                      <p className="text-[15px] font-medium">{tr(OPTION_LABEL[o].title)}</p>
                      <p className="mt-0.5 text-[13px] text-white/70">{tr(OPTION_LABEL[o].body)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[14px] text-white/75">{tr("Nothing in what you've shared needs a conversation right now.")}</p>
              )}
              <p className="mt-4 text-[12px] text-white/55">{tr("Options to talk through with a professional. Masar never prescribes.")}</p>
            </div>
          </div>
        </section>

        {/* 06 Prepare: the path arrives at the clinic door */}
        <section id="pt-doctor" className="pt-chapter scroll-mt-32 pt-12" style={{ ["--tint" as string]: "rgb(30 91 86 / 0.08)", ["--cx" as string]: "75%" }}>
          {/* The insight cards link to #prepare. */}
          <span id="prepare" aria-hidden className="block scroll-mt-32" />
          <span id="pt-guide" aria-hidden className="block scroll-mt-32" />
          <SectionTitle n={6} title={tr("Prepare for my consultation")} body={tr("A guide from your own timeline, which you edit and share only as you choose. Then, if you want, ask Dr Layla for a conversation.")} />
          <div className="mb-4 grid items-center gap-4 rounded-[24px] bg-surface p-3 ring-1 ring-rule md:grid-cols-[240px_minmax(0,1fr)]">
            <DoorScene />
            <div className="px-2 pb-2 md:px-0 md:pe-4">
              <p className="display text-[1.35rem] leading-snug text-ink">{tr("Walk in knowing what you want to ask.")}</p>
              <ul className="mt-2 grid gap-1.5 text-[13.5px] text-ink-2 sm:grid-cols-2">
                {[tr("What changed, and when"), tr("What is still unknown"), tr("Questions in your own words"), tr("Only what you choose to share")].map((t) => (
                  <li key={t} className="flex gap-2">
                    <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <PrepareGuide />
          {/* signed-in accounts keep their existing request flow, decided and tracked on the server */}
          {live ? live.slots.request : <RequestCard d={d} />}
        </section>

        {/* 07 Report: the journey, on paper. Calm and still, so it is easy to read and export. */}
        <section id="pt-report" className="scroll-mt-32 pt-12">
          <SectionTitle n={7} title={tr("Your personal health report")} body={tr("Everything on this page in one document you can print or save, with where each piece came from.")} />
          <div className="grid items-center gap-6 rounded-[24px] bg-surface p-5 ring-1 ring-rule md:grid-cols-[200px_minmax(0,1fr)] md:p-6">
            <ReportSheets />
            <div>
              <p className="text-[14.5px] text-ink-2">{tr("Download it to bring to an appointment, or keep it for yourself. It contains only what you chose to share.")}</p>
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                {[
                  [tr("What you shared"), d.known.length],
                  [tr("What Masar found"), d.insights.length],
                  [tr("Results over time"), d.series.length],
                  [tr("Still uncertain"), d.unknown.length],
                ].map(([k, v]) => (
                  <div key={String(k)} className="border-s border-rule ps-3">
                    <dt className="text-[12px] text-ink-3">{k}</dt>
                    <dd className="tabular font-display text-[1.4rem] text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void downloadPdf(`masar-health-report-${s.profileId}.pdf`, reportBlocks(d, base.name, base.age, tr, say, date, s.lang), s.lang);
                    set((y) => withAudit(y, { role: "patient", who: name, what: "Downloaded their health report", allowed: true }));
                  }}
                  className="btn btn-primary"
                >
                  {tr("Download PDF")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    download(`masar-health-report-${s.profileId}.json`, reportJson(d, base.name, base.age, tr, say, date, s.lang), "application/json");
                    set((y) => withAudit(y, { role: "patient", who: name, what: "Downloaded their health report", allowed: true }));
                  }}
                  className="btn btn-secondary"
                >
                  {tr("Download JSON")}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Assistant />
    </div>
  );
}

const CHAPTER: Record<number, string> = {
  2: "Patterns over time",
  3: "What begins to stand out",
  4: "The evidence, over time",
  5: "From understanding to choices",
  6: "Getting ready for the conversation",
  7: "Your record of the journey",
};

function SectionTitle({ n, title, body }: { n: number; title: string; body: string }) {
  const { tr } = useProto();
  return (
    <Reveal className="pt-title relative mb-5">
      {/* this chapter's stop on the spine */}
      <span aria-hidden className="pt-node absolute -start-16 top-0 hidden h-10 w-10 place-items-center rounded-full bg-ink font-mono text-[12px] text-paper shadow-[0_0_0_6px_var(--color-paper)] lg:grid">
        {String(n).padStart(2, "0")}
      </span>
      <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
        <span className="rounded-full bg-ink px-2 py-0.5 text-paper lg:hidden">{String(n).padStart(2, "0")}</span>
        {tr("Chapter {n} of 7", { n })} · {tr(CHAPTER[n] ?? "")}
      </p>
      <h2 className="display mt-1.5 text-[clamp(1.6rem,3vw,2.15rem)] leading-tight text-ink">{title}</h2>
      <p className="mt-1 max-w-3xl text-[14.5px] text-ink-2">{body}</p>
    </Reveal>
  );
}

/** The overview's landscape: seven chapters as stops on one path; a walker stands at the chapter you're reading. */
function JourneyHero({ chapters, active, onGo }: { chapters: { id: string; label: string; lit: boolean }[]; active: string; onGo: (id: string) => void }) {
  const { tr } = useProto();
  const at = Math.max(
    0,
    chapters.findIndex((c) => c.id === active),
  );
  const pos = (i: number) => {
    const p = heroPoint(HERO_T[i]);
    return { left: `${(p.x / 600) * 100}%`, top: `${(p.y / 300) * 100}%` };
  };
  return (
    <div className="relative flex items-center bg-gradient-to-b from-[#f5e9d6] to-[#dceae6]" dir="ltr">
      <nav aria-label={tr("Your path through this page")} className="relative aspect-[2/1] w-full">
        <PathHero />
        <ol>
          {chapters.map((c, i) => (
            <li key={c.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={pos(i)}>
              <span className="pt-milestone block" style={{ ["--i" as string]: i }}>
              <button
                type="button"
                onClick={() => onGo(c.id)}
                aria-current={active === c.id ? "location" : undefined}
                aria-label={`${String(i + 1).padStart(2, "0")} ${c.label}${c.lit ? "" : ` · ${tr("Nothing here yet")}`}`}
                className="group flex flex-col items-center"
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full font-mono text-[11px] shadow-[0_0_0_3px_rgb(255_255_255/0.7)] transition-[transform,background-color] duration-300 group-hover:scale-110 ${active === c.id ? "pt-here bg-ink text-paper" : c.lit ? "bg-accent text-white" : "border border-dashed border-unknown bg-white/80 text-ink-3"}`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={`mt-1 hidden whitespace-nowrap rounded-full bg-white/80 px-2 py-0.5 text-[11px] backdrop-blur sm:block ${active === c.id ? "font-semibold text-ink" : "text-ink-2"}`}>{c.label}</span>
              </button>
              </span>
            </li>
          ))}
        </ol>
        {/* the walker, who moves to the chapter being read */}
        <span aria-hidden className="pt-walker pointer-events-none absolute -translate-x-1/2 -translate-y-[115%]" style={pos(at)}>
          <svg width="22" height="34" viewBox="0 0 22 34">
            <circle cx="11" cy="5" r="4.5" fill="#c48d68" />
            <path d="M6 4 q2 -6 8 -3 q2 3 1 5 q-4 -3 -9 -2z" fill="#2c2a25" />
            <path d="M5 11 Q11 8 17 11 L18 24 Q11 26 4 24 Z" fill="var(--color-accent)" />
            <path d="M8 24 L7 33 M14 24 L15 33" stroke="#3a3833" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        </span>
      </nav>
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
        <Reveal className="pt-stagger grid gap-4 lg:grid-cols-2 lg:[&>*:only-child]:col-span-2">
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
        </Reveal>
      ) : (
        <div className="pt-card text-[14.5px] text-ink-2">{tr("Nothing you've shared has been measured more than once yet, so we can't see any changes.")}</div>
      )}
      <div className="grid items-start gap-4 xl:grid-cols-2 xl:[&>*:only-child]:col-span-2 [&>*]:min-w-0">
        {labs.length ? (
          <div className="pt-card overflow-x-auto">
            <h3 className="text-[15.5px] font-semibold text-ink">{tr("Laboratory results")}</h3>
            <table className="mt-3 w-full min-w-[420px] text-[13.5px]">
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
          <p className="mt-0.5 text-[13.5px] text-ink-2">{s.consent.shareClinician ? tr("She'll see your summary and your questions, nothing else.") : tr("She can only see your summary if you share it with her. Asking will share it.")}</p>
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

// ---------- the downloadable report ----------

type Tr = (t: string, v?: Record<string, string | number>) => string;
type Say = (l: { text: string; vars?: Record<string, string | number> }) => string;

/** The same report as the on-screen summary, as JSON the person can keep. */
export function reportJson(d: Dashboard, name: string, age: number, tr: Tr, say: Say, date: (iso: string) => string, lang: "en" | "ar") {
  const preparedAt = new Date().toISOString();
  return JSON.stringify(
    {
      document: tr("Personal health report"),
      product: "Masar",
      name,
      age,
      language: lang,
      preparedAt,
      prepared: date(preparedAt),
      data: tr("Synthetic prototype data"),
      notice: tr("Masar provides educational information and decision support. It does not diagnose, predict fertility or recommend treatment; clinical decisions stay with qualified professionals. Pilot environment: records shown are synthetic."),
      whatYouShared: d.known.map((f) => ({
        statement: say(f.text),
        source: tr(f.source),
        date: f.date ? date(f.date) : null,
      })),
      whatMasarFound: d.insights.map((i) => ({
        title: tr(i.title),
        because: i.because.map((b) => say(b.text)),
        whyItMatters: tr(i.why),
        evidence: tr(i.evidence.citation),
        whatThisCantTellYou: tr(i.cannot),
      })),
      whatMasarFoundNote: d.insights.length ? null : tr("Nothing you've shared needs a conversation right now. That isn't a guarantee: it only covers what we can see."),
      resultsOverTime: d.series.map((x) => ({
        measurement: tr(x.label),
        unit: tr(x.unit),
        whatMasarCanSay: say(x.sentence),
        results: x.points.map((p) => ({ date: date(p.at), value: p.value, source: tr(p.source) })),
      })),
      resultsOverTimeNote: d.series.length ? null : tr("Nothing you've shared has been measured more than once yet, so we can't see any changes."),
      whatRemainsUncertain: [...d.unknown.map((f) => say(f.text)), ...new Set(d.insights.map((i) => tr(i.cannot)))],
      nextStepsYouCouldDiscuss: d.actions.map((a) => ({ step: say(a.title), why: say(a.why) })),
      questionsToDiscuss: d.prepare.questions.map((q) => tr(q)),
      howToReadThis: [
        tr("Everything we noticed comes from Masar's published rules, used only on what you chose to share. Each one names the medical guideline behind it."),
        tr("We only call something a real change when it's bigger than the usual ups and downs. One result on its own can't show a trend."),
      ],
    },
    null,
    2,
  );
}

/** The same report, laid out for the PDF file. */
export function reportBlocks(d: Dashboard, name: string, age: number, tr: Tr, say: Say, date: (iso: string) => string, lang: "en" | "ar"): PdfBlock[] {
  const preparedAt = new Date().toISOString();
  const blocks: PdfBlock[] = [
    { kind: "kicker", text: lang === "ar" ? `${tr("Personal health report")} · Masar` : `${tr("Personal health report").toUpperCase()} · MASAR` },
    { kind: "title", text: name },
    { kind: "meta", text: `${tr("Age {age}", { age })} · ${tr("Prepared {date}", { date: date(preparedAt) })} · ${tr("Synthetic prototype data")}` },
    {
      kind: "notice",
      text: tr("Masar provides educational information and decision support. It does not diagnose, predict fertility or recommend treatment; clinical decisions stay with qualified professionals. Pilot environment: records shown are synthetic."),
    },
    { kind: "h2", text: tr("What you shared") },
    ...d.known.map((f) => ({ kind: "li" as const, text: `${say(f.text)} (${tr(f.source)}${f.date ? ` · ${date(f.date)}` : ""})` })),
    { kind: "h2", text: tr("What Masar found") },
  ];
  if (!d.insights.length) {
    blocks.push({ kind: "p", text: tr("Nothing you've shared needs a conversation right now. That isn't a guarantee: it only covers what we can see.") });
  }
  for (const i of d.insights) {
    blocks.push({ kind: "h3", text: tr(i.title) });
    for (const b of i.because) blocks.push({ kind: "li", text: say(b.text) });
    blocks.push({ kind: "p", text: `${tr("Why it matters")}: ${tr(i.why)} (${tr(i.evidence.citation)})` });
    blocks.push({ kind: "p", text: `${tr("What this can't tell you")}: ${tr(i.cannot)}` });
  }
  blocks.push({ kind: "h2", text: tr("Results over time") });
  if (!d.series.length) blocks.push({ kind: "p", text: tr("Nothing you've shared has been measured more than once yet, so we can't see any changes.") });
  for (const x of d.series) {
    blocks.push({ kind: "h3", text: tr(x.label) });
    blocks.push({ kind: "p", text: say(x.sentence) });
    for (const p of x.points) blocks.push({ kind: "li", text: `${date(p.at)}: ${p.value} ${tr(x.unit)} · ${tr(p.source)}` });
  }
  blocks.push({ kind: "h2", text: tr("What we still can't say") });
  for (const line of [...d.unknown.map((f) => say(f.text)), ...new Set(d.insights.map((i) => tr(i.cannot)))]) blocks.push({ kind: "li", text: line });
  blocks.push({ kind: "h2", text: tr("Next steps you could discuss") });
  for (const a of d.actions) blocks.push({ kind: "li", text: `${say(a.title)}: ${say(a.why)}` });
  blocks.push({ kind: "h2", text: tr("Questions to discuss with a healthcare professional") });
  for (const q of d.prepare.questions) blocks.push({ kind: "li", text: tr(q) });
  blocks.push({ kind: "h2", text: tr("Where this comes from, and how to read it") });
  blocks.push({ kind: "li", text: tr("Everything we noticed comes from Masar's published rules, used only on what you chose to share. Each one names the medical guideline behind it.") });
  blocks.push({ kind: "li", text: tr("We only call something a real change when it's bigger than the usual ups and downs. One result on its own can't show a trend.") });
  return blocks;
}
