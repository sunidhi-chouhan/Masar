"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { authorizeOrThrow } from "@/lib/consent/authorize";
import { recordReview } from "@/server/clinician";

export async function submitReview(patientId: string, decision: string, reason: string, note: string) {
  const s = await requireSession();
  if (s.role !== "clinician") throw new Error("FORBIDDEN");
  if (!["Accept", "Modify", "Override"].includes(decision)) return;
  if (decision === "Override" && !reason.trim()) throw new Error("REASON_REQUIRED");
  await authorizeOrThrow({
    actor: { userId: s.userId, role: s.role },
    subjectId: patientId,
    purpose: "ClinicianReview",
    resource: "review",
    silent: true,
  });
  await recordReview(s.userId, patientId, decision as "Accept" | "Modify" | "Override", reason || undefined, note || undefined);
  revalidatePath("/", "layout");
}
