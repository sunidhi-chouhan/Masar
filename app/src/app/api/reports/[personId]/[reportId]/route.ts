import { getSession, isPerson } from "@/server/session";
import { logAccess, person, readUpload } from "@/server/store";

// Opens an uploaded report: for the person themself, or for their doctor
// while they share with them. Every look by the doctor is logged.
export async function GET(_req: Request, ctx: RouteContext<"/api/reports/[personId]/[reportId]">) {
  const { personId, reportId } = await ctx.params;
  const session = await getSession();
  if (!session || !isPerson(personId)) return new Response("Not found", { status: 404 });
  const state = person(personId);
  const own = session.role === "person" && session.id === personId;
  const doctor = session.role === "clinician";
  if (!own && !doctor) return new Response("Not found", { status: 404 });
  if (doctor) {
    logAccess({ personId, who: "Dr Layla Al Hashimi (family physician)", what: "Opened an uploaded report", allowed: state.shareWithClinician });
    if (!state.shareWithClinician) return new Response("This patient is not sharing with you.", { status: 403 });
  }
  const report = state.reports.find((r) => r.id === reportId);
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
