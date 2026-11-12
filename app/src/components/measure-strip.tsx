import { TrajectoryChart } from "./trajectory-chart";
import { Statement, Statements } from "./editorial";
import type { MeasureView } from "@/lib/trajectory";
import type { PathStatement } from "@/lib/path";
import { formatDateIn, t, type Lang } from "@/lib/i18n";

/**
 * One measure over time: what Masar concluded in words, the chart, and the
 * same readings as a table for anyone who can't use the chart.
 */
export function MeasureStrip({ view, statement, lang, metaFor }: { view: MeasureView; statement: PathStatement; lang: Lang; metaFor: (s: PathStatement) => string }) {
  const tr = (text: string, vars?: Record<string, string | number>) => t(lang, text, vars);
  const last = view.readings.at(-1)!;
  return (
    <section className="mt-6" aria-label={tr(view.def.label)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h4 className="text-[15px] font-semibold text-ink">{tr(view.def.label)}</h4>
        <p className="text-[13.5px] text-ink-3">
          {tr("Latest")}:{" "}
          <span className="tabular font-semibold text-ink" dir="ltr">
            {last.value} {view.def.unit}
          </span>{" "}
          · {formatDateIn(lang, last.at)}
        </p>
      </div>
      <p className="mt-1 text-[13.5px] text-ink-2">{tr(view.sentence)}</p>
      <TrajectoryChart view={view} lang={lang} />
      <Statements>
        <Statement kind={statement.kind} lang={lang} meta={metaFor(statement)}>
          {tr(statement.line.text, statement.line.vars)}
        </Statement>
      </Statements>
      <details className="mt-1">
        <summary className="link inline-flex min-h-[44px] cursor-pointer items-center text-[13.5px]">{tr("Show as a table")}</summary>
        <table className="mt-1 w-full text-start text-[14px]">
          <caption className="sr-only">{tr(view.def.label)}</caption>
          <thead>
            <tr className="border-b border-rule text-ink-3">
              <th scope="col" className="py-2 text-start font-medium">
                {tr("Date")}
              </th>
              <th scope="col" className="py-2 text-end font-medium">
                {tr("Result")}
              </th>
            </tr>
          </thead>
          <tbody>
            {view.readings.map((r, i) => (
              <tr key={r.at + i} className="border-b border-rule">
                <td className="py-2 text-ink-2">{formatDateIn(lang, r.at)}</td>
                <td className="tabular py-2 text-end font-medium text-ink" dir="ltr">
                  {r.value} {r.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {view.def.band ? <p className="mt-2 text-[12.5px] text-ink-3">{tr("Usual range {lo}–{hi}", { lo: view.def.band[0], hi: view.def.band[1] })}</p> : null}
      </details>
    </section>
  );
}
