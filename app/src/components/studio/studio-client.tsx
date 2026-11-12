"use client";

import { useId, useRef, useState } from "react";
import { SubmitButton } from "../submit-button";

// Interactive pieces of the Demo Studio. The server actions they run are the
// existing ones (bound to the access key on the server); these components only
// add explanation, confirmation and feedback around them.

/** Copies a sign-in link, and says whether it worked. The link itself is never shown. */
export function CopyLink({ url, who }: { url: string; who: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | undefined>(undefined);
  const copy = async () => {
    window.clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      setState("failed");
    }
    timer.current = window.setTimeout(() => setState("idle"), 2200);
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy sign-in link for ${who}`}
      className={`studio-btn studio-btn--quiet ${state === "copied" ? "is-done" : state === "failed" ? "is-error" : ""}`}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden className="shrink-0">
        {state === "copied" ? (
          <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <rect x="5" y="5" width="8" height="9" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <path d="M3 10.5V3.6C3 2.7 3.7 2 4.6 2H10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </>
        )}
      </svg>
      <span aria-live="polite">{state === "copied" ? "Copied" : state === "failed" ? "Couldn't copy" : "Copy link"}</span>
    </button>
  );
}

/**
 * An action that explains itself first. When `confirm` is true the trigger
 * opens a short panel listing exactly what will happen, and the action runs
 * only from the explicit confirm button. When false, it runs straight away.
 */
export function ConfirmAction({
  action,
  label,
  pendingLabel,
  title,
  points,
  confirm,
  confirmLabel,
  tone = "primary",
}: {
  action: () => Promise<void>;
  label: string;
  pendingLabel: string;
  title: string;
  points: string[];
  confirm: boolean;
  confirmLabel: string;
  tone?: "primary" | "danger" | "quiet";
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const btn = tone === "danger" ? "studio-btn studio-btn--danger" : tone === "quiet" ? "studio-btn studio-btn--quiet" : "studio-btn studio-btn--primary";

  if (!confirm) {
    return (
      <form action={action}>
        <SubmitButton pendingLabel={pendingLabel} className={btn}>
          {label}
        </SubmitButton>
      </form>
    );
  }

  return (
    <div className="w-full">
      {!open ? (
        <button type="button" className={btn} aria-expanded={false} aria-controls={id} onClick={() => setOpen(true)}>
          {label}
        </button>
      ) : (
        <form action={action} id={id} role="group" aria-labelledby={`${id}-t`} className={`studio-confirm ${tone === "danger" ? "studio-confirm--danger" : ""}`}>
          <p id={`${id}-t`} className="text-[15px] font-semibold text-ink">
            {title}
          </p>
          <ul className="mt-2 space-y-1.5 text-[14px] leading-snug text-ink-2">
            {points.map((p) => (
              <li key={p} className="flex gap-2.5">
                <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <SubmitButton pendingLabel={pendingLabel} className={tone === "danger" ? "studio-btn studio-btn--danger-solid" : "studio-btn studio-btn--primary"}>
              {confirmLabel}
            </SubmitButton>
            <button type="button" className="studio-btn studio-btn--quiet" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
