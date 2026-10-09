// How the Assistant decides which retrieved passages an answer used (ADR 0005: an answer that
// used none is off-topic). The model is told to start its reply with the numbers of the
// passages it used, like "[1][3]", or to reply NONE. A passage counts as used only when the
// answer cites its number. The chat hides the answer until a citation has appeared, so an
// answer that cites nothing never shows any text. Pure.

import { stripMarkdown } from './markdown.ts';
import { NO_ANSWER } from './prompt.ts';

// [1], [1,3], [1, 3], [Passage 2], [source 2]
const CITATION = /\[(?:passage|source|p)?\s*(\d{1,2}(?:\s*[,;&]\s*(?:passage|source|p)?\s*\d{1,2})*)\s*\]/gi;

/** Passage numbers (1-based) cited in text that exist among count passages, in first-cited order. */
export function citedNumbers(text: string, count: number): number[] {
  const out: number[] = [];
  for (const match of text.matchAll(CITATION)) {
    for (const n of match[1].split(/[^\d]+/).filter(Boolean).map(Number)) {
      if (n >= 1 && n <= count && !out.includes(n)) out.push(n);
    }
  }
  return out;
}

/** The passages an answer used, in first-cited order. A NONE reply used nothing. */
export function usedPassages<T>(raw: string, passages: readonly T[]): T[] {
  if (isNoAnswer(raw)) return [];
  return citedNumbers(raw, passages.length).map((n) => passages[n - 1]);
}

/**
 * The model said the passages don't answer the question: NONE at the start, or (as it
 * sometimes does after a citation and an apology) anywhere as a word of its own.
 */
export function isNoAnswer(raw: string): boolean {
  return new RegExp(`(^|[^\\w])${NO_ANSWER}([^\\w]|$)`).test(raw.trim());
}

/** Caps the shown answer: whole sentences up to maxChars, or a cut at a word with an ellipsis. */
export function capLength(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const head = text.slice(0, maxChars);
  const sentenceEnd = Math.max(head.lastIndexOf('. '), head.lastIndexOf('! '), head.lastIndexOf('? '));
  if (sentenceEnd > maxChars * 0.5) return head.slice(0, sentenceEnd + 1);
  return `${head.replace(/\s+\S*$/, '')}…`;
}

/** A finished answer that hit the token cap ends mid-sentence: drop the unfinished sentence. */
export function trimUnfinished(text: string): string {
  const end = Math.max(text.lastIndexOf('.'), text.lastIndexOf('!'), text.lastIndexOf('?'));
  return end > text.length * 0.4 ? text.slice(0, end + 1) : text;
}

export const MAX_ANSWER_CHARS = 600;

/**
 * What the chat shows for raw model output (streaming or final): nothing until a valid
 * citation has appeared, then the text without citation markers and markdown, length-capped.
 */
export function displayText(raw: string, passageCount: number): string {
  if (isNoAnswer(raw) || citedNumbers(raw, passageCount).length === 0) return '';
  const withoutCitations = raw
    .replace(CITATION, '')
    // A half-streamed citation at the very end, like "[1" or "[".
    .replace(/\[[^\]]{0,12}$/, '')
    .replace(/[ \t]+([.,;:!?])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ');
  return capLength(stripMarkdown(withoutCitations), MAX_ANSWER_CHARS);
}
