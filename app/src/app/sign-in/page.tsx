import Image from "next/image";
import Link from "next/link";
import { PHOTOS } from "@/lib/media";
import { Brand } from "@/components/ui";

// Reads the error message from the URL, so it renders per request.
export const instant = false;

// Identity providers Masar plugs into once the pilot is connected.
const METHODS = [
  { title: "UAE PASS", who: "For residents", icon: "M12 11v4m-4-6a4 4 0 118 0v6a4 4 0 01-8 0m-3-3V9a7 7 0 0114 0v3" },
  { title: "Facility sign-on", who: "For doctors and clinic staff", icon: "M6 3v6a6 6 0 0012 0V3M12 15v3a3 3 0 006 0v-1m0 0a2 2 0 100-4 2 2 0 000 4z" },
  { title: "Department of Health account", who: "For health-system teams", icon: "M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6" },
];

export default async function SignIn({ searchParams }: PageProps<"/sign-in">) {
  const { error } = await searchParams;

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-6 md:px-12">
        <Brand />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-16">
          <h1 className="text-[2rem] font-semibold tracking-[-0.03em]">Sign in to Masar</h1>
          <p className="mt-2 text-[15px] text-zinc-600">Residents sign in with UAE PASS. Clinicians and health-system staff use their organisation account.</p>

          {error === "link" ? (
            <p className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-[14px] text-rose-700">That sign-in link is invalid or has expired. Ask your team for a new one.</p>
          ) : null}

          <ul className="mt-8 space-y-3">
            {METHODS.map((m) => (
              <li key={m.title}>
                <div aria-disabled="true" className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
                  <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d={m.icon} />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-zinc-950">{m.title}</span>
                    <span className="block text-[13px] text-zinc-500">{m.who}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-[11.5px] font-medium text-zinc-600">At pilot launch</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3.5 text-[13.5px] leading-relaxed text-indigo-950">
            <span className="font-semibold">Have a personal sign-in link?</span> Open it directly. It signs you in to your own account and expires
            after 30 days.
          </div>
          <p className="mt-10 text-[13px] text-zinc-400">
            <Link href="/" className="hover:text-zinc-700">
              ← Back to masar
            </Link>
          </p>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-indigo-950 lg:block">
        <Image src={PHOTOS.signIn.src} alt={PHOTOS.signIn.alt} fill priority sizes="50vw" className="ken-burns object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-indigo-950/95 via-indigo-900/55 to-violet-800/20" />
        <div className="relative flex h-full flex-col justify-end p-14 text-white">
          <p className="max-w-md text-[1.9rem] font-semibold leading-tight tracking-[-0.03em]">
            Your records, read with your future in mind. Only what you choose to share.
          </p>
          <p className="mt-4 max-w-md text-[15px] text-indigo-100">Never a fertility score. Never visible to employers or insurers.</p>
        </div>
      </div>
    </div>
  );
}
