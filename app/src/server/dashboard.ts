import "server-only";
import { buildDashboard, type Dashboard } from "@/lib/dashboard";
import type { PersonView } from "./views";

// The dashboard's input, taken only from what the person allowed: confirmed
// report values only while Lab results is on, clinic conditions only while
// Clinic records is on, quick-check answers only while "Your answers" is on.

export function dashboardFor(v: PersonView): Dashboard {
  const s = v.state;
  const confirmedValues = s.sources.lab
    ? s.reports.filter((r) => r.status === "confirmed").flatMap((r) => (r.values ?? []).map((x) => ({ ...x, uploadedAt: r.uploadedAt })))
    : [];
  return buildDashboard({
    name: v.resident.name.split(" ")[0],
    record: v.record,
    signals: v.signals,
    measures: v.measures,
    factors: v.factors,
    sources: s.sources,
    confirmedValues,
    scanning: s.scanning,
    recordConditions: s.sources.malaffi ? v.resident.conditions : [],
    touchpoint: v.resident.touchpoint,
    beliefs: s.sources.self && s.beliefsBefore ? [...s.beliefsBefore, s.journey.knowledgeExtra] : null,
    request: s.request ? { at: s.request.at, status: s.request.status, attendedAt: s.request.attendedAt ?? undefined, bookedFor: s.request.bookedFor ?? undefined } : null,
    reports: s.sources.lab ? s.reports.map((r) => ({ test: r.test, requestedAt: r.requestedAt, uploadedAt: r.uploadedAt, status: r.status })) : [],
  });
}
