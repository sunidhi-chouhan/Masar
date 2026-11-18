import { NextResponse } from "next/server";
import { CONDITION_LABEL, INTENTION_LABEL } from "@/lib/model";
import { RULES } from "@/lib/signals";
import { sayIn, t } from "@/lib/i18n";
import { ageBand } from "@/lib/prototype";
import { intentOf, SCOPE_LABEL, type Intent } from "@/lib/longitudinal";
import { getSession } from "@/server/session";
import { getLang } from "@/server/lang";
import { aiMode, consentAllows } from "@/server/ai/gemini";
import { logAccess } from "@/server/store";
import { liveView } from "@/server/experience";
import { prototypeAsk, prototypeGuide } from "@/server/ai/trajectory-ai";

// The trajectory assistant and the consultation guide for a signed-in demo
// account. The session decides whose record is used; the body carries only the
// question. Everything Gemini may see is rebuilt here from the stored record:
// stored permissions, stored longitudinal state, this account only. The AI is
// used only with the stored assistant consent, and every request that reaches
// it is written to the person's access history.

const INTENTS = new Set<Intent>(["changes", "relevant", "missing", "why", "evidence", "cannot", "specialist", "prepare", "lab", "track"]);

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "person") return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const lang = await getLang();
  const tr = (x: string) => t(lang, x);
  const say = (l: { text: string; vars?: Record<string, string | number> }) => sayIn(lang, l);
  const { p, resident, consent, jv, view } = liveView(session.id);
  const goal = view.record.intention ? tr(INTENTION_LABEL[view.record.intention]) : null;
  const insightTitles = view.dashboard.insights.map((i) => tr(RULES[i.code].title));
  const allowed = aiMode() !== "off" && consentAllows(p, "assistant");
  const used = jv.lanes.filter((l) => l.allowed && l.count).flatMap((l) => l.scope.filter((x) => !jv.withheld.includes(x))).map((x) => SCOPE_LABEL[x]);
  const withheld = jv.withheld.map((x) => SCOPE_LABEL[x]);
  const log = (what: string) => allowed && logAccess({ personId: session.id, who: "Masar's assistant (Google Gemini)", what: aiMode() === "mock" ? `${what} (demo mock, no live model call)` : what, allowed: true });

  if (body.task === "ask") {
    const question = typeof body.question === "string" ? body.question.trim().slice(0, 300) : "";
    if (!question) return NextResponse.json({ error: "Bad request" }, { status: 400 });
    const intent = typeof body.intent === "string" && INTENTS.has(body.intent as Intent) ? (body.intent as Intent) : intentOf(question);
    const out = await prototypeAsk({ allowed, question, intent, resident, view: jv, goal, insightTitles, ageBand: ageBand(resident.age), lang, say });
    if (out.source === "ai" || out.source === "mock") log("Answered a question about your trajectory, from what you allowed");
    return NextResponse.json({ ...out, used: allowed ? used : [], withheld });
  }
  if (body.task === "guide") {
    const out = await prototypeGuide({
      allowed,
      resident,
      view: jv,
      goal,
      insightTitles,
      ruleQuestions: [...new Set(view.dashboard.insights.flatMap((i) => RULES[i.code].questions))].slice(0, 3).map(tr),
      conditions: consent.clinical ? resident.conditions.map((c) => tr(CONDITION_LABEL[c])) : [],
      ageBand: ageBand(resident.age),
      lang,
      say,
    });
    if (out.source !== "masar") log("Prepared your consultation guide, from what you allowed");
    return NextResponse.json(out);
  }
  return NextResponse.json({ error: "Unknown task" }, { status: 400 });
}
