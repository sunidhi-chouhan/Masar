import { InView } from "./in-view";

// "Each sees only what it needs": one identity motif branching to three
// readers, each with the way they will sign in. The fingerprint is decorative
// only: Masar does not collect or check fingerprints, and the caption says so.
// Sign-in methods marked "at pilot launch" are not live. What works today
// is demo access: sample accounts, not real ones.

export interface Reader {
  title: string;
  body: string;
  sees: string;
  never: string;
  method: string;
  methodFor: string;
}

/**
 * Ridges as loops that open downwards, like the core of a print, with a few
 * ridges broken into two strokes so it never reads as a target or a letter.
 */
function ridges() {
  const out: string[] = [];
  const cx = 60;
  const cy = 58;
  const arc = (rx: number, ry: number, from: number, to: number) => {
    const p = (a: number) => `${(cx + rx * Math.cos(a)).toFixed(1)} ${(cy + ry * Math.sin(a)).toFixed(1)}`;
    const large = to - from > Math.PI ? 1 : 0;
    return `M ${p(from)} A ${rx} ${ry} 0 ${large} 1 ${p(to)}`;
  };
  for (let i = 0; i < 10; i++) {
    const rx = 6 + i * 5.2;
    const ry = 8 + i * 6.4;
    // opening at the bottom (angle π/2), narrowing as the ridges grow
    const open = 0.95 - i * 0.055;
    const from = Math.PI / 2 + open;
    const to = Math.PI / 2 + Math.PI * 2 - open;
    if (i === 3 || i === 6 || i === 8) {
      // a break, as real ridges have
      const mid = (from + to) / 2 + (i % 2 ? 0.5 : -0.6);
      out.push(arc(rx, ry, from, mid - 0.16), arc(rx, ry, mid + 0.16, to));
    } else {
      out.push(arc(rx, ry, from, to));
    }
  }
  return out;
}

export function Fingerprint({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 132" className={`fp ${className}`} aria-hidden>
      {ridges().map((d, i) => (
        <path key={i} d={d} pathLength={1} className="fp-ridge" style={{ ["--i" as string]: i }} />
      ))}
      <circle cx="60" cy="58" r="2.6" className="fp-core" />
    </svg>
  );
}

export function AccessPaths({
  readers,
  soon,
  live,
  linkTitle,
  linkBody,
  linkHref,
  decorative,
}: {
  readers: Reader[];
  soon: string;
  live: string;
  linkTitle: string;
  linkBody: string;
  linkHref?: string;
  decorative: string;
}) {
  return (
    <InView className="access" threshold={0.2}>
      {/* Identity, branching to three readers */}
      <div className="relative mx-auto mt-12 flex flex-col items-center">
        <Fingerprint className="h-24 w-24 md:h-28 md:w-28" />
        <p className="mt-2 text-center text-[12.5px] text-ink-3">{decorative}</p>
      </div>
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="access-branches mt-3 hidden h-24 w-full md:block" aria-hidden>
        {[200, 600, 1000].map((x, i) => {
          const d = `M 600 0 C 600 60, ${x} 50, ${x} 120`;
          return (
            <g key={x} style={{ ["--i" as string]: i }}>
              <path d={d} pathLength={1} vectorEffect="non-scaling-stroke" className="branch-line" />
              <path d={d} pathLength={1} vectorEffect="non-scaling-stroke" className="branch-dot" />
            </g>
          );
        })}
      </svg>

      <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
        {readers.map((r, i) => (
          <li key={r.title} className="access-col relative border-t-2 border-ink pt-5 md:border-t-0 md:pt-0" style={{ ["--i" as string]: i }}>
            <div className="access-method rounded-[14px] border border-rule bg-surface p-4 md:min-h-[104px]">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-[15.5px] font-semibold text-ink">{r.method}</span>
                  <span className="block text-[13.5px] text-ink-3">{r.methodFor}</span>
                </span>
                <span className="shrink-0 rounded-full border border-dashed border-unknown px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-unknown">{soon}</span>
              </div>
            </div>
            <span className="font-mono mt-6 block text-[12px] text-ink-3">0{i + 1}</span>
            <h3 className="display mt-1 text-[1.75rem] text-ink">{r.title}</h3>
            <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">{r.body}</p>
            <p className="mt-5 border-t border-rule pt-3 text-[14px] text-ink">{r.sees}</p>
            <p className="mt-1.5 text-[14px] text-urgent">{r.never}</p>
          </li>
        ))}
      </ol>

      {/* What works today, kept apart from what comes at pilot launch */}
      <div className="access-live mt-12 flex flex-col gap-3 rounded-[16px] bg-accent-soft p-5 sm:flex-row sm:items-center sm:gap-5">
        <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-accent px-3 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-white">
          <span aria-hidden className="live-dot h-1.5 w-1.5 rounded-full bg-white" />
          {live}
        </span>
        <p className="text-[15.5px] leading-relaxed text-ink">
          {linkHref ? (
            <a href={linkHref} className="link font-semibold">
              {linkTitle}
            </a>
          ) : (
            <span className="font-semibold">{linkTitle}</span>
          )}{" "}
          {linkBody}
        </p>
      </div>
    </InView>
  );
}
