"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { dirOf, t, type Lang } from "@/lib/i18n";

type Brief = { opening: string; points: string[]; questions: string[] };
type Message = { role: "user" | "assistant"; text: string; brief?: Brief | null; suggestions?: string[] };

const STARTERS = ["Explain my results simply", "Help me start the conversation with my doctor", "Ask me a few questions", "What can't Masar tell me?"];

/** Opens the assistant from anywhere on the page, optionally with a question. */
export function askMasar(text?: string) {
  window.dispatchEvent(new CustomEvent("masar:ask", { detail: text }));
}

export function AskButton({ text, children, className }: { text?: string; children: React.ReactNode; className?: string }) {
  return (
    <button type="button" onClick={() => askMasar(text)} className={className}>
      {children}
    </button>
  );
}

function Orb({ size = 28, busy = false }: { size?: number; busy?: boolean }) {
  return (
    <span aria-hidden className={`orb ${busy ? "orb--busy" : ""}`} style={{ width: size, height: size }}>
      <span className="orb__core" />
    </span>
  );
}

function BriefCard({ brief, lang }: { brief: Brief; lang: Lang }) {
  const [copied, setCopied] = useState(false);
  const text = [`"${brief.opening}"`, "", ...brief.points.map((p) => `• ${p}`), "", t(lang, "My questions:"), ...brief.questions.map((q, i) => `${i + 1}. ${q}`)].join("\n");
  return (
    <div className="mt-2 rounded-2xl border border-indigo-200 bg-white p-4 text-[13.5px] shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-indigo-600">{t(lang, "To bring to your doctor")}</p>
      <p className="mt-2 font-medium text-zinc-950">&ldquo;{brief.opening}&rdquo;</p>
      {brief.points.length ? (
        <ul className="mt-2 space-y-0.5 text-zinc-600">
          {brief.points.map((p) => (
            <li key={p}>· {p}</li>
          ))}
        </ul>
      ) : null}
      <ol className="mt-3 space-y-1 text-zinc-800">
        {brief.questions.map((q, i) => (
          <li key={q}>
            <span className="tabular me-1.5 text-indigo-600">{i + 1}.</span>
            {q}
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(text).then(() => setCopied(true))}
        className="mt-3 rounded-full border border-zinc-300 px-3 py-1 text-[12.5px] font-medium text-zinc-700 hover:border-indigo-400 hover:text-indigo-700"
      >
        {copied ? t(lang, "Copied") : t(lang, "Copy note")}
      </button>
    </div>
  );
}

export function Companion({ firstName, aiOn, lang = "en" }: { firstName: string; aiOn: boolean; lang?: Lang }) {
  const tr = (text: string, vars?: Record<string, string | number>) => t(lang, text, vars);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [from, setFrom] = useState<"ai" | "masar" | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  // The latest messages, for send() when it is called from the window event listener.
  const history = useRef<Message[]>([]);
  useEffect(() => {
    history.current = messages;
  }, [messages]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    const next = [...history.current, { role: "user" as const, text: clean }];
    history.current = next;
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/companion", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, text }) => ({ role, text })) }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const out = (await res.json()) as { reply: string; suggestions: string[]; brief: Brief | null; from: "ai" | "masar" };
      setFrom(out.from);
      setMessages((m) => [...m, { role: "assistant", text: out.reply, brief: out.brief, suggestions: out.suggestions }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: tr("Sorry, I couldn't answer just now. Please try again in a moment.") }]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const onAsk = (e: Event) => {
      setOpen(true);
      const text = (e as CustomEvent<string | undefined>).detail;
      if (text) void send(text);
      else setTimeout(() => field.current?.focus(), 50);
    };
    window.addEventListener("masar:ask", onAsk);
    return () => window.removeEventListener("masar:ask", onAsk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Rendered on <body>: the page-enter animation transforms the page, which would trap position: fixed.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!mounted) return null;

  const lastSuggestions = !busy && messages.at(-1)?.role === "assistant" ? messages.at(-1)?.suggestions ?? [] : [];

  return createPortal(
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        dir={dirOf(lang)}
        className={`fixed bottom-5 end-5 z-40 flex items-center gap-2.5 rounded-full bg-zinc-950 py-2 ps-2 pe-4 text-[14px] font-medium text-white shadow-[0_12px_40px_-12px_rgb(79_70_229/0.7)] transition hover:-translate-y-0.5 ${open ? "pointer-events-none opacity-0" : ""}`}
      >
        <Orb size={30} />
        {tr("Ask Masar")}
      </button>

      <div
        role="dialog"
        aria-label={tr("Masar assistant")}
        dir={dirOf(lang)}
        lang={lang}
        aria-hidden={!open}
        className={`companion fixed inset-x-3 bottom-3 z-50 flex max-h-[min(640px,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-white/95 shadow-[0_30px_80px_-20px_rgb(24_24_27/0.35)] backdrop-blur-xl sm:inset-x-auto sm:end-5 sm:bottom-5 sm:w-[400px] ${open ? "companion--open" : ""}`}
      >
        <header className="flex items-center gap-3 border-b border-zinc-200/70 px-4 py-3">
          <Orb size={34} busy={busy} />
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] font-semibold text-zinc-950">{tr("Masar assistant")}</p>
            <p className="truncate text-[12px] text-zinc-500">
              {from === "masar" || !aiOn ? tr("Answers from Masar's own explanations") : tr("Explains your record. Your doctor decides.")}
            </p>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label={tr("Close")} className="grid h-8 w-8 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {!messages.length ? (
            <div className="page-enter">
              <p className="text-[15px] font-semibold text-zinc-950">{tr("Hi {name}.", { name: firstName })}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-zinc-600">
                {tr("I can explain what Masar found in plain words, help you get ready to talk to your doctor, or ask you a few questions to fill in the gaps. I only see what you chose to share.")}
              </p>
              <div className="mt-4 grid gap-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(tr(s))}
                    className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-start text-[13.5px] font-medium text-zinc-800 transition hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-800"
                  >
                    {tr(s)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-md bg-indigo-600 px-3.5 py-2 text-[14px] text-white">{m.text}</p>
              </div>
            ) : (
              <div key={i} className="page-enter max-w-[92%]">
                <p className="whitespace-pre-line rounded-2xl rounded-bl-md bg-zinc-100 px-3.5 py-2.5 text-[14px] leading-relaxed text-zinc-900">{m.text}</p>
                {m.brief ? <BriefCard brief={m.brief} lang={lang} /> : null}
              </div>
            ),
          )}

          {busy ? (
            <div className="flex items-center gap-2 text-[13px] text-zinc-500">
              <span className="typing" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              {tr("Thinking it through")}
            </div>
          ) : null}

          {lastSuggestions.length ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {lastSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-indigo-200 bg-indigo-50/60 px-3 py-1 text-[12.5px] font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="border-t border-zinc-200/70 p-3"
        >
          <div className="flex items-end gap-2 rounded-2xl border border-zinc-300 bg-white p-1.5 ps-3 focus-within:border-indigo-500">
            <textarea
              ref={field}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder={tr("Ask anything about your results")}
              className="max-h-28 min-h-[36px] flex-1 resize-none bg-transparent py-1.5 text-[14px] outline-none placeholder:text-zinc-400"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label={tr("Send")}
              className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:bg-zinc-200 disabled:text-zinc-400"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                <path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <p className="mt-2 px-1 text-[11.5px] text-zinc-400">{tr("It explains; it doesn't diagnose. In an emergency, call 999.")}</p>
        </form>
      </div>
    </>,
    document.body,
  );
}
