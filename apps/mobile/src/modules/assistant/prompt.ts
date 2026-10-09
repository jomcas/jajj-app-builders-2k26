// What the Assistant sends to the model (ADR 0005, layer 3: a grounded answer under a
// scope-restricted system prompt). Model-facing text, not UI text, so it is not in the string
// catalog. Pure.
//
// The system message is the same for every question in one UI language, so llama.rn reuses
// its cached evaluation; only the passages and the question are new each time.

import type { Language } from '../../i18n/types';
import type { Chunk } from './corpus';

/** Hard cap on generated tokens. The prompt asks for far less; this stops a runaway answer. */
export const N_PREDICT = 180;
/** Passages given to the model per question. Each costs ~100-150 prompt tokens (~2-3 s on the CPU). */
export const MAX_PROMPT_PASSAGES = 3;
/** The reply the model gives when the passages do not answer the question. */
export const NO_ANSWER = 'NONE';

const RULES = [
  'You are the Assistant in Tahak, an offline hiking app for Filipino mountain trails.',
  'You help only with: hiking and camping, outdoor first aid, gear, weather on the trail, the',
  "hiker's Destination and its Trails and Waypoints, food for the trail, getting to and from",
  'the jump-off, local culture around a Destination, and using the Tahak app.',
  '',
  'Rules:',
  "1. Answer only from the numbered passages in the hiker's message. Never use outside",
  '   knowledge, and never guess numbers, prices, times or places that are not in them.',
  `2. If the passages do not answer the question, or the question is about anything else, reply`,
  `   with exactly: ${NO_ANSWER}`,
  '3. Start your reply with the numbers of the passages you used, in square brackets, like [2]',
  '   or [1][3]. Then give the answer.',
  '4. Keep it short: at most 3 sentences, under 70 words. Plain text only: no markdown, no',
  '   bold, no lists, no headings.',
  '5. Questions may be in English, Filipino or Taglish.',
].join('\n');

const ENGLISH_STYLE = '6. Always answer in clear, simple English, even when the question is in Filipino or Taglish.';

// Wave 0 found the 4B model's Filipino stiff and formal, so the Filipino-UI mode shows it
// what natural Taglish sounds like. The examples are about general hiking, not any one
// Destination, so they can't leak facts into an answer.
const TAGLISH_STYLE = [
  '6. Always answer in natural Taglish: the casual mix of Filipino and English that Filipino',
  '   hikers use when they chat. Keep everyday English words as they are (trail, jump-off,',
  '   campsite, water, fee, guide, registration, summit, liters). Sound like a friendly kuya or',
  '   ate on the trail, not a textbook. Avoid deep or formal Filipino words.',
  '',
  'Examples of the style:',
  'Q: Is there water on the trail?',
  'A: [1] Wala raw reliable na water source sa trail, kaya magdala ka ng at least 2 liters mula',
  'sa jump-off. Inumin mo nang paunti-unti para hindi ka ma-dehydrate.',
  'Q: Anong oras dapat mag-start?',
  'A: [2] Mas okay mag-start nang maaga, mga 5 o 6 AM, para hindi ka abutan ng tirik na araw',
  'sa open trail.',
  'Q: Saan ko itatapon yung basura ko?',
  'A: [1] Walang basurahan sa trail, kaya i-pack out mo lahat ng basura mo. Magdala ka ng',
  'extra na plastic bag para dito.',
].join('\n');

export function systemPrompt(language: Language): string {
  return `${RULES}\n${language === 'fil' ? TAGLISH_STYLE : ENGLISH_STYLE}`;
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

/** The passage's label inside the prompt, so the model knows what kind of source it is. */
function passageLabel(chunk: Chunk): string {
  switch (chunk.target.type) {
    case 'passage':
      return `${chunk.title} (Destination Pack)`;
    case 'guide':
      return `Guide: ${chunk.title}`;
    case 'help':
      return `Tahak app help: ${chunk.title}`;
  }
}

export function userPrompt(language: Language, passages: readonly Chunk[], question: string): string {
  const numbered = passages.map((p, i) => `[${i + 1}] ${passageLabel(p)}\n${p.text}`).join('\n\n');
  const reminder =
    language === 'fil'
      ? `Answer in natural Taglish, starting with the passage numbers, or reply ${NO_ANSWER}.`
      : `Answer in English, starting with the passage numbers, or reply ${NO_ANSWER}.`;
  return `Passages:\n${numbered}\n\nQuestion: ${question.trim()}\n\n${reminder}`;
}

export function buildMessages(language: Language, passages: readonly Chunk[], question: string): ChatMessage[] {
  return [
    { role: 'system', content: systemPrompt(language) },
    { role: 'user', content: userPrompt(language, passages, question) },
  ];
}
