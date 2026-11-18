"use client";

import { useEffect } from "react";
import { addDays, changesForClinician, sentences, SCOPE_LABEL, SHARE_LABEL, type Lane, type Obs, type ShareKey } from "@/lib/longitudinal";
import { Pill, useProto } from "./core";
import { ChangeCard, LaneCard, ProvenanceTag } from "./trajectory";
import { sharedNow, useGuideDraft } from "./prepare-guide";
import { withAudit } from "./state";

// Dr Layla's view of the patient's timeline: only the sections the patient
// ticked when sharing their guide, and only while each section's permission
// is still on. Every item says where it came from; Masar's observations are
// marked as observations, never as clinical findings.

const ALL_KEYS: ShareKey[] = ["goals", "changes", "cycles", "symptoms", "lifestyle", "wearable", "labs", "history", "questions", "notes"];

export function ClinicianTrajectory() {
  const { s, set, tr, say, date, journey: jv, base } = useProto();
  const d = useGuideDraft();
  const keys = sharedNow(s.guide, s.consent);
  const allowed = keys.length > 0;
  // Each opening of the timeline is written to the access history, allowed or not.
  useEffect(() => {
    set((x) => withAudit(x, { role: "clinician", who: "Dr Layla Al Hashimi", what: allowed ? "Opened the patient's shared timeline" : "Tried to open a timeline that isn't shared", allowed }));
  }, [set, allowed]);
  const has = (k: ShareKey) => keys.includes(k);
  const name = base.name.split(" ")[0];

  if (!s.guide?.sharedAt || !keys.length) {
    return (
      <div className="pt-card max-w-2xl">
        <p className="text-[15.5px] font-semibold text-ink">{tr("{name} hasn't shared a timeline with you", { name })}</p>
        <p className="mt-1 text-[14px] text-ink-2">{tr("Patients choose, section by section, what to share from their consultation guide. Nothing from their tracking is shown to you until they do, and it disappears if they stop sharing or switch a permission off.")}</p>
        <p className="mt-3 text-[12.5px] text-ink-3">{tr("In the demo: switch to the patient, create the guide in Prepare, tick sections and share them.")}</p>
      </div>
    );
  }

  const from = addDays(jv.asOf, -365);
  const lanes: { lane: Lane; only?: (o: Obs) => boolean }[] = [];
  const L = (id: Lane["id"]) => jv.lanes.find((l) => l.id === id)!;
  if (has("cycles") || has("symptoms")) lanes.push({ lane: L("cycle"), only: (o) => (o.type === "symptom" ? has("symptoms") : has("cycles")) });
  if (has("lifestyle")) lanes.push({ lane: L("lifestyle") });
  if (has("wearable")) lanes.push({ lane: L("device") });
  if (has("labs") || has("history")) lanes.push({ lane: L("clinical"), only: (o) => (o.type === "lab" ? has("labs") : has("history")) });
  // A change is shown only when "Changes" and the change's own data category are both shared.
  const changes = changesForClinician(jv.changes, keys);
  const hiddenChanges = has("changes") ? jv.changes.length - changes.length : 0;
  const why = sentences([...(has("goals") && d.shared.find((x) => x.key === "goals")?.available ? [say({ text: "Their plans: {goal}", vars: { goal: say(d.shared.find((x) => x.key === "goals")!.detail) } })] : []), ...changes.filter((c) => c.kind !== "data").map((c) => say(c.title))]);
  const notShared = ALL_KEYS.filter((k) => !has(k) && d.shared.some((x) => x.key === k));

  return (
    <div className="space-y-4">
      <div className="pt-card border-s-4 border-s-soon">
        <p className="text-[13px] font-semibold text-soon">{tr("Patient-authorised summary · shared {date}", { date: date(s.guide.sharedAt) })}</p>
        <p className="mt-1 text-[14px] text-ink">{tr("Masar organises what the patient chose to share. It doesn't diagnose, and its observations are not clinical findings: interpretation and decisions stay with you.")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px] text-ink-2">
          <span className="font-semibold text-ink">{tr("Sources")}:</span>
          <ProvenanceTag p="user" />
          <ProvenanceTag p="device" />
          <ProvenanceTag p="imported" />
          <ProvenanceTag p="clinician" />
          <span className="inline-flex items-center rounded-full border border-dashed border-date px-2 py-0.5 text-[11.5px] font-semibold text-ink-2">{tr("AI-generated")}</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11.5px] font-semibold text-ink-2">{tr("Synthetic demonstration data")}</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="pt-card">
          <p className="eyebrow">{tr("Reproductive goals")}</p>
          <p className="mt-2 text-[14.5px] text-ink">{has("goals") ? say(d.shared.find((x) => x.key === "goals")!.detail) : tr("Not shared with you")}</p>
          <p className="mt-1 text-[12px] text-ink-3">{tr("Patient-reported")}</p>
        </div>
        <div className="pt-card lg:col-span-2">
          <p className="eyebrow">{tr("Why the patient prepared this")}</p>
          <p className="mt-2 text-[14px] text-ink">{why || tr("The patient didn't share their reasons or any changes.")}</p>
          <p className="mt-1 text-[12px] text-ink-3">{tr("Built only from the sections the patient shared")}</p>
        </div>
      </div>

      {lanes.length ? (
        <div className="space-y-4">
          <h3 className="display text-[1.3rem] text-ink">{tr("Timeline")}</h3>
          {lanes.map((l) => (
            <LaneCard key={l.lane.id} lane={l.lane} from={from} readOnly only={l.only} />
          ))}
        </div>
      ) : null}

      {has("changes") ? (
        <div className="space-y-3">
          <h3 className="display text-[1.3rem] text-ink">{tr("Observations Masar surfaced, with their support")}</h3>
          {changes.length ? changes.map((c) => <ChangeCard key={c.id} c={c} clinician compact />) : <p className="pt-card text-[14px] text-ink-2">{tr("No changes detected in what is shared.")}</p>}
          {hiddenChanges ? <p className="text-[12.5px] text-ink-3">{tr("{n} more observations rely on data the patient hasn't shared with you, so they are not shown.", { n: hiddenChanges })}</p> : null}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="pt-card">
          <p className="eyebrow">{tr("Limitations")}</p>
          <ul className="mt-2 space-y-1.5 text-[13.5px] text-ink-2">
            {d.unknown.map((u) => (
              <li key={say(u)} className="flex gap-2">
                <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full border border-dashed border-unknown" />
                {say(u)}
              </li>
            ))}
            {notShared.length ? (
              <li className="flex gap-2">
                <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-zinc-300" />
                {tr("Not shared with you: {list}", { list: notShared.map((k) => tr(SHARE_LABEL[k])).join(", ") })}
              </li>
            ) : null}
            {jv.withheld.length ? (
              <li className="flex gap-2">
                <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-zinc-300" />
                {tr("The patient hasn't allowed Masar to use: {list}", { list: jv.withheld.map((x) => tr(SCOPE_LABEL[x])).join(", ") })}
              </li>
            ) : null}
            <li className="flex gap-2">
              <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-zinc-300" />
              {tr("Self-logged tracking can be incomplete; gaps are shown, not filled.")}
            </li>
          </ul>
        </div>
        <div className="pt-card">
          <p className="eyebrow">{tr("Patient questions")}</p>
          {has("questions") ? (
            <ol className="mt-2 list-decimal space-y-1.5 ps-5 text-[14px] text-ink">
              {s.guide.questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-[13.5px] text-ink-3">{tr("Not shared with you")}</p>
          )}
          {has("notes") && s.guide.notes.trim() ? (
            <>
              <p className="eyebrow mt-4">{tr("Patient's notes")}</p>
              <p className="mt-1 whitespace-pre-line text-[14px] text-ink">{s.guide.notes}</p>
            </>
          ) : null}
        </div>
      </div>

      <div className="pt-card">
        <p className="eyebrow">{tr("Potential discussion areas")}</p>
        <ul className="mt-2 grid gap-2 md:grid-cols-2">
          {d.discussion.map((x) => (
            <li key={say(x)} className="rounded-[12px] border border-rule px-3 py-2 text-[13.5px] text-ink">
              {say(x)}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[12px] text-ink-3">{tr("Educational prompts to structure the conversation. They are not a diagnostic pathway.")}</p>
        <Pill tone="stone">{tr("Every view of this timeline is recorded in the patient's access history")}</Pill>
      </div>
    </div>
  );
}
