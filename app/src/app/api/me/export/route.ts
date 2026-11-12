import { getSession } from "@/server/session";
import { accessLog, person } from "@/server/store";
import { personView } from "@/server/views";

// Everything Masar holds about the signed-in person, as one JSON file.
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "person") return new Response("Sign in first.", { status: 401 });
  const v = personView(session.id);
  const state = person(session.id);
  const body = {
    exportedAt: new Date().toISOString(),
    about: { name: v.resident.name, age: v.resident.age, sex: v.resident.sex },
    choices: {
      sources: state.sources,
      shareWithDoctor: state.shareWithClinician,
      keepAnEyeOut: state.scanning,
      assistantMayReadSummary: state.assistantConsent,
      assistantMayReadReports: state.reportReadingConsent,
    },
    yourAnswers: state.answers,
    yourJourney: {
      answers: state.journey.answers,
      finalQuestions: state.journey.followUps,
      finalAnswers: state.journey.followUpAnswers,
      assistantSummary: state.journey.summary,
    },
    recordsMasarUsed: v.record,
    whatMasarFound: v.signals,
    requestToYourDoctor: state.request,
    testResults: state.reports.map(({ file, ...r }) => ({ ...r, file: file ? { name: file.name, size: file.size } : null })),
    accessLog: accessLog(session.id),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="masar-my-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "private, no-store",
    },
  });
}
