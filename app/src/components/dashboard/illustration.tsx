// A restrained illustration for the overview: a path across soft rings, with
// three markers. Decorative only, drawn in Masar's own colours.

export function PathIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 220" className={className} aria-hidden>
      <defs>
        <radialGradient id="pi-a" cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#dceae6" stopOpacity="0.15" />
        </radialGradient>
        <radialGradient id="pi-b" cx="0.6" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#f3e6cc" stopOpacity="0.95" />
          <stop offset="1" stopColor="#f3e6cc" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pi-line" x1="0" x2="1">
          <stop offset="0" stopColor="#1e5b56" stopOpacity="0.25" />
          <stop offset="0.6" stopColor="#1e5b56" />
          <stop offset="1" stopColor="#c8962e" />
        </linearGradient>
      </defs>
      <circle cx="210" cy="96" r="92" fill="url(#pi-a)" />
      <circle cx="248" cy="132" r="64" fill="url(#pi-b)" />
      <circle cx="210" cy="96" r="62" fill="none" stroke="#1e5b56" strokeOpacity="0.12" />
      <circle cx="210" cy="96" r="34" fill="none" stroke="#1e5b56" strokeOpacity="0.1" strokeDasharray="3 5" />
      <path className="illus-path" d="M14 196 C 70 188, 92 140, 140 136 S 214 150, 236 104 S 282 40, 306 30" fill="none" stroke="url(#pi-line)" strokeWidth="3" strokeLinecap="round" pathLength={1} />
      {[
        [140, 136],
        [236, 104],
        [306, 30],
      ].map(([x, y], i) => (
        <g key={i} className="illus-dot" style={{ ["--i" as string]: i }}>
          <circle cx={x} cy={y} r="10" fill="#ffffff" stroke={i === 2 ? "#c8962e" : "#1e5b56"} strokeWidth="2" />
          <circle cx={x} cy={y} r="3.5" fill={i === 2 ? "#c8962e" : "#1e5b56"} />
        </g>
      ))}
    </svg>
  );
}
