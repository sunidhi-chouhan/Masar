"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { isLocale, type Locale } from "@/lib/i18n/config";
import {
  DEMO_COOKIE,
  DEMO_LOCALE_COOKIE,
  parsePosition,
  serializePosition,
  stepAt,
  type DemoPosition,
} from "@/lib/demo/chapters";
import { importSynthetic } from "@/server/integrations";
import { loadPatientBundle, syncDerived } from "@/server/patient";
import type { Confidence, Direction } from "@/lib/domain/types";

async function signInPersona(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role === "cohort") throw new Error("UNKNOWN_PERSONA");
  const store = await cookies();
  store.set(SESSION_COOKIE, user.id, { httpOnly: true, sameSite: "lax", path: "/" });
}

async function openPosition(p: DemoPosition, fallbackLocale: string) {
  const step = stepAt(p);
  await signInPersona(step.persona);
  const store = await cookies();
  store.set(DEMO_COOKIE, serializePosition(p), { sameSite: "lax", path: "/" });
  const loc: Locale = step.locale ?? (isLocale(fallbackLocale) ? fallbackLocale : "en");
  redirect(`/${loc}${step.path}`);
}

/** Landing page: begin the story at chapter 1. */
export async function startDemo(locale: string) {
  const store = await cookies();
  store.set(DEMO_LOCALE_COOKIE, isLocale(locale) ? locale : "en", { sameSite: "lax", path: "/" });
  await openPosition({ chapter: 0, step: 0 }, locale);
}

/** Rail: move to an explicit chapter/step. */
export async function goToDemoStep(chapter: number, step: number, locale: string) {
  const p = parsePosition(`${chapter}.${step}`);
  if (!p) throw new Error("BAD_POSITION");
  const store = await cookies();
  const startLocale = store.get(DEMO_LOCALE_COOKIE)?.value ?? locale;
  // Steps without a forced locale return to the language the demo started in.
  await openPosition(p, startLocale);
}

/** Rail: leave the story but stay signed in as the current persona. */
export async function exitDemo(locale: string) {
  const store = await cookies();
  store.delete(DEMO_COOKIE);
  const startLocale = store.get(DEMO_LOCALE_COOKIE)?.value ?? locale;
  store.delete(DEMO_LOCALE_COOKIE);
  redirect(`/${isLocale(startLocale) ? startLocale : "en"}/demo`);
}

/** Rail: last step reached. */
export async function finishDemo(locale: string) {
  const store = await cookies();
  store.delete(DEMO_COOKIE);
  const startLocale = store.get(DEMO_LOCALE_COOKIE)?.value ?? locale;
  store.delete(DEMO_LOCALE_COOKIE);
  redirect(`/${isLocale(startLocale) ? startLocale : "en"}/demo?done=1`);
}

export interface DemoImportResult {
  status: "ok" | "duplicate" | "blocked" | "empty";
  observation: { code: string; value: number; unit: string; effectiveAt: string; source: "LabMock" } | null;
  before: { direction: Direction; confidence: Confidence } | null;
  after: { direction: Direction; confidence: Confidence } | null;
}

/**
 * Chapter 3: write a synthetic AMH result for Mariam through the same
 * connector path a real integration would use. Blocked (and audited) if she
 * has lab results switched off; a repeat on the same day adds nothing.
 */
export async function demoImportAmh(): Promise<DemoImportResult> {
  const userId = "u_mariam";
  const actor = { userId, role: "patient" as const };
  const value = 1.4;
  const unit = "ng/mL";
  const now = new Date();

  const beforeBundle = await loadPatientBundle(actor, userId, "PersonalView", "recompute");
  const beforeR = beforeBundle.results.find((r) => r.domain === "reserve");
  const before = beforeR ? { direction: beforeR.direction, confidence: beforeR.confidence } : null;

  const result = await importSynthetic(userId, "LabMock", [{ code: "amh", valueNum: value, unit, effectiveAt: now }]);

  let after = before;
  if (result.status === "ok") {
    const afterBundle = await loadPatientBundle(actor, userId, "PersonalView", "recompute");
    await syncDerived(afterBundle);
    const afterR = afterBundle.results.find((r) => r.domain === "reserve");
    after = afterR ? { direction: afterR.direction, confidence: afterR.confidence } : null;
  }
  revalidatePath("/", "layout");
  return {
    status: result.status,
    observation:
      result.status === "ok" || result.status === "duplicate"
        ? { code: "amh", value, unit, effectiveAt: now.toISOString(), source: "LabMock" }
        : null,
    before,
    after,
  };
}
