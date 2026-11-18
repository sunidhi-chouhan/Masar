import { ConsultScene, CoupleScene, CyclistScene, TreadmillScene } from "@/components/prototype/scenes";
import { InView } from "./in-view";

// "Inside Masar": the same four illustrated scenes the resident dashboard uses
// in My trajectory, so the landing page and the app read as one story. Purely
// illustrative: the scenes carry no data here (no cycle stones, no readings),
// and the note under them says so.

export function InsideMasar({ label, title, body, note, parts }: { label: string; title: string; body: string; note: string; parts: readonly (readonly [string, string])[] }) {
  const scene = (i: number, name: string) =>
    i === 0 ? <CoupleScene cycles={[]} allowed label={name} /> : i === 1 ? <CyclistScene label={name} /> : i === 2 ? <ConsultScene label={name} /> : <TreadmillScene connected label={name} />;
  return (
    <section id="inside" aria-labelledby="inside-title" className="inside relative scroll-mt-6 overflow-hidden py-20 md:py-28">
      <div aria-hidden className="inside-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-4 md:px-8">
        <InView className="seq max-w-3xl" threshold={0.3}>
          <p className="eyebrow">{label}</p>
          <h2 id="inside-title" className="display mt-4 text-[clamp(2rem,4.5vw,3.4rem)] leading-[1.08] text-ink">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-[16.5px] leading-relaxed text-ink-2">{body}</p>
        </InView>

        {/* Four scenes on one path: a dashed line runs behind them, the way the app's chapters hang on one spine. */}
        <div className="relative mt-12">
          <svg aria-hidden viewBox="0 0 1000 600" preserveAspectRatio="none" className="inside-path pointer-events-none absolute inset-0 hidden h-full w-full md:block">
            <path d="M250 40 C 250 200, 750 160, 750 300 S 250 420, 250 560" fill="none" stroke="var(--color-rule-strong)" strokeWidth="2" strokeDasharray="3 7" vectorEffect="non-scaling-stroke" />
          </svg>
          <ol className="relative grid gap-6 md:grid-cols-2 md:gap-x-10 md:gap-y-0">
            {parts.map(([name, line], i) => (
              <InView as="li" key={name} className={`inside-card ${i % 2 ? "md:mt-28" : ""}`} threshold={0.25} style={{ ["--i" as string]: i }}>
                <article className="group overflow-hidden rounded-[28px] border border-rule bg-surface shadow-[0_1px_0_rgb(28_27_24/0.02),0_24px_60px_-40px_rgb(28_27_24/0.35)] transition-[transform,box-shadow] duration-500 hover:shadow-[0_1px_0_rgb(28_27_24/0.02),0_34px_70px_-40px_rgb(28_27_24/0.45)]">
                  <div className="relative">
                    {scene(i, name)}
                    <span aria-hidden className="absolute start-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-ink font-display text-[1rem] text-paper shadow-sm">
                      {String.fromCharCode(65 + i)}
                    </span>
                  </div>
                  <div className="p-5 md:p-6">
                    <h3 className="display text-[1.5rem] leading-tight text-ink">{name}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{line}</p>
                  </div>
                </article>
              </InView>
            ))}
          </ol>
        </div>
        <p className="mt-8 text-[13px] text-ink-3">{note}</p>
      </div>
    </section>
  );
}
