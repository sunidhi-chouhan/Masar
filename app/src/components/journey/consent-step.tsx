"use client";

import { useRef, useState, useTransition } from "react";
import { t, type Lang, type Vars } from "@/lib/i18n";
import { setAssistantConsent, setReportReadingConsent, setSharing, setSource } from "@/server/actions";
import { StageActions, StageHead } from "./stage";

// Your permissions, after the questions: four compact categories (personal
// information, clinical records, AI assistance, sharing). Every permission is
// its own switch, off by default, optional, and revocable later in My data.
// Switching uses the existing consent actions, so enforcement and the access
// log are unchanged. The full explanation of each category opens in a dialog,
// so reading it never lengthens the page. Nothing here is a prerequisite.

import { PERMISSION_TEXT as TEXT, type ConsentItem, type ConsentKey } from "@/lib/permissions";
export type { ConsentItem, ConsentKey };

const GROUPS: { id: string; title: string; body: string; keys: ConsentKey[] }[] = [
  { id: "personal", title: "Personal information", body: "What you told Masar in this journey, and data from your own devices.", keys: ["self", "device"] },
  { id: "clinical", title: "Clinical records", body: "Records from clinics, laboratories and earlier checks.", keys: ["malaffi", "lab", "healthAge"] },
  { id: "ai", title: "AI assistance (Google Gemini)", body: "Two separate choices. Masar works fully without them.", keys: ["assistant", "reading"] },
  { id: "sharing", title: "Sharing with your clinician", body: "Who else may see your summary.", keys: ["share"] },
];

const STATUS = { none: "Not connected", granted: "Permission granted", revoked: "Permission revoked" } as const;

export function ConsentStep({
  items,
  lang,
  aiMode,
  saving,
  saveError,
  onBack,
  onNext,
}: {
  items: ConsentItem[];
  lang: Lang;
  aiMode: "live" | "mock" | "off";
  saving: boolean;
  saveError: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const tr = (text: string, vars?: Vars) => t(lang, text, vars);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<ConsentKey | null>(null);
  const [error, setError] = useState<ConsentKey | null>(null);
  const [openGroup, setOpenGroup] = useState<(typeof GROUPS)[number] | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const byKey = Object.fromEntries(items.map((i) => [i.key, i])) as Record<ConsentKey, ConsentItem>;

  const toggle = (key: ConsentKey, on: boolean) => {
    setBusy(key);
    setError(null);
    start(async () => {
      try {
        if (key === "share") await setSharing(on);
        else if (key === "assistant") await setAssistantConsent(on);
        else if (key === "reading") await setReportReadingConsent(on);
        else await setSource(key, on);
      } catch {
        setError(key);
      } finally {
        setBusy(null);
      }
    });
  };

  const explain = (g: (typeof GROUPS)[number]) => {
    setOpenGroup(g);
    dialog.current?.showModal();
  };

  return (
    <section className="jr-stage jr-enter" aria-labelledby="stage-3">
      <StageHead
        id="stage-3"
        eyebrow={tr("Your permissions")}
        title={tr("You decide what Masar may use.")}
        lead={tr("Each one is separate and off until you switch it on. Change them any time in My data.")}
      />

      <div className="jr-perms grid md:grid-cols-2">
        {GROUPS.map((g) => (
          <section key={g.id} aria-labelledby={`perm-${g.id}`} className="jr-perm rounded-[16px] border border-rule bg-surface">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id={`perm-${g.id}`} className="text-[15px] font-semibold text-ink">
                {tr(g.title)}
              </h2>
              <button type="button" onClick={() => explain(g)} className="link min-h-[32px] shrink-0 text-[13px]" aria-haspopup="dialog">
                {tr("What this means")}
                <span className="sr-only">: {tr(g.title)}</span>
              </button>
            </div>
            <ul className="divide-y divide-rule">
              {g.keys.map((key) => {
                const item = byKey[key];
                const id = `consent-${key}`;
                const disabled = pending && busy === key;
                const offNote = key === "self" && !item.on;
                return (
                  <li key={key} className="jr-perm-row flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <label htmlFor={id} className="cursor-pointer text-[14px] font-medium leading-tight text-ink">
                          {tr(TEXT[key].label)}
                        </label>
                        <span id={`${id}-status`} className="flex flex-wrap items-center gap-x-2 text-[11px]" aria-live="polite">
                          <span className={`jr-status jr-status--${item.status} !px-1.5 !py-0`}>{tr(STATUS[item.status])}</span>
                          {error === key ? <span className="text-urgent">{tr("Couldn't save. Please try again.")}</span> : null}
                          {disabled ? <span className="text-ink-3">{tr("Saving")}…</span> : null}
                        </span>
                      </div>
                      {offNote ? <p className="text-[11.5px] leading-snug text-ink-3">{tr("Off: your answers stay on this device and aren't used.")}</p> : null}
                    </div>
                    <span className="relative inline-flex shrink-0 items-center">
                      <input
                        id={id}
                        type="checkbox"
                        role="switch"
                        checked={item.on}
                        disabled={disabled}
                        onChange={(e) => toggle(key, e.target.checked)}
                        aria-describedby={`${id}-status`}
                        className="peer h-6 w-11 cursor-pointer appearance-none rounded-full bg-zinc-300 transition-colors checked:bg-accent disabled:cursor-progress focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      />
                      <span aria-hidden className="pointer-events-none absolute start-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5" />
                    </span>
                  </li>
                );
              })}
            </ul>
            {g.id === "ai" ? (
              <p className="mt-1 text-[11.5px] leading-snug text-ink-3">
                {aiMode === "mock"
                  ? tr("Demo mock: no live Gemini call is made.")
                  : aiMode === "off"
                    ? tr("Gemini isn't connected here, so Masar writes these itself.")
                    : tr("It never diagnoses or predicts. When off, Masar writes these itself.")}
              </p>
            ) : null}
          </section>
        ))}
      </div>

      {saveError ? (
        <p role="alert" className="mt-4 text-[14px] text-urgent">
          {tr("Couldn't continue. Nothing is lost; please try again.")}
        </p>
      ) : null}

      <StageActions>
        <button type="button" onClick={onBack} className="btn btn-secondary">
          {tr("Back")}
        </button>
        <button type="button" onClick={onNext} disabled={saving || pending} className="btn btn-primary ms-auto disabled:opacity-60">
          {saving ? `${tr("Saving")}…` : tr("Continue to your path")}
        </button>
      </StageActions>

      {/* What each permission means, without lengthening the page. */}
      <dialog
        ref={dialog}
        aria-labelledby="perm-dialog-title"
        onClose={() => setOpenGroup(null)}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="jr-dialog"
      >
        {openGroup ? (
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{tr("What this means")}</p>
                <h2 id="perm-dialog-title" className="display mt-1 text-[1.6rem] leading-tight text-ink">
                  {tr(openGroup.title)}
                </h2>
                <p className="mt-1 text-[14px] text-ink-2">{tr(openGroup.body)}</p>
              </div>
              <button type="button" onClick={() => dialog.current?.close()} className="btn btn-secondary !min-h-[40px] !px-4 text-[13.5px]" autoFocus>
                {tr("Close")}
              </button>
            </div>
            <div className="mt-4 space-y-5">
              {openGroup.keys.map((key) => {
                const c = TEXT[key];
                return (
                  <div key={key}>
                    <h3 className="text-[15px] font-semibold text-ink">{tr(c.label)}</h3>
                    <p className="text-[13.5px] text-ink-2">{tr(c.involves)}</p>
                    <dl className="mt-2 grid grid-cols-1 gap-3 rounded-[14px] bg-paper p-3.5 text-[13.5px] sm:grid-cols-2">
                      {[
                        ["Why Masar may use it", c.why],
                        ["What Masar will do", c.does],
                        ["What it will never do", c.never],
                        ["Who sees or processes it", c.who],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">{tr(k)}</dt>
                          <dd className="mt-0.5 text-ink-2">{tr(v)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                );
              })}
              {openGroup.id === "ai" ? (
                <p className="text-[13px] text-ink-3">
                  {tr("Powered by Google Gemini for personalized follow-up questions and concise health-context summaries. It never diagnoses or predicts.")}
                  {aiMode === "mock" ? ` ${tr("In this demo, Gemini runs as a labelled mock: no live model call is made.")}` : ""}
                  {aiMode === "off" ? ` ${tr("Gemini isn't connected in this environment, so Masar writes these itself.")}` : ""}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </dialog>
    </section>
  );
}
