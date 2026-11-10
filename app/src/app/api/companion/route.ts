import { NextResponse } from "next/server";
import { companionReply, type ChatMessage } from "@/server/ai/companion";
import { getSession } from "@/server/session";
import { personView } from "@/server/views";
import { getLang } from "@/server/lang";

// The resident's assistant. It only ever sees the signed-in person's own view,
// built from what they chose to share.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "person") return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { messages?: unknown } | null;
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const history: ChatMessage[] = messages
    .filter((m): m is ChatMessage => typeof m?.text === "string" && (m.role === "user" || m.role === "assistant"))
    .map((m) => ({ role: m.role, text: m.text.slice(0, 2000) }))
    .slice(-16);
  if (!history.length || history[history.length - 1].role !== "user") return NextResponse.json({ error: "Nothing to answer." }, { status: 400 });

  return NextResponse.json(await companionReply(personView(session.id), history, await getLang()));
}
