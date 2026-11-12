"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { SCENES, line, tr } from "@/lib/experience/copy";
import { derive } from "@/lib/experience/derive";
import { initialState, reducer, type SimState } from "@/lib/experience/state";
import type { Aggregates } from "@/lib/experience/aggregates";
import { SceneBody } from "./scenes";
import { SimContext, useSim } from "./sim-context";
import "./experience.css";

const STORE_KEY = "masar-experience-v1";

export function ExperienceApp({ aggregates, studioHref }: { aggregates: Aggregates; studioHref: string }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState());
  const [ready, setReady] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const view = useMemo(
    () => derive({ sources: state.sources, scanning: state.scanning, answers: state.answers }),
    [state.sources, state.scanning, state.answers],
  );
  const scene = SCENES[state.scene];

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) dispatch({ type: "hydrate", state: JSON.parse(raw) as SimState });
    } catch {
      /* a damaged browser note should not block the story */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    sessionStorage.setItem(STORE_KEY, JSON.stringify(state));
  }, [state, ready]);

  useEffect(() => {
    document.getElementById("main")?.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [state.scene]);

  useEffect(() => {
    if (!state.playing) return;
    const id = window.setInterval(() => dispatch({ type: "reveal" }), 6500);
    return () => window.clearInterval(id);
  }, [state.playing, state.scene]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON" || tag === "A") return;
      if (event.key === "ArrowRight" && event.shiftKey) {
        event.preventDefault();
        dispatch({ type: "next-scene" });
      } else if (event.key === "ArrowLeft" && event.shiftKey) {
        event.preventDefault();
        dispatch({ type: "prev-scene" });
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        dispatch({ type: "reveal" });
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        dispatch({ type: "hide" });
      } else if (event.key === "Home") {
        event.preventDefault();
        dispatch({ type: "restart" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const lang = state.lang;
  const t = (text: string) => tr(lang, text);

  return (
    <SimContext.Provider value={{ state, dispatch, view, aggregates, studioHref, headingRef }}>
      <div className="xm flex h-dvh flex-col overflow-hidden" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
        <header className="shrink-0 border-b border-rule">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 md:px-8">
            <a href="/" className="flex items-center gap-2.5 text-ink" aria-label="Masar · مسار">
              <svg viewBox="0 0 32 32" className="h-8 w-8 flip-rtl" aria-hidden>
                <rect width="32" height="32" rx="9" fill="var(--color-accent)" />
                <path d="M7 21.5c3.2 0 4.2-6 7.4-6s3.6 3.6 6.4 3.6S24.5 10 25 10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                <circle cx="7" cy="21.5" r="1.7" fill="#fff" />
                <circle cx="25" cy="10" r="2.3" fill="var(--color-date)" />
              </svg>
              <span aria-hidden className="display text-[1.45rem] leading-none">Masar</span>
              <span aria-hidden className="hidden font-[family-name:var(--font-naskh)] text-[1.05rem] text-ink-3 min-[420px]:inline">مسار</span>
            </a>
            <span className="hidden h-5 w-px bg-rule-strong sm:block" aria-hidden />
            <span className="text-[14px] font-medium text-ink-2">{lang === "ar" ? "تجربة مسار" : "Experience Masar"}</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-soon/40 bg-soon-soft px-3 py-1 text-[12.5px] font-semibold text-soon">
              {lang === "ar" ? "عرض محاكى" : "Simulated demonstration"}
            </span>
            <div className="ms-auto flex items-center gap-2">
              <button type="button" className="xm-btn xm-btn--quiet" onClick={() => dispatch({ type: "lang", lang: lang === "en" ? "ar" : "en" })}>
                {lang === "en" ? "العربية" : "English"}
              </button>
              <a className="xm-btn xm-btn--quiet" href={studioHref}>
                {t("Back to Demo Studio")}
              </a>
            </div>
          </div>
          <p className="mx-auto max-w-5xl px-4 pb-3 text-[13.5px] text-ink-3 md:px-8">
            {lang === "ar" ? "نورة المنصوري · ٣٤ عامًا · مقيمة خيالية · السجل الاصطناعي نفسه في كل مشهد" : "Noura Al Mansouri · 34 · fictional resident · the same synthetic record in every scene"}
          </p>
        </header>

        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 overflow-y-auto px-4 py-10 md:px-8 md:py-14">
          <p className="sr-only" aria-live="polite">
            {line(lang, scene.title)}
          </p>
          <SceneBody />
        </main>

        <Director />
      </div>
    </SimContext.Provider>
  );
}

function Director() {
  const { state, dispatch } = useSim();
  const lang = state.lang;
  const t = (text: string) => tr(lang, text);
  const scene = SCENES[state.scene];
  const lastBeat = scene.beats - 1;

  return (
    <aside className="xm-dock" aria-label={lang === "ar" ? "أدوات المقدّم" : "Presenter controls"}>
      <div className="mx-auto max-w-5xl px-4 py-3 md:px-8">
        <div className="xm-progress" role="tablist" aria-label={t("Jump to scene")}>
          {SCENES.map((item, index) => (
            <button key={item.id} type="button" role="tab" aria-current={index === state.scene ? "step" : undefined} aria-selected={index === state.scene} onClick={() => dispatch({ type: "scene", index })}>
              {String(index + 1).padStart(2, "0")}
              <span className="sr-only"> {line(lang, item.title)}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[13.5px] leading-snug text-ink-2">
          <span className="font-mono text-[12px] text-accent">
            {state.scene + 1} / {SCENES.length}
          </span>
          <span className="mx-2 text-rule-strong" aria-hidden>·</span>
          {line(lang, scene.challenge)}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="xm-btn" onClick={() => dispatch({ type: "prev-scene" })} disabled={state.scene === 0}>
            {t("Previous scene")}
          </button>
          <button type="button" className="xm-btn" onClick={() => dispatch({ type: "hide" })} disabled={state.beat === 0}>
            {t("Hide last")}
          </button>
          <button type="button" className="xm-btn" aria-pressed={state.playing} onClick={() => dispatch({ type: state.playing ? "pause" : "play" })}>
            {state.playing ? t("Pause") : t("Play")}
          </button>
          <button type="button" className="xm-btn xm-btn--accent" onClick={() => dispatch({ type: "reveal" })} disabled={state.beat >= lastBeat}>
            {t("Reveal")}
          </button>
          <button type="button" className="xm-btn xm-btn--accent" onClick={() => dispatch({ type: "next-scene" })} disabled={state.scene === SCENES.length - 1}>
            {t("Next scene")}
          </button>
          <button type="button" className="xm-btn xm-btn--quiet" aria-expanded={state.notes} onClick={() => dispatch({ type: "toggle-notes" })}>
            {t("Notes")}
          </button>
          <button type="button" className="xm-btn xm-btn--quiet" onClick={() => dispatch({ type: "restart" })}>
            {t("Restart story")}
          </button>
        </div>
        {state.notes ? (
          <div className="mt-3 max-h-[32vh] overflow-auto border-t border-rule pt-3 text-[14px] leading-relaxed text-ink-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent">{t("Presenter notes")}</p>
            <p className="mt-1">{line(lang, scene.notes)}</p>
            <p className="mt-2 text-[13px] text-ink-3">
              {lang === "ar"
                ? "الأسهم تكشف العنصر التالي أو تخفيه. Shift مع الأسهم ينقل بين المشاهد. Home يعيد القصة. التشغيل لا يقفز إلى المشهد التالي."
                : "Arrow keys reveal or hide the next visual. Shift plus arrows changes scene. Home restarts. Play does not jump to the next scene."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="xm-btn xm-btn--quiet" onClick={() => dispatch({ type: "share-story" })}>
                {t("Share prepared sources")}
              </button>
              <button type="button" className="xm-btn xm-btn--quiet" onClick={() => dispatch({ type: "fill-story" })}>
                {t("Use Noura's answers")}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
