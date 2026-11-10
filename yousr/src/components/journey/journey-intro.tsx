"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { SimulatedBadge } from "@/components/ui/atoms";
import { useJourneyMotion } from "@/components/journey/journey-loaders";

const LUX = [0.16, 1, 0.3, 1] as const;

function IntroBody({
  eyebrow,
  title,
  body,
  brandLine,
  badge,
  hero,
  children,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  brandLine?: string;
  badge: boolean;
  hero: boolean;
  children?: ReactNode;
}) {
  return (
    <>
      {badge || eyebrow ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {eyebrow ? <p className="label-caps mb-0">{eyebrow}</p> : null}
          {badge ? <SimulatedBadge /> : null}
        </div>
      ) : null}

      {hero ? (
        <div className="min-w-0 max-w-2xl">
          {brandLine ? <p className="mb-3 font-display text-lg italic text-mist-700">{brandLine}</p> : null}
          <h1 className="text-[clamp(2.25rem,4.6vw,3.25rem)] leading-[1.02] tracking-[-0.025em] text-ink-900">{title}</h1>
          {body ? <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-600">{body}</p> : null}
        </div>
      ) : (
        <>
          <h1 className="text-[clamp(2rem,3.8vw,2.6rem)] leading-[1.05] tracking-[-0.02em] text-ink-900">
            {title}
          </h1>
          {body ? (
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-600">
              {body}
            </p>
          ) : null}
        </>
      )}
      {children}
    </>
  );
}

/** Animated page intro for journey screens. */
export function JourneyIntro({
  eyebrow,
  title,
  body,
  brandLine,
  badge = true,
  hero = false,
  children,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  brandLine?: string;
  badge?: boolean;
  hero?: boolean;
  children?: ReactNode;
}) {
  const { live, dur, animate } = useJourneyMotion();
  const bodyNode = (
    <IntroBody
      eyebrow={eyebrow}
      title={title}
      body={body}
      brandLine={brandLine}
      badge={badge}
      hero={hero}
    >
      {children}
    </IntroBody>
  );

  if (!live) return <div>{bodyNode}</div>;

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur(0.45), ease: LUX }}
    >
      {bodyNode}
    </motion.div>
  );
}

/** Staggered list reveal for consent / AI bullet points. */
export function JourneyStaggerList({ items }: { items: string[] }) {
  const { live, animate, dur } = useJourneyMotion();
  if (!live) {
    return (
      <ul className="space-y-3.5 text-[14.5px] leading-relaxed text-ink-700">
        {items.map((item) => (
          <li key={item} className="flex gap-3"><span aria-hidden className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mist-100 text-mist-700"><svg viewBox="0 0 16 16" className="h-3 w-3" fill="none"><path d="m4 8.4 2.6 2.6L12 5.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span><span>{item}</span></li>
        ))}
      </ul>
    );
  }
  return (
    <motion.ul
      className="space-y-3.5 text-[14.5px] leading-relaxed text-ink-700"
      initial={animate ? "hidden" : false}
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: animate ? 0.07 : 0 } },
      }}
    >
      {items.map((item) => (
        <motion.li
          key={item}
          className="flex gap-3"
          variants={{
            hidden: { opacity: 0, x: -6 },
            show: {
              opacity: 1,
              x: 0,
              transition: { duration: dur(0.35), ease: LUX },
            },
          }}
        >
          <span aria-hidden className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mist-100 text-mist-700"><svg viewBox="0 0 16 16" className="h-3 w-3" fill="none"><path d="m4 8.4 2.6 2.6L12 5.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
          <span>{item}</span>
        </motion.li>
      ))}
    </motion.ul>
  );
}
