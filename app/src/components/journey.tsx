import { InView } from "./in-view";

// How Masar works, as one path through four stages. These describe the
// product's workflow at a high level; they are not a fixed questionnaire.
// Each stage has its own small illustration. Stages reveal as they scroll in.

export interface Stage {
  title: string;
  body: string;
}

/** 1. Understand what is on record: sources, each behind its own switch; one stays off. */
function RecordSymbol() {
  return (
    <svg viewBox="0 0 96 72" className="js-sym" aria-hidden>
      {[14, 34, 54].map((y, i) => (
        <g key={y} className={`js-src ${i === 2 ? "js-src--off" : ""}`} style={{ ["--i" as string]: i }}>
          <rect x="6" y={y - 6} width="44" height="12" rx="3" className="js-bar" />
          <rect x="58" y={y - 7} width="26" height="14" rx="7" className="js-switch" />
          <circle cx={i === 2 ? 65 : 77} cy={y} r="5" className="js-knob" />
        </g>
      ))}
    </svg>
  );
}

/** 2. Notice what has changed: readings over time, the last step crossing out of the usual band. */
function ChangeSymbol() {
  return (
    <svg viewBox="0 0 96 72" className="js-sym" aria-hidden>
      <rect x="6" y="20" width="84" height="22" rx="3" className="js-band" />
      <path d="M10 30 L30 28 L50 32 L70 30" pathLength={1} className="js-line" />
      <path d="M70 30 L88 56" pathLength={1} className="js-line js-line--change" />
      {[
        [10, 30],
        [30, 28],
        [50, 32],
        [70, 30],
      ].map(([x, y], i) => (
        <circle key={x} cx={x} cy={y} r="3.2" className="js-pt" style={{ ["--i" as string]: i }} />
      ))}
      <circle cx="88" cy="56" r="4.4" className="js-pt js-pt--change" />
    </svg>
  );
}

/** 3. Explain what it means: one sentence, and a label for how sure it is. */
function ExplainSymbol() {
  return (
    <svg viewBox="0 0 96 72" className="js-sym" aria-hidden>
      <rect x="6" y="14" width="62" height="5" rx="2.5" className="js-text" />
      <rect x="6" y="25" width="78" height="5" rx="2.5" className="js-text" />
      <rect x="6" y="36" width="48" height="5" rx="2.5" className="js-text" />
      <g className="js-tags">
        <circle cx="12" cy="56" r="4" className="js-tag js-tag--fact" style={{ ["--i" as string]: 0 }} />
        <path d="M24 59 l4 -4 3 3 5 -6" className="js-tag js-tag--trend" style={{ ["--i" as string]: 1 }} />
        <path d="M44 52 h6 v8 h-6 z M50 52 h6 v8 h-6 z" className="js-tag js-tag--evidence" style={{ ["--i" as string]: 2 }} />
        <circle cx="70" cy="56" r="4.5" className="js-tag js-tag--unknown" style={{ ["--i" as string]: 3 }} />
      </g>
    </svg>
  );
}

/** 4. Explore possible next steps: one path opening into options; the choice stays with people. */
function NextSymbol() {
  return (
    <svg viewBox="0 0 96 72" className="js-sym" aria-hidden>
      <path d="M8 36 H38" pathLength={1} className="js-branch" />
      {[14, 36, 58].map((y, i) => (
        <g key={y} style={{ ["--i" as string]: i }}>
          <path d={`M38 36 C 54 36, 54 ${y}, 72 ${y}`} pathLength={1} className={`js-branch ${i === 1 ? "js-branch--chosen" : ""}`} />
          <circle cx="78" cy={y} r="5" className={`js-opt ${i === 1 ? "js-opt--chosen" : ""}`} />
        </g>
      ))}
      <circle cx="8" cy="36" r="4" className="js-origin" />
    </svg>
  );
}

const SYMBOLS = [RecordSymbol, ChangeSymbol, ExplainSymbol, NextSymbol];

export function Journey({ stages }: { stages: Stage[] }) {
  return (
    <InView className="journey relative mt-14" threshold={0.15}>
      {/* The continuous path behind the stages: horizontal on wide screens. */}
      <svg viewBox="0 0 1000 40" preserveAspectRatio="none" className="journey-path flip-rtl absolute inset-x-0 top-[52px] hidden h-10 w-full md:block" aria-hidden>
        <path d="M 125 20 C 250 0, 250 40, 375 20 S 500 0, 625 20 S 750 40, 875 20" pathLength={1} vectorEffect="non-scaling-stroke" className="journey-line" />
        <path d="M 125 20 C 250 0, 250 40, 375 20 S 500 0, 625 20 S 750 40, 875 20" pathLength={1} vectorEffect="non-scaling-stroke" className="journey-dot" />
      </svg>
      {/* On phones, a vertical line down the reading-start side carries the same path. */}
      <span aria-hidden className="journey-rail absolute bottom-6 start-[27px] top-6 w-px bg-rule-strong md:hidden" />

      <ol className="relative grid gap-10 md:grid-cols-4 md:gap-6">
        {stages.map((s, i) => {
          const Symbol = SYMBOLS[i];
          return (
            <InView as="li" key={s.title} className="journey-stage relative ps-16 md:ps-0 md:text-center" threshold={0.4} style={{ ["--i" as string]: i }}>
              <div className="flex items-center gap-4 md:flex-col md:gap-0">
                <span className="journey-node absolute start-[18px] top-1 grid h-[19px] w-[19px] place-items-center rounded-full border-2 border-accent bg-paper md:static md:mx-auto md:mb-0 md:mt-[62px] md:h-[22px] md:w-[22px]">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                </span>
              </div>
              <div className="journey-art w-[120px] md:mx-auto md:mt-5 md:w-[132px]">
                <Symbol />
              </div>
              <span className="mt-3 block font-mono text-[12px] text-accent">0{i + 1}</span>
              <h3 className="display mt-1 text-[1.45rem] leading-snug text-ink">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-[17rem] text-[15px] leading-relaxed text-ink-2 md:max-w-none">{s.body}</p>
            </InView>
          );
        })}
      </ol>
    </InView>
  );
}
