"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { INTENTIONS, type Intention } from "@/lib/domain/types";
import { isLocale } from "@/lib/i18n/config";
import { DEMO_COOKIE } from "@/lib/demo/chapters";
import { isDemoMode } from "@/lib/demo/mode";

const INTENTION_COOKIE = "masar_intention";

export async function signInAs(userId: string, locale: string) {
  if (!isDemoMode()) throw new Error("DEMO_MODE_OFF");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role === "cohort") throw new Error("UNKNOWN_PERSONA");
  const store = await cookies();
  store.set(SESSION_COOKIE, user.id, { httpOnly: true, sameSite: "lax", path: "/" });
  // Manually switching personas leaves any active guided-demo rail so the
  // normal authenticated workspace stays free of walkthrough chrome.
  store.delete(DEMO_COOKIE);

  // Apply an intention chosen before sign-in.
  const pending = store.get(INTENTION_COOKIE)?.value;
  if (user.role === "patient" && pending && (INTENTIONS as readonly string[]).includes(pending)) {
    await prisma.user.update({ where: { id: user.id }, data: { intention: pending } });
    store.delete(INTENTION_COOKIE);
  }
  const loc = isLocale(locale) ? locale : "en";
  const dest = user.role === "clinician" ? "/clinician" : user.role === "admin" ? "/population" : "/trajectory";
  redirect(`/${loc}${dest}`);
}

/** Demo runner: sign in as a persona and land on a specific screen. */
export async function signInAndGo(userId: string, locale: string, path: string) {
  if (!isDemoMode()) throw new Error("DEMO_MODE_OFF");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role === "cohort") throw new Error("UNKNOWN_PERSONA");
  const store = await cookies();
  store.set(SESSION_COOKIE, user.id, { httpOnly: true, sameSite: "lax", path: "/" });
  // Exploring a screen on its own leaves the guided story.
  store.delete(DEMO_COOKIE);
  const loc = isLocale(locale) ? locale : "en";
  const safe = path.startsWith("/") && !path.startsWith("//") ? path : "/";
  redirect(`/${loc}${safe}`);
}

export async function signOut(locale: string) {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(DEMO_COOKIE);
  redirect(`/${isLocale(locale) ? locale : "en"}/login`);
}

export async function chooseIntention(formData: FormData) {
  const intention = String(formData.get("intention") ?? "");
  const locale = String(formData.get("locale") ?? "en");
  if (!(INTENTIONS as readonly string[]).includes(intention)) return;
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  const loc = isLocale(locale) ? locale : "en";
  if (sessionId) {
    const user = await prisma.user.findUnique({ where: { id: sessionId } });
    if (user?.role === "patient") {
      await prisma.user.update({ where: { id: user.id }, data: { intention: intention as Intention } });
      redirect(`/${loc}/trajectory`);
    }
  }
  store.set(INTENTION_COOKIE, intention, { sameSite: "lax", path: "/" });
  redirect(`/${loc}/login`);
}
