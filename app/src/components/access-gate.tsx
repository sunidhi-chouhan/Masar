import Link from "next/link";
import { Brand } from "@/components/ui";

/**
 * Shown instead of a bare 404 when demo access (/access, /prototype) is
 * opened without the right key. It does not open anything by itself: the key
 * goes back in the address and is checked by accessAllowed() as before.
 */
export function AccessGate({ action, wrongKey, enabled }: { action: string; wrongKey: boolean; enabled: boolean }) {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12" lang="en" dir="ltr">
      <Brand />
      <p className="eyebrow mt-10">Demo access</p>
      <h1 className="display mt-3 text-[2.2rem] leading-tight text-ink">Enter the demo access key</h1>
      {enabled ? (
        <>
          <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">
            Masar&apos;s demo uses synthetic people only. It&apos;s kept behind a key so it isn&apos;t opened by accident. Ask the team presenting Masar for the key.
          </p>
          <form method="get" action={action} className="mt-6">
            <label htmlFor="access-key" className="block text-[14px] font-semibold text-ink">
              Access key
            </label>
            <input
              id="access-key"
              name="key"
              type="password"
              required
              autoComplete="off"
              autoFocus
              aria-invalid={wrongKey || undefined}
              aria-describedby={wrongKey ? "access-key-error" : undefined}
              className="mt-2 block min-h-[48px] w-full rounded-[12px] border border-rule-strong bg-surface px-3.5 text-[15px] text-ink outline-none focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent-soft"
            />
            {wrongKey ? (
              <p id="access-key-error" role="alert" className="mt-2 text-[14px] font-medium text-urgent">
                That key didn&apos;t work. Check it and try again.
              </p>
            ) : null}
            <button type="submit" className="btn btn-primary mt-5 w-full">
              Open demo
            </button>
          </form>
        </>
      ) : (
        <p role="status" className="mt-3 text-[15.5px] leading-relaxed text-ink-2">
          Demo access isn&apos;t switched on for this server. Whoever runs it can switch it on by setting <code className="font-mono text-[14px]">ACCESS_KEY</code>.
        </p>
      )}
      <p className="mt-10">
        <Link href="/" className="link text-[14px]">
          Back to Masar
        </Link>
      </p>
    </main>
  );
}
