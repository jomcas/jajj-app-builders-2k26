// What the Emergency Guide card shows from a Guide. Pure, tested under plain Node.
//
// ADR 0003: the card quotes the Guide's own reviewed summary, verbatim, and nothing else. No
// model output ever appears in it, so it cannot carry first-aid steps that are not in the Guide.

/** About two lines of body text on the card on a Flip 6 (Barlow 16, ~45 characters a line). */
export const TWO_LINES = 90;

/**
 * At most two lines of a Guide summary, taken verbatim. Whole sentences are kept while they
 * fit; when even the first sentence is too long, it is cut at the last whole word and ends in
 * an ellipsis. The card also caps the text at two rendered lines, so a narrow screen never
 * shows more.
 */
export function cardSummary(summary: string, maxChars: number = TWO_LINES): string {
  const text = summary.trim().replace(/\s+/g, ' ');
  if (text.length <= maxChars) return text;
  const sentences = text.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) ?? [text];
  let kept = '';
  for (const sentence of sentences) {
    const next = kept ? `${kept} ${sentence.trim()}` : sentence.trim();
    if (next.length > maxChars) break;
    kept = next;
  }
  if (kept) return kept;
  const cut = text.slice(0, maxChars - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:]+$/, '')}…`;
}

/** What the card offers besides the Guide, read from the Guide's own "call for help" text. */
export function helpOptions(callForHelpEnglish: string): { call911: boolean; flare: boolean } {
  return {
    call911: /\b911\b/.test(callForHelpEnglish),
    flare: /\bFlare\b/.test(callForHelpEnglish),
  };
}
