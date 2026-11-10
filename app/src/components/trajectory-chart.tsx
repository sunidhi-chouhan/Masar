import { t, type Lang } from "@/lib/i18n";
import type { MeasureView } from "@/lib/trajectory";
import { TrendChart } from "./trend-chart";

/** Server side: turns a measure into plain points for the client chart. */
export function TrajectoryChart({ view, lang = "en" }: { view: MeasureView; lang?: Lang }) {
  const compared = view.verdict === "meaningful" || view.verdict === "normal";
  const from = compared ? view.readings.length - view.def.windowSize : view.readings.length;
  const points = view.readings.map((r, i) => ({ t: Date.parse(r.at), value: r.value, latest: i >= from }));
  const band = view.def.band;
  return (
    <TrendChart
      points={points}
      band={band}
      bandLabel={band ? t(lang, "Usual range {lo}–{hi}", { lo: band[0], hi: band[1] }) : undefined}
      unit={view.def.unit}
      label={t(lang, view.def.label)}
      meaningful={view.verdict === "meaningful"}
      lang={lang}
    />
  );
}
