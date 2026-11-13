import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/ui";
import { Tag } from "@/components/editorial";
import { PrintButton } from "@/components/dashboard/print-button";
import { SOURCES } from "@/lib/model";
import { OPTION_LABEL } from "@/lib/signals";
import { formatDateIn } from "@/lib/i18n";
import type { Line } from "@/lib/path";
import { requireRole } from "@/server/session";
import { personView } from "@/server/views";
import { translator } from "@/server/lang";
import { dashboardFor } from "@/server/dashboard";

// The personal health report: what the person shared, what Masar found and
// couldn't tell, results over time, and what they could discuss next, with
// the source of every statement. Built from the same model as My Path, so it
// never says more than the dashboard does. Prints (or saves as PDF) as a
// plain document.

export const instant = false;

function H({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="display mt-10 flex items-baseline gap-3 border-b-2 border-ink pb-2 text-[1.45rem] text-ink">
      <span className="font-mono text-[12px] text-ink-3">{String(n).padStart(2, "0")}</span>
      {children}
    </h2>
  );
}

export default async function HealthReport() {
  const session = await requireRole("person");
  const v = personView(session.id);
  if (!v.state.onboarded) redirect("/me");
  const { t, lang } = await translator();
  const fmt = (iso: string) => formatDateIn(lang, iso);
  const say = (l: Line) => t(l.text, l.vars && Object.fromEntries(Object.entries(l.vars).map(([k, x]) => [k, typeof x === "string" ? t(x) : x])));
  const d = dashboardFor(v);
  const today = new Date().toISOString().slice(0, 10);
  const num = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

  return (
    <Shell session={session}>
      <div className="no-print mb-6 flex flex-wrap items-center gap-3">
        <Link href="/me#report" className="btn btn-secondary">
          {t("Back to My path")}
        </Link>
        <PrintButton label={t("Print or save as PDF")} />
        <a href="/api/me/export" className="link text-[14px]">
          {t("Download all my data (JSON)")}
        </a>
      </div>

      <article className="report-doc dash-card !p-6 md:!p-10">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-rule pb-5">
          <div>
            <p className="eyebrow">{t("Personal health report")}</p>
            <h1 className="display mt-2 text-[clamp(1.8rem,3.4vw,2.4rem)] leading-tight text-ink">{v.resident.name}</h1>
            <p className="mt-1 text-[14px] text-ink-2">
              {t("Age {age}", { age: v.resident.age })} · {t("Prepared {date}", { date: fmt(today) })}
            </p>
          </div>
          <p className="max-w-xs text-[12.5px] leading-relaxed text-ink-3">
            {t("Masar provides educational information and decision support. It does not diagnose, predict fertility or recommend treatment; clinical decisions stay with qualified professionals. Pilot environment: records shown are synthetic.")}
          </p>
        </header>

        <H n={1}>{t("What you shared")}</H>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {SOURCES.map((s) => (
            <li key={s.id} className="flex items-center gap-2.5 text-[14px]">
              <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${v.state.sources[s.id] ? "bg-accent" : "border border-dashed border-unknown"}`} />
              <span className="text-ink">{t(s.label)}</span>
              <span className={`ms-auto text-[12.5px] ${v.state.sources[s.id] ? "text-accent" : "text-unknown"}`}>{v.state.sources[s.id] ? t("Shared") : t("Not shared")}</span>
            </li>
          ))}
        </ul>
        <ul className="mt-4 divide-y divide-rule border-y border-rule">
          {d.known.map((f, i) => (
            <li key={i} className="grid gap-1 py-2.5 sm:grid-cols-[9rem_1fr_auto] sm:gap-4">
              <Tag kind={f.kind} lang={lang} />
              <span className="text-[14.5px] text-ink">{say(f.text)}</span>
              <span className="text-[12px] text-ink-3">
                {t(f.source)}
                {f.date ? ` · ${fmt(f.date)}` : ""}
              </span>
            </li>
          ))}
          {!d.known.length ? <li className="py-2.5 text-[14px] text-ink-3">{t("Nothing shared yet.")}</li> : null}
        </ul>

        <H n={2}>{t("What Masar found")}</H>
        {d.insights.length ? (
          <div className="mt-3 space-y-5">
            {d.insights.map((i) => (
              <section key={i.code}>
                <h3 className="text-[16px] font-semibold text-ink">{t(i.title)}</h3>
                <ul className="mt-1.5 space-y-1 text-[14px] text-ink-2">
                  {i.because.map((b, k) => (
                    <li key={k}>
                      · {say(b.text)} <span className="text-[12px] text-ink-3">({t(b.source)})</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[14px] text-ink-2">
                  <span className="font-medium text-ink">{t("Why it matters")}: </span>
                  {t(i.why)} <span className="text-[12px] text-ink-3">({t(i.evidence.citation)} · {t("{strength} evidence", { strength: t(i.evidence.strength) })})</span>
                </p>
                <p className="mt-1 text-[14px] text-ink-2">
                  <span className="font-medium text-ink">{t("What this can't tell you")}: </span>
                  {t(i.cannot)}
                </p>
              </section>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[14.5px] text-ink-2">{t("Nothing you've shared needs a conversation right now. That isn't a guarantee: it only covers what we can see.")}</p>
        )}
        {d.context.map((c) => (
          <p key={c.id} className="mt-3 text-[14px] text-ink-2">
            <span className="font-medium text-ink">{say(c.title)} ({t("context, not a finding")}): </span>
            {c.body.map((b) => say(b.text)).join(" ")}
          </p>
        ))}

        <H n={3}>{t("Results over time")}</H>
        {d.series.length ? (
          <table className="mt-3 w-full text-[13.5px]">
            <thead>
              <tr className="text-ink-3">
                <th className="py-1.5 text-start font-medium">{t("Measurement")}</th>
                <th className="py-1.5 text-start font-medium">{t("Results")}</th>
                <th className="py-1.5 text-start font-medium">{t("What Masar can say")}</th>
              </tr>
            </thead>
            <tbody>
              {d.series.map((s) => (
                <tr key={s.code} className="border-t border-rule align-top">
                  <td className="py-2 pe-3 font-medium text-ink">{t(s.label)}</td>
                  <td className="tabular py-2 pe-3 text-ink-2">
                    {s.points.map((p) => (
                      <span key={p.at} className="block">
                        {fmt(p.at)}: <span dir="ltr">{num(p.value)}</span> {t(s.unit)}
                      </span>
                    ))}
                  </td>
                  <td className="py-2 text-ink-2">
                    {say(s.sentence)} <span className="block text-[12px] text-ink-3">{t(s.info.limits)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-3 text-[14.5px] text-ink-2">{t("Nothing you've shared has been measured more than once yet, so we can't see any changes.")}</p>
        )}

        <H n={4}>{t("What we still can't say")}</H>
        <ul className="mt-3 space-y-1.5 text-[14px] text-ink-2">
          {d.unknown.map((f, i) => (
            <li key={i}>
              · {say(f.text)} <span className="text-[12px] text-ink-3">{t(f.source)}</span>
            </li>
          ))}
          {[...new Set(d.insights.map((i) => i.cannot))].map((c) => (
            <li key={c}>· {t(c)}</li>
          ))}
          {!d.unknown.length && !d.insights.length ? <li>{t("Nothing we look at is missing.")}</li> : null}
        </ul>

        <H n={5}>{t("Next steps you could discuss")}</H>
        <p className="mt-2 text-[13px] text-ink-3">{t("These are ideas, not medical instructions. You decide, and a doctor can advise.")}</p>
        <ul className="mt-3 space-y-2 text-[14px]">
          {d.actions
            .filter((a) => a.group !== "discuss")
            .map((a) => (
              <li key={a.id}>
                <span className="font-medium text-ink">{say(a.title)}.</span> <span className="text-ink-2">{say(a.why)}</span>
              </li>
            ))}
          {[...new Set(d.insights.flatMap((i) => i.options))].map((o) => (
            <li key={o}>
              <span className="font-medium text-ink">{t(OPTION_LABEL[o].title)}.</span> <span className="text-ink-2">{t(OPTION_LABEL[o].body)}</span>
            </li>
          ))}
        </ul>
        <h3 className="mt-5 text-[15px] font-semibold text-ink">{t("Questions to discuss with a healthcare professional")}</h3>
        <ol className="mt-2 list-decimal space-y-1 ps-5 text-[14px] text-ink-2">
          {d.prepare.questions.map((q) => (
            <li key={q}>{t(q)}</li>
          ))}
        </ol>

        <H n={6}>{t("Where this comes from, and how to read it")}</H>
        <ul className="mt-3 space-y-1.5 text-[13.5px] text-ink-2">
          <li>{t("Everything we noticed comes from Masar's published rules, used only on what you chose to share. Each one names the medical guideline behind it.")}</li>
          <li>{t("“You said” is something you told us. “Fact” is a result in your record, shown with where it came from and when.")}</li>
          <li>{t("We only call something a real change when it's bigger than the usual ups and downs. One result on its own can't show a trend.")}</li>
          <li>
            {v.state.assistantConsent
              ? t("You allowed Masar's assistant (Google Gemini) to read your summary. Any text it wrote is labelled where it appears; nothing in this report was written by it.")
              : t("Masar's assistant was not used for this report.")}
          </li>
        </ul>
      </article>
    </Shell>
  );
}
