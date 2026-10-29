/**
 * Demo mode: Masar has no real sign-in in this prototype, so choosing a synthetic
 * person is the only way in. Set MASAR_DEMO_MODE=off to disable it (persona
 * switching and passwordless sign-in are refused on the server, not just hidden).
 */
export function isDemoMode(): boolean {
  return process.env.MASAR_DEMO_MODE !== "off";
}
