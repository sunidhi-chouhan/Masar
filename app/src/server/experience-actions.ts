"use server";

import { revalidatePath } from "next/cache";
import { SHARE_LABEL } from "@/lib/longitudinal";
import { parseChat, parseGuide, parseJourney } from "@/lib/journey-input";
import { requireRole } from "./session";
import { logAccess, person, updatePerson } from "./store";

// Saves for the latest resident experience on a signed-in account. The
// session decides whose record is written; the browser's copy of the state is
// only a proposal, validated field by field. Consent for the existing sources,
// sharing and the assistant still goes through the existing actions in
// actions.ts, so their access-log wording and side effects are unchanged.

/** Cycle tracking and lifestyle check-ins: the two permissions the longitudinal layer added. */
export async function setTrackingConsent(key: "cycles" | "lifestyle", on: boolean) {
  const s = await requireRole("person");
  if (key !== "cycles" && key !== "lifestyle") return;
  updatePerson(s.id, (p) => ({ ...p, longitudinal: { ...p.longitudinal, [key]: on === true } }));
  logAccess({ personId: s.id, who: "You", what: `${on ? "Shared" : "Stopped sharing"}: ${key === "cycles" ? "Cycle tracking" : "Lifestyle check-ins"}`, allowed: true });
  revalidatePath("/me");
}

/** The demo clock, the person's own entries and edits, their guide and their assistant turns. */
export async function saveExperience(patch: { journey?: unknown; guide?: unknown; chat?: unknown }) {
  const s = await requireRole("person");
  const before = person(s.id).longitudinal;
  const next = {
    ...before,
    ...(patch.journey !== undefined ? { journey: parseJourney(patch.journey, before.journey.stage) } : {}),
    ...(patch.guide !== undefined ? { guide: parseGuide(patch.guide) } : {}),
    ...(patch.chat !== undefined ? { chat: parseChat(patch.chat) } : {}),
  };
  updatePerson(s.id, (p) => ({ ...p, longitudinal: next }));

  // What the person would want to see in their access history.
  const was = before.guide?.sharedAt ?? null;
  const now = next.guide?.sharedAt ?? null;
  if (now && now !== was) logAccess({ personId: s.id, who: "You", what: `Shared your consultation guide with Dr Layla: ${(next.guide?.sharedKeys ?? []).map((k) => SHARE_LABEL[k]).join(", ")}`, allowed: true });
  if (was && !now) logAccess({ personId: s.id, who: "You", what: "Stopped sharing your consultation guide", allowed: true });
  const added = next.journey.edits.entries.length - before.journey.edits.entries.length;
  if (added > 0) logAccess({ personId: s.id, who: "You", what: "Logged new observations in My trajectory", allowed: true });
  if (next.journey.edits.hidden.length > before.journey.edits.hidden.length || added < 0) logAccess({ personId: s.id, who: "You", what: "Removed one of your own observations", allowed: true });
}

/** Dr Layla confirms a lab result against the original report, in a timeline the person shared. */
export async function confirmTimelineLab(personId: string, obsId: string) {
  await requireRole("clinician");
  const p = person(personId);
  const shared = p.shareWithClinician && p.longitudinal.guide?.sharedAt && p.longitudinal.guide.sharedKeys.includes("labs") && p.sources.lab;
  if (!shared || !/^[\w-]{1,40}$/.test(obsId)) {
    logAccess({ personId, who: "Dr Layla Al Hashimi (family physician)", what: "Tried to confirm a result in a timeline that isn't shared", allowed: false });
    return;
  }
  updatePerson(personId, (x) => ({ ...x, longitudinal: { ...x.longitudinal, journey: { ...x.longitudinal.journey, edits: { ...x.longitudinal.journey.edits, confirmed: [...new Set([...x.longitudinal.journey.edits.confirmed, obsId])] } } } }));
  logAccess({ personId, who: "Dr Layla Al Hashimi (family physician)", what: "Confirmed a lab result in your timeline", allowed: true });
  revalidatePath(`/clinic/${personId}`);
}
