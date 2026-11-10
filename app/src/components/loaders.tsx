// Clinical loaders drawn from the subject itself, animated in CSS (globals.css)
// so they run before any JavaScript loads. They respect reduced motion.

/** One cell dividing into two, then four, inside its outer shell. */
export function CellLoader({ size = 72 }: { size?: number }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden className="cell-loader">
      <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-indigo-200)" strokeWidth="2" />
      <circle cx="40" cy="40" r="30" fill="var(--color-indigo-50)" />
      <g className="cell-loader__cells">
        <circle className="cell cell--a" cx="40" cy="40" r="12" />
        <circle className="cell cell--b" cx="40" cy="40" r="12" />
        <circle className="cell cell--c" cx="40" cy="40" r="12" />
        <circle className="cell cell--d" cx="40" cy="40" r="12" />
      </g>
    </svg>
  );
}

/** A 28-day ring with a point travelling around it. */
export function CycleLoader({ size = 72 }: { size?: number }) {
  const ticks = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2 - Math.PI / 2;
    return { x: 40 + Math.cos(a) * 30, y: 40 + Math.sin(a) * 30, i };
  });
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden className="cycle-loader">
      {ticks.map((t) => (
        <circle key={t.i} cx={t.x} cy={t.y} r="1.6" fill="var(--color-zinc-300)" style={{ animationDelay: `${(t.i / 28) * 1.6}s` }} className="cycle-tick" />
      ))}
      <circle cx="40" cy="40" r="5" className="cycle-core" />
    </svg>
  );
}

/** Full-area loading state with a calm, specific message. */
export function PageLoader({ label, variant = "cell" }: { label: string; variant?: "cell" | "cycle" }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      {variant === "cell" ? <CellLoader /> : <CycleLoader />}
      <p className="text-[14px] font-medium text-zinc-600">{label}</p>
    </div>
  );
}

/** Three-dot pulse for buttons waiting on the server. */
export function DotsLoader() {
  return (
    <span aria-hidden className="dots-loader inline-flex items-center gap-1">
      <span />
      <span />
      <span />
    </span>
  );
}
