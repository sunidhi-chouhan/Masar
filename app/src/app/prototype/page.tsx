import type { Metadata } from "next";
import { connection } from "next/server";
import { PrototypeApp } from "@/components/prototype/app";
import { accessAllowed, accessEnabled } from "@/server/access";
import { AccessGate } from "@/components/access-gate";
import { aiMode } from "@/server/ai/gemini";
import { prototypeInbox, prototypeProfiles, prototypeReport } from "@/server/prototype";
import "@/components/prototype/prototype.css";

// The Masar prototype: one connected, explorable demonstration of the whole
// ecosystem (patient, clinician, health system) with Demo Controls. Synthetic
// people only; UAE PASS and clinical systems are simulated and labelled as
// such; Gemini goes through an adapter with a labelled mock and fallbacks.
// Same access gate as Demo Studio: open in development, ?key= in production
// (asks for the key rather than 404ing).

export const instant = false;
export const metadata: Metadata = { title: "Masar prototype", robots: { index: false, follow: false } };

export default async function PrototypePage({ searchParams }: { searchParams: Promise<{ key?: string | string[] }> }) {
  await connection();
  const { key } = await searchParams;
  const k = typeof key === "string" ? key : undefined;
  if (!accessAllowed(k)) return <AccessGate action="/prototype" wrongKey={k !== undefined} enabled={accessEnabled()} />;
  return <PrototypeApp profiles={prototypeProfiles()} inbox={prototypeInbox()} report={prototypeReport()} aiMode={aiMode()} accessKey={k ?? null} />;
}
