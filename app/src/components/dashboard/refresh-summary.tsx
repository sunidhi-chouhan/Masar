"use client";

import { useState } from "react";
import { refreshSummary } from "@/server/journey-actions";

/** Rewrites the summary from the current answers. Shown only when the assistant is allowed. */
export function RefreshSummary({ labels }: { labels: { idle: string; busy: string; ai: string; mock: string; masar: string; failed: string } }) {
  const [state, setState] = useState<"idle" | "busy" | "ai" | "mock" | "masar" | "failed">("idle");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={state === "busy"}
        onClick={async () => {
          setState("busy");
          try {
            setState((await refreshSummary()).source);
          } catch {
            setState("failed");
          }
        }}
        className="btn btn-secondary disabled:opacity-60"
      >
        {state === "busy" ? labels.busy : labels.idle}
      </button>
      <p role="status" className="text-[13px] text-ink-2">
        {state === "ai" || state === "mock" || state === "masar" || state === "failed" ? labels[state] : ""}
      </p>
    </div>
  );
}
