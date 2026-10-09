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
/** Passages given to the model per question. Each costs ~100-150 prompt tokens (~3-5 s on the CPU). */
export const MAX_PROMPT_PASSAGES = 3;
/** A passage goes into the prompt only if it scores within this much of the best one. */
export const PASSAGE_SCORE_SPREAD = 0.1;
/** The reply the model gives when the passages do not answer the question. */
export const NO_ANSWER = 'NONE';

// Kept short on purpose: every prompt token costs ~20-30 ms of waiting on the phone's CPU.
const RULES = [
  'You are the Assistant in Tahak, an offline hiking app for Filipino mountain trails.',
  'Rules:',
  '- Answer only from the numbered passages in the message. Use no outside knowledge, and never',
  '  invent numbers, prices, times or places.',
  '- If the passages do not answer the question, or it is not about hiking, camping, outdoor',
  '  first aid, gear, trail weather, the Destination, trail food, getting to the jump-off, local',
  `  culture or the Tahak app, reply only: ${NO_ANSWER}`,
  '- Start your reply with the numbers of the passages you used, like [1] or [1][3].',
  '- At most 3 short sentences, under 70 words. Plain text: no markdown, lists or headings.',
  '- Questions may be in English, Filipino or Taglish.',
].join('\n');

const ENGLISH_STYLE = '- Always answer in clear, simple English.';

// Wave 0 found the 4B model's Filipino stiff and formal, so the Filipino-UI mode shows it
// what natural Taglish sounds like. The examples are about general hiking, not any one
// Destination, so they can't leak facts into an answer.
const TAGLISH_STYLE = [
  '- Always answer in natural Taglish, the casual mix of Filipino and English hikers use in',
  '  chat. Keep words like trail, jump-off, campsite, fee, guide and summit in English. Sound',
  '  like a friendly kuya or ate, not a textbook; avoid deep or formal Filipino.',
  'Examples:',
  'Q: Is there water on the trail?',
  'A: [1] Walang reliable na water source sa trail, kaya magdala ka ng at least 2 liters.',
  'Q: Anong oras dapat mag-start?',
  'A: [2] Mas okay mag-start nang maaga, mga 5 AM, para hindi ka abutan ng tirik na araw.',
  'Q: Saan ko itatapon yung basura ko?',
  'A: [1] Walang basurahan sa trail, kaya i-pack out mo lahat ng basura mo.',
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
