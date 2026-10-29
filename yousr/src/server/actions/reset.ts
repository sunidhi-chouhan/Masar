"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { resetPersonas } from "../../../prisma/personas";

/**
 * "Reset demo data": Fatima, Mariam, Omar and Sara go back to their seeded
 * starting point. Staff, data sources and the synthetic cohort are untouched.
 */
export async function resetDemo() {
  await resetPersonas(prisma, new Date());
  revalidatePath("/", "layout");
  return { ok: true as const };
}
