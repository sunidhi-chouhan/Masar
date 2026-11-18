"use client";

import { useEffect, useRef, useState } from "react";
import { INTENT_QUESTION, type Answer, type Intent } from "@/lib/longitudinal";
import { geminiAsk } from "./adapters";
import { useProto } from "./core";
import { withAudit, type ChatTurn } from "./state";

// The assistant, grounded in the person's authorised longitudinal record.
// Every answer has the same structure, so observation, evidence, uncertainty
// and the professional pathway are always visibly separate, and each answer
// says exactly which categories the AI was given and which were withheld.

const STARTERS: Intent[] = ["changes", "relevant", "missing", "why", "cannot", "lab", "specialist", "prepare", "track"];

/** Older starter events from insight cards, mapped onto the longitudinal intents. */
function intentFrom(detail: { kind?: string; code?: string } | undefined): Intent | undefined {
  if (!detail) return undefined;
  if (detail.kind === "journey" && detail.code) return detail.code as Intent;
  if (detail.kind === "unknown") return "missing";
  if (detail.kind === "questions") return "prepare";
  if (detail.kind === "measure") return "lab";
  if (detail.kind === "insight") return "why";
  return undefined;
}

export function Assistant() {
  const { s, set, tr, base, accessKey, aiMode, live } = useProto();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const name = base.name.split(" ")[0];

  const ask = async (q: string, intent?: Intent) => {
    setOpen(true);
    setBusy(true);
    const r = await geminiAsk(s, base, accessKey, q, intent, live?.api);
    const turn: ChatTurn = { q, a: r.answer, source: r.source, used: r.used, withheld: r.withheld, at: new Date().toISOString() };
    set((x) =>
      withAudit(
        { ...x, chat: [...x.chat, turn].slice(-12) },
        {
          role: "system",
          who: r.source === "ai" ? "Gemini (via Masar's adapter)" : r.source === "mock" ? "Gemini demo mock" : "Masar",
          what: r.source === "urgent" ? "Answered an urgent message with fixed text; nothing was sent to the AI" : r.source === "ai" ? "Answered a question from authorised longitudinal data" : "Answered a question in Masar's own words",
          allowed: true,
        },
      ),
    );
    setBusy(false);
  };
  useEffect(() => {
    const on = (e: Event) => {
      const det = (e as CustomEvent<{ text?: string; intent?: { kind: string; code?: string } }>).detail ?? {};
      if (det.text) void ask(det.text, intentFrom(det.intent));
      else setOpen(true);
    };
    window.addEventListener("masar:ask", on);
    return () => window.removeEventListener("masar:ask", on);
  });
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [s.chat.length, busy]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  const mode = !s.consent.ai ? tr("AI processing is off: Masar answers in its own words") : !s.geminiOn ? tr("Gemini is unavailable: Masar answers in its own words") : aiMode === "mock" ? tr("Gemini demo mock: no live model call, same checks") : aiMode === "off" ? tr("No Gemini key here: Masar answers in its own words") : tr("Gemini, given only what you've allowed");

  return (
    <>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="fixed bottom-4 end-4 z-[65] flex min-h-[48px] items-center gap-2 rounded-full border border-rule bg-surface px-4 text-[13.5px] font-semibold text-ink shadow-[0_18px_40px_-14px_rgb(0_0_0/0.35)]">
        <span aria-hidden className="orb" style={{ width: 22, height: 22 }}>
          <span className="orb__core" />
        </span>
        {tr("Ask about your trajectory")}
      </button>
      {open ? (
        <div role="dialog" aria-label={tr("Masar assistant")} className="pt-pop fixed bottom-20 end-4 z-[65] flex max-h-[min(78svh,700px)] w-[min(440px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[22px] border border-rule bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0/0.4)]">
          <header className="flex items-start justify-between gap-3 border-b border-rule px-4 py-3">
            <div>
              <p className="text-[14.5px] font-semibold text-ink">{tr("Masar assistant")}</p>
              <p className="text-[11.5px] text-ink-3">{tr("Explains your timeline using only what you've allowed. Educational support, not a diagnosis.")}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-ink-2">
                <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${s.consent.ai && s.geminiOn ? "bg-date" : "bg-ink-3"}`} />
                {mode}
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={tr("Close")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-3 hover:bg-zinc-100">
              ✕
            </button>
          </header>
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite" aria-busy={busy}>
            {!s.chat.length ? (
              <div className="grid gap-2">
                {STARTERS.map((i) => (
                  <button key={i} type="button" onClick={() => void ask(tr(INTENT_QUESTION[i]), i)} className="rounded-[14px] border border-rule px-3.5 py-2.5 text-start text-[13.5px] font-medium text-ink hover:border-accent hover:bg-accent-soft">
                    {tr(INTENT_QUESTION[i])}
                  </button>
                ))}
              </div>
            ) : null}
            {s.chat.map((t, i) => (
              <div key={i} className="space-y-2">
                <p className="ms-auto max-w-[85%] rounded-[16px] bg-accent px-3.5 py-2 text-[14px] text-white">{t.q}</p>
                <StructuredAnswer t={t} />
              </div>
            ))}
            {busy ? (
              <p role="status" className="flex items-center gap-2 text-[13px] text-ink-3">
                <span className="jr-spinner !h-3.5 !w-3.5" aria-hidden />
                {tr("Reading your authorised timeline")}…
              </p>
            ) : null}
            {s.chat.length ? (
              <div className="flex flex-wrap gap-1.5">
                {STARTERS.filter((i) => !s.chat.some((c) => c.q === tr(INTENT_QUESTION[i]))).slice(0, 3).map((i) => (
                  <button key={i} type="button" onClick={() => void ask(tr(INTENT_QUESTION[i]), i)} className="rounded-full border border-rule px-3 py-1.5 text-[12.5px] text-ink-2 hover:border-accent">
                    {tr(INTENT_QUESTION[i])}
                  </button>
                ))}
                <button type="button" onClick={() => set((x) => withAudit({ ...x, chat: [] }, { role: "patient", who: name, what: "Cleared the assistant conversation", allowed: true }))} className="rounded-full px-3 py-1.5 text-[12.5px] text-ink-3 underline-offset-4 hover:underline">
                  {tr("Clear")}
                </button>
              </div>
            ) : null}
            <div ref={end} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget).get("q");
              if (typeof f === "string" && f.trim() && !busy) void ask(f.trim().slice(0, 300));
              e.currentTarget.reset();
              input.current?.focus();
            }}
            className="border-t border-rule p-3"
          >
            <label className="sr-only" htmlFor="pt-ask">
              {tr("Ask about your timeline")}
            </label>
            <input ref={input} id="pt-ask" name="q" maxLength={300} placeholder={tr("Ask about your timeline")} className="pt-input" />
            <p className="mt-1.5 text-[11px] text-ink-3">{tr("It explains; it doesn't diagnose. In an emergency, call 999.")}</p>
          </form>
        </div>
      ) : null}
    </>
  );
}

function StructuredAnswer({ t }: { t: ChatTurn }) {
  const { tr } = useProto();
  const a: Answer = t.a;
  const [ctx, setCtx] = useState(false);
  const sections: [string, string | string[]][] = [
    [tr("Observation"), a.observation],
    [tr("Context"), a.context],
    [tr("Evidence"), a.evidence],
    [tr("Uncertainty"), a.uncertainty],
    [tr("Options"), a.options],
    [tr("Preparation"), a.preparation],
    [tr("Professional pathway"), a.pathway],
  ];
  return (
    <div className={`max-w-[96%] rounded-[16px] border px-3.5 py-3 ${t.source === "urgent" ? "border-urgent bg-urgent-soft" : "border-rule bg-zinc-50"}`}>
      <dl className="space-y-2.5">
        {sections
          .filter(([, v]) => (Array.isArray(v) ? v.length : v))
          .map(([k, v]) => (
            <div key={k}>
              <dt className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-3">{k}</dt>
              <dd className="mt-0.5 text-[13.5px] leading-relaxed text-ink">
                {Array.isArray(v) ? (
                  <ul className="space-y-1">
                    {v.map((x) => (
                      <li key={x} className="flex gap-2">
                        <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        {x}
                      </li>
                    ))}
                  </ul>
                ) : (
                  v
                )}
              </dd>
            </div>
          ))}
      </dl>
      {a.references.length ? (
        <p className="mt-2.5 flex flex-wrap gap-1.5">
          {a.references
            .filter((r) => /^(cycle_variation|sleep_shift|stress_shift|new_lab|gap_device|gap_cycle)$/.test(r))
            .map((r) => (
              <a key={r} href={`#chg-${r}`} className="rounded-full border border-rule bg-surface px-2 py-0.5 text-[11.5px] font-medium text-accent">
                {tr("See the observation")}
              </a>
            ))
            .slice(0, 2)}
        </p>
      ) : null}
      <p className="mt-2.5 flex flex-wrap items-center gap-x-2 text-[11px] text-ink-3">
        <span>
          {t.source === "ai" ? tr("Written by Gemini from your authorised data, checked by Masar") : t.source === "mock" ? tr("Gemini demo mock, no live model call. Checked by Masar") : t.source === "urgent" ? tr("Fixed safety text. Nothing was sent to the AI.") : tr("In Masar's own words, from the same authorised data")}
        </span>
        <button type="button" aria-expanded={ctx} onClick={() => setCtx((o) => !o)} className="font-semibold text-accent underline-offset-4 hover:underline">
          {tr("What the assistant was given")}
        </button>
      </p>
      {ctx ? (
        <div className="mt-1.5 rounded-[12px] bg-surface px-3 py-2 text-[12px] text-ink-2">
          <p>
            <span className="font-semibold text-ink">{tr("Given")}: </span>
            {t.used.length ? t.used.map((u) => tr(u)).join(", ") : t.source === "ai" ? tr("Your goals and Masar's findings only") : tr("Nothing was sent to an AI")}
          </p>
          <p className="mt-0.5">
            <span className="font-semibold text-ink">{tr("Withheld")}: </span>
            {t.withheld.length ? t.withheld.map((u) => tr(u)).join(", ") : tr("nothing")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
