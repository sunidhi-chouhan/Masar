import { NextResponse } from "next/server";
import { t } from "@/lib/i18n";
import { visibleQuestions, type JAnswers } from "@/lib/journey";
import { protoSummaryInput, protoView, ageBand, type ProtoConsent, type ProtoSim } from "@/lib/prototype";
import { accessAllowed } from "@/server/access";
import { aiMode } from "@/server/ai/gemini";
import { prototypeFollowUps, prototypeSummary } from "@/server/ai/journey-ai";
import { answeredLines } from "@/server/journey";
import { prototypeProfiles } from "@/server/prototype";

// The prototype's Gemini adapter. It never takes free text: the browser sends
// which synthetic profile, the prototype's permissions and the answers as
// question ids and option values; the server rebuilds the authorised record
// with Masar's rules and decides what may be sent. Without the AI permission
// (or with Gemini off) the answer is Masar's own deterministic version; in
// mock mode it is that version, labelled as the mock. Every live output goes
// through the same validation as the real journey.

const BOOL_KEYS: (keyof ProtoConsent)[] = ["answers", "clinical", "labs", "device", "healthAge", "ai", "shareClinician"];

export async function GET() {
  return NextResponse.json({ mode: aiMode() });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  if (!accessAllowed(url.searchParams.get("key") ?? undefined)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const profile = prototypeProfiles().find((p) => p.id === body.profileId);
  if (!profile) return NextResponse.json({ error: "Unknown profile" }, { status: 400 });
  const lang = body.lang === "ar" ? "ar" : "en";
  const c = (body.consent ?? {}) as Record<string, unknown>;
  const consent = Object.fromEntries(BOOL_KEYS.map((k) => [k, c[k] === true])) as unknown as ProtoConsent;
  const s = (body.sim ?? {}) as Record<string, unknown>;
  const sim: ProtoSim = { clinical: s.clinical === "missing" ? "missing" : "available", labs: s.labs === "missing" ? "missing" : "available", extraLab: s.extraLab === true };
  const geminiOn = body.geminiOn === true;
  // Only real options of real, visible questions; nothing else is kept.
  const raw = (consent.answers ? body.answers : {}) as JAnswers;
  const answers: JAnswers = {};
  for (const q of visibleQuestions(profile.resident.sex, raw ?? {})) {
    const v = raw?.[q.id];
    const ok = new Set(q.options.map((o) => o.value));
    if (Array.isArray(v) && q.multi) {
      const kept = v.filter((x) => typeof x === "string" && ok.has(x));
      if (kept.length) answers[q.id] = kept;
    } else if (typeof v === "string" && ok.has(v)) answers[q.id] = v;
  }
  // Answers go to the assistant only with both "Your answers" and the AI permission, and only while Gemini is switched on.
  const allowed = geminiOn && consent.ai && consent.answers;
  const tr = (x: string) => t(lang, x);

  if (body.task === "followups") {
    const out = await prototypeFollowUps({
      allowed,
      sex: profile.resident.sex,
      ageBand: ageBand(profile.resident.age),
      answers,
      answered: answeredLines(profile.resident.sex, answers, (x) => x),
      lang,
    });
    return NextResponse.json(out);
  }
  if (body.task === "summary") {
    const view = protoView(profile.resident, sim, consent, answers, null);
    const finals = Array.isArray(body.finalAnswered) ? (body.finalAnswered as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 2).map((x) => x.slice(0, 200)) : [];
    const out = await prototypeSummary({ allowed: geminiOn && consent.ai, input: protoSummaryInput(view, consent, answers, finals, tr), lang, tr });
    return NextResponse.json(out);
  }
  return NextResponse.json({ error: "Unknown task" }, { status: 400 });
}
