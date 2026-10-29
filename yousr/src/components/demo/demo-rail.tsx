"use client";

import { useTransition } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { CHAPTERS, nextPosition, prevPosition, type DemoPosition } from "@/lib/demo/chapters";
import { exitDemo, finishDemo, goToDemoStep } from "@/server/actions/demo";

/**
 * Compact guide bar shown only when the user is on the active guided-demo
 * step route. Exploring other screens hides the bar so it never dominates
 * the everyday application.
 */
export function DemoRail({ position }: { position: DemoPosition }) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const chapter = CHAPTERS[position.chapter];
  const step = chapter.steps[position.step];
  const prev = prevPosition(position);
  const next = nextPosition(position);
  const multi = chapter.steps.length > 1;

  // Only show the walkthrough rail on the active step's screen or on /demo.
  const expectedPath = `/${locale}${step.path}`;
  const onDemoLanding = pathname === `/${locale}/demo`;
  const onStepRoute =
    pathname === expectedPath ||
    pathname.startsWith(`${expectedPath}/`) ||
    (step.path === "/trajectory" && pathname === `/${locale}`);

  if (!onStepRoute || onDemoLanding) {
    return null;
  }

  const go = (p: DemoPosition) => start(() => goToDemoStep(p.chapter, p.step, locale));

  return (
    <aside
      aria-label={t("demo.rail.label")}
      className="sticky bottom-0 z-40 border-t border-dawn-300 bg-dawn-100/95 text-ink-900 shadow-[0_-4px_16px_-6px_rgba(31,28,25,0.12)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2">
        <div className="flex items-center gap-2.5">
          <span className="rounded-sm bg-mist-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
            {t("demo.rail.label")}
          </span>
          <ol className="flex items-center gap-1" aria-label={t("demo.rail.chapters")}>
            {CHAPTERS.map((c, i) => {
              const state = i < position.chapter ? "done" : i === position.chapter ? "current" : "todo";
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => go({ chapter: i, step: 0 })}
                    aria-current={state === "current" ? "step" : undefined}
                    aria-label={`${i + 1}. ${t(`demo.chapters.${c.id}.title`)}`}
                    title={`${i + 1}. ${t(`demo.chapters.${c.id}.title`)}`}
                    className={`h-2 rounded-pill transition-all ${
                      state === "current"
                        ? "w-5 bg-mist-700"
                        : state === "done"
                          ? "w-2 bg-mist-500/60"
                          : "w-2 bg-dawn-300 hover:bg-ink-400"
                    }`}
                  />
                </li>
              );
            })}
          </ol>
        </div>

        <div className="min-w-0 flex-1 text-xs md:text-sm">
          <p className="truncate font-semibold text-ink-900">
            <span className="text-mist-700">{t("demo.rail.chapterOf", { n: position.chapter + 1, total: CHAPTERS.length })}</span>
            <span className="mx-1.5 text-ink-400">·</span>
            {t(`demo.chapters.${chapter.id}.title`)}
            {multi ? (
              <span className="ms-1.5 text-[11px] font-normal text-ink-600">
                ({position.step + 1}/{chapter.steps.length})
              </span>
            ) : null}
            <span className="ms-2 font-normal text-ink-600 hidden lg:inline">
              — {t(`demo.guide.${step.id}.notice`)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={pending || !prev}
            onClick={() => prev && go(prev)}
            className="rounded-md border border-dawn-300 bg-white px-2.5 py-1 text-xs font-medium text-ink-900 hover:bg-dawn-50 disabled:opacity-40"
          >
            {t("demo.rail.back")}
          </button>
          {next ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => go(next)}
              className="rounded-md bg-mist-700 px-3 py-1 text-xs font-medium text-white hover:bg-mist-500 disabled:opacity-60"
            >
              {pending ? "…" : `${t("demo.rail.next")} →`}
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => start(() => finishDemo(locale))}
              className="rounded-md bg-mist-700 px-3 py-1 text-xs font-medium text-white hover:bg-mist-500 disabled:opacity-60"
            >
              {t("demo.rail.finish")}
            </button>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => start(() => exitDemo(locale))}
            className="rounded-md px-2 py-1 text-xs text-ink-600 hover:bg-dawn-200 hover:text-ink-900"
          >
            {t("demo.rail.exit")}
          </button>
        </div>
      </div>
    </aside>
  );
}
