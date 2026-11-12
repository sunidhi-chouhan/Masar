"use client";

export default function ExperienceError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-dvh bg-paper px-6 py-16">
      <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-3">Experience Masar</p>
      <h1 className="mt-3 font-serif text-3xl text-ink">This demonstration could not be shown.</h1>
      <p className="mt-3 max-w-md text-[16px] text-ink-2">The synthetic story failed to load. Demo accounts and clinical rules were not changed.</p>
      <button type="button" className="mt-6 rounded-full bg-accent px-4 py-2 text-[14px] font-semibold text-white" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
