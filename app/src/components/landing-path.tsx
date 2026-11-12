import type { Lang } from "@/lib/i18n";
import { InView } from "./in-view";

// The landing page's signature: a life course drawn as one path, with the
// moments where a conversation could happen. Illustrative only: no person,
// no values, nothing measured.

const W = 1200;
const H = 330;
const AGE_FROM = 20;
const AGE_TO = 45;
const AXIS = 288;

const X = (age: number) => 70 + ((age - AGE_FROM) / (AGE_TO - AGE_FROM)) * (W - 140);
/** A gentle, rising line: a shape, not data. */
const Y = (age: number) => 236 - (age - AGE_FROM) * 3.4 + Math.sin((age - AGE_FROM) / 2.6) * 14;

export interface Moment {
  age: number;
  label: string;
  kind: "check" | "early" | "late";
  /** which label row, so neighbouring labels never collide */
  row: 0 | 1;
}

export function LandingPath({ moments, ageLabel, gapLabel, lang }: { moments: Moment[]; ageLabel: string; gapLabel: string; lang: Lang }) {
  const rtl = lang === "ar";
  const m = (x: number) => (rtl ? W - x : x);
  const ticks = [20, 25, 30, 35, 40, 45];
  const samples = Array.from({ length: 101 }, (_, i) => AGE_FROM + (i / 100) * (AGE_TO - AGE_FROM));
  const d = samples.map((a, i) => `${i ? "L" : "M"} ${m(X(a)).toFixed(1)} ${Y(a).toFixed(1)}`).join(" ");
  const early = moments.find((x) => x.kind === "early");
  const late = moments.find((x) => x.kind === "late");

  const ord = (a: number) => moments.findIndex((x) => x.age === a);
  return (
    <InView as="figure" className="lp relative" threshold={0.3}>
      {/* Wide screens: the drawn path. Decorative; the list below carries the meaning. */}
      <svg viewBox={`0 0 ${W} ${H}`} className="hidden w-full md:block" aria-hidden direction="ltr">
        <defs>
          {early && late ? (
            <>
              <clipPath id="lp-gap-clip">
                <rect x={Math.min(m(X(early.age)), m(X(late.age)))} y={70} width={Math.abs(X(late.age) - X(early.age))} height={AXIS - 70} />
              </clipPath>
              <linearGradient id="lp-sweep" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="var(--color-date)" stopOpacity="0" />
                <stop offset="0.5" stopColor="var(--color-date)" stopOpacity="0.22" />
                <stop offset="1" stopColor="var(--color-date)" stopOpacity="0" />
              </linearGradient>
            </>
          ) : null}
        </defs>
        <line x1={70} x2={W - 70} y1={AXIS} y2={AXIS} stroke="var(--color-rule-strong)" className="lp-axis" />
        {ticks.map((a, i) => (
          <g key={a} className="lp-tick" style={{ ["--i" as string]: i }}>
            <line x1={m(X(a))} x2={m(X(a))} y1={AXIS} y2={AXIS + 7} stroke="var(--color-rule-strong)" />
            <text x={m(X(a))} y={AXIS + 27} textAnchor="middle" className="fill-[var(--color-ink-3)] font-mono text-[14px]">
              {a}
            </text>
          </g>
        ))}
        <text x={rtl ? 70 : W - 70} y={AXIS - 10} textAnchor={rtl ? "start" : "end"} className="lp-tick fill-[var(--color-ink-3)] text-[14px]" style={{ ["--i" as string]: 6 }}>
          {ageLabel}
        </text>

        {/* The gap between an earlier conversation and the usual first assessment. */}
        {early && late ? (
          <g className="lp-gap">
            <rect
              x={Math.min(m(X(early.age)), m(X(late.age)))}
              y={70}
              width={Math.abs(X(late.age) - X(early.age))}
              height={AXIS - 70}
              fill="var(--color-date)"
              className="lp-gap-fill"
            />
            <g clipPath="url(#lp-gap-clip)">
              <rect
                x={Math.min(m(X(early.age)), m(X(late.age))) - Math.abs(X(late.age) - X(early.age))}
                y={70}
                width={Math.abs(X(late.age) - X(early.age))}
                height={AXIS - 70}
                fill="url(#lp-sweep)"
                className={`lp-gap-sweep ${rtl ? "lp-gap-sweep--rtl" : ""}`}
              />
            </g>
            <text x={m((X(early.age) + X(late.age)) / 2)} y={AXIS - 14} textAnchor="middle" className="fill-[var(--color-soon)] text-[14px] italic">
              {gapLabel}
            </text>
          </g>
        ) : null}

        <path d={d} pathLength={1} fill="none" stroke="var(--color-ink)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="lp-path" />
        {/* a point of light that keeps travelling the same, unchanging curve */}
        <path d={d} pathLength={1} fill="none" className="lp-glint" />

        {moments.map((mo) => {
          const x = m(X(mo.age));
          const y = Y(mo.age);
          const labelY = 30 + mo.row * 26;
          const i = ord(mo.age);
          const color = mo.kind === "early" ? "var(--color-date)" : mo.kind === "late" ? "var(--color-ink-3)" : "var(--color-accent)";
          return (
            <g key={mo.label} className="lp-moment" style={{ ["--i" as string]: i }}>
              <line x1={x} x2={x} y1={labelY + 9} y2={y - 10} stroke={color} strokeWidth="1" strokeDasharray="2 4" className="lp-guide" />
              {mo.kind === "early" ? <circle cx={x} cy={y} r={16} fill="none" stroke="var(--color-date)" strokeOpacity="0.5" className="lp-halo" /> : null}
              <circle cx={x} cy={y} r={mo.kind === "early" ? 9 : 6} fill={mo.kind === "late" ? "var(--color-paper)" : color} stroke={color} strokeWidth="2.2" className="lp-marker" />
              <text x={x} y={labelY} textAnchor="middle" className={`lp-label text-[16px] ${mo.kind === "early" ? "fill-[var(--color-ink)] font-semibold" : "fill-[var(--color-ink-2)]"}`}>
                {mo.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Phones, and screen readers everywhere: the same moments as a list. */}
      <ol className="relative space-y-5 border-s border-rule-strong ps-6 md:sr-only">
        {moments.map((mo) => (
          <li key={mo.label} className="relative">
            <span
              aria-hidden
              className={`absolute -start-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 ${
                mo.kind === "early" ? "border-date bg-date" : mo.kind === "late" ? "border-ink-3 bg-paper" : "border-accent bg-accent"
              }`}
            />
            <p className={`text-[15.5px] ${mo.kind === "early" ? "font-semibold text-ink" : "text-ink-2"}`}>{mo.label}</p>
            {mo.kind === "early" ? <p className="mt-0.5 text-[13.5px] italic text-soon">{gapLabel}</p> : null}
          </li>
        ))}
      </ol>
    </InView>
  );
}
