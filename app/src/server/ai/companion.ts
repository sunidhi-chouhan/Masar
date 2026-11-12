import "server-only";
import { CONDITION_LABEL, INTENTION_LABEL } from "@/lib/model";
import { OPTION_LABEL, RULES } from "@/lib/signals";
import { reportsForAssistant, type PersonView } from "@/server/views";
import { aiAllowedFor, aiMode, consentAllows, generateJson, type Turn } from "./gemini";
import { person } from "@/server/store";
import { dashboardFor } from "@/server/dashboard";
import { MEASURE_INFO } from "@/lib/measure-info";
import type { SignalCode } from "@/lib/signals";
import type { ReadingCode } from "@/lib/model";
import { checkOutput, needsUrgentCare } from "./guard";
import { t, type Lang } from "@/lib/i18n";

// The assistant explains what Masar's rules already found. It never decides
// anything itself: no new findings, no numbers that are not in the record, no
// diagnosis. Questions that need a clinician are turned into questions to ask.

export interface Brief {
  opening: string;
  points: string[];
  questions: string[];
}

export interface CompanionReply {
  reply: string;
  suggestions: string[];
  brief: Brief | null;
  /** "ai" when Gemini wrote it, "mock" for the labelled demo stand-in, "masar" when it is Masar's own text */
  from: "ai" | "mock" | "masar";
}

/** What a question is about, when it came from a button on the page. */
export type AskIntent =
  | { kind: "insight"; code: string }
  | { kind: "measure"; code: string }
  | { kind: "unknown" }
  | { kind: "questions" }
  | { kind: "known" };

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export const STARTERS = [
  "Explain my results simply",
  "Help me start the conversation with my doctor",
  "Ask me a few questions",
  "What can't Masar tell me?",
] as const;

/** Everything the assistant may know, written out in words. */
export function contextFor(v: PersonView): string {
  const r = v.resident;
  const lines: string[] = [];
  lines.push(`Name: ${r.name.split(" ")[0]}. Age ${r.age}. ${r.sex === "female" ? "Woman" : "Man"}.`);
  if (v.record.intention) lines.push(`Plans for children: ${INTENTION_LABEL[v.record.intention]}.`);
  if (v.record.conditions.length) lines.push(`Conditions on record: ${v.record.conditions.map((c) => CONDITION_LABEL[c]).join(", ")}.`);
  lines.push("", "What Masar found (decided by Masar's published rules, not by you):");
  if (!v.state.scanning) lines.push("- The person asked Masar not to look for anything.");
  else if (!v.signals.length) lines.push("- Nothing worth a conversation right now. This is NOT an all-clear; it only covers what was shared.");
  for (const s of v.signals) {
    const rule = RULES[s.code];
    lines.push(`- ${rule.title}. Because: ${s.reasons.join("; ")}.`);
    lines.push(`  Why it matters: ${rule.whyItMatters}`);
    lines.push(`  What it cannot tell: ${rule.cannotTell}`);
    lines.push(`  Based on: ${rule.evidence.citation}.`);
    lines.push(`  Questions Masar suggests: ${rule.questions.join(" | ")}`);
  }
  if (v.options.length) lines.push("", `Options Masar offers: ${v.options.map((o) => OPTION_LABEL[o].title).join("; ")}.`);
  if (v.measures.length) {
    lines.push("", "Results over time:");
    for (const m of v.measures) {
      const verdict = { meaningful: "a real change", normal: "normal ups and downs", single: "not enough results to compare", too_close: "too close together to compare" }[m.verdict];
      lines.push(`- ${m.def.label}: ${m.sentence} Masar calls this ${verdict}.`);
    }
  }
  if (v.factors.length) {
    lines.push("", "Things on record:");
    for (const f of v.factors) lines.push(`- ${f.label}: ${f.value} (${f.canChange ? "can change" : "can't change"}). ${f.note}`);
  }
  if (v.missing.length) lines.push("", `Not on record yet: ${v.missing.join("; ")}.`);
  if (v.state.request) lines.push("", `The person has asked their doctor for a conversation (status: ${v.state.request.status}).`);
  // Reports only while "Lab results" is on.
  for (const rep of reportsForAssistant(v.state)) {
    if (rep.status === "requested") lines.push(`Their doctor asked them to upload: ${rep.test}.`);
    if (rep.values?.length) lines.push(`Uploaded ${rep.test}: ${rep.values.map((x) => `${x.name} ${x.value} ${x.unit}`).join(", ")}${rep.status === "confirmed" ? "" : " (not yet confirmed by the person)"}.`);
  }
  return lines.join("\n");
}

const SYSTEM = (context: string) => `You are the assistant inside Masar, a reproductive-health service in Abu Dhabi. You talk with one resident about their own record.

How you speak:
- Warm, calm and plain. Short sentences. No medical jargon; if you must name a test, say what it is in everyday words.
- Two to five short sentences per reply unless they ask for more. No markdown headings, no bullet lists in "reply".
- Use their first name now and then, not every time.

What you must never do:
- Never diagnose, never say whether they can or cannot have children, never give a percentage chance.
- Never add a finding, a number or a risk that is not in the record below. If something is not there, say Masar doesn't have it.
- Never say they are fine or all clear. No finding only means nothing in what they shared was worth raising.
- Never recommend a medicine, dose or treatment. Questions like that become a question for their doctor.
- If they describe severe pain, heavy bleeding, a possible pregnancy problem or thoughts of self-harm, tell them kindly to contact a doctor or call 999 now.

What you do:
- Explain what Masar found and why, using the record below.
- When they want to talk to their doctor, write a "brief": one opening sentence they can say, the key points from their record, and three questions. Otherwise brief is null.
- When they ask you to ask them questions, ask ONE simple question at a time about their plans, cycles, lifestyle or worries, and say why you are asking. Tell them they can change their answers on the "About me" page.
- Offer two or three short follow-up suggestions (under 8 words each) they might tap next, written as things they would say.

The record (only what this person chose to share):
${context}`;

const SCHEMA = {
  type: "OBJECT" as const,
  properties: {
    reply: { type: "STRING" as const },
    suggestions: { type: "ARRAY" as const, items: { type: "STRING" as const } },
    brief: {
      type: "OBJECT" as const,
      nullable: true,
      properties: {
        opening: { type: "STRING" as const },
        points: { type: "ARRAY" as const, items: { type: "STRING" as const } },
        questions: { type: "ARRAY" as const, items: { type: "STRING" as const } },
      },
      required: ["opening", "points", "questions"],
    },
  },
  required: ["reply", "suggestions"],
};

export async function companionReply(v: PersonView, history: ChatMessage[], lang: Lang = "en", intent?: AskIntent): Promise<CompanionReply> {
  const last = history[history.length - 1]?.text ?? "";
  // Severe symptoms or distress get fixed words pointing to a person, never a model's reply.
  if (needsUrgentCare(last)) return urgent(lang);
  // Demo mock (no key): with the person's consent, Masar's own answer, labelled as the mock and logged like a real call.
  if (aiMode() === "mock" && consentAllows(person(v.resident.id), "assistant")) {
    try {
      const own = fallback(v, last, lang, intent);
      const out = await generateJson<Omit<CompanionReply, "from">>({
        personId: v.resident.id,
        purpose: "assistant",
        activity: "Read your summary to answer your question",
        system: "",
        turns: [],
        schema: SCHEMA,
        mock: () => ({ reply: own.reply, suggestions: own.suggestions, brief: own.brief }),
      });
      return { ...out, brief: out.brief ?? null, from: "mock" };
    } catch (e) {
      console.error("[companion mock]", e instanceof Error ? e.message : e);
    }
  }
  // Only with this person's assistant consent, checked again inside generateJson.
  if (aiAllowedFor(v.resident.id, "assistant")) {
    try {
      const turns: Turn[] = history.slice(-12).map((m) => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text }] }));
      const context = contextFor(v);
      const out = await generateJson<Omit<CompanionReply, "from">>({
        personId: v.resident.id,
        purpose: "assistant",
        activity: "Read your summary to answer your question",
        system:
          SYSTEM(context) +
          (lang === "ar" ? "\n\nReply in clear, simple Modern Standard Arabic, gender-neutral where you can. Write the brief and suggestions in Arabic too." : ""),
        turns,
        schema: SCHEMA,
      });
      const reply: CompanionReply = {
        reply: out.reply.trim().slice(0, 1500),
        suggestions: (out.suggestions ?? []).map((x) => x.trim()).filter(Boolean).slice(0, 3).map((x) => x.slice(0, 80)),
        brief: out.brief
          ? { opening: out.brief.opening.slice(0, 400), points: out.brief.points.slice(0, 6), questions: out.brief.questions.slice(0, 5) }
          : null,
        from: "ai",
      };
      // Every word must pass the content rules, and every number must come from the record.
      const texts = [reply.reply, ...reply.suggestions, ...(reply.brief ? [reply.brief.opening, ...reply.brief.points, ...reply.brief.questions] : [])];
      const problem = !reply.reply ? "empty reply" : checkOutput(texts, [context]);
      if (!problem) return reply;
      console.warn("[companion] reply withheld:", problem);
    } catch (e) {
      console.error("[companion]", e instanceof Error ? e.message : e);
    }
  }
  return fallback(v, last, lang, intent);
}

/** Fixed words for severe symptoms or distress. */
function urgent(lang: Lang): CompanionReply {
  return {
    from: "masar",
    brief: null,
    reply: t(
      lang,
      "This needs a person, not an assistant. If you have severe pain, very heavy bleeding, a possible problem with a pregnancy, or thoughts of harming yourself, please call 999 or go to the nearest emergency department now. You can also contact your doctor.",
    ),
    suggestions: [],
  };
}

/** Turns "You are 34" into "I am 34", for a note the person reads out. */
const firstPerson = (s: string) =>
  s
    .replace(/\bYou told us\b/g, "I said")
    .replace(/\b[Yy]ou are\b/g, "I am")
    .replace(/\bYour\b/g, "My")
    .replace(/\byour\b/g, "my")
    .replace(/\bYou\b/g, "I")
    .replace(/\byou\b/g, "me");

/** Masar's own words, used when Gemini is not set up or does not answer. */
function fallback(v: PersonView, said: string, lang: Lang, intent?: AskIntent): CompanionReply {
  const tr = (text: string, vars?: Record<string, string | number>) => t(lang, text, vars);
  const say = (l: { text: string; vars?: Record<string, string | number> }) =>
    tr(l.text, l.vars && Object.fromEntries(Object.entries(l.vars).map(([k, x]) => [k, typeof x === "string" ? tr(x) : x])));
  const first = v.resident.name.split(" ")[0];
  const text = said.toLowerCase();
  const has = (...words: string[]) => words.some((w) => text.includes(w));
  const questions = [...new Set(v.signals.flatMap((s) => RULES[s.code].questions))].slice(0, 3);
  const base = { from: "masar" as const, brief: null };
  const d = dashboardFor(v);
  const sep = lang === "ar" ? "، " : "; ";

  // Typed questions are matched to the same topics as the buttons.
  const measureNamed = d.series.find((s) => has(tr(s.label).toLowerCase(), s.label.toLowerCase(), ...(s.label.match(/\(([^)]+)\)/)?.[1] ? [s.label.match(/\(([^)]+)\)/)![1].toLowerCase()] : [])));
  const insightNamed = d.insights.find((i) => has(tr(i.title).toLowerCase(), i.title.toLowerCase()));
  const kind: AskIntent | undefined =
    intent ??
    (insightNamed ? { kind: "insight", code: insightNamed.code } : undefined) ??
    (measureNamed ? { kind: "measure", code: measureNamed.code } : undefined) ??
    (has("unknown", "missing", "don't know", "doesn't know", "مجهول", "ناقص", "لا يعرف", "لا نعرف")
      ? { kind: "unknown" }
      : has("what do you know", "information do you have", "have about me", "ماذا تعرف", "معلومات")
        ? { kind: "known" }
        : undefined);

  if (kind?.kind === "insight") {
    const i = d.insights.find((x) => x.code === (kind.code as SignalCode));
    if (i) {
      return {
        ...base,
        reply: [
          tr("{title}.", { title: tr(i.title) }),
          tr("Why Masar raised it: {reasons}.", { reasons: i.because.map((b) => say(b.text)).join(sep) }),
          tr("Why it matters: {why}", { why: tr(i.why) }),
          tr("This comes from {citation} ({strength} evidence), about people in general, not a prediction about you.", { citation: tr(i.evidence.citation), strength: tr(i.evidence.strength) }),
          tr("What it can't tell you: {cannot}", { cannot: tr(i.cannot) }),
        ].join("\n\n"),
        suggestions: [tr(i.questions[0]), tr("What's still unknown about me?"), tr("What should I ask my doctor?")],
      };
    }
  }
  if (kind?.kind === "measure") {
    const s = d.series.find((x) => x.code === (kind.code as ReadingCode));
    if (s) {
      const info = MEASURE_INFO[s.code];
      const last = s.points.at(-1);
      return {
        ...base,
        reply: [
          tr("{label}: {what}", { label: tr(s.label), what: tr(info.what) }),
          last ? tr("Your latest result on record is {value} {unit}.", { value: Number.isInteger(last.value) ? last.value : last.value.toFixed(1), unit: tr(s.unit) }) : "",
          say(s.sentence),
          tr("Its limits: {limits}", { limits: tr(info.limits) }),
        ]
          .filter(Boolean)
          .join("\n\n"),
        suggestions: [tr("What's still unknown about me?"), tr("What should I ask my doctor?")],
      };
    }
  }
  if (kind?.kind === "unknown") {
    const gaps = d.unknown.map((f) => say(f.text));
    const limits = [...new Set(d.insights.map((i) => tr(i.cannot)))];
    return {
      ...base,
      reply: [
        gaps.length ? tr("Still unknown: {list}", { list: gaps.join(" ") }) : tr("Nothing Masar looks at is missing from your record."),
        limits.length ? tr("And what your findings can't tell: {list}", { list: limits.join(" ") }) : "",
        tr("Masar can only see what you chose to share, and it never says whether you will or won't have children."),
      ]
        .filter(Boolean)
        .join("\n\n"),
      suggestions: [tr("What should I ask my doctor?"), tr("What information do you have about me?")],
    };
  }
  if (kind?.kind === "known") {
    return {
      ...base,
      reply: d.known.length
        ? tr("From what you shared, Masar has: {list}", { list: d.known.map((f) => `${say(f.text)} (${tr(f.source)})`).join(" ") })
        : tr("You haven't shared anything Masar can use yet. You can change that in My data."),
      suggestions: [tr("What's still unknown about me?"), tr("What should I ask my doctor?")],
    };
  }

  if (kind?.kind === "questions" || has("doctor", "conversation", "prepare", "طبيب", "محادثة", "الحديث")) {
    return {
      ...base,
      reply: tr("Here is a short note you can bring, {name}. Read the opening line out, then go through the questions.", { name: first }),
      brief: {
        opening: v.signals.length
          ? tr(
              v.signals.length === 1
                ? "Masar suggested I talk to you about something in my record, and I'd like to understand what it means for my plans."
                : "Masar suggested I talk to you about {n} things in my record, and I'd like to understand what they mean for my plans.",
              { n: v.signals.length },
            )
          : tr("I'd like to talk about my plans for children and what I should know now."),
        points: v.signals
          .flatMap((s) => s.reasons)
          .slice(0, 4)
          .map((r) => (lang === "ar" ? tr(r) : firstPerson(r))),
        questions: (questions.length
          ? questions
          : ["Is there anything I should check now, given my plans?", "What can I do to look after my fertility?", "When should I come back?"]
        ).map((q) => tr(q)),
      },
      suggestions: [tr("What can't Masar tell me?"), tr("Explain my results simply")],
    };
  }
  if (has("can't", "cannot", "limit", "لا يستطيع", "لا يمكن")) {
    const limits = [...new Set(v.signals.map((s) => tr(RULES[s.code].cannotTell)))];
    return {
      ...base,
      reply: limits.length
        ? `${limits.join(" ")} ${tr("Masar can only see what you chose to share, and it never says whether you will or won't have children.")}`
        : tr("Masar can only see what you chose to share. Nothing standing out does not mean everything is fine, and Masar never says whether you will or won't have children."),
      suggestions: [tr("Help me start the conversation with my doctor"), tr("Explain my results simply")],
    };
  }
  if (has("question", "ask me", "أسئلة", "اسألني")) {
    return {
      ...base,
      reply: tr('To keep your picture up to date, Masar asks about your plans, cycles, sleep, stress and activity. You can answer or change them any time on the "About me" page, {name}.', { name: first }),
      suggestions: [tr("Explain my results simply"), tr("Help me start the conversation with my doctor")],
    };
  }
  const reply = v.signals.length
    ? tr(
        v.signals.length === 1
          ? "{name}, Masar found one thing worth talking about: {list}. None of this is a diagnosis. It means a conversation with a doctor now could keep more options open."
          : "{name}, Masar found {n} things worth talking about: {list}. None of this is a diagnosis. It means a conversation with a doctor now could keep more options open.",
        {
          name: first,
          n: v.signals.length,
          list: v.signals.map((s) => `${tr(RULES[s.code].title)} (${s.reasons.map((r) => tr(r)).join(lang === "ar" ? "، " : ", ")})`).join(lang === "ar" ? "؛ " : "; "),
        },
      )
    : tr("{name}, nothing in what you shared stands out right now. That is not an all-clear: it only covers what Masar can see.", { name: first });
  return { ...base, reply, suggestions: [tr("Help me start the conversation with my doctor"), tr("What can't Masar tell me?")] };
}
