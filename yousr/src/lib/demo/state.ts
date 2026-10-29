import "server-only";
import { cookies } from "next/headers";
import { DEMO_COOKIE, parsePosition, stepAt, type DemoPosition, type DemoStep } from "./chapters";

export interface DemoState {
  position: DemoPosition;
  step: DemoStep;
}

/** Guided-demo position from the cookie, or null when not in the demo. */
export async function getDemoState(): Promise<DemoState | null> {
  const store = await cookies();
  const position = parsePosition(store.get(DEMO_COOKIE)?.value);
  if (!position) return null;
  return { position, step: stepAt(position) };
}
