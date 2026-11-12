import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ExperienceApp } from "@/components/experience/experience-app";
import { experienceAggregates } from "@/lib/experience/aggregates";
import { accessAllowed } from "@/server/access";

export const instant = false;
export const metadata: Metadata = {
  title: "Experience Masar · Demo Studio",
  robots: { index: false, follow: false },
};

export default async function ExperiencePage({ searchParams }: { searchParams: Promise<{ key?: string | string[] }> }) {
  await connection();
  const { key } = await searchParams;
  const k = typeof key === "string" ? key : undefined;
  if (!accessAllowed(k)) notFound();
  return <ExperienceApp aggregates={experienceAggregates()} studioHref={k ? `/access?key=${encodeURIComponent(k)}` : "/access"} />;
}
