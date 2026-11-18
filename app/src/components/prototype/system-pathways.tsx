"use client";

import { useMemo } from "react";
import { MIN_GROUP } from "@/lib/evidence";
import { pathwayMetrics } from "@/lib/pathways";
import { Bars, Pill, Simulated, Stat, useProto } from "./core";

// The health system's longitudinal view: whether people reach informed
// conversations earlier, where they drop off, how good the data is and how
// well Masar's observations matched clinicians' judgement. Aggregates only.

export function Pathways() {
  const { s, tr, report, journey } = useProto();
  const you = {
    baseline: !!s.analysedAt,
    tracked3m: !!s.analysedAt && journey.stage >= 1,
    changeSurfaced: !!s.analysedAt && journey.changes.some((c) => c.kind !== "data"),
    guide: !!s.guide,
    shared: !!s.guide?.sharedAt && s.consent.shareClinician,
    conversation: s.request?.status === "attended",
  };
  const m = useMemo(() => (report ? pathwayMetrics(report, you) : null), [report, you.baseline, you.tracked3m, you.changeSurfaced, you.guide, you.shared, you.conversation]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!m) return null;
  const max = m.funnel[0].n;
  return (
    <div className="space-y-5">
      <div className="pt-card flex flex-wrap items-center gap-3 !py-4">
        <Simulated>{tr("Simulated pilot assumptions")}</Simulated>
        <p className="min-w-0 flex-1 text-[13.5px] text-ink-2">{tr("Earlier, better-informed pathways, measured in aggregate. No individual is ranked or shown, and these figures are never used for employment, insurance or eligibility decisions.")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {m.engagement.map((e) => (
          <Stat key={e.label} label={tr(e.label)} value={e.value} sub={tr(e.note)} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <section className="pt-card" aria-labelledby="pw-funnel">
          <h2 id="pw-funnel" className="text-[15.5px] font-semibold text-ink">
            {tr("From baseline to conversation")}
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-2">{tr("Largest drop-off: {step}.", { step: tr(m.dropAt) })}</p>
          <ol className="mt-4 space-y-2.5">
            {m.funnel.map((f) => (
              <li key={f.id}>
                <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
                  <span className="text-ink">
                    {tr(f.label)}
                    {f.you ? (
                      <span className="ms-2">
                        <Pill tone="soon">{tr("+1 from this demo, anonymised")}</Pill>
                      </span>
                    ) : null}
                  </span>
                  <span className="tabular text-ink-2">{f.n.toLocaleString("en")}</span>
                </div>
                <span className="mt-1 block h-2 overflow-hidden rounded-full bg-zinc-100">
                  <span className="pt-grow block h-full rounded-full bg-accent" style={{ width: `${Math.max(2, (f.n / max) * 100)}%` }} />
                </span>
              </li>
            ))}
          </ol>
        </section>
        <div className="space-y-4">
          <section className="pt-card">
            <h2 className="text-[15.5px] font-semibold text-ink">{tr("Time from a surfaced change to a conversation")}</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[12.5px] text-ink-3">{tr("With Masar")}</p>
                <p className="tabular font-display text-[2rem] text-ink">{m.timing.masar ?? "—"}</p>
                <p className="text-[12px] text-ink-3">{tr("median days")}</p>
              </div>
              <div>
                <p className="text-[12.5px] text-ink-3">{tr("Usual care")}</p>
                <p className="tabular font-display text-[2rem] text-ink-2">{m.timing.usual ?? "—"}</p>
                <p className="text-[12px] text-ink-3">{tr("median days")}</p>
              </div>
            </div>
          </section>
          <section className="pt-card">
            <h2 className="text-[15.5px] font-semibold text-ink">{tr("False reassurance watch")}</h2>
            <p className="mt-1 text-[13.5px] text-ink-2">{tr("{pct}% of {n} residents told nothing needed a conversation later had a clinician-identified issue. Reviewed monthly.", { pct: m.falseReassurance.pct, n: m.falseReassurance.ofN.toLocaleString("en") })}</p>
          </section>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="pt-card">
          <h2 className="text-[15.5px] font-semibold text-ink">{tr("Recommendation calibration")}</h2>
          <p className="mt-0.5 text-[13px] text-ink-2">{tr("How often clinicians agreed an observation was worth discussing.")}</p>
          <div className="mt-3">
            <Bars rows={m.calibration.map((c) => ({ label: tr(c.label), n: c.agreePct, note: tr("of {n}", { n: c.n.toLocaleString("en") }) }))} max={100} unit="%" />
          </div>
          <p className="mt-2 text-[12px] text-ink-3">{tr("Lifestyle context is agreed less often, which is why Masar shows it as context and never as a finding.")}</p>
        </section>
        <section className="pt-card">
          <h2 className="text-[15.5px] font-semibold text-ink">{tr("Data-quality limitations")}</h2>
          <div className="mt-3">
            <Bars rows={m.quality.map((q) => ({ label: tr(q.label), n: q.pct, note: tr(q.note), muted: true }))} max={100} unit="%" />
          </div>
        </section>
      </div>

      <section className="pt-card">
        <h2 className="text-[15.5px] font-semibold text-ink">{tr("Equitable access: shared a guide after a change, by language")}</h2>
        <div className="mt-3">
          <Bars rows={m.equity.map((e) => ({ label: tr(e.label), n: e.suppressed ? 0 : e.sharedPct, note: e.suppressed ? tr("Fewer than 10: hidden") : undefined, muted: e.suppressed }))} max={100} unit="%" />
        </div>
        <p className="mt-2 text-[12.5px] text-ink-3">{tr("Groups smaller than {n} are never shown, including their exact size.", { n: MIN_GROUP })}</p>
      </section>
    </div>
  );
}
