"use client";

/**
 * Progress indicator (ui-design-brain): completed / current / upcoming,
 * numbered + labeled, total count always visible.
 */
export function JourneyStepTracker({
  steps,
  current,
  labels,
}: {
  steps: number;
  current: number; // 0-based
  labels: string[];
}) {
  return (
    <nav aria-label="Question progress" className="mb-6">
      <ol className="flex items-start gap-1 overflow-x-auto pb-1 sm:gap-0">
        {Array.from({ length: steps }, (_, idx) => {
          const state = idx < current ? "done" : idx === current ? "current" : "upcoming";
          const label = labels[idx] ?? String(idx + 1);
          return (
            <li
              key={idx}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1.5 ${
                idx < steps - 1 ? "relative" : ""
              }`}
            >
              {idx < steps - 1 ? (
                <span
                  aria-hidden
                  className={`absolute start-[calc(50%+14px)] top-3.5 h-px w-[calc(100%-28px)] ${
                    idx < current ? "bg-mist-500" : "bg-dawn-200"
                  }`}
                />
              ) : null}
              <span
                className={`relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-pill text-xs font-semibold tabular-nums ${
                  state === "done"
                    ? "bg-mist-700 text-white"
                    : state === "current"
                      ? "border-2 border-mist-500 bg-white text-mist-700"
                      : "border border-dawn-300 bg-dawn-50 text-ink-400"
                }`}
                aria-current={state === "current" ? "step" : undefined}
              >
                {state === "done" ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                    <path
                      d="M2.5 6.2 L4.8 8.5 L9.5 3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  idx + 1
                )}
              </span>
              <span
                className={`hidden max-w-[4.5rem] truncate text-center text-[11px] leading-tight sm:block ${
                  state === "current"
                    ? "font-medium text-ink-900"
                    : state === "done"
                      ? "text-mist-700"
                      : "text-ink-400"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs text-ink-400 sm:hidden">
        {current + 1} / {steps} · {labels[current]}
      </p>
    </nav>
  );
}
