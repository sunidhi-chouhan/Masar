import { MEASURES, type MeasureView } from "@/lib/trajectory";
import type { Reading } from "@/lib/model";
import { TOUCHPOINT_LABEL, type Touchpoint } from "@/lib/model";
import { formatDateIn, t, type Lang } from "@/lib/i18n";

// The resident's record on one time axis: a lane for each measure they share,
// plus their visits and requests. Laid out in HTML (not a scaled SVG) so it
// stays legible on a phone and mirrors in Arabic.

const LABEL: Record<string, string> = {
  ...Object.fromEntries(MEASURES.map((m) => [m.code, m.label])),
  tsh: "Thyroid (TSH)",
};

function Track({ children, last = false, years, pos }: { children?: React.ReactNode; last?: boolean; years: number[]; pos: (iso: string) => number }) {
  return (
    <div className={`relative h-9 ${last ? "" : "border-b border-rule"}`}>
      <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-rule-strong/60" />
      {years.map((y) => (
        <span key={y} aria-hidden className="absolute inset-y-0 w-px bg-rule" style={{ insetInlineStart: `${pos(`${y}-01-01`)}%` }} />
      ))}
      {children}
    </div>
  );
}

export interface PathEvent {
  at: string;
  label: string;
}

export function PathLine({
  readings,
  measures,
  touchpoint,
  events,
  lang,
}: {
  readings: Reading[];
  measures: MeasureView[];
  touchpoint: { kind: Touchpoint; at: string };
  events: PathEvent[];
  lang: Lang;
}) {
  const tr = (text: string, vars?: Record<string, string | number>) => t(lang, text, vars);
  const fmt = (iso: string) => formatDateIn(lang, iso);
  const allEvents: PathEvent[] = [{ at: touchpoint.at, label: TOUCHPOINT_LABEL[touchpoint.kind] }, ...events];
  const times = [...readings.map((r) => Date.parse(r.at)), ...allEvents.map((e) => Date.parse(e.at))];
  if (!readings.length) return null;

  const start = Math.min(...times);
  const end = Math.max(...times);
  const span = Math.max(end - start, 86_400_000 * 30);
  const pos = (iso: string) => ((Date.parse(iso) - start) / span) * 100;

  const codes = [...new Set(readings.map((r) => r.code))].sort((a, b) => Object.keys(LABEL).indexOf(a) - Object.keys(LABEL).indexOf(b));
  const verdict = Object.fromEntries(measures.map((m) => [m.def.code, m.verdict]));
  const years: number[] = [];
  for (let y = new Date(start).getUTCFullYear() + 1; Date.UTC(y, 0, 1) <= end; y++) years.push(y);

  return (
    <figure>
      <div aria-hidden className="grid grid-cols-[6.5rem_1fr] gap-x-4 sm:grid-cols-[10rem_1fr]">
        {codes.map((code) => {
          const lane = readings.filter((r) => r.code === code).sort((a, b) => a.at.localeCompare(b.at));
          const changed = verdict[code] === "meaningful";
          return (
            <div key={code} className="contents">
              <div className="flex h-9 items-center border-b border-rule text-[13px] leading-tight text-ink-2">{tr(LABEL[code] ?? code)}</div>
              <Track years={years} pos={pos}>
                {lane.map((r, i) => {
                  const isLast = i === lane.length - 1;
                  return (
                    <span
                      key={r.at + i}
                      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full rtl:translate-x-1/2 ${
                        isLast ? `h-3 w-3 ${changed ? "bg-soon ring-4 ring-soon-soft" : "bg-accent ring-4 ring-accent-soft"}` : "h-2 w-2 border border-ink-3 bg-paper"
                      }`}
                      style={{ insetInlineStart: `${pos(r.at)}%` }}
                    />
                  );
                })}
              </Track>
            </div>
          );
        })}
        <div className="flex h-9 items-center text-[13px] leading-tight text-ink-2">{tr("Visits and requests")}</div>
        <Track last years={years} pos={pos}>
          {allEvents.map((e, i) => (
            <span
              key={e.at + i}
              className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-date rtl:translate-x-1/2"
              style={{ insetInlineStart: `${pos(e.at)}%` }}
            />
          ))}
        </Track>
        <div />
        <div className="relative mt-1 h-5 font-mono text-[11.5px] text-ink-3">
          {years.map((y) => (
            <span key={y} className="absolute -translate-x-1/2 rtl:translate-x-1/2" style={{ insetInlineStart: `${pos(`${y}-01-01`)}%` }}>
              {y}
            </span>
          ))}
        </div>
      </div>

      <figcaption className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-accent" />
          {tr("Latest result")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-soon" />
          {tr("Latest result, a real change")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rotate-45 bg-date" />
          {tr("Visit or request")}
        </span>
      </figcaption>

      <details className="group mt-4">
        <summary className="link inline-flex min-h-[44px] cursor-pointer items-center text-[14px]">{tr("Show every entry as a list")}</summary>
        <ul className="mt-2 divide-y divide-rule border-y border-rule text-[14px]">
          {[...readings.map((r) => ({ at: r.at, what: tr(LABEL[r.code] ?? r.code), value: `${r.value} ${r.unit}` })), ...allEvents.map((e) => ({ at: e.at, what: tr(e.label), value: "" }))]
            .sort((a, b) => b.at.localeCompare(a.at))
            .map((x, i) => (
              <li key={x.at + i} className="flex flex-wrap justify-between gap-2 py-2">
                <span className="text-ink-3">{fmt(x.at)}</span>
                <span className="text-ink">
                  {x.what}
                  {x.value ? (
                    <span className="tabular ms-2 font-semibold" dir="ltr">
                      {x.value}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
        </ul>
      </details>
    </figure>
  );
}
