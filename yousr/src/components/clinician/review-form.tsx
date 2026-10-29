"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/client";
import { submitReview } from "@/server/actions/clinician";
import { Button } from "@/components/ui/atoms";

export function ReviewForm({ patientId }: { patientId: string }) {
  const { t } = useI18n();
  const [decision, setDecision] = useState<"Accept" | "Modify" | "Override">("Accept");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <form
      className="surface-paper p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        start(async () => {
          try {
            await submitReview(patientId, decision, reason, note);
            setDone(true);
          } catch (ex) {
            setErr(ex instanceof Error ? ex.message : "error");
          }
        });
      }}
    >
      <h2 className="text-ink-900">{t("clinician.decide")}</h2>
      <p className="mt-1 text-xs text-ink-600">{t("clinician.decideNote")}</p>
      <div className="mt-3 flex flex-wrap gap-2" role="radiogroup">
        {(["Accept", "Modify", "Override"] as const).map((d) => (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={decision === d}
            onClick={() => setDecision(d)}
            className={`rounded-pill border px-4 py-1.5 text-sm ${decision === d ? "border-mist-700 bg-mist-100 text-mist-700" : "border-dawn-300 bg-dawn-50 text-ink-600"}`}
          >
            {t(`clinician.${d}`)}
          </button>
        ))}
      </div>
      <label className="mt-4 block text-sm">
        <span className="text-ink-900">{t("clinician.reasonLabel")}</span>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required={decision === "Override"}
          className="mt-1 w-full rounded-md border border-dawn-300 bg-dawn-50 px-3 py-2"
        />
      </label>
      <label className="mt-3 block text-sm">
        <span className="text-ink-900">{t("clinician.noteLabel")}</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="mt-1 w-full rounded-md border border-dawn-300 bg-dawn-50 px-3 py-2" />
      </label>
      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" disabled={pending || done}>
          {t("clinician.record")}
        </Button>
        {done ? <span className="text-sm text-mist-700">{t("clinician.recorded")}</span> : null}
        {err ? <span className="text-sm text-amber-700">{err}</span> : null}
      </div>
    </form>
  );
}
