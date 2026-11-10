"use client";

import { useState } from "react";

type Brief = { summary: string; focus: string[]; gaps: string[]; from: "ai" | "masar" };

export function VisitBriefButton({ patientId }: { patientId: string }) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/clinic/brief/${patientId}`, { method: "POST" });
      if (!res.ok) throw new Error();
      setBrief(await res.json());
    } catch {
      setError("Couldn't prepare the brief. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!brief) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={load}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13.5px] font-semibold text-indigo-950 shadow-sm hover:bg-indigo-50 disabled:opacity-70"
        >
          <span aria-hidden className={`orb ${busy ? "orb--busy" : ""}`} style={{ width: 18, height: 18 }}>
            <span className="orb__core" />
          </span>
          {busy ? "Preparing…" : "Prepare me for this visit"}
        </button>
        {error ? <span className="text-[13px] text-rose-200">{error}</span> : null}
      </div>
    );
  }
  return (
    <div className="page-enter rounded-2xl bg-white/95 p-4 text-zinc-900 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-indigo-600">
        Visit brief{brief.from === "ai" ? " · written by the assistant from this record" : ""}
      </p>
      <p className="mt-1.5 text-[14px] leading-relaxed">{brief.summary}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[12px] font-semibold text-zinc-500">Cover in the visit</p>
          <ul className="mt-1 space-y-0.5 text-[13.5px]">
            {brief.focus.map((f) => (
              <li key={f}>· {f}</li>
            ))}
          </ul>
        </div>
        {brief.gaps.length ? (
          <div>
            <p className="text-[12px] font-semibold text-zinc-500">Worth collecting</p>
            <ul className="mt-1 space-y-0.5 text-[13.5px]">
              {brief.gaps.map((g) => (
                <li key={g}>· {g}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
