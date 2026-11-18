"use client";

import { useEffect, useMemo, useState } from "react";
import { guideDraft, SHARE_LABEL, SHARE_SCOPE, type GuideDraft, type JourneyView, type ShareKey } from "@/lib/longitudinal";
import { CONDITION_LABEL, INTENTION_LABEL } from "@/lib/model";
import { RULES } from "@/lib/signals";
import type { ProtoConsent, ProtoView } from "@/lib/prototype";
import { geminiGuide } from "./adapters";
import { Pill, useProto } from "./core";
import { downloadPdf, type PdfBlock } from "./report-pdf";
import { withAudit, withNotice, type Guide } from "./state";

// Prepare for my consultation: a guide written from the person's authorised
// timeline, which they can edit, add notes to and share, one category at a
// time, with Dr Layla. Nothing is ticked for sharing until they tick it.

const KEYS: ShareKey[] = ["goals", "changes", "cycles", "symptoms", "lifestyle", "wearable", "labs", "history", "questions", "notes"];
const NO_SHARE = Object.fromEntries(KEYS.map((k) => [k, false])) as Record<ShareKey, boolean>;

/** The guide's draft for this person, from what they allow right now. */
export function useGuideDraft(): GuideDraft {
  const { tr, base, view, journey } = useProto();
  return useMemo(() => draftFor(base.sex, view, journey, tr), [base.sex, view, journey, tr]);
}

export function draftFor(sex: "female" | "male", view: ProtoView, journey: JourneyView, tr: (t: string) => string): GuideDraft {
  return guideDraft(sex, journey, {
    goal: view.record.intention ? tr(INTENTION_LABEL[view.record.intention]) : null,
    insightTitles: view.dashboard.insights.map((i) => tr(RULES[i.code].title)),
    ruleQuestions: [...new Set(view.dashboard.insights.flatMap((i) => RULES[i.code].questions))].slice(0, 3).map(tr),
    conditions: view.record.conditions.map((c) => tr(CONDITION_LABEL[c])),
  });
}

/** What the clinician may see: ticked when shared, and still permitted now. */
export function sharedNow(guide: Guide | null, consent: ProtoConsent): ShareKey[] {
  // Withdrawing "Your family doctor" stops all sharing, the guide included.
  if (!guide?.sharedAt || !consent.shareClinician) return [];
  return guide.sharedKeys.filter((k) => {
    const scope = SHARE_SCOPE[k];
    return !scope || consent[scope];
  });
}

export function PrepareGuide() {
  const { s, set, tr, say, date, base, accessKey, live } = useProto();
  const d = useGuideDraft();
  const [busy, setBusy] = useState(false);
  const [draftQ, setDraftQ] = useState("");
  // A guide saved earlier opens as a short summary, so every account's Prepare chapter starts the same size; one made now opens in full.
  const [open, setOpen] = useState(!s.guide);
  const name = base.name.split(" ")[0];
  const g = s.guide;

  const generate = async () => {
    setBusy(true);
    const r = await geminiGuide(s, base, accessKey, live?.api);
    set((x) =>
      withAudit(
        {
          ...x,
          guide: { source: r.source, at: new Date().toISOString(), intro: r.intro, questions: r.questions, notes: x.guide?.notes ?? "", share: x.guide?.share ?? { ...NO_SHARE }, sharedAt: x.guide?.sharedAt ?? null, sharedKeys: x.guide?.sharedKeys ?? [] },
        },
        { role: "system", who: r.source === "ai" ? "Gemini (via Masar's adapter)" : r.source === "mock" ? "Gemini demo mock" : "Masar", what: "Prepared a consultation guide from authorised information", allowed: true },
      ),
    );
    setBusy(false);
    setOpen(true);
  };
  useEffect(() => {
    const on = () => {
      document.getElementById("pt-guide")?.scrollIntoView({ behavior: "smooth", block: "start" });
      void generate();
    };
    window.addEventListener("masar:guide", on);
    return () => window.removeEventListener("masar:guide", on);
  });

  const upd = (fn: (g: Guide) => Guide) => set((x) => (x.guide ? { ...x, guide: fn(x.guide) } : x));
  const available = new Map(d.shared.map((x) => [x.key, x]));

  if (!g) {
    return (
      <div className="pt-card flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[15.5px] font-semibold text-ink">{tr("Prepare for my consultation")}</p>
          <p className="mt-0.5 text-[13.5px] text-ink-2">{tr("A guide built from your timeline: what changed and when, what is still unknown, questions you may want to ask, and what to bring. You edit it, and you choose what to share.")}</p>
        </div>
        <button type="button" onClick={generate} disabled={busy} className="btn btn-primary disabled:opacity-60">
          {busy ? <span className="jr-spinner !h-4 !w-4" aria-hidden /> : null}
          {busy ? tr("Preparing your guide") : tr("Create my guide")}
        </button>
      </div>
    );
  }

  const shared = sharedNow(g, s.consent);
  const ticked = KEYS.filter((k) => g.share[k] && available.get(k)?.available);
  const sourceLine = g.source === "ai" ? tr("Written with Gemini from your authorised timeline, checked by Masar") : g.source === "mock" ? tr("Gemini demo mock, no live model call. Checked by Masar") : !s.consent.ai ? tr("Written by Masar: AI processing is off") : tr("Written by Masar from your timeline");
  const pdf = () => {
    void downloadPdf(`masar-consultation-guide-${s.profileId}.pdf`, guideBlocks(g, d, base.name, tr, say, date, s.lang), s.lang);
    set((x) => withAudit(x, { role: "patient", who: name, what: "Downloaded their consultation guide", allowed: true }));
  };

  if (!open) {
    return (
      <div className="pt-card flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1 basis-80">
          <p className="flex items-center gap-2 text-[12px] text-ink-3">
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${g.source === "masar" ? "bg-ink-3" : "bg-date"}`} />
            {sourceLine} · {date(g.at)}
          </p>
          <p className="mt-1 text-[15.5px] font-semibold text-ink">{tr("Your consultation guide")}</p>
          <p className="mt-0.5 line-clamp-2 text-[13.5px] text-ink-2">{g.intro}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill tone="stone">{tr("{n} questions", { n: g.questions.length })}</Pill>
            {g.sharedAt ? <Pill tone="accent">{tr("Shared with Dr Layla: {list}", { list: shared.map((k) => tr(SHARE_LABEL[k])).join(s.lang === "ar" ? "، " : ", ") || tr("nothing that is still permitted") })}</Pill> : <Pill tone="stone">{tr("Not shared")}</Pill>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={pdf} className="btn btn-secondary">
            {tr("Download PDF")}
          </button>
          <button type="button" aria-expanded={false} onClick={() => setOpen(true)} className="btn btn-primary">
            {tr("Open my guide")}
          </button>
        </div>
      </div>
    );
  }
  const share = () =>
    set((x) =>
      x.guide
        ? withAudit(withNotice({ ...x, consent: { ...x.consent, shareClinician: true }, guide: { ...x.guide, sharedAt: new Date().toISOString(), sharedKeys: ticked } }, { to: "clinician", tone: "info", text: "{name} shared a consultation guide with you.", vars: { name } }), {
            role: "patient",
            who: name,
            what: "Shared their consultation guide with Dr Layla: {what}",
            vars: { what: ticked.map((k) => SHARE_LABEL[k]).join(", ") },
            allowed: true,
          })
        : x,
    );
  const stop = () => set((x) => (x.guide ? withAudit({ ...x, guide: { ...x.guide, sharedAt: null, sharedKeys: [] } }, { role: "patient", who: name, what: "Stopped sharing their consultation guide", allowed: true }) : x));

  return (
    <div className="space-y-4">
      <div className="pt-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[12px] text-ink-3">
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${g.source === "masar" ? "bg-ink-3" : "bg-date"}`} />
            {sourceLine}
            {" · "}
            {date(g.at)}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={generate} disabled={busy} className="btn btn-secondary !min-h-[38px] text-[13px] disabled:opacity-60">
              {busy ? tr("Updating") : tr("Update from my latest timeline")}
            </button>
            <button type="button" onClick={pdf} className="btn btn-secondary !min-h-[38px] text-[13px]">
              {tr("Download PDF")}
            </button>
            <button type="button" aria-expanded onClick={() => setOpen(false)} className="btn btn-secondary !min-h-[38px] text-[13px]">
              {tr("Close the guide")}
            </button>
          </div>
        </div>
        <h3 className="display mt-3 text-[1.5rem] text-ink">{tr("Your consultation guide")}</h3>
        <section className="mt-4">
          <h4 className="text-[13px] font-semibold text-ink-3">{tr("Why this guide was created")}</h4>
          <p className="mt-1 text-[14.5px] leading-relaxed text-ink">{g.intro}</p>
        </section>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section>
            <h4 className="text-[13px] font-semibold text-ink-3">{tr("Your timeline")}</h4>
            <ol className="mt-2 space-y-2 border-s border-rule ps-4">
              {d.timeline.map((t, i) => (
                <li key={i} className="relative text-[13.5px]">
                  <span aria-hidden className="absolute -start-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-paper bg-accent" />
                  <span className="text-ink-3">{date(t.at)}</span> · <span className="text-ink">{say(t.text)}</span>
                </li>
              ))}
            </ol>
          </section>
          <section>
            <h4 className="text-[13px] font-semibold text-ink-3">{tr("What remains unknown")}</h4>
            <ul className="mt-2 space-y-1.5">
              {d.unknown.length ? (
                d.unknown.map((u) => (
                  <li key={say(u)} className="flex gap-2 text-[13.5px] text-ink-2">
                    <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full border border-dashed border-unknown" />
                    {say(u)}
                  </li>
                ))
              ) : (
                <li className="text-[13.5px] text-ink-3">{tr("Nothing Masar looks at is missing.")}</li>
              )}
            </ul>
            <p className="mt-2 text-[12.5px] text-ink-3">{tr("Gaps are normal and not a sign of anything. A doctor can tell you which, if any, would help.")}</p>
          </section>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="pt-card pt-dark lg:col-span-7" aria-labelledby="pt-gq">
          <h4 id="pt-gq" className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/60">
            {tr("Questions you may want to ask")}
          </h4>
          <ol className="mt-3 space-y-2">
            {g.questions.map((q, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="tabular mt-2 w-5 shrink-0 text-[12px] text-white/50">{i + 1}.</span>
                <label className="sr-only" htmlFor={`pt-gq-${i}`}>
                  {tr("Question {n}", { n: i + 1 })}
                </label>
                <textarea
                  id={`pt-gq-${i}`}
                  value={q}
                  rows={2}
                  onChange={(e) => upd((x) => ({ ...x, questions: x.questions.map((y, j) => (j === i ? e.target.value : y)) }))}
                  className="min-h-[44px] w-full resize-y rounded-[12px] border border-white/15 bg-white/[0.06] px-3 py-2 text-[14px] text-white placeholder:text-white/40 focus-visible:border-white/50 focus-visible:outline-none"
                />
                <button type="button" onClick={() => upd((x) => ({ ...x, questions: x.questions.filter((_, j) => j !== i) }))} aria-label={tr("Remove question {n}", { n: i + 1 })} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white/60 hover:bg-white/10">
                  ✕
                </button>
              </li>
            ))}
          </ol>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draftQ.trim()) return;
              upd((x) => ({ ...x, questions: [...x.questions, draftQ.trim().slice(0, 300)] }));
              setDraftQ("");
            }}
          >
            <label className="sr-only" htmlFor="pt-gq-new">
              {tr("Add your own question")}
            </label>
            <input id="pt-gq-new" value={draftQ} onChange={(e) => setDraftQ(e.target.value)} placeholder={tr("Add your own question")} className="min-h-[44px] w-full rounded-[12px] border border-white/15 bg-white/[0.06] px-3 text-[14px] text-white placeholder:text-white/45" />
            <button type="submit" className="rounded-full bg-white px-4 text-[13px] font-semibold text-ink">
              {tr("Add")}
            </button>
          </form>
        </section>
        <div className="space-y-4 lg:col-span-5">
          <section className="pt-card">
            <h4 className="text-[13px] font-semibold text-ink-3">{tr("Information you may want to bring")}</h4>
            <ul className="mt-2 space-y-1.5">
              {d.bring.map((b) => (
                <li key={say(b)} className="flex gap-2 text-[13.5px] text-ink">
                  <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  {say(b)}
                </li>
              ))}
            </ul>
          </section>
          <section className="pt-card">
            <h4 className="text-[13px] font-semibold text-ink-3">{tr("Possible discussion areas")}</h4>
            <ul className="mt-2 space-y-1.5">
              {d.discussion.map((b) => (
                <li key={say(b)} className="flex gap-2 text-[13.5px] text-ink">
                  <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-300" />
                  {say(b)}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[12px] text-ink-3">{tr("Topics to help structure the conversation, not a plan of tests. Your doctor decides what is appropriate.")}</p>
          </section>
        </div>
      </div>

      <section className="pt-card">
        <label htmlFor="pt-gnotes" className="text-[13px] font-semibold text-ink-3">
          {tr("Your personal notes")}
        </label>
        <textarea id="pt-gnotes" value={g.notes} onChange={(e) => upd((x) => ({ ...x, notes: e.target.value.slice(0, 1500) }))} rows={3} placeholder={tr("Anything you want to remember to say, or ask")} className="pt-input mt-2 !h-auto py-2.5" />
      </section>

      <section className="pt-card" aria-labelledby="pt-gshare">
        <h4 id="pt-gshare" className="text-[15.5px] font-semibold text-ink">
          {tr("What you share with Dr Layla")}
        </h4>
        <p className="mt-0.5 text-[13.5px] text-ink-2">{tr("Nothing is shared until you choose it here. Tick only what you want her to see; you can stop sharing at any time.")}</p>
        <p className="mt-1 text-[12.5px] text-ink-3">{tr("A change Masar noticed is shown to her only if you also share the data it comes from.")}</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {KEYS.filter((k) => available.has(k)).map((k) => {
            const a = available.get(k)!;
            return (
              <li key={k}>
                <label className={`flex min-h-[52px] items-start gap-3 rounded-[14px] border px-3.5 py-2.5 ${a.available ? "cursor-pointer border-rule hover:border-rule-strong" : "border-dashed border-rule opacity-70"}`}>
                  <input type="checkbox" disabled={!a.available} checked={g.share[k] && a.available} onChange={(e) => upd((x) => ({ ...x, share: { ...x.share, [k]: e.target.checked } }))} className="mt-1 h-4 w-4 accent-[var(--color-accent)]" />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-medium text-ink">{tr(SHARE_LABEL[k])}</span>
                    <span className="block text-[12.5px] text-ink-3">{a.available ? say(a.detail) : SHARE_SCOPE[k] ? tr("Not available: its permission is off, or nothing is recorded") : tr("Nothing to share yet")}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={share} disabled={!ticked.length} className="btn btn-primary disabled:opacity-50">
            {g.sharedAt ? tr("Update what Dr Layla sees") : tr("Share my selection with Dr Layla")}
          </button>
          {g.sharedAt ? (
            <button type="button" onClick={stop} className="btn btn-secondary">
              {tr("Stop sharing")}
            </button>
          ) : null}
          <span className="text-[12.5px] text-ink-3">{tr("Sharing switches on “Your family doctor”: only Dr Layla Al Hashimi. Never employers, insurers or anyone else.")}</span>
        </div>
        {g.sharedAt ? (
          <p role="status" className="mt-3 rounded-[12px] bg-accent-soft px-4 py-2.5 text-[13.5px] text-ink">
            {tr("Shared on {date}: {list}.", { date: date(g.sharedAt), list: shared.length ? shared.map((k) => tr(SHARE_LABEL[k])).join(s.lang === "ar" ? "، " : ", ") : tr("nothing that is still permitted") })}
            {shared.length < g.sharedKeys.length ? ` ${tr("Some parts are no longer visible to her because you switched their permission off.")}` : ""}
          </p>
        ) : (
          <p className="mt-3">
            <Pill tone="stone">{tr("Not shared")}</Pill>
          </p>
        )}
      </section>
    </div>
  );
}

type Tr = (t: string, v?: Record<string, string | number>) => string;
type Say = (l: { text: string; vars?: Record<string, string | number> }) => string;

function guideBlocks(g: Guide, d: GuideDraft, name: string, tr: Tr, say: Say, date: (iso: string) => string, lang: "en" | "ar"): PdfBlock[] {
  return [
    { kind: "kicker", text: lang === "ar" ? `${tr("Consultation guide")} · Masar` : "CONSULTATION GUIDE · MASAR" },
    { kind: "title", text: name },
    { kind: "meta", text: `${tr("Prepared {date}", { date: date(g.at) })} · ${tr("Synthetic prototype data")}` },
    { kind: "notice", text: tr("Masar provides educational information and decision support. It does not diagnose, predict fertility or recommend treatment; clinical decisions stay with qualified professionals. Pilot environment: records shown are synthetic.") },
    { kind: "h2", text: tr("Why this guide was created") },
    { kind: "p", text: g.intro },
    { kind: "h2", text: tr("Your timeline") },
    ...d.timeline.map((t) => ({ kind: "li" as const, text: `${date(t.at)}: ${say(t.text)}` })),
    { kind: "h2", text: tr("What remains unknown") },
    ...d.unknown.map((u) => ({ kind: "li" as const, text: say(u) })),
    { kind: "h2", text: tr("Questions you may want to ask") },
    ...g.questions.map((q) => ({ kind: "li" as const, text: q })),
    { kind: "h2", text: tr("Information you may want to bring") },
    ...d.bring.map((b) => ({ kind: "li" as const, text: say(b) })),
    { kind: "h2", text: tr("Possible discussion areas") },
    ...d.discussion.map((b) => ({ kind: "li" as const, text: say(b) })),
    ...(g.notes.trim() ? [{ kind: "h2" as const, text: tr("Your personal notes") }, { kind: "p" as const, text: g.notes.trim() }] : []),
  ];
}

