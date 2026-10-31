/**
 * Detect personal medical / distress / out-of-scope questions for Ask Masar.
 * Never used to answer clinically — only to route to a human handoff.
 */

export type HandoffKind = "distress" | "should_i" | "out_of_scope" | "general";

const DISTRESS =
  /\b(suicid|kill myself|end my life|self[- ]?harm|want to die|hurt myself|hopeless|can't go on|cannot go on)\b/i;

const SHOULD_I =
  /\b(should i|shall i|do i need|is it safe to|can i get pregnant|am i (infertile|fertile)|will i (conceive|get pregnant)|ivf|icsi|egg freez|sperm freez|preservation|treatment|diagnos|prescrib|dosage|medicine for)\b/i;

const OUT_OF_SCOPE =
  /\b(fertility score|pregnancy (chance|odds|probability)|how fertile|rank(ing)? me|compare me)\b/i;

export function detectHandoff(text: string): HandoffKind {
  const q = text.trim();
  if (!q) return "general";
  if (DISTRESS.test(q)) return "distress";
  if (OUT_OF_SCOPE.test(q) || SHOULD_I.test(q)) return "should_i";
  // Short personal medical framing still gets a soft handoff, not an answer.
  if (/\b(my|i)\b/i.test(q) && /\b(pregnant|cycle|period|sperm|amh|pcos|thyroid)\b/i.test(q)) {
    return "should_i";
  }
  return "general";
}

export function needsClinicianHandoff(kind: HandoffKind): boolean {
  return kind === "distress" || kind === "should_i" || kind === "out_of_scope";
}
