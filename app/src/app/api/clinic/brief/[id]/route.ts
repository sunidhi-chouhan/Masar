import { NextResponse } from "next/server";
import { visitBrief } from "@/server/ai/visit-brief";
import { getSession } from "@/server/session";
import { clinicianView } from "@/server/views";

// Pre-visit brief for the doctor, only for patients who share with them.
export async function POST(_req: Request, ctx: RouteContext<"/api/clinic/brief/[id]">) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session || session.role !== "clinician") return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const v = clinicianView(id, session);
  if (!v) return NextResponse.json({ error: "This patient is not sharing with you." }, { status: 403 });
  return NextResponse.json(await visitBrief(v));
}
