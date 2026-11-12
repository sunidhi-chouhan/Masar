import { getSession, isPerson } from "@/server/session";
import { logAccess, person, readUpload } from "@/server/store";
import { reportFileAccess, reportsForOthers } from "@/server/views";

// Opens an uploaded report: for the person themself, or for their doctor while
// they share with them, have "Lab results" switched on, and have checked the
// report. Every look by the doctor is logged, allowed or blocked.
export async function GET(_req: Request, ctx: RouteContext<"/api/reports/[personId]/[reportId]">) {
  const { personId, reportId } = await ctx.params;
  const session = await getSession();
  if (!isPerson(personId)) return new Response("Not found", { status: 404 });
  const access = reportFileAccess(session, personId);
  if (access.kind === "none") return new Response("Not found", { status: 404 });

  let report = person(personId).reports.find((r) => r.id === reportId);
  if (access.kind === "doctor") {
    const state = access.state;
    const visible = state.shareWithClinician ? reportsForOthers(state).find((r) => r.id === reportId) : undefined;
    const allowed = Boolean(visible?.file);
    logAccess({ personId, who: "Dr Layla Al Hashimi (family physician)", what: "Opened an uploaded report", allowed });
    if (!allowed) return new Response("This report is not shared with you.", { status: 403 });
    report = visible;
  }

  const bytes = report?.file && readUpload(personId, report.file.stored);
  if (!report?.file || !bytes) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": report.file.mime,
      "content-disposition": `inline; filename="${report.file.name.replace(/[^\w.-]+/g, "_")}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
