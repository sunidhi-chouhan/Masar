"use client";

/** Shown if a Demo Studio action fails (for example, an expired or missing access key). */
export default function StudioError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6" lang="en" dir="ltr">
      <p className="eyebrow">Demo Studio</p>
      <h1 className="display mt-3 text-[2.2rem] leading-tight text-ink">That action didn&apos;t complete.</h1>
      <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">
        Check that the access key is still in the address, then try again. Reload the studio to see the current state of the demo data.
      </p>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
      </div>
    </main>
  );
}
