"use client";

import { useActionState, useState } from "react";
import { uploadReport, type UploadResult } from "@/server/actions";
import { CellLoader } from "./loaders";
import { t, type Lang, type Vars } from "@/lib/i18n";

export function ReportUpload({ reportId, lang }: { reportId: string; lang: Lang }) {
  const tr = (text: string, vars?: Vars) => t(lang, text, vars);
  const [state, action, pending] = useActionState<UploadResult | null, FormData>(uploadReport.bind(null, reportId), null);
  const [name, setName] = useState<string | null>(null);

  if (pending) {
    return (
      <div className="mt-4 flex items-center gap-4 rounded-2xl bg-indigo-50/70 p-4">
        <CellLoader size={40} />
        <div>
          <p className="text-[14px] font-semibold text-indigo-950">{tr("Reading your report…")}</p>
          <p className="text-[13px] text-indigo-900/70">{tr("This takes a few seconds. You'll check what we found before it counts.")}</p>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="mt-4">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-zinc-300 px-4 py-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40">
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden className="text-indigo-500">
          <path d="M12 16V4m0 0l-4.5 4.5M12 4l4.5 4.5M4 16v2.5A1.5 1.5 0 005.5 20h13a1.5 1.5 0 001.5-1.5V16" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[14px] font-medium text-zinc-900">{name ?? tr("Choose the report, or take a photo of it")}</span>
        <span className="text-[12.5px] text-zinc-500">{tr("PDF or photo, up to 8 MB")}</span>
        <input
          type="file"
          name="file"
          required
          accept="application/pdf,image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => setName(e.target.files?.[0]?.name ?? null)}
        />
      </label>
      {state && !state.ok ? <p className="mt-2 text-[13px] text-rose-700">{tr(state.error)}</p> : null}
      <button type="submit" disabled={!name} className="mt-3 w-full rounded-full bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-zinc-200 disabled:text-zinc-400">
        {tr("Upload and read it")}
      </button>
    </form>
  );
}
