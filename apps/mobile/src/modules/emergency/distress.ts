// Is a message bare distress ("help", "tulong po", "SOS!", "may emergency")? Pure, tested
// under plain Node. Only used when no Guide fires: a topic always wins ("help, nakagat ng
// ahas" opens Snakebite).
import { DISTRESS_FILLERS, DISTRESS_PHRASES, DISTRESS_WORDS } from './lexicon.ts';
import { BOUNDARY, tokenize } from './normalize.ts';

const phrases = DISTRESS_PHRASES.map((phrase) => tokenize(phrase)).sort((a, b) => b.length - a.length);

/** The distress words found, or null when the message is not bare distress. */
export function bareDistress(tokens: readonly string[]): string[] | null {
  const words = tokens.filter((word) => word !== BOUNDARY);
  if (!words.length) return null;
  // Remove the allowed phrases, longest first.
  const kept: string[] = [];
  for (let i = 0; i < words.length; ) {
    const phrase = phrases.find((p) => p.every((word, k) => words[i + k] === word));
    if (phrase) {
      i += phrase.length;
      continue;
    }
    kept.push(words[i]);
    i += 1;
  }
  const found = kept.filter((word) => DISTRESS_WORDS.has(word));
  if (!found.length) return null;
  return kept.every((word) => DISTRESS_WORDS.has(word) || DISTRESS_FILLERS.has(word)) ? found : null;
}

export function isBareDistress(question: string): boolean {
  return bareDistress(tokenize(question)) !== null;
}
