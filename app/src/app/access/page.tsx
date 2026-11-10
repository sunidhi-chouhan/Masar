import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CopyButton } from "@/components/copy-button";
import { Brand } from "@/components/ui";
import { ACCOUNTS, createLoginToken } from "@/lib/accounts";
import { loadDemoStory, resetData, startFresh } from "@/server/actions";
import { accessAllowed } from "@/server/access";

// Team-only page: never linked from the product, hidden from search engines.
export const instant = false;
export const metadata: Metadata = { title: "Access · Masar", robots: { index: false, follow: false } };

const ROLE_LABEL = { person: "Resident", clinician: "Clinician", system: "Health system" } as const;

export default async function Access({ searchParams }: PageProps<"/access">) {
  await connection();
  const { key, reset, demo } = await searchParams;
  const k = typeof key === "string" ? key : undefined;
  if (!accessAllowed(k)) notFound();

  const h = await headers();
  const base = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  return (
    <div className="min-h-dvh bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-4 md:px-8">
          <Brand />
          <span className="ms-auto rounded-full bg-zinc-100 px-3 py-1 text-[12px] font-medium text-zinc-600">Team access</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        <h1 className="text-[2rem] font-semibold tracking-[-0.03em]">Login links</h1>
        <p className="mt-2 text-[15px] text-zinc-600">
          Each link signs in one account and expires in 30 days. A resident&apos;s link continues where they left off; use Start fresh to
          begin again as a first-time user. Share them only with your team. The same links come from{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[13px]">npm run login-links</code>.
        </p>
        {reset ? <p className="mt-4 rounded-xl bg-indigo-50 px-4 py-3 text-[14px] text-indigo-700">All accounts were reset to their starting state.</p> : null}
        {demo ? (
          <p className="mt-4 rounded-xl bg-indigo-50 px-4 py-3 text-[14px] text-indigo-700">
            Demo story loaded. Sign in as Dr Layla to see Noura&apos;s request, or as Maryam to start from the beginning.
          </p>
        ) : null}

        <ul className="mt-8 space-y-3">
          {ACCOUNTS.map((a) => {
            const url = `${base}/auth/${encodeURIComponent(createLoginToken(a))}`;
            return (
              <li key={a.role + a.id} className="card flex flex-wrap items-center gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-indigo-600">{ROLE_LABEL[a.role]}</p>
                  <p className="text-[16px] font-semibold">{a.name}</p>
                  <p className="text-[13.5px] text-zinc-500">{a.description}</p>
                </div>
                {a.role === "person" ? (
                  <form action={startFresh.bind(null, k ?? "", a.id)}>
                    <button
                      title="Clears this resident's choices and signs in as a first-time user"
                      className="rounded-full border border-indigo-200 px-3.5 py-1.5 text-[13px] font-medium text-indigo-700 hover:bg-indigo-50"
                    >
                      Start fresh
                    </button>
                  </form>
                ) : null}
                <CopyButton text={url} />
                <a href={url} className="rounded-full bg-zinc-950 px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-zinc-800">
                  Sign in
                </a>
              </li>
            );
          })}
        </ul>

        <form action={loadDemoStory.bind(null, k ?? "")} className="mt-10 flex flex-wrap items-center gap-4 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold">Load the demo story</p>
            <p className="text-[13.5px] text-zinc-600">
              Noura has shared and asked to talk, so Dr Layla has a live request. Arjun has shared but not asked yet. Maryam starts fresh.
            </p>
          </div>
          <button className="rounded-full bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-indigo-700">Load story</button>
        </form>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-[15px] font-semibold">Sample test reports</p>
          <p className="mt-1 text-[13.5px] text-zinc-600">
            Made-up lab reports for trying the upload. As Dr Layla, ask a patient for a test result; then, as that patient, upload one of these.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ["noura-amh-follow-up.pdf", "Noura: AMH follow-up"],
              ["arjun-semen-analysis.pdf", "Arjun: sperm test"],
              ["thyroid-and-sugar.pdf", "Maryam: thyroid and sugar"],
            ].map(([file, label]) => (
              <a key={file} href={`/samples/${file}`} download className="rounded-full border border-zinc-300 px-3.5 py-1.5 text-[13px] font-medium text-zinc-800 hover:border-indigo-400 hover:text-indigo-700">
                {label}
              </a>
            ))}
          </div>
        </div>

        <form action={resetData.bind(null, k ?? "")} className="mt-10 flex flex-wrap items-center gap-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-5">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold">Reset all data</p>
            <p className="text-[13.5px] text-zinc-500">Clears every consent, request and review so each account starts fresh. Signs you out.</p>
          </div>
          <button className="rounded-full border border-rose-500/40 px-4 py-2 text-[13px] font-semibold text-rose-700 hover:bg-rose-50">Reset</button>
        </form>
      </main>
    </div>
  );
}
