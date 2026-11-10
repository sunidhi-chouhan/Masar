"use client";

import { useState } from "react";
import { deleteMyData } from "@/server/actions";
import { SubmitButton } from "./submit-button";
import { t, type Lang, type Vars } from "@/lib/i18n";

/** Two steps, so nobody deletes their data by accident. */
export function DeleteData({ lang }: { lang: Lang }) {
  const tr = (text: string, vars?: Vars) => t(lang, text, vars);
  const [sure, setSure] = useState(false);
  if (!sure) {
    return (
      <button type="button" onClick={() => setSure(true)} className="rounded-full border border-rose-300 bg-white px-4 py-2 text-[13.5px] font-semibold text-rose-700 hover:bg-rose-50">
        {tr("Delete my Masar data")}
      </button>
    );
  }
  return (
    <form action={deleteMyData} className="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
      <p className="flex-1 text-[13.5px] text-rose-900">
        {tr("This removes your answers, choices, requests and uploaded reports from Masar, and signs you out. Your clinic and lab records are not affected. It can't be undone.")}
      </p>
      <button type="button" onClick={() => setSure(false)} className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-[13.5px] font-medium">
        {tr("Keep my data")}
      </button>
      <SubmitButton pendingLabel={tr("Deleting")} className="rounded-full bg-rose-600 px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-rose-700">
        {tr("Yes, delete it")}
      </SubmitButton>
    </form>
  );
}
