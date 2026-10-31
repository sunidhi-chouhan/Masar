/** Reject invented scores, probabilities, banned labels, or bare digits that look like rankings. */
export function rejectsClinicalInvention(text: string): boolean {
  if (
    /fertility score|pregnancy (probability|chance|odds)|\binfertile\b|\bfertile\b|risk score|\boptimal\b|\bdeclining\b|\bdefective\b/i.test(
      text,
    )
  ) {
    return true;
  }
  // Percent / probability patterns that rules did not authorize.
  if (/\b\d{1,3}\s*%|\b\d+\s*(in|out of)\s*\d+\b|\bchance of\b|\blikelihood of\b/i.test(text)) {
    return true;
  }
  // Standalone 0–100 “score” framing.
  if (/\b(score|rating|rank)\b.{0,24}\b\d{1,3}\b|\b\d{1,3}\b.{0,24}\b(score|rating|rank)\b/i.test(text)) {
    return true;
  }
  return false;
}
