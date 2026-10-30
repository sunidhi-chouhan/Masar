"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { SimulatedBadge } from "@/components/ui/atoms";
import { useJourneyMotion } from "@/components/journey/journey-loaders";
import { JourneyHorizonMark } from "@/components/journey/journey-path-motif";

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
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div className="min-w-0 max-w-xl">
            {brandLine ? (
              <p className="mb-2 font-display text-base text-mist-700 sm:text-lg">{brandLine}</p>
            ) : null}
            <h1 className="font-display text-[clamp(2rem,5vw,2.75rem)] leading-[1.12] tracking-tight text-ink-900">
              {title}
            </h1>
            {body ? (
              <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-600 md:text-[0.95rem]">
                {body}
              </p>
            ) : null}
          </div>
          <JourneyHorizonMark className="shrink-0 self-start sm:self-end sm:mb-1" />
        </div>
      ) : (
        <>
          <h1 className="font-display text-[clamp(1.65rem,3.5vw,2.15rem)] tracking-tight text-ink-900">
            {title}
          </h1>
          {body ? (
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-600 md:text-[0.95rem]">
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
      <ul className="list-disc space-y-2.5 ps-5 text-sm leading-relaxed text-ink-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  return (
    <motion.ul
      className="list-disc space-y-2.5 ps-5 text-sm leading-relaxed text-ink-600"
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
          variants={{
            hidden: { opacity: 0, x: -6 },
            show: {
              opacity: 1,
              x: 0,
              transition: { duration: dur(0.35), ease: LUX },
            },
          }}
        >
          {item}
        </motion.li>
      ))}
    </motion.ul>
  );
}
