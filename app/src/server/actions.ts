"use server";

import { randomUUID } from "node:crypto";
import { LANG_COOKIE, type Lang } from "@/lib/i18n";
import { getLang } from "./lang";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SOURCES, type OptionKind, type SourceId } from "@/lib/model";
import { OPTION_LABEL, RULES } from "@/lib/signals";
import { HEROES } from "@/lib/population";
import { clinicianLabel } from "@/lib/accounts";
import { answersFromRecords, questionsFor, type Answers } from "@/lib/profile";
import { clearCookieName, getSession, isPerson, requireRole, sessionCookie } from "./session";
import { accessAllowed } from "./access";
import { logAccess, person, resetPerson, resetState, saveUpload, updatePerson, type Belief, type Decision } from "./store";
import { ACCEPTED, MAX_BYTES, TESTS, readReport } from "./ai/reports";
import { personView } from "./views";

const BELIEFS: Belief[] = ["true", "false", "unsure"];
const SOURCE_IDS = SOURCES.map((s) => s.id);

/** From the access page: wipe one resident back to a first visit and sign in as them. */
export async function startFresh(key: string, personId: string) {
  if (!accessAllowed(key) || !isPerson(personId)) throw new Error("FORBIDDEN");
  resetPerson(personId);
  const [name, value] = sessionCookie({ role: "person", id: personId });
  (await cookies()).set(name, value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 });
  redirect("/me");
}

export async function signOut() {
  (await cookies()).delete(clearCookieName());
  redirect("/");
}

/** Restores every account to its starting state. Only from the protected access page. */
export async function resetData(key: string) {
  if (!accessAllowed(key)) throw new Error("FORBIDDEN");
  resetState();
  (await cookies()).delete(clearCookieName());
  redirect(`/access?key=${encodeURIComponent(key)}&reset=1`);
}

/** First visit: what to share, with whom, and the short "before" check. */
export async function completeOnboarding(form: FormData) {
  const s = await requireRole("person");
  const sources = Object.fromEntries(SOURCE_IDS.map((id) => [id, form.get(`source_${id}`) === "on"])) as Record<SourceId, boolean>;
  const beliefs = [0, 1, 2].map((i) => {
    const b = String(form.get(`belief_${i}`) ?? "unsure") as Belief;
    return BELIEFS.includes(b) ? b : "unsure";
  });
  const worry = Math.min(4, Math.max(1, Number(form.get("worry") ?? 2)));
  const answers = readAnswers(s.id, form);
  const assistantConsent = form.get("consent_assistant") === "on";
  const reportReadingConsent = form.get("consent_reportReading") === "on";
  updatePerson(s.id, (p) => ({
    ...p,
    onboarded: true,
    sources,
    shareWithClinician: form.get("share_clinician") === "on",
    assistantConsent,
    reportReadingConsent,
    answers,
    beliefsBefore: beliefs,
    worryBefore: worry,
  }));
  const chosen = SOURCES.filter((x) => sources[x.id]).map((x) => x.label);
  logAccess({ personId: s.id, who: "You", what: chosen.length ? `Agreed to share: ${chosen.join(", ")}` : "Chose not to share any records yet", allowed: true });
  logAccess({
    personId: s.id,
    who: "You",
    what: form.get("share_clinician") === "on" ? "Allowed your doctor to see your summary" : "Kept your summary private from your doctor",
    allowed: true,
  });
  logAccess({ personId: s.id, who: "You", what: ASSISTANT_LOG[String(assistantConsent) as "true" | "false"], allowed: true });
  logAccess({ personId: s.id, who: "You", what: READING_LOG[String(reportReadingConsent) as "true" | "false"], allowed: true });
  revalidatePath("/", "layout");
  redirect("/me");
}

const ASSISTANT_LOG = {
  true: "Allowed Masar's assistant to read your summary",
  false: "Kept your summary from Masar's assistant",
} as const;
const READING_LOG = {
  true: "Allowed Masar's assistant to read your uploaded reports",
  false: "Kept your uploaded reports from Masar's assistant",
} as const;

/** Lets Masar's assistant (Google Gemini) read the person's summary, or stops it at once. */
export async function setAssistantConsent(on: boolean) {
  const s = await requireRole("person");
  const had = Boolean(person(s.id).journey.summary);
  // Withdrawing consent also deletes what the assistant wrote from your data.
  updatePerson(s.id, (p) => ({ ...p, assistantConsent: on === true, journey: on === true ? p.journey : { ...p.journey, summary: null } }));
  logAccess({ personId: s.id, who: "You", what: on ? ASSISTANT_LOG.true : "Stopped Masar's assistant reading your summary", allowed: true });
  if (!on && had) logAccess({ personId: s.id, who: "Masar", what: "Deleted the summary Masar's assistant wrote", allowed: true });
  revalidatePath("/", "layout");
}

/** Lets Masar's assistant read uploaded reports, or stops it at once. */
export async function setReportReadingConsent(on: boolean) {
  const s = await requireRole("person");
  updatePerson(s.id, (p) => ({ ...p, reportReadingConsent: on === true }));
  logAccess({ personId: s.id, who: "You", what: on ? READING_LOG.true : "Stopped Masar's assistant reading your uploaded reports", allowed: true });
  revalidatePath("/", "layout");
}

/** Only accept answers that are real options for this person's questions. */
function readAnswers(personId: string, form: FormData): Answers {
  const r = HEROES.find((h) => h.id === personId);
  if (!r) return {};
  const out: Answers = {};
  for (const q of questionsFor(r.sex)) {
    const allowed = new Set(q.options.map((o) => o.value));
    if (q.multi) {
      out[q.id] = form.getAll(`q_${q.id}`).map(String).filter((v) => allowed.has(v));
    } else {
      const v = form.get(`q_${q.id}`);
      if (typeof v === "string" && allowed.has(v)) out[q.id] = v;
    }
  }
  return out;
}

export async function saveAnswers(form: FormData) {
  const s = await requireRole("person");
  const answers = readAnswers(s.id, form);
  updatePerson(s.id, (p) => ({ ...p, answers }));
  logAccess({ personId: s.id, who: "You", what: "Updated your answers about your health", allowed: true });
  revalidatePath("/", "layout");
  redirect("/me");
}

export async function setSource(source: SourceId, on: boolean) {
  const s = await requireRole("person");
  if (!SOURCE_IDS.includes(source)) return;
  updatePerson(s.id, (p) => ({ ...p, sources: { ...p.sources, [source]: on } }));
  logAccess({ personId: s.id, who: "You", what: `${on ? "Shared" : "Stopped sharing"}: ${SOURCES.find((x) => x.id === source)?.label}`, allowed: true });
  revalidatePath("/", "layout");
}

export async function setSharing(on: boolean) {
  const s = await requireRole("person");
  updatePerson(s.id, (p) => ({ ...p, shareWithClinician: on }));
  logAccess({ personId: s.id, who: "You", what: on ? "Allowed your doctor to see your summary" : "Stopped your doctor seeing your summary", allowed: true });
  revalidatePath("/", "layout");
}

export async function setScanning(on: boolean) {
  const s = await requireRole("person");
  updatePerson(s.id, (p) => ({ ...p, scanning: on }));
  logAccess({ personId: s.id, who: "You", what: on ? "Asked Masar to keep an eye out" : "Asked Masar to stop keeping an eye out", allowed: true });
  revalidatePath("/", "layout");
}

export async function requestConversation(form: FormData) {
  const s = await requireRole("person");
  const v = personView(s.id);
  const option = String(form.get("option")) as OptionKind;
  if (!v.options.includes(option) || !(option in OPTION_LABEL)) return;
  const questions = form.getAll("question").map(String).filter(Boolean).slice(0, 8);
  const own = String(form.get("own_question") ?? "").trim().slice(0, 300);
  updatePerson(s.id, (p) => ({
    ...p,
    request: { at: new Date().toISOString(), option, questions: own ? [...questions, own] : questions, status: "requested" },
  }));
  revalidatePath("/", "layout");
}

export async function completeAfterCheck(form: FormData) {
  const s = await requireRole("person");
  if (person(s.id).request?.status !== "attended") return;
  const beliefs = [0, 1, 2].map((i) => {
    const b = String(form.get(`belief_${i}`) ?? "unsure") as Belief;
    return BELIEFS.includes(b) ? b : "unsure";
  });
  updatePerson(s.id, (p) => ({
    ...p,
    beliefsAfter: beliefs,
    worryAfter: Math.min(4, Math.max(1, Number(form.get("worry") ?? 2))),
    sure: [0, 1, 2, 3].map((i) => form.get(`sure_${i}`) === "yes"),
  }));
  revalidatePath("/", "layout");
}

/** The clinician may act only on a named person who shares with them. */
async function clinicianTarget(personId: string) {
  const s = await getSession();
  if (!s || s.role !== "clinician") throw new Error("FORBIDDEN");
  if (!isPerson(personId)) throw new Error("UNKNOWN_PERSON");
  if (!person(personId).shareWithClinician) {
    logAccess({ personId, who: clinicianLabel(s.id), what: "Tried to record a decision", allowed: false });
    throw new Error("NOT_SHARED");
  }
  return s;
}

export async function clinicianDecide(personId: string, form: FormData) {
  const s = await clinicianTarget(personId);
  const decision = String(form.get("decision")) as Decision;
  if (!["Accept", "Modify", "Override"].includes(decision)) return;
  const reason = String(form.get("reason") ?? "").trim().slice(0, 300);
  if (decision === "Override" && !reason) return;
  updatePerson(personId, (p) => ({
    ...p,
    request: p.request && {
      ...p.request,
      status: "reviewed",
      decision,
      addTest: decision === "Modify",
      reason: reason || undefined,
      note: String(form.get("note") ?? "").trim().slice(0, 500) || undefined,
      decidedAt: new Date().toISOString(),
    },
  }));
  logAccess({ personId, who: clinicianLabel(s.id), what: `Reviewed your request (${{ Accept: "agreed", Modify: "agreed and added a test", Override: "suggested something different" }[decision]})`, allowed: true });
  revalidatePath("/", "layout");
}

export async function clinicianBook(personId: string) {
  await clinicianTarget(personId);
  const when = new Date(Date.now() + 9 * 86_400_000).toISOString().slice(0, 10);
  updatePerson(personId, (p) => ({ ...p, request: p.request && { ...p.request, status: "booked", bookedFor: when } }));
  revalidatePath("/", "layout");
}

export async function clinicianAttended(personId: string) {
  await clinicianTarget(personId);
  updatePerson(personId, (p) => ({ ...p, request: p.request && { ...p.request, status: "attended", attendedAt: new Date().toISOString() } }));
  revalidatePath("/", "layout");
}

/** The doctor asks the person to upload a test result. */
export async function clinicianRequestReport(personId: string, form: FormData) {
  const s = await clinicianTarget(personId);
  const test = String(form.get("test") ?? "");
  if (!(TESTS as readonly string[]).includes(test)) return;
  const note = String(form.get("note") ?? "").trim().slice(0, 300);
  updatePerson(personId, (p) => ({
    ...p,
    reports: [{ id: randomUUID(), test, note, requestedAt: new Date().toISOString(), status: "requested" }, ...p.reports],
  }));
  logAccess({ personId, who: clinicianLabel(s.id), what: `Asked you to upload: ${test}`, allowed: true });
  revalidatePath("/", "layout");
}

const MAGIC: Record<string, (b: Buffer) => boolean> = {
  "application/pdf": (b) => b.subarray(0, 4).toString("latin1") === "%PDF",
  "image/png": (b) => b[0] === 0x89 && b.subarray(1, 4).toString("latin1") === "PNG",
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8,
  "image/webp": (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP",
};

export type UploadResult = { ok: true } | { ok: false; error: string };

/** The person uploads the report; Masar reads it and asks them to check the values. */
export async function uploadReport(reportId: string, _prev: UploadResult | null, form: FormData): Promise<UploadResult> {
  const session = await requireRole("person");
  const req = person(session.id).reports.find((r) => r.id === reportId);
  if (!req || req.status === "confirmed") return { ok: false, error: "This request is no longer open." };
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a file first." };
  if (file.size > MAX_BYTES) return { ok: false, error: "That file is over 8 MB. A photo or a smaller PDF works." };
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = file.type;
  if (!ACCEPTED.includes(mime) || !MAGIC[mime](bytes)) return { ok: false, error: "Please upload a PDF or a photo (PNG, JPG or WebP)." };

  const stored = saveUpload(session.id, file.name || "report", bytes);
  // Read by the assistant only with report-reading consent and Lab results on; checked inside readReport and again in generateJson.
  const reading = await readReport(session.id, { mime, bytes }, req.test, await getLang());
  updatePerson(session.id, (p) => ({
    ...p,
    reports: p.reports.map((r) =>
      r.id === reportId
        ? {
            ...r,
            status: "uploaded",
            file: { name: file.name || "report", mime, stored, size: file.size },
            uploadedAt: new Date().toISOString(),
            values: reading.values,
            forPerson: reading.forPerson,
            forDoctor: reading.forDoctor,
            readBy: reading.readBy,
          }
        : r,
    ),
  }));
  revalidatePath("/", "layout");
  return { ok: true };
}

/** The person checks the values Masar read; only the ones they keep count. */
export async function confirmReport(reportId: string, form: FormData) {
  const session = await requireRole("person");
  updatePerson(session.id, (p) => ({
    ...p,
    reports: p.reports.map((r) =>
      r.id === reportId && r.status === "uploaded"
        ? { ...r, status: "confirmed", confirmedAt: new Date().toISOString(), values: (r.values ?? []).filter((_, i) => form.get(`keep_${i}`) === "on") }
        : r,
    ),
  }));
  revalidatePath("/", "layout");
}

/** The person's right to erasure: wipe their Masar data and sign them out. */
export async function deleteMyData() {
  const s = await requireRole("person");
  resetPerson(s.id);
  (await cookies()).delete(clearCookieName());
  redirect("/?deleted=1");
}

/**
 * From the access page: puts the story mid-way, so every role has something
 * to act on. Noura has shared and asked to talk; Arjun has shared but not
 * asked yet; Maryam is a first-time visitor.
 */
export async function loadDemoStory(key: string) {
  if (!accessAllowed(key)) throw new Error("FORBIDDEN");
  resetState();
  const sources = { self: true, malaffi: true, lab: true, healthAge: true, device: false };
  const at = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();
  for (const id of ["noura", "arjun"]) {
    const r = HEROES.find((h) => h.id === id)!;
    updatePerson(id, (p) => ({
      ...p,
      onboarded: true,
      sources,
      shareWithClinician: true,
      answers: answersFromRecords(r),
      beliefsBefore: ["unsure", "true", "unsure"],
      worryBefore: 2,
    }));
    logAccess({ personId: id, who: "You", what: "Agreed to share: What you tell us, Clinic records (Malaffi), Lab results, Health Age check", allowed: true });
    logAccess({ personId: id, who: "You", what: "Allowed your doctor to see your summary", allowed: true });
  }
  const noura = personView("noura");
  updatePerson("noura", (p) => ({
    ...p,
    request: {
      at: at(1),
      option: noura.options.includes("Counsel") ? "Counsel" : noura.options[0],
      questions: [...new Set(noura.signals.flatMap((s) => RULES[s.code].questions))].slice(0, 3),
      status: "requested",
    },
  }));
  redirect(`/access?key=${encodeURIComponent(key)}&demo=1`);
}

/** "Not ready yet": remind the person in a few days. 0 clears the reminder. */
export async function setReminder(days: number) {
  const s = await requireRole("person");
  const d = Math.max(0, Math.min(90, Math.round(days)));
  updatePerson(s.id, (p) => ({ ...p, remindAt: d ? new Date(Date.now() + d * 86_400_000).toISOString() : null }));
  revalidatePath("/", "layout");
}

/** Switches the resident screens between English and Arabic. */
export async function setLanguage(lang: Lang) {
  (await cookies()).set(LANG_COOKIE, lang === "ar" ? "ar" : "en", { sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}
