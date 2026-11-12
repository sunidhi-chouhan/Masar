import { InView } from "../in-view";

// One health journey, three perspectives: the resident, the clinical review,
// the health system. Each stage has its own small drawing; one line joins
// them and a point of light travels it. Decorative: the text carries meaning.

export interface StudioStage {
  n: string;
  title: string;
  body: string;
}

function ResidentArt() {
  return (
    <svg viewBox="0 0 120 80" className="sj-art" aria-hidden>
      <circle cx="30" cy="26" r="9" className="sj-ink" />
      <path d="M14 58c2-11 9-17 16-17s14 6 16 17" className="sj-ink" />
      <path d="M56 56c8 0 10-14 18-14s9 8 16 8 8-16 16-16" pathLength={1} className="sj-line" />
      <circle cx="106" cy="34" r="4" className="sj-gold" />
    </svg>
  );
}

function ClinicianArt() {
  return (
    <svg viewBox="0 0 120 80" className="sj-art" aria-hidden>
      <rect x="34" y="12" width="52" height="60" rx="6" className="sj-ink" />
      <rect x="48" y="8" width="24" height="9" rx="3" className="sj-fill" />
      <path d="M44 32h22M44 42h30M44 52h18" className="sj-soft" />
      <path d="M68 52l5 5 10-12" pathLength={1} className="sj-check" />
    </svg>
  );
}

function SystemArt() {
  return (
    <svg viewBox="0 0 120 80" className="sj-art" aria-hidden>
      {[
        [22, 30],
        [38, 18],
        [54, 38],
        [70, 24],
      ].map(([x, h], i) => (
        <rect key={x} x={x} y={66 - h - 10} width="11" height={h + 10} rx="2" className="sj-bar" style={{ ["--i" as string]: i }} />
      ))}
      <rect x="86" y="44" width="16" height="22" rx="3" className="sj-veil" />
      <path d="M14 66h94" className="sj-soft" />
    </svg>
  );
}

const ART = [ResidentArt, ClinicianArt, SystemArt];

export function StudioJourney({ stages }: { stages: StudioStage[] }) {
  return (
    <InView className="sj relative" threshold={0.25}>
      <svg viewBox="0 0 1000 40" preserveAspectRatio="none" className="sj-path flip-rtl absolute inset-x-0 top-[66px] hidden h-10 w-full md:block" aria-hidden>
        <path d="M 166 20 C 330 -4, 340 44, 500 20 S 670 -4, 834 20" pathLength={1} vectorEffect="non-scaling-stroke" className="sj-track" />
        <path d="M 166 20 C 330 -4, 340 44, 500 20 S 670 -4, 834 20" pathLength={1} vectorEffect="non-scaling-stroke" className="sj-dot" />
      </svg>
      <span aria-hidden className="absolute bottom-10 start-[23px] top-10 w-px bg-rule-strong md:hidden" />
      <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
        {stages.map((s, i) => {
          const Art = ART[i];
          return (
            <li key={s.n} className="sj-stage relative ps-14 md:ps-0 md:text-center" style={{ ["--i" as string]: i }}>
              <div className="sj-art-wrap w-[132px] md:mx-auto">
                <Art />
              </div>
              <span aria-hidden className="absolute start-[16px] top-1 grid h-4 w-4 place-items-center rounded-full border-2 border-accent bg-paper md:hidden">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              <p className="mt-4 font-mono text-[12px] text-accent">{s.n}</p>
              <h3 className="display mt-1 text-[1.5rem] leading-snug text-ink">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-ink-2">{s.body}</p>
            </li>
          );
        })}
      </ol>
    </InView>
  );
}
