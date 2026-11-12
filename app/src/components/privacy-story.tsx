import type { Lang } from "@/lib/i18n";
import { InView } from "./in-view";

// "Never for employers, insurers or marketing": six privacy principles told as
// one picture. Data sources reach a protected space only through their own
// switch; the assistant has a separate switch; every look is written to a log;
// small groups stay veiled; download and delete are one action each. Numbered
// markers in the picture match the six short labels beside it.
//
// The shield's inner lines are decorative. Masar does not use fingerprints or
// any biometric, and the caption says so.

export interface Principle {
  title: string;
  body: string;
}

const W = 640;
const H = 400;
const SOURCES = [70, 130, 190, 250];
const SWITCH_X = 128;
const SHIELD = "M320 92 C 352 104 384 108 404 110 V 196 C 404 250 368 282 320 300 C 272 282 236 250 236 196 V 110 C 256 108 288 104 320 92 Z";

/** Which story each source switch tells: opened, opened then withdrawn, or never opened. */
const ROLE = ["on", "withdraw", "on", "off"] as const;

export function PrivacyStory({ principles, caption, lang }: { principles: Principle[]; caption: string; lang: Lang }) {
  const rtl = lang === "ar";
  const m = (x: number) => (rtl ? W - x : x);
  // Paths are drawn left to right, then mirrored for Arabic.
  const pathFor = (y: number, i: number) => {
    const ey = 150 + i * 26;
    return `M ${m(48)} ${y} L ${m(SWITCH_X - 15)} ${y} M ${m(SWITCH_X + 15)} ${y} C ${m(200)} ${y}, ${m(205)} ${ey}, ${m(238)} ${ey}`;
  };
  const flowFor = (y: number, i: number) => {
    const ey = 150 + i * 26;
    return `M ${m(SWITCH_X + 15)} ${y} C ${m(200)} ${y}, ${m(205)} ${ey}, ${m(238)} ${ey} L ${m(320)} ${190}`;
  };
  const aiPath = `M ${m(48)} 342 L ${m(SWITCH_X - 15)} 342 M ${m(SWITCH_X + 15)} 342 C ${m(230)} 342, ${m(300)} 340, ${m(318)} 300`;
  const aiFlow = `M ${m(SWITCH_X + 15)} 342 C ${m(230)} 342, ${m(300)} 340, ${m(318)} 300 L ${m(320)} 200`;
  // The shield is symmetric about the centre line, so it needs no mirroring.
  const sw = (y: number, role: string, i: number) => (
    <g key={`sw-${i}`} className={`pv-switch pv-switch--${role}`} style={{ ["--i" as string]: i }}>
      <rect x={m(SWITCH_X) - 15} y={y - 8} width="30" height="16" rx="8" className="pv-pill" />
      <rect x={m(SWITCH_X) - 15} y={y - 8} width="30" height="16" rx="8" className="pv-pill-on" />
      <circle cx={m(SWITCH_X - 7)} cy={y} r="5.5" className="pv-knob" />
    </g>
  );

  const marker = (n: number, x: number, y: number) => (
    <g className="pv-marker" style={{ ["--i" as string]: n }}>
      <circle cx={m(x)} cy={y} r="10" />
      <text x={m(x)} y={y + 4} textAnchor="middle">
        {n}
      </text>
    </g>
  );

  return (
    <InView className="pv grid items-center gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16" threshold={0.2}>
      <figure>
        <svg viewBox={`0 0 ${W} ${H}`} className="pv-svg h-auto w-full" direction="ltr" style={{ ["--on" as string]: rtl ? "-14px" : "14px" }} aria-hidden>
          {/* data sources and their pathways */}
          {SOURCES.map((y, i) => (
            <g key={y}>
              <path d={pathFor(y, i)} className="pv-path" />
              <g className={`pv-gate pv-gate--${ROLE[i]}`} style={{ ["--i" as string]: i }}>
                <path d={pathFor(y, i)} className="pv-path-open" />
                <path d={flowFor(y, i)} pathLength={1} className="pv-flow" style={{ ["--i" as string]: i }} />
              </g>
              <rect x={m(40) - 8} y={y - 10} width="16" height="20" rx="3" className="pv-doc" />
              <path d={`M ${m(36)} ${y - 3} h 8 M ${m(36)} ${y + 2} h 8`} className="pv-doc-lines" />
            </g>
          ))}
          {SOURCES.map((y, i) => sw(y, ROLE[i], i))}

          {/* the assistant: a separate, optional pathway with its own switch */}
          <path d={aiPath} className="pv-path pv-path--ai" />
          <g className="pv-gate pv-gate--ai">
            <path d={aiPath} className="pv-path-open pv-path-open--ai" />
            <path d={aiFlow} pathLength={1} className="pv-flow pv-flow--ai" />
          </g>
          <path d={`M ${m(40)} 330 l 3 9 9 3 -9 3 -3 9 -3 -9 -9 -3 9 -3 z`} className="pv-ai" />
          {sw(342, "ai", 4)}

          {/* the protected space */}
          <path d={SHIELD} className="pv-shield" />
          {[0, 1, 2, 3].map((k) => (
            <ellipse key={k} cx={m(320)} cy={206} rx={14 + k * 12} ry={18 + k * 14} className="pv-ridge" style={{ ["--i" as string]: k }} />
          ))}
          <circle cx={m(320)} cy={200} r={7} className="pv-core" />

          {/* every look, written down */}
          <path d={`M ${m(404)} 172 H ${m(446)}`} className="pv-tap" />
          {[0, 1, 2, 3, 4].map((r) => (
            <g key={r} className="pv-log" style={{ ["--i" as string]: r }}>
              <circle cx={m(456)} cy={124 + r * 24} r={4} className={r === 3 ? "pv-log-blocked" : "pv-log-allowed"} />
              <rect x={rtl ? W - 468 - (90 + (r % 3) * 22) : 468} y={121 + r * 24} width={90 + (r % 3) * 22} height="6" rx="3" className="pv-log-line" />
            </g>
          ))}

          {/* small groups stay hidden */}
          {Array.from({ length: 12 }, (_, k) => (
            <circle key={`a${k}`} cx={m(462 + (k % 4) * 11)} cy={302 + Math.floor(k / 4) * 11} r="3.4" className="pv-person" />
          ))}
          {Array.from({ length: 10 }, (_, k) => (
            <circle key={`b${k}`} cx={m(520 + (k % 4) * 11)} cy={302 + Math.floor(k / 4) * 11} r="3.4" className="pv-person" />
          ))}
          {Array.from({ length: 3 }, (_, k) => (
            <circle key={`c${k}`} cx={m(580 + k * 10)} cy={313} r="3.4" className="pv-person" />
          ))}
          <rect x={m(572) - (rtl ? 34 : 0)} y={298} width="34" height="30" rx="6" className="pv-veil" />

          {/* yours to take, or to erase */}
          <g className="pv-take">
            <path d={`M ${m(478)} 44 v 18 m -6 -6 l 6 6 6 -6`} className="pv-arrow" />
            <path d={`M ${m(468)} 66 v 6 h 20 v -6`} className="pv-tray" />
          </g>
          <g className="pv-erase">
            <path d={`M ${m(520)} 50 h 22 M ${m(524)} 50 v 22 h 14 v -22 M ${m(528)} 46 h 6`} className="pv-bin" />
          </g>

          {marker(1, 128, 40)}
          {marker(2, 128, 374)}
          {marker(3, 600, 100)}
          {marker(4, 172, 112)}
          {marker(5, 446, 350)}
          {marker(6, 454, 52)}
        </svg>
        <figcaption className="mt-3 text-[12.5px] text-white/75">{caption}</figcaption>
      </figure>

      <ol className="pv-list grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-1">
        {principles.map((p, i) => (
          <li key={p.title} className="pv-item flex gap-4" style={{ ["--i" as string]: i }}>
            <span aria-hidden className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/60 font-mono text-[12.5px] text-white">
              {i + 1}
            </span>
            <span>
              <span className="block text-[16.5px] font-semibold text-white">{p.title}</span>
              <span className="mt-0.5 block text-[14.5px] leading-snug text-white/80">{p.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </InView>
  );
}
