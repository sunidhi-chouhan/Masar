import { DoctorDecisions, Journey, Monthly, Reach, TimeToConversation } from "@/components/report-charts";
import { Pill, Shell } from "@/components/ui";
import { MIN_GROUP, report } from "@/lib/evidence";
import { GROUP_LABEL, LANGUAGE_LABEL } from "@/lib/model";
import { RULES } from "@/lib/signals";
import { requireRole } from "@/server/session";

// Per-user page: it reads the session on every request, so it is never prerendered.
export const instant = false;

const fmtDays = (d: number | null) =>
  d === null ? "—" : d >= 365 ? `${(d / 365).toFixed(1)} years` : d >= 60 ? `${Math.round(d / 30)} months` : `${d} days`;

const listOf = (xs: string[]) => {
  const s = xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs.join("");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

function ChartCard({ title, body, takeaway, children, className = "" }: { title: string; body: string; takeaway?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`reveal card p-6 ${className}`}>
      <h2 className="text-[1.15rem] font-semibold tracking-[-0.015em] text-zinc-950">{title}</h2>
      <p className="mt-1 max-w-xl text-[14px] text-zinc-600">{body}</p>
      <div className="mt-5">{children}</div>
      {takeaway ? (
        <p className="mt-4 rounded-xl bg-indigo-50/70 px-4 py-3 text-[13.5px] text-indigo-950">
          <span className="font-semibold">What this means: </span>
          {takeaway}
        </p>
      ) : null}
    </section>
  );
}

export default async function EvidenceReport() {
  const session = await requireRole("system");
  const r = report({ group: (g) => GROUP_LABEL[g], language: (l) => LANGUAGE_LABEL[l] });
  const decidedRules = r.rules.filter((x) => x.n >= MIN_GROUP);
  const agreement = Math.round(decidedRules.reduce((s, x) => s + x.agreePct * x.n, 0) / Math.max(1, decidedRules.reduce((s, x) => s + x.n, 0)));
  const asked = r.funnel[2].n;
  const averageAsked = Math.round((asked / Math.max(1, r.signalled)) * 100);
  const at90 = r.curve.find((c) => c.day === 90)!;
  const lowestAgreement = [...decidedRules].sort((a, b) => a.agreePct - b.agreePct)[0];
  const ruleCount = Object.keys(RULES).length;
  const disclosed = Object.values(RULES).filter((x) => x.cannotTell.trim().length > 0).length;

  const kpis = [
    { label: "People who said yes to Masar", value: r.optedIn.toLocaleString("en"), sub: `of ${r.population.toLocaleString("en")} residents` },
    { label: "People Masar suggested a conversation to", value: r.signalled.toLocaleString("en"), sub: `${Math.round((r.signalled / r.optedIn) * 100)}% of those who said yes` },
    { label: "Typical wait for a conversation", value: fmtDays(r.medianMasarDays), sub: `without Masar: ${fmtDays(r.medianUsualDays)}` },
    { label: "Asked, and then went", value: `${r.referralCompletionPct}%`, sub: "of people who asked for a conversation" },
    { label: "Doctors agreed it was worth raising", value: `${agreement}%`, sub: "including those who added a test" },
  ];

  const reachGroups = r.equity
    .filter((d) => d.dimension !== "Age")
    .flatMap((d) => d.rows.filter((row) => !row.suppressed).map((row) => ({ label: row.label, pct: row.requestedPct, dimension: d.dimension })));
  const gaps = reachGroups.filter((g) => g.pct < averageAsked - 10);

  return (
    <Shell session={session} wide>
      <p className="eyebrow">How Masar is doing</p>
      <h1 className="mt-3 max-w-4xl font-semibold tracking-[-0.025em] text-[clamp(2.2rem,4vw,3rem)] leading-[1.05] text-zinc-950">
        Are people talking to a doctor sooner, and is everyone being reached?
      </h1>
      <div className="mt-5 flex max-w-4xl gap-3 rounded-2xl border border-dashed border-slate-400/70 bg-white p-4 text-[13.5px] text-zinc-600">
        <Pill tone="slate">Practice run</Pill>
        <p>
          These numbers come from 10,000 made-up residents and the assumptions listed at the bottom of the page. They show what a real
          pilot would measure, not real results. To protect privacy, any group of fewer than {MIN_GROUP} people is never shown.
        </p>
      </div>

      <dl className="card mt-8 grid grid-cols-2 overflow-hidden lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="border-zinc-200/70 p-5 lg:border-s lg:first:border-s-0">
            <dt className="text-[12.5px] leading-snug text-zinc-500">{k.label}</dt>
            <dd className="tabular mt-2 text-[1.9rem] font-semibold leading-none tracking-tight text-zinc-950">{k.value}</dd>
            <p className="mt-1.5 text-[12px] text-zinc-400">{k.sub}</p>
          </div>
        ))}
      </dl>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <ChartCard
          className="lg:col-span-3"
          title="How quickly people got to talk to someone"
          body="Of everyone Masar suggested a conversation to, the share who had one, by how long it had been."
          takeaway={`After three months, ${at90.masar}% had talked to a doctor with Masar, against ${at90.usual}% without it. Without Masar, most people only get advice after a year or more of trying for a baby.`}
        >
          <TimeToConversation data={r.curve} />
        </ChartCard>
        <ChartCard
          className="lg:col-span-2"
          title="Where people stop along the way"
          body="Each step, from Masar's suggestion to sitting down with a doctor."
          takeaway="The biggest drop is between reading the suggestion and asking for a conversation. That is where reminders and clearer wording help most."
        >
          <Journey
            data={[
              { label: "Got a suggestion", n: r.funnel[0].n },
              { label: "Read it", n: r.funnel[1].n },
              { label: "Asked to talk", n: r.funnel[2].n },
              { label: "Talked to a doctor", n: r.funnel[3].n },
            ]}
          />
        </ChartCard>
      </div>

      <ChartCard
        className="mt-6"
        title="Month by month"
        body="How many people Masar suggested a conversation to each month, and how many of them asked for one."
        takeaway={`Roughly ${averageAsked}% of people ask each month, and that share is steady. A sudden fall would mean something on the resident's screen stopped working.`}
      >
        <Monthly data={r.monthly} />
      </ChartCard>

      <ChartCard
        className="mt-6"
        title="Were we right to raise it?"
        body="For each reason Masar gives, what the doctor decided after reviewing the person's record."
        takeaway={
          lowestAgreement
            ? `Doctors agree most of the time. "${lowestAgreement.title}" has the most disagreement (${lowestAgreement.overridePct}%), so it is the first reason to review with the clinical team.`
            : undefined
        }
      >
        <DoctorDecisions data={decidedRules} />
        {r.rules.some((x) => x.n < MIN_GROUP) ? (
          <p className="mt-2 text-[12.5px] text-zinc-400">Reasons given to fewer than {MIN_GROUP} people are left out to protect privacy.</p>
        ) : null}
      </ChartCard>

      <section aria-labelledby="calibration" className="reveal card mt-6 overflow-hidden">
        <div className="p-6 pb-4">
          <h2 id="calibration" className="text-[1.15rem] font-semibold tracking-[-0.015em] text-zinc-950">
            Calibration: is each reason raised about as often as it should be?
          </h2>
          <p className="mt-1 max-w-2xl text-[14px] text-zinc-600">
            Calibration compares how often Masar raises a reason with how often it turns out to matter. That needs real outcomes, such as what
            the assessment found, so this practice run can&apos;t measure it. The table shows what a pilot would fill in, next to what we have
            now.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[13.5px]">
            <thead>
              <tr className="border-y border-zinc-200 bg-zinc-100/60 text-start text-[12px] uppercase tracking-[0.06em] text-zinc-500">
                <th scope="col" className="px-6 py-2.5 text-start font-medium">Reason</th>
                <th scope="col" className="px-4 py-2.5 text-end font-medium">Raised</th>
                <th scope="col" className="px-4 py-2.5 text-end font-medium">Doctor agreed (assumed)</th>
                <th scope="col" className="px-4 py-2.5 text-start font-medium">Confirmed by outcome</th>
                <th scope="col" className="px-6 py-2.5 text-start font-medium">Limits stated to the person</th>
              </tr>
            </thead>
            <tbody>
              {decidedRules.map((x) => (
                <tr key={x.code} className="border-b border-zinc-200 last:border-0">
                  <th scope="row" className="px-6 py-2.5 text-start font-medium text-zinc-950">{x.title}</th>
                  <td className="tabular px-4 py-2.5 text-end text-zinc-700">{x.n.toLocaleString("en")}</td>
                  <td className="tabular px-4 py-2.5 text-end text-zinc-700">{x.agreePct}%</td>
                  <td className="px-4 py-2.5 text-zinc-500">Not measurable yet</td>
                  <td className="px-6 py-2.5 text-zinc-700">{RULES[x.code].cannotTell ? "Yes, every time" : "Missing"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-6 py-4 text-[13.5px] text-zinc-600">
          <span className="font-semibold text-zinc-950">Uncertainty disclosed: </span>
          {disclosed} of {ruleCount} reasons always show the person what they can&apos;t tell, next to the finding. Doctor agreement is an
          assumption in this run, not a measurement. Reasons given to fewer than {MIN_GROUP} people are left out.
        </p>
      </section>

      <ChartCard
        className="mt-6"
        title="Is everyone being reached?"
        body="The share of each group who asked to talk after Masar suggested it. The dashed line is the average."
        takeaway={
          gaps.length
            ? `${listOf(gaps.map((g) => (g.dimension === "Language" ? `people who speak ${g.label}` : g.dimension === "Sex" ? g.label.toLowerCase() : `${g.label} residents`)))} ask noticeably less often than average. ${
                gaps.some((g) => g.dimension === "Language") ? "Offering Masar in more languages is the next thing to try." : "Reaching these groups directly is the next thing to try."
              }`
            : "No group is far below the average."
        }
      >
        <div className="grid gap-x-10 gap-y-6 lg:grid-cols-3">
          {r.equity
            .filter((d) => d.dimension !== "Age")
            .map((d) => (
              <div key={d.dimension}>
                <p className="text-[13px] font-semibold text-zinc-950">{d.dimension}</p>
                <Reach data={d.rows.filter((row) => !row.suppressed).map((row) => ({ label: row.label, pct: row.requestedPct }))} average={averageAsked} />
              </div>
            ))}
        </div>
      </ChartCard>

      <section className="reveal card mt-6 overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 p-6 pb-4">
          <div>
            <h2 className="text-[1.15rem] font-semibold tracking-[-0.015em] text-zinc-950">Who could benefit from earlier advice</h2>
            <p className="mt-1 max-w-2xl text-[14px] text-zinc-600">
              Groups of residents by the reason Masar would raise, how many have not yet talked to a doctor, and which part of each group is
              hardest to reach. Use it to plan outreach, not to contact anyone directly.
            </p>
          </div>
          <a href="/api/system/export" className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-[13.5px] font-semibold text-zinc-900 hover:border-indigo-400 hover:text-indigo-700">
            Download as spreadsheet (CSV)
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[14px]">
            <thead>
              <tr className="border-y border-zinc-200 bg-zinc-100/60 text-[11.5px] uppercase tracking-[0.08em] text-zinc-500">
                <th className="px-6 py-2.5 text-start font-semibold">Reason</th>
                <th className="px-3 py-2.5 text-end font-semibold">People</th>
                <th className="px-3 py-2.5 text-end font-semibold">Not yet talked to a doctor</th>
                <th className="px-3 py-2.5 text-end font-semibold">Asked to talk</th>
                <th className="px-6 py-2.5 text-start font-semibold">Hardest to reach</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70">
              {r.cohorts.map((c) => (
                <tr key={c.code}>
                  <td className="px-6 py-3 text-zinc-950">{c.title}</td>
                  <td className="tabular px-3 py-3 text-end text-zinc-700">{c.n.toLocaleString("en")}</td>
                  <td className="tabular px-3 py-3 text-end font-semibold text-zinc-950">{c.notYet.toLocaleString("en")}</td>
                  <td className="tabular px-3 py-3 text-end text-zinc-700">{c.askedPct}%</td>
                  <td className="px-6 py-3 text-zinc-700">
                    {c.leastReached ? (
                      <>
                        {c.leastReached.label} <span className={`tabular font-semibold ${c.leastReached.askedPct < c.askedPct - 10 ? "text-rose-700" : "text-zinc-950"}`}>{c.leastReached.askedPct}%</span>
                      </>
                    ) : (
                      <span className="text-zinc-400">Groups too small to show</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="reveal card p-6">
          <p className="eyebrow">Understanding</p>
          <p className="tabular mt-3 text-[2rem] font-semibold leading-none text-zinc-950">
            {r.knowledge.before}% → {r.knowledge.after}%
          </p>
          <p className="mt-2 text-[13.5px] text-zinc-600">Simple questions about fertility answered correctly, before and after talking to a doctor.</p>
          <p className="tabular mt-5 text-[2rem] font-semibold leading-none text-zinc-950">{r.surePct}%</p>
          <p className="mt-2 text-[13.5px] text-zinc-600">Said afterwards that they felt sure about what to do next.</p>
        </section>
        <section className="reveal card p-6">
          <p className="eyebrow">Worry</p>
          <p className="tabular mt-3 text-[2rem] font-semibold leading-none text-zinc-950">
            {r.anxiety.before} → {r.anxiety.after}
          </p>
          <p className="mt-2 text-[13.5px] text-zinc-600">
            How worried people felt, on a scale from 20 (calm) to 80 (very worried), before Masar&apos;s suggestion and after talking to a doctor.
            If this went up, Masar would be doing harm. It goes down.
          </p>
        </section>
        <section className="reveal card p-6">
          <p className="eyebrow">People we may have missed</p>
          <p className="tabular mt-3 text-[2rem] font-semibold leading-none text-zinc-950">{r.falseReassurance.pct}%</p>
          <p className="mt-2 text-[13.5px] text-zinc-600">
            Of {r.falseReassurance.ofN.toLocaleString("en")} people Masar did not raise anything with, the share who later needed help. Most of
            them had shared very little, which is why Masar never tells anyone &ldquo;you&apos;re fine&rdquo;.
          </p>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-100 p-6">
        <p className="text-[14px] font-semibold text-zinc-950">What this practice run assumes</p>
        <ul className="mt-3 grid gap-x-8 gap-y-1.5 text-[13.5px] text-zinc-600 md:grid-cols-2">
          <li>· 10,000 made-up residents with a mix similar to Abu Dhabi; 72% say yes to Masar.</li>
          <li>· Without Masar, most people first get advice after a year of trying; a few (2–25%, more as plans get closer) ask earlier on their own.</li>
          <li>· With Masar, people take about a week to ask, then wait two to three weeks; urgent cases are seen within days.</li>
          <li>· Men, and people whose language Masar does not speak yet, are assumed to ask less and later.</li>
          <li>· How often doctors agree is assumed for now, in place of real decisions. Calibration needs real outcomes and is not measured.</li>
          <li>· A real pilot replaces every one of these with what actually happens on the same screens.</li>
        </ul>
      </section>
    </Shell>
  );
}
