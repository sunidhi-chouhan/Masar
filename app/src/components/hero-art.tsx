import type { Lang } from "@/lib/i18n";

// The hero illustration: several strands of a record (cycles, hormones,
// weight and sleep, family history) flowing over time into one view, ending in
// Masar's gold point. Decorative and illustrative only: no values, no person.
// The geometry is computed so the connecting nodes sit exactly on the strands,
// and everything mirrors for right-to-left.

const W = 560;
const H = 500;
const X0 = 24;
const MERGE_X = 410;
const MERGE_Y = 262;
const END: [number, number] = [536, 132];

const smooth = (u: number) => u * u * (3 - 2 * u);

const STRANDS = [
  { y0: 92, amp: 30, freq: 0.021, phase: 0.4 },
  { y0: 196, amp: 24, freq: 0.026, phase: 2.1 },
  { y0: 306, amp: 28, freq: 0.019, phase: 4.0 },
  { y0: 412, amp: 22, freq: 0.024, phase: 1.2 },
];

function strandY(s: (typeof STRANDS)[number], x: number) {
  const u = smooth(Math.min(1, Math.max(0, (x - X0) / (MERGE_X - X0))));
  return s.y0 + (MERGE_Y - s.y0) * u + s.amp * Math.sin(s.freq * x + s.phase) * (1 - u);
}

function mergedY(x: number) {
  const u = smooth(Math.min(1, Math.max(0, (x - MERGE_X) / (END[0] - MERGE_X))));
  return MERGE_Y + (END[1] - MERGE_Y) * u;
}

const TICKS = [130, 236, 330];

export function HeroArt({ labels, endLabel, lang }: { labels: string[]; endLabel: string; lang: Lang }) {
  const rtl = lang === "ar";
  const m = (x: number) => (rtl ? W - x : x);
  const d = (f: (x: number) => number, from: number, to: number) => {
    const pts: string[] = [];
    for (let x = from; x <= to + 0.01; x += 6) pts.push(`${pts.length ? "L" : "M"} ${m(x).toFixed(1)} ${f(x).toFixed(1)}`);
    return pts.join(" ");
  };
  const strandPaths = STRANDS.map((s) => d((x) => strandY(s, x), X0, MERGE_X));
  const merged = d(mergedY, MERGE_X, END[0]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="hero-art h-auto w-full" role="img" aria-label={endLabel} direction="ltr">
      <defs>
        <radialGradient id="hero-glow">
          <stop offset="0" stopColor="var(--color-date)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--color-date)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* time, as faint vertical guides */}
      {TICKS.map((x, i) => (
        <line key={x} x1={m(x)} x2={m(x)} y1={36} y2={H - 30} className="ha-tick" style={{ ["--i" as string]: i }} />
      ))}

      {/* the strands */}
      {strandPaths.map((p, i) => (
        <path key={i} d={p} pathLength={1} className="ha-strand" style={{ ["--i" as string]: i }} />
      ))}
      <path d={merged} pathLength={1} className="ha-merged" />

      {/* connecting lines: the same moment, read across every strand */}
      {TICKS.map((x, ti) => {
        const ys = STRANDS.map((s) => strandY(s, x));
        return (
          <g key={x} className="ha-link" style={{ ["--i" as string]: ti }}>
            <line x1={m(x)} x2={m(x)} y1={Math.min(...ys)} y2={Math.max(...ys)} />
            {ys.map((y, si) => (
              <circle key={si} cx={m(x)} cy={y} r={3.2} className="ha-node" style={{ ["--j" as string]: si + ti }} />
            ))}
          </g>
        );
      })}

      {/* points travelling along each strand into the single view */}
      {strandPaths.map((p, i) => (
        <path key={`dot-${i}`} d={p} pathLength={1} className="ha-dot" style={{ ["--i" as string]: i }} />
      ))}
      <path d={merged} pathLength={1} className="ha-dot ha-dot--merged" />

      {/* strand starts and labels */}
      {STRANDS.map((s, i) => (
        <g key={`start-${i}`} className="ha-label" style={{ ["--i" as string]: i }}>
          <circle cx={m(X0)} cy={strandY(s, X0)} r={4.5} className="ha-start" />
          <text x={m(X0 + 2)} y={strandY(s, X0) - 14} textAnchor={rtl ? "end" : "start"} className="ha-text hidden sm:block">
            {labels[i]}
          </text>
        </g>
      ))}

      {/* the gold point: one view, over time */}
      <circle cx={m(END[0])} cy={END[1]} r={34} fill="url(#hero-glow)" className="ha-glow" />
      <circle cx={m(END[0])} cy={END[1]} r={7.5} className="ha-end" />
      <text x={m(END[0] - 6)} y={END[1] - 26} textAnchor={rtl ? "start" : "end"} className="ha-text ha-text--end hidden sm:block">
        {endLabel}
      </text>
    </svg>
  );
}

/** A single thread that carries the eye from the hero down into the life-course graph. */
export function Thread() {
  return (
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="thread flip-rtl block h-20 w-full md:h-28" aria-hidden>
      <path d="M 1010 0 C 1010 70, 140 40, 120 120" pathLength={1} vectorEffect="non-scaling-stroke" className="thread-line" />
      <path d="M 1010 0 C 1010 70, 140 40, 120 120" pathLength={1} vectorEffect="non-scaling-stroke" className="thread-dot" />
    </svg>
  );
}
