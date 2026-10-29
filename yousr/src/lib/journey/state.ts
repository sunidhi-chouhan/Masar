import "server-only";
import { cookies } from "next/headers";

export const JOURNEY_COOKIE = "masar_journey";

export type JourneyStage =
  | "role"
  | "consent"
  | "stepper"
  | "prepare"
  | "ai"
  | "done";

export type JourneyPath = "patient" | "clinician" | "admin";

export interface JourneyState {
  stage: JourneyStage;
  path: JourneyPath;
  sex?: "female" | "male";
  stepIndex?: number;
}

export function parseJourneyCookie(raw: string | undefined): JourneyState | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as JourneyState;
    if (!v?.stage || !v?.path) return null;
    return v;
  } catch {
    return null;
  }
}

export async function getJourneyState(): Promise<JourneyState | null> {
  const store = await cookies();
  return parseJourneyCookie(store.get(JOURNEY_COOKIE)?.value);
}

export async function setJourneyState(state: JourneyState) {
  const store = await cookies();
  store.set(JOURNEY_COOKIE, JSON.stringify(state), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function clearJourneyState() {
  const store = await cookies();
  store.delete(JOURNEY_COOKIE);
}
