import "server-only";

// A thin client for Google's Gemini API (REST, no SDK). The key stays on the
// server. Without GEMINI_API_KEY every caller falls back to Masar's own text,
// so the app works the same, just without the conversational layer.

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export function aiEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export type Part = { text: string } | { inlineData: { mimeType: string; data: string } };
export interface Turn {
  role: "user" | "model";
  parts: Part[];
}

/** A JSON schema in the subset Gemini accepts for structured output. */
export type Schema = {
  type: "OBJECT" | "ARRAY" | "STRING" | "NUMBER" | "BOOLEAN";
  description?: string;
  properties?: Record<string, Schema>;
  required?: string[];
  items?: Schema;
  enum?: string[];
  nullable?: boolean;
};

export async function generateJson<T>(opts: { system: string; turns: Turn[]; schema: Schema; temperature?: number }): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("AI_DISABLED");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: opts.turns,
      generationConfig: {
        temperature: opts.temperature ?? 0.4,
        responseMimeType: "application/json",
        responseSchema: opts.schema,
      },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`GEMINI_${res.status}: ${detail.slice(0, 300)}`);
  }
  const body = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  return JSON.parse(text) as T;
}
