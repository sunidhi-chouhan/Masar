"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Illustrated scenes for My Trajectory and the dashboard's journey line.
// Pure SVG and CSS: no animation library, no per-frame JavaScript. Each scene
// animates only while it is on screen (an IntersectionObserver sets
// data-play, and CSS pauses everything else) and is a still picture for
// people who prefer reduced motion. Scenes are decorative (aria-hidden): every
// piece of information they hint at is also written out as text beside them.
//
// The shared motif is the path (Masar means "path"): the couple walk a path,
// the rider rides a road, the treadmill belt runs, and the dashboard's chapters
// sit on one path. Data only ever decorates that path when its permission is on.

/**
 * Sets data-play on the element while it is visible, without re-rendering React.
 * With `once`, the attribute stays after the first sighting: content that has
 * been revealed never hides again behind the reader.
 */
export function useInView<T extends HTMLElement>(threshold = 0.2, once = false) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      el?.setAttribute("data-play", "");
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.setAttribute("data-play", "");
          if (once) io.disconnect();
        } else if (!once) el.removeAttribute("data-play");
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once]);
  return ref;
}

/** Reveals its children once, as they first scroll into view (instantly with reduced motion). */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useInView<HTMLDivElement>(0.08, true);
  return (
    <div ref={ref} className={`sc-reveal ${className}`}>
      {children}
    </div>
  );
}

function Frame({ children, tone, label, fill = false }: { children: ReactNode; tone: string; label: string; fill?: boolean }) {
  const ref = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`sc ${tone} overflow-hidden ${fill ? "absolute inset-0" : "relative rounded-[20px]"}`} data-label={label}>
      <svg viewBox="0 0 480 210" className={`block w-full ${fill ? "h-full" : "h-auto"}`} aria-hidden focusable="false" preserveAspectRatio="xMidYMid slice">
        {children}
      </svg>
    </div>
  );
}

/** Two layers of rolling hills that drift for depth; drawn twice so the loop is seamless. */
function Hills({ far, near, y = 150 }: { far: string; near: string; y?: number }) {
  const hill = (o: number, h: number) => `M${o} ${y} q60 -${h} 120 0 t120 0 t120 0 t120 0 V210 H${o}Z`;
  return (
    <>
      <g className="sc-drift-slow sc-hide-sm">
        <path d={hill(0, 46)} fill={far} />
        <path d={hill(480, 46)} fill={far} />
      </g>
      <g className="sc-drift">
        <path d={hill(-40, 26).replace(`M-40 ${y}`, `M-40 ${y + 14}`)} fill={near} />
        <path d={hill(440, 26).replace(`M440 ${y}`, `M440 ${y + 14}`)} fill={near} />
      </g>
    </>
  );
}

function Cloud({ x, y, s = 1, className }: { x: number; y: number; s?: number; className: string }) {
  return (
    <g className={className}>
      {[0, 520].map((o) => (
        <g key={o} transform={`translate(${x + o} ${y}) scale(${s})`} fill="#fff" opacity="0.9">
          <ellipse cx="0" cy="8" rx="26" ry="10" />
          <ellipse cx="-12" cy="2" rx="13" ry="10" />
          <ellipse cx="9" cy="-1" rx="15" ry="13" />
        </g>
      ))}
    </g>
  );
}


/** Foreground tufts and flowers that pass faster than the hills: the sense of moving forward. Drawn twice for a seamless loop. */
function Verge({ y, tone = "#8fb3a7", flowers = false }: { y: number; tone?: string; flowers?: boolean }) {
  const tufts = [12, 70, 128, 190, 236, 300, 352, 410, 452];
  return (
    <g className="sc-drift-fast">
      {[0, 480].map((o) => (
        <g key={o} transform={`translate(${o} ${y})`}>
          {tufts.map((x, i) => (
            <g key={x} transform={`translate(${x} 0)`}>
              <path d="M0 0 q-2 -9 -6 -12 M0 0 q0 -11 2 -15 M0 0 q3 -8 8 -10" stroke={tone} strokeWidth="1.6" strokeLinecap="round" fill="none" className="sc-sway" style={{ animationDelay: `${-i * 0.4}s` }} />
              {flowers && i % 3 === 1 ? <circle cx="2" cy="-15" r="2.2" fill="var(--color-date)" opacity="0.8" /> : null}
            </g>
          ))}
        </g>
      ))}
    </g>
  );
}

/** Two birds crossing the sky, wings beating slowly. */
function Birds({ x, y }: { x: number; y: number }) {
  return (
    <g className="sc-cloud-slow sc-hide-sm">
      {[0, 520].map((o) => (
        <g key={o} transform={`translate(${x + o} ${y})`} stroke="#6f8f86" strokeWidth="1.4" strokeLinecap="round" fill="none">
          <path d="M-6 0 q3 -3 6 0 q3 -3 6 0" className="sc-flap" />
          <path d="M10 -8 q2.4 -2.4 4.8 0 q2.4 -2.4 4.8 0" className="sc-flap" style={{ animationDelay: "-0.35s" }} />
        </g>
      ))}
    </g>
  );
}

// ---------- Scene 1: reproductive patterns ----------

/** A couple walking hand in hand along a path; the path carries the logged cycles, if shared. */
/** The path's curve, shared by the path itself and the stones on it. */
const pathY = (x: number) => 186 + 7 * Math.sin((x / 480) * Math.PI * 2.2 + 0.6) - 4 * Math.sin((x / 480) * Math.PI * 5);

export function CoupleScene({ cycles, allowed, label, fill }: { cycles: number[]; allowed: boolean; label: string; fill?: boolean }) {
  const road = Array.from({ length: 53 }, (_, i) => -10 + i * 10)
    .map((x, i) => `${i ? "L" : "M"}${x} ${pathY(x).toFixed(1)}`)
    .join(" ");
  const n = Math.min(12, cycles.length);
  return (
    <Frame tone="sc-dawn" label={label} fill={fill}>
      <defs>
        <linearGradient id="sc1-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7ecdc" />
          <stop offset="1" stopColor="#dceae6" />
        </linearGradient>
      </defs>
      <rect width="480" height="210" fill="url(#sc1-sky)" />
      <circle cx="372" cy="62" r="34" fill="var(--color-date)" opacity="0.18" className="sc-glow" />
      <circle cx="372" cy="62" r="20" fill="var(--color-date)" opacity="0.5" />
      <Cloud x={70} y={42} s={0.8} className="sc-cloud-slow" />
      <Cloud x={250} y={26} s={0.55} className="sc-cloud sc-hide-sm" />
      <Birds x={180} y={58} />
      <Hills far="#c9ddd6" near="#a9cbc1" y={160} />
      <path d={road} fill="none" stroke="#efe7d8" strokeWidth="22" strokeLinecap="round" />
      <path d={road} fill="none" stroke={allowed ? "var(--color-accent)" : "var(--color-zinc-300)"} strokeWidth="2" strokeDasharray={allowed ? "0" : "4 6"} className="sc-draw" pathLength={1} />
      {/* each logged cycle is a stone on the path: teal within 21–35 days, gold outside it */}
      {allowed
        ? cycles.slice(-n).map((d, i) => {
            const x = 14 + ((i + 0.5) / n) * 452;
            return <circle key={i} cx={x} cy={pathY(x)} r="4.2" fill={d < 21 || d > 35 ? "var(--color-date)" : "var(--color-accent)"} className="sc-pop" style={{ animationDelay: `${0.4 + i * 0.12}s` }} />;
          })
        : null}
      <g transform="translate(223 182) scale(1.5) translate(-223 -176)">
        <g className="sc-bob">
          {/* she */}
          <g transform="translate(206 176)">
            <path d="M-9 -52 q-5 18 -3 30" stroke="#2c2a25" strokeWidth="7" strokeLinecap="round" fill="none" className="sc-sway" />
            <g className="sc-leg sc-a">
              <path d="M-2 -24 L-3 0" stroke="#3a3833" strokeWidth="4.5" strokeLinecap="round" />
            </g>
            <g className="sc-leg sc-b">
              <path d="M2 -24 L3 0" stroke="#4a4740" strokeWidth="4.5" strokeLinecap="round" />
            </g>
            <path d="M-8 -48 Q0 -52 8 -48 L13 -20 Q0 -14 -13 -20 Z" fill="var(--color-accent)" />
            <g className="sc-arm sc-a">
              <path d="M-7 -46 L-11 -26" stroke="#b07b56" strokeWidth="3.6" strokeLinecap="round" />
            </g>
            <path d="M7 -45 Q14 -36 19 -30" stroke="#b07b56" strokeWidth="3.6" strokeLinecap="round" fill="none" />
            <circle cx="0" cy="-58" r="8" fill="#c48d68" />
            <path d="M-8 -59 q2 -11 10 -9 q8 2 6 10 q-6 -6 -16 -1z" fill="#2c2a25" />
          </g>
          {/* he */}
          <g transform="translate(240 176)">
            <g className="sc-leg sc-b">
              <path d="M-2 -26 L-3 0" stroke="#2c3b45" strokeWidth="5" strokeLinecap="round" />
            </g>
            <g className="sc-leg sc-a">
              <path d="M2 -26 L3 0" stroke="#34495a" strokeWidth="5" strokeLinecap="round" />
            </g>
            <rect x="-9" y="-54" width="18" height="30" rx="7" fill="#d8a64a" />
            <path d="M-8 -50 Q-14 -40 -19 -32" stroke="#8d5a3b" strokeWidth="3.8" strokeLinecap="round" fill="none" />
            <g className="sc-arm sc-b">
              <path d="M8 -50 L12 -30" stroke="#8d5a3b" strokeWidth="3.8" strokeLinecap="round" />
            </g>
            <circle cx="0" cy="-63" r="8.5" fill="#8d5a3b" />
            <path d="M-8 -66 q8 -10 16 0 q-8 -4 -16 0z" fill="#1c1b18" />
          </g>
          {/* joined hands */}
          <circle cx="222.5" cy="145.5" r="3" fill="#a06f4d" />
        </g>
      </g>
      <Verge y={210} flowers />
    </Frame>
  );
}

// ---------- Scene 2: lifestyle ----------

/** A rider on a windy road: wheels turn, cranks pedal, hair and clouds move with the wind. */
export function CyclistScene({ label, fill }: { label: string; fill?: boolean }) {
  return (
    <Frame tone="sc-day" label={label} fill={fill}>
      <defs>
        <linearGradient id="sc2-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e4efec" />
          <stop offset="1" stopColor="#f7f4ee" />
        </linearGradient>
      </defs>
      <rect width="480" height="210" fill="url(#sc2-sky)" />
      <Cloud x={40} y={40} s={1} className="sc-cloud" />
      <Cloud x={250} y={28} s={0.7} className="sc-cloud-slow" />
      <Cloud x={400} y={62} s={0.55} className="sc-cloud sc-hide-sm" />
      {/* wind */}
      <g stroke="#9fbfb7" strokeWidth="1.6" strokeLinecap="round" fill="none" className="sc-hide-sm">
        <path d="M120 86 h60 q12 0 12 -8" className="sc-wind" />
        <path d="M60 112 h80" className="sc-wind" style={{ animationDelay: "-0.8s" }} />
        <path d="M330 100 h70 q10 0 10 -7" className="sc-wind" style={{ animationDelay: "-1.6s" }} />
      </g>
      <Hills far="#cfe0da" near="#b2cfc6" y={150} />
      {/* trees passing */}
      <g className="sc-drift">
        {[30, 150, 300, 420, 510, 630, 780, 900].map((x) => (
          <g key={x} transform={`translate(${x} 150)`}>
            <rect x="-1.5" y="-4" width="3" height="12" fill="#6f8f86" />
            <ellipse cx="0" cy="-12" rx="9" ry="13" fill="#7fa79c" className="sc-sway" />
          </g>
        ))}
      </g>
      <rect y="168" width="480" height="42" fill="#d9d2c4" />
      <line x1="0" y1="190" x2="480" y2="190" stroke="#f7f4ee" strokeWidth="3" strokeDasharray="22 18" className="sc-road" />
      <Birds x={330} y={44} />
      <g transform="translate(228 187) scale(1.18) translate(-228 -187)">
        <g className="sc-bob-fast">
          {/* wheels */}
          {[190, 266].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy="166" r="21" fill="none" stroke="#1c1b18" strokeWidth="3.4" />
              <g className="sc-spin">
                {[0, 45, 90, 135].map((a) => (
                  <line key={a} x1={cx - 19} y1="166" x2={cx + 19} y2="166" stroke="#625e55" strokeWidth="1" transform={`rotate(${a} ${cx} 166)`} />
                ))}
                <circle cx={cx} cy="166" r="3" fill="#1c1b18" />
              </g>
            </g>
          ))}
          {/* frame */}
          <path d="M190 166 L222 166 L212 134 M222 166 L258 136 L212 134 M258 136 L266 166 M206 132 h14 M254 126 l8 -2" stroke="var(--color-accent)" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {/* crank and pedals */}
          <g className="sc-spin-crank">
            <line x1="212" y1="166" x2="232" y2="166" stroke="#1c1b18" strokeWidth="2.6" strokeLinecap="round" />
            <rect x="208" y="164.5" width="7" height="3" rx="1" fill="#625e55" />
            <rect x="229" y="164.5" width="7" height="3" rx="1" fill="#625e55" />
            <circle cx="222" cy="166" r="4" fill="#1c1b18" />
          </g>
          {/* rider */}
          <g className="sc-leg-pedal sc-a">
            <path d="M214 128 L230 148 L224 166" stroke="#2c3b45" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
          <g className="sc-leg-pedal sc-b">
            <path d="M214 128 L222 150 L218 166" stroke="#3d5363" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
          {/* the jersey's hem lifts in the wind */}
          <g className="sc-hair">
            <path d="M214 124 q-10 2 -16 -2 q6 6 15 6z" fill="#c4923c" />
          </g>
          <path d="M212 130 Q222 102 240 96" stroke="#d8a64a" strokeWidth="11" strokeLinecap="round" fill="none" />
          <path d="M236 100 L258 124" stroke="#a06f4d" strokeWidth="4" strokeLinecap="round" />
          <circle cx="246" cy="84" r="9" fill="#a06f4d" />
          {/* hair streaming back in the wind */}
          <g className="sc-hair">
            <path d="M238 80 q-18 -2 -30 6 q12 -1 18 2 q-12 3 -20 11 q14 -5 30 -9z" fill="#1c1b18" />
          </g>
          <path d="M238 78 q8 -10 17 -2 q-6 0 -8 4z" fill="#1c1b18" />
        </g>
      </g>
      <Verge y={210} tone="#a9a08e" />
    </Frame>
  );
}

// ---------- Scene 3: clinical evidence ----------

/** A calm consultation: a doctor explains a report to a couple; the ceiling fan turns. */
export function ConsultScene({ label, fill }: { label: string; fill?: boolean }) {
  return (
    <Frame tone="sc-room" label={label} fill={fill}>
      <rect width="480" height="210" fill="#f4efe6" />
      <rect y="168" width="480" height="42" fill="#e6ddcd" />
      <line x1="0" y1="168" x2="480" y2="168" stroke="#d6ccb9" />
      {/* window with daylight */}
      <rect x="40" y="46" width="92" height="74" rx="6" fill="#e1eeea" stroke="#d6ccb9" strokeWidth="3" />
      <clipPath id="sc3-win">
        <rect x="42" y="48" width="88" height="70" rx="4" />
      </clipPath>
      <g clipPath="url(#sc3-win)">
        <Cloud x={100} y={70} s={0.45} className="sc-cloud-slow" />
      </g>
      <line x1="86" y1="46" x2="86" y2="120" stroke="#d6ccb9" strokeWidth="3" />
      {/* daylight falling across the floor */}
      <path d="M42 120 L130 120 L196 210 L70 210 Z" fill="#fff8e8" opacity="0.5" className="sc-glow" />
      {/* a wall clock: the minute hand keeps time */}
      <g transform="translate(410 70)">
        <circle r="16" fill="#fffaf0" stroke="#b9a98f" strokeWidth="2.4" />
        {[0, 90, 180, 270].map((a) => (
          <line key={a} x1="0" y1="-12" x2="0" y2="-10" stroke="#b9a98f" strokeWidth="1.6" transform={`rotate(${a})`} />
        ))}
        <line x1="0" y1="0" x2="0" y2="-7" stroke="#544b3e" strokeWidth="2" strokeLinecap="round" transform="rotate(60)" />
        <g className="sc-clock">
          <line x1="0" y1="0" x2="0" y2="-11" stroke="#544b3e" strokeWidth="1.4" strokeLinecap="round" />
        </g>
        <circle r="1.6" fill="#544b3e" />
      </g>
      {/* plant */}
      <g transform="translate(26 168)">
        <rect x="-10" y="-14" width="20" height="14" rx="3" fill="#c9b79a" />
        <g className="sc-sway">
          <path d="M0 -14 q-14 -14 -8 -34 q6 14 8 34z M0 -14 q12 -18 4 -36 q-8 16 -4 36z M0 -14 q18 -6 20 -24 q-12 6 -20 24z" fill="#7fa79c" />
        </g>
      </g>
      {/* ceiling fan: blades spin in a flattened plane, so they read as a fan seen from below */}
      <line x1="262" y1="0" x2="262" y2="22" stroke="#625e55" strokeWidth="2.4" />
      <g transform="translate(262 27) scale(1 0.24)">
        <g className="sc-spin-fan">
          {[0, 120, 240].map((a) => (
            <ellipse key={a} cx="34" cy="0" rx="34" ry="9" fill="#8a7a63" transform={`rotate(${a})`} />
          ))}
        </g>
      </g>
      <ellipse cx="262" cy="26" rx="9" ry="5" fill="#544b3e" />
      <circle cx="262" cy="33" r="3.5" fill="var(--color-date)" opacity="0.8" className="sc-glow" />
      {/* bench and couple */}
      <rect x="150" y="140" width="96" height="10" rx="4" fill="#b99d78" />
      <rect x="156" y="150" width="5" height="18" fill="#a18562" />
      <rect x="235" y="150" width="5" height="18" fill="#a18562" />
      <g transform="translate(176 140)">
        <path d="M-10 -2 Q0 -34 10 -2 Z" fill="var(--color-accent)" />
        <path d="M-6 0 L-6 28 M6 0 L8 28" stroke="#3a3833" strokeWidth="4.5" strokeLinecap="round" />
        <g className="sc-nod">
          <circle cx="0" cy="-36" r="8" fill="#c48d68" />
          <path d="M-8 -37 q1 -12 10 -10 q9 2 6 12 q-4 -7 -16 -2z" fill="#2c2a25" />
          <path d="M-3 -33 q3 3 6 0" stroke="#5a3a26" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        </g>
      </g>
      <g transform="translate(214 140)">
        <rect x="-10" y="-30" width="20" height="30" rx="7" fill="#d8a64a" />
        <path d="M-6 0 L-8 28 M6 0 L6 28" stroke="#2c3b45" strokeWidth="5" strokeLinecap="round" />
        <g className="sc-nod" style={{ animationDelay: "-1.3s" }}>
          <circle cx="0" cy="-39" r="8.5" fill="#8d5a3b" />
          <path d="M-8 -42 q8 -10 16 0 q-8 -4 -16 0z" fill="#1c1b18" />
          <path d="M-3 -36 q3 3 6 0" stroke="#3a2418" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        </g>
        {/* his hand rests on hers */}
        <path d="M-9 -24 L-24 -10" stroke="#8d5a3b" strokeWidth="3.6" strokeLinecap="round" />
      </g>
      {/* doctor */}
      <g transform="translate(330 168)">
        <path d="M-6 -40 L-7 0 M6 -40 L7 0" stroke="#34495a" strokeWidth="5.5" strokeLinecap="round" />
        <path d="M-14 -78 Q0 -84 14 -78 L16 -34 Q0 -30 -16 -34 Z" fill="#ffffff" stroke="#d6ccb9" />
        <path d="M-4 -78 q4 16 0 22 q6 4 8 -4" stroke="var(--color-accent)" strokeWidth="1.6" fill="none" />
        {/* the report, held and tilted slightly as it is read from */}
        <g className="sc-report">
          <path d="M14 -72 L4 -54" stroke="#6b4a32" strokeWidth="4" strokeLinecap="round" />
          <rect x="-16" y="-66" width="20" height="26" rx="2" fill="#fff" stroke="var(--color-accent)" strokeWidth="1.4" transform="rotate(-8 -6 -53)" />
          <path d="M-12 -60 h12 M-12 -55 h9 M-12 -50 h11" stroke="#b9d5ce" strokeWidth="1.6" transform="rotate(-8 -6 -53)" />
        </g>
        {/* explaining hand */}
        <g className="sc-gesture">
          <path d="M-12 -74 L-28 -58" stroke="#6b4a32" strokeWidth="4" strokeLinecap="round" />
          <circle cx="-29" cy="-57" r="3" fill="#6b4a32" />
        </g>
        <g className="sc-tilt">
          <circle cx="0" cy="-90" r="9.5" fill="#6b4a32" />
          <path d="M-9 -93 q9 -12 18 0 q-9 -3 -18 0z" fill="#2c2a25" />
          <path d="M-4 -86 q4 3 8 0" stroke="#3a2418" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        </g>
      </g>
    </Frame>
  );
}

// ---------- Scene 4: wearable signals ----------

/** Morning on a treadmill: the watch sends a quiet stream of signals to a small panel. */
export function TreadmillScene({ connected, label, fill }: { connected: boolean; label: string; fill?: boolean }) {
  return (
    <Frame tone="sc-morning" label={label} fill={fill}>
      <defs>
        <linearGradient id="sc4-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3ece1" />
          <stop offset="1" stopColor="#f7f4ee" />
        </linearGradient>
      </defs>
      <rect width="480" height="210" fill="url(#sc4-wall)" />
      <rect y="176" width="480" height="34" fill="#e6ddcd" />
      {/* window: the sun is coming up */}
      <rect x="34" y="40" width="104" height="80" rx="6" fill="#f6dfbd" stroke="#d6ccb9" strokeWidth="3" />
      <clipPath id="sc4-win">
        <rect x="34" y="40" width="104" height="80" rx="6" />
      </clipPath>
      <g clipPath="url(#sc4-win)">
        <circle cx="86" cy="90" r="16" fill="var(--color-date)" opacity="0.75" className="sc-rise" />
      </g>
      <rect x="34" y="104" width="104" height="16" fill="#e8d3b3" />
      <line x1="86" y1="40" x2="86" y2="120" stroke="#d6ccb9" strokeWidth="3" />
      {/* treadmill */}
      <path d="M150 176 L330 170 L336 182 L146 186 Z" fill="#3a3833" />
      <line x1="156" y1="176" x2="326" y2="171" stroke="#6d6a62" strokeWidth="2" strokeDasharray="10 8" className="sc-belt" />
      {[150, 332].map((cx) => (
        <g key={cx} transform={`translate(${cx} ${cx < 200 ? 181 : 176})`}>
          <circle r="5" fill="#4a4740" />
          <g className="sc-spin">
            <line x1="-4" y1="0" x2="4" y2="0" stroke="#8a867c" strokeWidth="1.2" />
          </g>
        </g>
      ))}
      <path d="M318 172 L304 106 M304 106 L282 116" stroke="#4a4740" strokeWidth="5" strokeLinecap="round" fill="none" />
      <rect x="296" y="92" width="30" height="18" rx="3" fill="#1c1b18" />
      <polyline points="299,102 305,102 308,96 311,107 314,102 322,102" fill="none" stroke="var(--color-indigo-300)" strokeWidth="1.4" className="sc-ecg" pathLength={1} />
      {/* runner */}
      <g transform="translate(232 172) scale(1.3)">
        <g className="sc-bob-run">
          <g className="sc-run-leg sc-a">
            <path d="M0 -42 L-6 -20 L-2 0" stroke="#2c3b45" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
          <g className="sc-run-leg sc-b">
            <path d="M0 -42 L6 -22 L2 0" stroke="#3d5363" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
          <path d="M-8 -76 Q2 -80 10 -74 L8 -42 L-8 -42 Z" fill="var(--color-accent)" />
          <g className="sc-run-arm sc-b">
            <path d="M-4 -72 L-14 -56 L-6 -48" stroke="#b07b56" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
          <g className="sc-run-arm sc-a">
            <path d="M6 -72 L14 -56 L22 -60" stroke="#c48d68" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* the wearable, and its pulse */}
            <rect x="16" y="-62" width="6" height="5" rx="1.4" fill="#1c1b18" />
            {connected ? <circle cx="19" cy="-59.5" r="5" fill="none" stroke="var(--color-indigo-400)" strokeWidth="1.4" className="sc-ping" /> : null}
          </g>
          <circle cx="2" cy="-86" r="8.5" fill="#c48d68" />
          <path d="M-6 -88 q4 -10 12 -6 q4 3 3 7 q-6 -4 -15 -1z" fill="#2c2a25" />
          <g className="sc-ponytail">
            <path d="M-6 -90 q-12 0 -16 10 q8 -3 14 -4z" fill="#2c2a25" />
          </g>
        </g>
      </g>
      {/* the data stream, only when the wearable is shared */}
      {connected ? (
        <>
          <path d="M258 108 C 300 70, 340 60, 370 54" fill="none" stroke="var(--color-indigo-300)" strokeWidth="1.6" strokeDasharray="2 6" className="sc-stream" />
          {/* steps, resting heart rate and sleep: the only three signals this synthetic wearable records */}
          {[
            <path key="steps" d="M-3 2 a2.2 3.2 0 1 0 0.1 0z M3 -2 a2.2 3.2 0 1 0 0.1 0z" fill="var(--color-accent)" />,
            <path key="heart" d="M0 3.5 C -5 0, -4.5 -4, -1.8 -3.6 C -0.8 -3.5, 0 -2.6, 0 -2 C 0 -2.6, 0.8 -3.5, 1.8 -3.6 C 4.5 -4, 5 0, 0 3.5 Z" fill="var(--color-date)" />,
            <path key="sleep" d="M1.5 -4 a4.2 4.2 0 1 0 2.6 6.6 a3.4 3.4 0 1 1 -2.6 -6.6z" fill="var(--color-indigo-400)" />,
          ].map((icon, i) => (
            <g key={i} transform="translate(262 98)">
              <g className="sc-signal" style={{ animationDelay: `${i * 1.1}s`, ["--x" as string]: `${24 + i * 31}px`, ["--y" as string]: `${-14 - i * 15}px` }}>
                <circle r="7.5" fill="#fff" stroke="#e2ddd3" />
                {icon}
              </g>
            </g>
          ))}
          <rect x="368" y="28" width="92" height="54" rx="10" fill="#fff" stroke="#e2ddd3" />
          <polyline points="378,58 388,58 392,46 397,66 401,52 406,58 418,58 422,50 426,62 430,58 450,58" fill="none" stroke="var(--color-accent)" strokeWidth="1.8" className="sc-ecg" pathLength={1} />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={380 + i * 15} y={72 - (6 + ((i * 7) % 5) * 1.6)} width="8" height={6 + ((i * 7) % 5) * 1.6} rx="2" fill="var(--color-indigo-300)" className="sc-grow-y" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </>
      ) : (
        <g>
          <rect x="368" y="28" width="92" height="54" rx="10" fill="none" stroke="var(--color-zinc-300)" strokeDasharray="4 5" />
          <line x1="388" y1="55" x2="440" y2="55" stroke="var(--color-zinc-300)" strokeWidth="2" strokeDasharray="3 5" />
        </g>
      )}
    </Frame>
  );
}

// ---------- the journey line across the dashboard ----------

/** The seven chapters on one path; chapters with something to show glow, the current one is marked. */
export function JourneyPath({ chapters, active, onGo }: { chapters: { id: string; label: string; lit: boolean }[]; active: string; onGo: (id: string) => void }) {
  const ref = useInView<HTMLDivElement>(0.3);
  const n = chapters.length;
  return (
    <div ref={ref} className="sc relative">
      <svg viewBox="0 0 700 60" className="block h-auto w-full" aria-hidden focusable="false" preserveAspectRatio="none">
        <path d="M10 34 C 110 6, 190 58, 290 30 S 470 8, 560 32 S 660 46, 690 26" fill="none" stroke="var(--color-rule)" strokeWidth="10" strokeLinecap="round" />
        <path d="M10 34 C 110 6, 190 58, 290 30 S 470 8, 560 32 S 660 46, 690 26" fill="none" stroke="var(--color-accent)" strokeWidth="2.4" strokeLinecap="round" className="sc-draw" pathLength={1} />
      </svg>
      <ol className="mt-2 grid gap-1.5 text-center" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {chapters.map((c, i) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onGo(c.id)}
              aria-current={active === c.id ? "location" : undefined}
              className={`group flex w-full flex-col items-center gap-1 rounded-[12px] px-1 py-1.5 text-[11.5px] leading-tight transition-colors hover:bg-surface ${active === c.id ? "font-semibold text-ink" : "text-ink-2"}`}
            >
              <span
                aria-hidden
                className={`sc-node grid h-7 w-7 place-items-center rounded-full font-mono text-[10.5px] ${active === c.id ? "bg-ink text-paper" : c.lit ? "bg-accent text-white" : "border border-dashed border-unknown bg-surface text-ink-3"}`}
                style={{ animationDelay: `${0.2 + i * 0.1}s` }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="hidden sm:block">{c.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ---------- Overview: the path through all seven chapters ----------

/** Points on the overview's winding path, from the foreground to the horizon (viewBox 600 × 300). */
export function heroPoint(t: number) {
  return { x: 46 + 500 * t + 34 * Math.sin(t * Math.PI * 2), y: 258 - 178 * Math.pow(t, 0.85) + 26 * Math.sin(t * Math.PI * 2.4) * (1 - t) };
}
export const HERO_T = [0.02, 0.17, 0.32, 0.47, 0.62, 0.78, 0.95];

/** The landscape behind the overview's seven milestones. The milestones themselves are buttons laid over it. */
export function PathHero() {
  const ref = useInView<HTMLDivElement>(0.2);
  const pts = Array.from({ length: 61 }, (_, i) => heroPoint(i / 60));
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  return (
    <div ref={ref} className="sc absolute inset-0">
      <svg viewBox="0 0 600 300" className="h-full w-full" aria-hidden focusable="false" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sch-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f5e9d6" />
            <stop offset="0.6" stopColor="#eef0e8" />
            <stop offset="1" stopColor="#dceae6" />
          </linearGradient>
        </defs>
        <rect width="600" height="300" fill="url(#sch-sky)" />
        <circle cx="470" cy="70" r="46" fill="var(--color-date)" opacity="0.16" className="sc-glow" />
        <circle cx="470" cy="70" r="26" fill="var(--color-date)" opacity="0.45" />
        <Cloud x={120} y={50} s={0.9} className="sc-cloud-slow" />
        <Cloud x={330} y={34} s={0.6} className="sc-cloud sc-hide-sm" />
        <g className="sc-drift-slow sc-hide-sm">
          {[0, 480].map((o) => (
            <path key={o} d={`M${o} 130 q60 -40 120 0 t120 0 t120 0 t120 0 V300 H${o}Z`} fill="#d3e3dc" />
          ))}
        </g>
        <path d="M0 160 q90 -36 180 0 t180 0 t180 0 t180 0 V300 H0Z" fill="#bcd6cd" />
        <path d="M0 210 q120 -40 240 0 t240 0 t240 0 V300 H0Z" fill="#a7c9be" />
        {/* the path itself, wide near the reader and narrow at the horizon */}
        <path d={d} fill="none" stroke="#f4ecdd" strokeWidth="30" strokeLinecap="round" />
        <path d={d} fill="none" stroke="#efe3cc" strokeWidth="12" strokeLinecap="round" />
        <path d={d} fill="none" stroke="var(--color-accent)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="1" className="sc-draw" pathLength={1} />
        {[60, 210, 380, 520].map((x, i) => (
          <g key={x} transform={`translate(${x} ${i % 2 ? 196 : 228})`}>
            <rect x="-1.5" y="-4" width="3" height="12" fill="#6f8f86" />
            <ellipse cx="0" cy="-13" rx="10" ry="14" fill="#86ab9f" className="sc-sway" />
          </g>
        ))}
      </svg>
    </div>
  );
}

/** A dashed stretch of path that carries the eye from one trajectory scene to the next. */
export function Connector({ flip }: { flip: boolean }) {
  const ref = useInView<HTMLDivElement>(0.5);
  return (
    <div ref={ref} className="sc hidden h-12 lg:block" aria-hidden>
      <svg viewBox="0 0 1000 48" className="h-full w-full" preserveAspectRatio="none">
        <path d={flip ? "M260 0 C 260 30, 740 18, 740 48" : "M740 0 C 740 30, 260 18, 260 48"} fill="none" stroke="var(--color-rule-strong)" strokeWidth="2" strokeDasharray="1" pathLength={1} className="sc-draw" />
      </svg>
    </div>
  );
}

// ---------- What stood out: a lantern lights part of the path ----------

export function LanternScene() {
  const ref = useInView<HTMLDivElement>(0.3);
  return (
    <div ref={ref} className="sc overflow-hidden rounded-[22px]">
      <svg viewBox="0 0 320 220" className="block h-auto w-full" aria-hidden focusable="false">
        <defs>
          <radialGradient id="scl-light" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#f3d58c" stopOpacity="0.85" />
            <stop offset="1" stopColor="#f3d58c" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="320" height="220" fill="#1f3a37" />
        {[
          [40, 30],
          [90, 18],
          [150, 40],
          [230, 22],
          [280, 48],
          [200, 60],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.2" fill="#fff" opacity="0.7" className="sc-glow" style={{ animationDelay: `${i * 0.6}s` }} />
        ))}
        <path d="M0 170 q80 -30 160 0 t160 0 V220 H0Z" fill="#2a4a46" />
        <path d="M-10 214 C 90 190, 150 196, 200 182 S 300 168, 330 172" fill="none" stroke="#3b5e58" strokeWidth="18" strokeLinecap="round" />
        <circle cx="168" cy="150" r="78" fill="url(#scl-light)" className="sc-glow" />
        {/* the lit stretch of path, and two stones it reveals */}
        <path d="M120 194 C 150 190, 180 186, 214 178" fill="none" stroke="#e9d9b4" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
        <circle cx="140" cy="191" r="5" fill="var(--color-date)" className="sc-pop" style={{ animationDelay: "0.6s" }} />
        <circle cx="196" cy="182" r="5" fill="var(--color-date)" className="sc-pop" style={{ animationDelay: "0.9s" }} />
        {/* lantern post */}
        <rect x="166" y="96" width="4" height="92" fill="#13211f" />
        <path d="M156 92 h24 l-4 -8 h-16z" fill="#13211f" />
        <g className="sc-sway">
          <rect x="158" y="96" width="20" height="24" rx="4" fill="#f3d58c" />
          <rect x="161" y="99" width="14" height="18" rx="3" fill="#fff4d6" />
        </g>
        {/* fireflies */}
        {[
          [90, 120],
          [230, 130],
          [250, 96],
          [110, 90],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2" fill="#f3d58c" className="sc-float" style={{ animationDelay: `${-i * 1.3}s` }} />
        ))}
      </svg>
    </div>
  );
}

// ---------- Prepare: a door to the consultation, and a notepad ----------

export function DoorScene() {
  const ref = useInView<HTMLDivElement>(0.3);
  return (
    <div ref={ref} className="sc overflow-hidden rounded-[22px]">
      <svg viewBox="0 0 320 220" className="block h-auto w-full" aria-hidden focusable="false">
        <rect width="320" height="220" fill="#f1ebe0" />
        <rect y="178" width="320" height="42" fill="#e2d8c6" />
        {/* the door, slightly open, light spilling through */}
        <rect x="170" y="42" width="84" height="136" fill="#fff6e2" />
        <path d="M170 42 L170 178 L150 194 L150 54 Z" fill="#fbe7bf" opacity="0.7" className="sc-glow" />
        <path d="M254 42 L254 178 L228 186 L228 48 Z" fill="#c9b293" />
        <rect x="166" y="38" width="92" height="140" fill="none" stroke="#b39c7c" strokeWidth="4" />
        <circle cx="233" cy="116" r="2.6" fill="#7a6447" />
        <text x="212" y="32" textAnchor="middle" fontSize="9" fill="#7a6447" fontFamily="var(--font-mono)">
          + CLINIC
        </text>
        {/* chair and notepad */}
        <rect x="40" y="138" width="56" height="8" rx="3" fill="#b99d78" />
        <rect x="44" y="146" width="5" height="32" fill="#a18562" />
        <rect x="87" y="146" width="5" height="32" fill="#a18562" />
        <rect x="40" y="96" width="8" height="46" rx="3" fill="#b99d78" />
        <g transform="translate(96 72) rotate(-6)">
          <rect width="62" height="80" rx="5" fill="#fff" stroke="#d6ccb9" />
          <rect x="22" y="-5" width="18" height="9" rx="3" fill="var(--color-accent)" />
          {[18, 34, 50, 66].map((y, i) => (
            <g key={y}>
              <path
                d={`M9 ${y} l4 4 l7 -8`}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="1"
                pathLength={1}
                className="sc-draw"
                style={{ animationDelay: `${0.4 + i * 0.5}s` }}
              />
              <path d={`M26 ${y} h26`} stroke="#d6ccb9" strokeWidth="3" strokeLinecap="round" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

// ---------- Report: a calm stack of pages ----------

export function ReportSheets() {
  return (
    <svg viewBox="0 0 200 160" className="block h-auto w-full max-w-[220px]" aria-hidden focusable="false">
      <rect x="46" y="22" width="110" height="128" rx="8" fill="#ece5d8" transform="rotate(-6 100 86)" />
      <rect x="44" y="18" width="110" height="128" rx="8" fill="#f6f1e8" transform="rotate(3 100 86)" />
      <rect x="45" y="16" width="110" height="128" rx="8" fill="#fff" stroke="#e2ddd3" />
      <rect x="57" y="30" width="44" height="6" rx="3" fill="var(--color-accent)" />
      {[46, 56, 66, 80, 90, 100, 114, 124].map((y, i) => (
        <rect key={y} x="57" y={y} width={i % 3 === 2 ? 52 : 84} height="4" rx="2" fill="#e2ddd3" />
      ))}
      <circle cx="136" cy="126" r="12" fill="none" stroke="var(--color-date)" strokeWidth="2" />
      <path d="M131 126 l4 4 l7 -8" fill="none" stroke="var(--color-date)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
