"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { JOURNEY_USER_ID, type Sex } from "@/lib/domain/types";
import { isLocale } from "@/lib/i18n/config";
import { DEMO_COOKIE } from "@/lib/demo/chapters";
import { isDemoMode } from "@/lib/demo/mode";
import {
  clearJourneyState,
  setJourneyState,
  type JourneyPath,
  type JourneyState,
} from "@/lib/journey/state";
import { resetJourneyUser } from "../../../prisma/personas";
import { setAiExplanationConsent, setSourceConsent } from "@/server/consent";
import { loadPatientBundle, syncDerived } from "@/server/patient";

async function setSession(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, userId, { httpOnly: true, sameSite: "lax", path: "/" });
  store.delete(DEMO_COOKIE);
}

export async function startJourney(locale: string) {
  if (!isDemoMode()) throw new Error("DEMO_MODE_OFF");
  await clearJourneyState();
  await setJourneyState({ stage: "role", path: "patient" });
  redirect(`/${isLocale(locale) ? locale : "en"}/journey`);
}

export async function pickJourneyRole(
  locale: string,
  choice: "female" | "male" | "clinician" | "admin",
) {
  if (!isDemoMode()) throw new Error("DEMO_MODE_OFF");
  const loc = isLocale(locale) ? locale : "en";

  if (choice === "clinician" || choice === "admin") {
    const path: JourneyPath = choice === "clinician" ? "clinician" : "admin";
    const userId = choice === "clinician" ? "u_layla" : "u_admin";
    await setSession(userId);
    await setJourneyState({ stage: "consent", path });
    redirect(`/${loc}/journey/consent`);
  }

  const sex: Sex = choice;
  await resetJourneyUser(prisma, sex);
  await setSession(JOURNEY_USER_ID);
  await setJourneyState({ stage: "consent", path: "patient", sex, stepIndex: 0 });
  redirect(`/${loc}/journey/consent`);
}

export async function acceptGuidelines(locale: string) {
  if (!isDemoMode()) throw new Error("DEMO_MODE_OFF");
  const loc = isLocale(locale) ? locale : "en";
  const store = await cookies();
  const raw = store.get("masar_journey")?.value;
  let state: JourneyState = { stage: "consent", path: "patient" };
  try {
    if (raw) state = JSON.parse(raw) as JourneyState;
  } catch {
    /* keep default */
  }

  if (state.path === "clinician") {
    await setJourneyState({ ...state, stage: "done" });
    redirect(`/${loc}/clinician`);
  }
  if (state.path === "admin") {
    await setJourneyState({ ...state, stage: "done" });
    redirect(`/${loc}/population`);
  }

  // Patient: SelfReport for PersonalView so their answers can be shown to them.
  await setSourceConsent(JOURNEY_USER_ID, "SelfReport", true);
  await setJourneyState({ ...state, stage: "stepper", stepIndex: 0 });
  redirect(`/${loc}/journey/stepper`);
}

export async function advanceStepper(locale: string, nextIndex: number, done: boolean) {
  if (!isDemoMode()) throw new Error("DEMO_MODE_OFF");
  const loc = isLocale(locale) ? locale : "en";
  const store = await cookies();
  let state: JourneyState = { stage: "stepper", path: "patient", stepIndex: 0 };
  try {
    const raw = store.get("masar_journey")?.value;
    if (raw) state = JSON.parse(raw) as JourneyState;
  } catch {
    /* keep */
  }

  if (done) {
    await setJourneyState({ ...state, stage: "prepare", stepIndex: nextIndex });
    redirect(`/${loc}/journey/prepare`);
  }
  await setJourneyState({ ...state, stage: "stepper", stepIndex: nextIndex });
  redirect(`/${loc}/journey/stepper`);
}

export async function finishPrepare(locale: string) {
  if (!isDemoMode()) throw new Error("DEMO_MODE_OFF");
  const loc = isLocale(locale) ? locale : "en";
  try {
    const bundle = await loadPatientBundle(
      { userId: JOURNEY_USER_ID, role: "patient" },
      JOURNEY_USER_ID,
      "PersonalView",
      "journey-prepare",
    );
    await syncDerived(bundle);
  } catch {
    /* still continue to AI consent */
  }
  const store = await cookies();
  let state: JourneyState = { stage: "prepare", path: "patient" };
  try {
    const raw = store.get("masar_journey")?.value;
    if (raw) state = JSON.parse(raw) as JourneyState;
  } catch {
    /* keep */
  }
  await setJourneyState({ ...state, stage: "ai" });
  redirect(`/${loc}/journey/ai`);
}

export async function decideAiExplanation(locale: string, accept: boolean) {
  if (!isDemoMode()) throw new Error("DEMO_MODE_OFF");
  const loc = isLocale(locale) ? locale : "en";
  await setAiExplanationConsent(JOURNEY_USER_ID, accept);
  await setJourneyState({ stage: "done", path: "patient" });
  revalidatePath("/", "layout");
  redirect(`/${loc}`);
}

export async function restartJourney(locale: string) {
  if (!isDemoMode()) throw new Error("DEMO_MODE_OFF");
  await clearJourneyState();
  await resetJourneyUser(prisma, "female");
  redirect(`/${isLocale(locale) ? locale : "en"}/journey`);
}
