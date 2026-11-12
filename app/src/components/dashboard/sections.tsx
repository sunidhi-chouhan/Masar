import type { ReactNode } from "react";
import Link from "next/link";
import type { Dashboard, Fact, Insight, Series, Topic } from "@/lib/dashboard";
import { TOPIC_TITLE } from "@/lib/dashboard";
import type { Line } from "@/lib/path";
import { OPTION_LABEL } from "@/lib/signals";
import type { Lang } from "@/lib/i18n";
import { Tag, Timing } from "@/components/editorial";
import { AskButton } from "@/components/companion";
import { Icon, TopicIcon, type IconName } from "./icons";
import { SeriesChart } from "./series-chart";
import { HealthTimeline } from "./health-timeline";
import { PrepareList } from "./prepare-list";
import { PathIllustration } from "./illustration";

// The dashboard's sections, rendered on the server from the dashboard model.
// Every sentence shown comes from the model (and so from Masar's rules) or is
// fixed interface copy; each statement carries its certainty and source.

export interface Tx {
  t: (text: string, vars?: Record<string, string | number>) => string;
  lang: Lang;
  date: (iso: string) => string;
  say: (line: Line) => string;
}

/** A section frame: icon, number, title and a one-line standfirst. */
export function DashSection({ id, n, icon, title, body, children }: { id: string; n: number; icon: IconName; title: string; body?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="dash-section scroll-mt-32 pt-12 first:pt-2">
      <header className="mb-6 flex items-start gap-4">
        <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-ink text-paper">
          <Icon name={icon} />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-ink-3">{String(n).padStart(2, "0")}</p>
          <h2 id={`${id}-title`} className="display text-[clamp(1.6rem,3vw,2.05rem)] leading-tight text-ink">
            {title}
          </h2>
          {body ? <p className="mt-1 max-w-3xl text-[15px] leading-relaxed text-ink-2">{body}</p> : null}
        </div>
      </header>
      {children}
    </section>
  );
}

function Source({ f, x }: { f: Fact; x: Tx }) {
  return (
    <span className="text-[12px] text-ink-3">
      {x.t(f.source)}
      {f.date ? ` · ${x.date(f.date)}` : ""}
    </span>
  );
}

// ---------- 1. Overview ----------

export function Overview({
  d,
  x,
  shared,
  summary,
}: {
  d: Dashboard;
  x: Tx;
  shared: { doctor: boolean; assistant: "off" | "on" | "mock" | "notConnected" };
  summary: { lines: string[]; from: "ai" | "mock" | "masar" };
}) {
  const total = d.picture.items.length;
  const R = 46;
  const C = 2 * Math.PI * R;
  const seg = (count: number) => (count / Math.max(1, total)) * C;
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* Greeting */}
      <div className="dash-card dash-hero relative overflow-hidden lg:col-span-8">
        <PathIllustration className="pointer-events-none absolute -bottom-10 -end-8 hidden h-[210px] w-[300px] opacity-80 xl:block" />
        <div className="relative max-w-xl xl:max-w-[34rem]">
          <p className="eyebrow">{x.t("Your reproductive-health overview")}</p>
          <h1 className="display mt-3 text-[clamp(1.85rem,3.6vw,2.6rem)] leading-[1.1] text-ink">
            {x.say({ text: d.headline.line.text, vars: { ...d.headline.line.vars, name: d.name } })} <em className="text-accent">{x.t(d.headline.emphasis.text)}</em>
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
            {d.insights.length
              ? x.t("This isn't a diagnosis or a prediction. It's a reason to talk to a doctor while you have the most options.")
              : x.t("Masar can only speak to what is on record, and some useful information isn't yet. If your records change, Masar looks again.")}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {d.urgency ? <Timing urgency={d.urgency} lang={x.lang} /> : null}
            <a href={d.insights.length ? "#insights" : "#explore"} className="btn btn-primary !min-h-[42px] text-[14px]">
              {d.insights.length ? x.t("See your insights") : x.t("See what could help")}
            </a>
            <a href="#prepare" className="btn btn-secondary !min-h-[42px] text-[14px]">
              {x.t("Prepare for your doctor")}
            </a>
          </div>
          <ul className="mt-6 flex flex-wrap gap-2 text-[12.5px]">
            <li className="dash-chip">
              <Icon name="plug" className="h-4 w-4" />
              {x.t("{n} of 5 sources shared", { n: d.sourcesShared })}
            </li>
            <li className="dash-chip">
              <Icon name="shield" className="h-4 w-4" />
              {shared.doctor ? x.t("Your doctor can see your summary") : x.t("Your doctor can't see your summary")}
            </li>
            <li className="dash-chip">
              <Icon name="spark" className="h-4 w-4" />
              {shared.assistant === "off"
                ? x.t("Assistant off: Masar's own words")
                : shared.assistant === "on"
                  ? x.t("Assistant on (Google Gemini)")
                  : shared.assistant === "mock"
                    ? x.t("Assistant on (demo mock, no live model call)")
                    : x.t("Assistant on, not connected here")}
            </li>
            <li>
              <Link href="/me/privacy" className="link inline-flex min-h-[32px] items-center">
                {x.t("Change what you share")}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* The picture: what's on record, missing or switched off. A list, not a score. */}
      <div className="dash-card lg:col-span-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">{x.t("Your picture")}</p>
            <p className="mt-1 text-[15px] font-semibold text-ink">{x.t("{on} of {total} pieces on record", { on: d.picture.on, total })}</p>
          </div>
          <svg viewBox="0 0 120 120" className="h-24 w-24 shrink-0 -rotate-90" aria-hidden>
            <circle cx="60" cy="60" r={R} fill="none" strokeWidth="12" className="stroke-zinc-100" />
            <circle cx="60" cy="60" r={R} fill="none" strokeWidth="12" className="ring-seg stroke-accent" strokeDasharray={`${seg(d.picture.on)} ${C}`} strokeLinecap="butt" />
            <circle cx="60" cy="60" r={R} fill="none" strokeWidth="12" className="ring-seg stroke-indigo-300" strokeDasharray={`${seg(d.picture.missing)} ${C}`} strokeDashoffset={-seg(d.picture.on)} />
            <circle cx="60" cy="60" r={R} fill="none" strokeWidth="12" className="ring-seg stroke-unknown-soft" strokeDasharray={`${seg(d.picture.off)} ${C}`} strokeDashoffset={-seg(d.picture.on + d.picture.missing)} />
          </svg>
        </div>
        <ul className="mt-3 space-y-2">
          {d.picture.items.map((c) => (
            <li key={c.label} className="flex items-center gap-2.5 text-[13.5px]">
              <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${c.status === "on" ? "bg-accent" : c.status === "missing" ? "bg-indigo-300" : "border border-dashed border-unknown"}`} />
              <span className="min-w-0 flex-1 text-ink">{x.t(c.label)}</span>
              <span className={`text-[12px] ${c.status === "on" ? "text-accent" : "text-unknown"}`}>
                {c.status === "on" ? x.t("On record") : c.status === "off" ? x.t("Not shared") : x.t("Not on record yet")}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] text-ink-3">{x.t("A list, not a score. Missing information is never counted against you.")}</p>
      </div>

      {/* At a glance */}
      <div className="grid gap-4 sm:grid-cols-3 lg:col-span-12">
        {[
          { icon: "spark" as IconName, n: d.insights.length, label: x.t("Worth a conversation"), href: "#insights" },
          { icon: "chart" as IconName, n: d.series.length, label: x.t("Measurements on record"), href: "#over-time" },
          { icon: "question" as IconName, n: d.unknown.length, label: x.t("Still unknown"), href: "#known" },
        ].map((s) => (
          <a key={s.label} href={s.href} className="dash-card dash-stat group flex items-center gap-4 !py-4">
            <span aria-hidden className="grid h-10 w-10 place-items-center rounded-[12px] bg-accent-soft text-accent">
              <Icon name={s.icon} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="tabular block font-display text-[1.9rem] leading-none text-ink">{s.n}</span>
              <span className="mt-1 block text-[13px] text-ink-2">{s.label}</span>
            </span>
            <Icon name="arrow" className="h-4 w-4 text-ink-3 transition-transform group-hover:translate-x-0.5" />
          </a>
        ))}
      </div>

      {summary.lines.length ? (
        <div className="dash-card lg:col-span-12">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="eyebrow">{x.t("Your summary")}</p>
            <p className="flex items-center gap-1.5 text-[12px] text-ink-3">
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${summary.from === "masar" ? "bg-ink-3" : "bg-date"}`} />
              {summary.from === "ai"
                ? x.t("Written by Masar's assistant (Google Gemini) from what you shared, and checked by Masar.")
                : summary.from === "mock"
                  ? x.t("Written by the Gemini demo mock (no live model call), and checked by Masar.")
                  : x.t("Masar's own summary of what you shared.")}
            </p>
          </div>
          <ul className="mt-3 grid gap-x-8 gap-y-2 md:grid-cols-2">
            {summary.lines.map((l) => (
              <li key={l} className="flex gap-2.5 text-[14.5px] leading-relaxed text-ink-2">
                <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {l}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

// ---------- 2. Insights ----------

const STRENGTH: Record<Insight["evidence"]["strength"], number> = { Moderate: 2, Strong: 3 };

export function InsightCard({ i, x }: { i: Insight; x: Tx }) {
  return (
    <article id={`insight-${i.code}`} aria-labelledby={`insight-${i.code}-t`} className="dash-card dash-insight reveal flex scroll-mt-32 flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-[12px] font-medium text-ink-2">
          <TopicIcon topic={i.topic} className="h-4 w-4" />
          {x.t(TOPIC_TITLE[i.topic])}
        </span>
        <Timing urgency={i.urgency} lang={x.lang} />
      </div>
      <h3 id={`insight-${i.code}-t`} className="display mt-3 text-[1.4rem] leading-snug text-ink">
        {x.t(i.title)}
      </h3>

      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">{x.t("Why Masar raised it")}</p>
      <ul className="mt-1.5 space-y-2">
        {i.because.map((b, k) => (
          <li key={k} className="rounded-[12px] bg-zinc-50 px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Tag kind={b.kind} lang={x.lang} />
              <Source f={b} x={x} />
            </div>
            <p className="mt-1 text-[14.5px] text-ink">{x.say(b.text)}</p>
          </li>
        ))}
      </ul>

      <details className="dash-more mt-3" open>
        <summary>{x.t("Why it matters")}</summary>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">{x.t(i.why)}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px] text-ink-3">
          <span className="inline-flex items-center gap-1" aria-hidden>
            {[1, 2, 3].map((k) => (
              <span key={k} className={`h-1.5 w-4 rounded-full ${k <= STRENGTH[i.evidence.strength] ? "bg-accent" : "bg-zinc-200"}`} />
            ))}
          </span>
          <span>
            {x.t("{strength} evidence", { strength: x.t(i.evidence.strength) })} · {x.t(i.evidence.citation)}
          </span>
        </div>
      </details>
      <details className="dash-more mt-2">
        <summary>{x.t("What this can't tell you")}</summary>
        <p className="mt-2 flex gap-2 text-[14.5px] leading-relaxed text-ink-2">
          <Tag kind="unknown" lang={x.lang} />
          {x.t(i.cannot)}
        </p>
      </details>
      <details className="dash-more mt-2 mb-4">
        <summary>{x.t("What you could do")}</summary>
        <ul className="mt-2 space-y-1.5">
          {i.options.map((o) => (
            <li key={o} className="text-[14px] text-ink-2">
              <span className="font-medium text-ink">{x.t(OPTION_LABEL[o].title)}.</span> {x.t(OPTION_LABEL[o].body)}
            </li>
          ))}
        </ul>
      </details>

      <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-rule pt-3">
        <AskButton text={x.t("Why does “{title}” matter for me?", { title: x.t(i.title) })} intent={{ kind: "insight", code: i.code }} className="dash-ask">
          <span aria-hidden className="orb" style={{ width: 16, height: 16 }}>
            <span className="orb__core" />
          </span>
          {x.t("Ask about this")}
        </AskButton>
        <a href="#prepare" className="link text-[13.5px]">
          {x.t("Add to my doctor questions")}
        </a>
      </div>
    </article>
  );
}

export function Insights({ d, x }: { d: Dashboard; x: Tx }) {
  return (
    <div className="space-y-4">
      {d.insights.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {d.insights.map((i) => (
            <InsightCard key={i.code} i={i} x={x} />
          ))}
        </div>
      ) : (
        <div className="dash-card flex flex-col gap-4 md:flex-row md:items-center">
          <span aria-hidden className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
            <Icon name="check" className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <p className="text-[16px] font-semibold text-ink">{x.t("Nothing in what you've shared needs a conversation right now.")}</p>
            <p className="mt-1 text-[14.5px] leading-relaxed text-ink-2">
              {x.t("That isn't a guarantee: it only covers what Masar can see. The gaps below are what would help Masar say more.")}
            </p>
          </div>
          <a href="#explore" className="btn btn-secondary shrink-0">
            {x.t("See what could help")}
          </a>
        </div>
      )}

      {d.context.map((c) => (
        <article key={c.id} className="dash-card reveal">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-[12px] font-medium text-ink-2">
              <TopicIcon topic={c.topic} className="h-4 w-4" />
              {x.t(TOPIC_TITLE[c.topic])}
            </span>
            <span className="rounded-full bg-unknown-soft px-2.5 py-1 text-[12px] font-medium text-unknown">{x.t("Context, not a finding")}</span>
          </div>
          <h3 className="display mt-3 text-[1.25rem] leading-snug text-ink">{x.say(c.title)}</h3>
          <ul className="mt-2 divide-y divide-rule">
            {c.body.map((b, k) => (
              <li key={k} className="grid gap-1 py-2.5 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
                <Tag kind={b.kind} lang={x.lang} />
                <span className="text-[14.5px] leading-relaxed text-ink-2">
                  {x.say(b.text)} <Source f={b} x={x} />
                </span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

// ---------- known vs unknown vs worth exploring ----------

export function KnowledgeBoard({ d, x }: { d: Dashboard; x: Tx }) {
  const cols: { title: string; icon: IconName; tone: string; items: Fact[]; empty: string }[] = [
    { title: x.t("What we know"), icon: "check", tone: "border-t-accent", items: d.known, empty: x.t("Nothing shared yet.") },
    { title: x.t("What is still unknown"), icon: "question", tone: "border-t-unknown", items: d.unknown, empty: x.t("Nothing missing from what Masar looks at.") },
    { title: x.t("What may be worth exploring"), icon: "compass", tone: "border-t-soon", items: d.explore, empty: x.t("Nothing raised right now.") },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {cols.map((c) => (
        <div key={c.title} className={`dash-card reveal border-t-[3px] ${c.tone}`}>
          <h3 className="flex items-center gap-2 text-[15.5px] font-semibold text-ink">
            <Icon name={c.icon} className="h-5 w-5 text-ink-2" />
            {c.title}
            <span className="tabular ms-auto rounded-full bg-zinc-100 px-2 py-0.5 text-[12px] text-ink-2">{c.items.length}</span>
          </h3>
          {c.items.length ? (
            <ul className="mt-3 space-y-2.5">
              {c.items.slice(0, 6).map((f, k) => (
                <FactRow key={k} f={f} x={x} />
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[14px] text-ink-3">{c.empty}</p>
          )}
          {c.items.length > 6 ? (
            <details className="dash-more mt-2">
              <summary>{x.t("Show {n} more", { n: c.items.length - 6 })}</summary>
              <ul className="mt-2 space-y-2.5">
                {c.items.slice(6).map((f, k) => (
                  <FactRow key={k} f={f} x={x} />
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function FactRow({ f, x }: { f: Fact; x: Tx }) {
  return (
    <li className="text-[14px]">
      <span className="flex items-start justify-between gap-2">
        <span className="text-ink">{x.say(f.text)}</span>
        {f.canChange !== undefined ? (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${f.canChange ? "bg-accent-soft text-accent" : "bg-zinc-100 text-ink-2"}`}>
            {f.canChange ? x.t("You can change this") : x.t("Can't change")}
          </span>
        ) : null}
      </span>
      <span className="mt-0.5 flex flex-wrap items-center gap-x-2">
        <Tag kind={f.kind} lang={x.lang} />
        <Source f={f} x={x} />
      </span>
    </li>
  );
}

// ---------- 3. Over time ----------

const VERDICT: Record<Series["verdict"], { label: string; tone: string }> = {
  meaningful: { label: "A real change", tone: "bg-soon-soft text-soon" },
  normal: { label: "Within normal ups and downs", tone: "bg-accent-soft text-accent" },
  single: { label: "One reading: no trend yet", tone: "bg-unknown-soft text-unknown" },
  too_close: { label: "Too close together to compare", tone: "bg-unknown-soft text-unknown" },
  noRule: { label: "Shown as recorded", tone: "bg-zinc-100 text-ink-2" },
};

export function OverTime({ d, x, children }: { d: Dashboard; x: Tx; children?: ReactNode }) {
  const charted = d.series.filter((s) => s.points.length >= 2);
  const single = d.series.filter((s) => s.points.length < 2);
  const year = (iso: string) => (x.lang === "ar" ? new Intl.DateTimeFormat("ar-AE", { year: "numeric", numberingSystem: "latn" }).format(new Date(iso)) : iso.slice(0, 4));
  const chartLabels = {
    usual: x.t("Usual range"),
    printedRange: x.t("Range printed on your report"),
    showValues: x.t("Show values"),
    hideValues: x.t("Hide values"),
    date: x.t("Date"),
    value: x.t("Value"),
    source: x.t("Source"),
  };
  return (
    <div className="space-y-4">
      {d.series.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {charted.map((s) => (
            <article key={s.code} className="dash-card reveal" aria-labelledby={`series-${s.code}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span aria-hidden className="grid h-9 w-9 place-items-center rounded-[10px] bg-zinc-100 text-ink-2">
                    <TopicIcon topic={s.topic as Topic} />
                  </span>
                  <h3 id={`series-${s.code}`} className="text-[15.5px] font-semibold text-ink">
                    {x.t(s.label)}
                  </h3>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${VERDICT[s.verdict].tone}`}>{x.t(VERDICT[s.verdict].label)}</span>
              </div>
              <div className="mt-3">
                <SeriesChart
                  points={s.points.map((p) => ({ at: p.at, date: x.date(p.at), value: p.value, source: x.t(p.source) }))}
                  unit={x.t(s.unit)}
                  band={s.band}
                  refRange={s.refRange}
                  bars={s.code === "cycle_length"}
                  title={x.t(s.label)}
                  labels={chartLabels}
                />
              </div>
              <p className="mt-2 text-[13.5px] text-ink-2">{x.say(s.sentence)}</p>
              <details className="dash-more mt-2">
                <summary>{x.t("What this measures, and its limits")}</summary>
                <p className="mt-2 text-[14px] text-ink-2">{x.t(s.info.what)}</p>
                <p className="mt-1.5 flex gap-2 text-[14px] text-ink-2">
                  <Tag kind="unknown" lang={x.lang} />
                  {x.t(s.info.limits)}
                </p>
                <p className="mt-1.5 text-[12.5px] text-ink-3">{x.t("Masar's rule: {rule}", { rule: x.t(s.rule) })}</p>
              </details>
              <div className="mt-3 border-t border-rule pt-3">
                <AskButton text={x.t("What does the {test} measure, and what can't it tell me?", { test: x.t(s.label) })} intent={{ kind: "measure", code: s.code }} className="dash-ask">
                  <span aria-hidden className="orb" style={{ width: 16, height: 16 }}>
                    <span className="orb__core" />
                  </span>
                  {x.t("Ask about this measurement")}
                </AskButton>
              </div>
            </article>
          ))}
          {single.map((s) => (
            <div key={s.code} className="dash-card reveal flex flex-col justify-center">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[14px] font-semibold text-ink">{x.t(s.label)}</p>
                <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${VERDICT[s.verdict].tone}`}>{x.t(VERDICT[s.verdict].label)}</span>
              </div>
              {s.points.at(-1) ? (
                <p className="mt-2">
                  <span className="tabular font-display text-[1.7rem] text-ink" dir="ltr">
                    {Number.isInteger(s.points.at(-1)!.value) ? s.points.at(-1)!.value : s.points.at(-1)!.value.toFixed(1)}
                  </span>{" "}
                  <span className="text-[13px] text-ink-3">{x.t(s.unit)}</span>
                </p>
              ) : null}
              <p className="mt-1 text-[12.5px] text-ink-3">
                {s.points.at(-1) ? `${x.date(s.points.at(-1)!.at)} · ${x.t(s.points.at(-1)!.source)}` : ""}
              </p>
              <p className="mt-2 text-[13px] text-ink-2">{x.t(s.info.what)}</p>
            </div>
          ))}
        </div>
      ) : null}

      {!d.series.length ? (
        <div className="dash-card text-[14.5px] text-ink-2">{x.t("Nothing you shared has readings over time yet, so no change can be described.")}</div>
      ) : null}

      {d.timeline.length >= 2 ? (
        <div className="dash-card reveal">
          <h3 className="flex items-center gap-2 text-[15.5px] font-semibold text-ink">
            <Icon name="clock" className="h-5 w-5 text-ink-2" />
            {x.t("Your health timeline")}
          </h3>
          <p className="mt-1 text-[13.5px] text-ink-3">{x.t("Everything on record from the sources you shared, in date order.")}</p>
          <div className="mt-3">
            <HealthTimeline
              label={x.t("Your health timeline")}
              labels={{ earlier: x.t("Earlier"), later: x.t("Later") }}
              items={d.timeline.map((e) => ({
                at: e.at,
                year: year(e.at),
                date: x.date(e.at),
                kind: e.kind,
                kindLabel: x.t(
                  {
                    lab: "Lab result",
                    device: "Phone and wearable",
                    healthAge: "Health Age check",
                    malaffi: "Clinic records",
                    self: "You told us",
                    check: "Check",
                    request: "Your doctor",
                    report: "Report",
                  }[e.kind],
                ),
                title: x.say(e.title),
                detail: e.detail ? x.say(e.detail) : undefined,
              }))}
            />
          </div>
        </div>
      ) : null}
      {children}
    </div>
  );
}

// ---------- 4. What you could explore next ----------

const GROUPS: { id: "understand" | "missing" | "records" | "discuss" | "learn"; title: string; icon: IconName; body: string }[] = [
  { id: "understand", title: "Understand better", icon: "spark", body: "What Masar found, explained." },
  { id: "missing", title: "Information still missing", icon: "plug", body: "What would let Masar say more." },
  { id: "records", title: "Results or records to ask about", icon: "flask", body: "Only if a doctor thinks they'd help." },
  { id: "discuss", title: "Questions to discuss", icon: "chat", body: "For a conversation with a healthcare professional." },
  { id: "learn", title: "Learn more", icon: "book", body: "Matched to your quick check." },
];

export function Explore({ d, x }: { d: Dashboard; x: Tx }) {
  const groups = GROUPS.map((g) => ({ ...g, items: d.actions.filter((a) => a.group === g.id) })).filter((g) => g.items.length);
  return (
    <div>
      <p className="mb-4 flex items-start gap-2 rounded-[14px] bg-soon-soft px-4 py-3 text-[13.5px] text-ink">
        <Icon name="compass" className="mt-0.5 h-4 w-4 shrink-0 text-soon" />
        {x.t("Suggestions to explore, not medical instructions. You decide what to do; a doctor advises.")}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <div key={g.id} className="dash-card reveal">
            <h3 className="flex items-center gap-2 text-[15.5px] font-semibold text-ink">
              <span aria-hidden className="grid h-8 w-8 place-items-center rounded-[10px] bg-accent-soft text-accent">
                <Icon name={g.icon} className="h-4 w-4" />
              </span>
              {x.t(g.title)}
            </h3>
            <p className="mt-1 text-[13px] text-ink-3">{x.t(g.body)}</p>
            <ul className="mt-3 space-y-2">
              {g.items.map((a) => (
                <li key={a.id} className="rounded-[14px] border border-rule p-3">
                  <p className="text-[14.5px] font-medium text-ink">{x.say(a.title)}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
                    <span className="font-medium text-ink-3">{x.t("Why it's suggested")}: </span>
                    {x.say({ text: a.why.text, vars: a.why.vars })}
                  </p>
                  {a.href || a.ask ? (
                    <div className="mt-2 flex flex-wrap gap-3 text-[13px]">
                      {a.href ? (
                        a.href.startsWith("/") ? (
                          <Link href={a.href} className="link">
                            {x.t("Change in My data")}
                          </Link>
                        ) : (
                          <a href={a.href} className="link">
                            {g.id === "discuss" ? x.t("See your questions") : x.t("Read the insight")}
                          </a>
                        )
                      ) : null}
                      {a.ask ? (
                        <AskButton text={x.t(a.ask)} intent={a.id.startsWith("understand-") ? { kind: "insight", code: a.id.slice("understand-".length) } : undefined} className="link">
                          {x.t("Ask the assistant")}
                        </AskButton>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- 5. Prepare for your doctor ----------

export function Prepare({ d, x, personId, children }: { d: Dashboard; x: Tx; personId: string; children?: ReactNode }) {
  const questions = d.prepare.questions.map((q) => x.t(q));
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="dash-card dash-dark lg:col-span-7">
          <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-white/60">{x.t("Questions to bring")}</p>
          <p className="mt-2 text-[17px] leading-snug text-white">&ldquo;{x.say(d.prepare.reason)}&rdquo;</p>
          <p className="mt-1 text-[13px] text-white/60">
            {d.prepare.generic ? x.t("Nothing needs a conversation now; these help at any routine visit.") : x.t("From the rules behind what Masar found. Tick the ones you want to ask.")}
          </p>
          <div className="mt-4">
            <PrepareList dark copyable storageKey={`masar-questions:${personId}`} items={questions} labels={{ copy: x.t("Copy my questions"), copied: x.t("Copied"), heading: x.t("My questions:") }} />
          </div>
        </div>
        <div className="dash-card lg:col-span-5">
          <p className="eyebrow">{x.t("What to bring")}</p>
          <p className="mt-1 text-[13px] text-ink-3">{x.t("Ticks are saved on this device only.")}</p>
          <div className="mt-3">
            <PrepareList storageKey={`masar-bring:${personId}`} items={d.prepare.bring.map((b) => x.say(b))} labels={{ copy: "", copied: "", heading: "" }} />
          </div>
        </div>
      </div>

      <div className="dash-card">
        <p className="eyebrow">{x.t("Consultation summary")}</p>
        <dl className="mt-3 grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-[12.5px] font-medium text-ink-3">{x.t("Why I'm here")}</dt>
            <dd className="mt-1 text-[14.5px] text-ink">{x.say(d.prepare.reason)}</dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-ink-3">{x.t("What Masar found")}</dt>
            <dd className="mt-1 text-[14.5px] text-ink">{d.insights.length ? d.insights.map((i) => x.t(i.title)).join(x.lang === "ar" ? "، " : "; ") : x.t("Nothing worth a conversation in what was shared.")}</dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-ink-3">{x.t("What's on record")}</dt>
            <dd className="mt-1 text-[14.5px] text-ink">{d.known.slice(0, 5).map((f) => x.say(f.text)).join(" ")}</dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-ink-3">{x.t("What remains uncertain")}</dt>
            <dd className="mt-1 text-[14.5px] text-ink">{d.prepare.uncertainties.slice(0, 4).map((u) => x.t(u)).join(" ")}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-3 border-t border-rule pt-3">
          <Link href="/me/report" className="btn btn-primary !min-h-[42px] text-[14px]">
            {x.t("Open your health report")}
          </Link>
          <AskButton text={x.t("Help me start the conversation with my doctor")} intent={{ kind: "questions" }} className="btn btn-secondary !min-h-[42px] text-[14px]">
            {x.t("Draft an opening with the assistant")}
          </AskButton>
        </div>
      </div>
      {children}
    </div>
  );
}

// ---------- 6. Your health report ----------

export function ReportTeaser({ d, x }: { d: Dashboard; x: Tx }) {
  const parts = [
    [x.t("What you shared"), x.t("{n} of 5 sources", { n: d.sourcesShared })],
    [x.t("What Masar found"), String(d.insights.length)],
    [x.t("Results over time"), String(d.series.length)],
    [x.t("What remains uncertain"), String(d.unknown.length)],
    [x.t("Questions to discuss"), String(d.prepare.questions.length)],
  ];
  return (
    <div className="dash-card grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <p className="text-[15px] text-ink-2">
          {x.t("A readable summary of what you shared, what Masar found and couldn't tell, where each statement came from, and what you could discuss next. Print it or save it as a PDF to bring to an appointment.")}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {parts.map(([k, v]) => (
            <div key={k} className="rounded-[12px] bg-zinc-50 px-3 py-2">
              <dt className="text-[11.5px] text-ink-3">{k}</dt>
              <dd className="tabular mt-0.5 text-[15px] font-semibold text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex flex-col gap-2.5">
        <Link href="/me/report" className="btn btn-primary">
          <Icon name="doc" className="h-4 w-4" />
          {x.t("Open your health report")}
        </Link>
        <a href="/api/me/export" className="btn btn-secondary">
          {x.t("Download all my data (JSON)")}
        </a>
      </div>
    </div>
  );
}
