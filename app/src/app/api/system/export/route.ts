import { MIN_GROUP, report } from "@/lib/evidence";
import { GROUP_LABEL, LANGUAGE_LABEL } from "@/lib/model";
import { getSession } from "@/server/session";

// The report's tables as one CSV, for the health-system team. Groups under
// MIN_GROUP are already left out of the report, so they never reach the file.
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "system") return new Response("Sign in first.", { status: 401 });
  const r = report({ group: (g) => GROUP_LABEL[g], language: (l) => LANGUAGE_LABEL[l] });
  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows: unknown[][] = [
    ["Masar practice run (synthetic data)", `exported ${new Date().toISOString().slice(0, 10)}`, `groups under ${MIN_GROUP} people left out`],
    [],
    ["Who could benefit from earlier advice"],
    ["Reason", "People", "Not yet talked to a doctor", "Asked to talk (%)", "Least reached group", "That group asked (%)"],
    ...r.cohorts.map((c) => [c.title, c.n, c.notYet, c.askedPct, c.leastReached?.label, c.leastReached?.askedPct]),
    [],
    ["Were we right to raise it?"],
    ["Reason", "People", "Agreed (%)", "Agreed and added a test (%)", "Disagreed (%)", "Typical days to a conversation"],
    ...r.rules.filter((x) => x.n >= MIN_GROUP).map((x) => [x.title, x.n, x.acceptPct, x.modifyPct, x.overridePct, x.medianDays]),
    [],
    ["Is everyone being reached?"],
    ["Grouped by", "Group", "People", "Asked to talk (%)", "Typical days to a conversation"],
    ...r.equity.flatMap((d) => d.rows.filter((g) => !g.suppressed).map((g) => [d.dimension, g.label, g.n, g.requestedPct, g.medianDays])),
  ];
  return new Response(rows.map((row) => row.map(cell).join(",")).join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="masar-report-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "private, no-store",
    },
  });
}
