// What the Assistant sends to the model for a photo question (Vision, #18). Model-facing text,
// not UI text, so it is not in the string catalog. Pure.
//
// The photo goes first in the user message and the text after it. The system message and
// the photo are then a fixed prefix: llama.rn keeps a snapshot right after the photo, so a
// photo read ahead of time (while the hiker types, vision.ts) is not read again when the
// question is sent; only the question's own text is evaluated.

import type { Language } from '../../i18n/types';
import type { Chunk } from './corpus';
import { NO_ANSWER, type ChatMessage } from './prompt.ts';

/** Passages given with a photo question, when its text passes the gate. Each costs ~3-5 s. */
export const MAX_PHOTO_PASSAGES = 1;

// Short on purpose, like the text prompt: every token costs time on the phone's CPU.
// ADR 0003: no first aid from a photo, ever; the hiker is sent to the Guides instead.
// ADR 0005: the photo must show something about the outdoors, or the reply is NONE.
const PHOTO_RULES = [
  'You are the Assistant in Tahak, an offline hiking app for Filipino mountain trails.',
  'The hiker sends a photo taken outdoors and asks about it.',
  'Rules:',
  '- Talk only about what the photo shows that matters on a hike or camp: plants, animals,',
  '  insects, terrain, trail signs, sky and weather, water, gear, campsites, trail food.',
  `- If the photo or the question is about anything else, reply only: ${NO_ANSWER}`,
  '- Say plainly what you see. If you are not sure what it is, say so. Never guess a name',
  '  with confidence.',
  '- Never say a wild plant, mushroom, berry or water is safe to eat or drink.',
  '- Never give first aid, medical or treatment steps. If the photo shows an injury, a bite,',
  '  a rash or a sick person, say only: open the matching Guide in the Guides tab.',
  '- If a numbered passage helps, cite it like [1]. Never invent numbers, prices or places.',
  '- At most 3 short sentences, under 60 words. Plain text: no markdown, lists or headings.',
  '- Questions may be in English, Filipino or Taglish.',
].join('\n');

const ENGLISH_STYLE = '- Always answer in clear, simple English.';

const TAGLISH_STYLE = [
  '- Always answer in natural Taglish, the casual mix of Filipino and English hikers use in',
  '  chat. Sound like a friendly kuya or ate, not a textbook; avoid deep or formal Filipino.',
  'Example:',
  'Q: Anong halaman ito?',
  'A: Mukhang fern ito, karaniwan sa gilid ng trail. Hindi ako sigurado sa eksaktong uri, kaya',
  'huwag mo itong kainin.',
].join('\n');

export function photoSystemPrompt(language: Language): string {
  return `${PHOTO_RULES}\n${language === 'fil' ? TAGLISH_STYLE : ENGLISH_STYLE}`;
}

/** The text after the photo: the passages (if any), the question and a short reminder. */
export function photoUserText(language: Language, passages: readonly Chunk[], question: string): string {
  const numbered = passages.length
    ? `Passages:\n${passages.map((p, i) => `[${i + 1}] ${p.title}\n${p.text}`).join('\n\n')}\n\n`
    : '';
  const reminder =
    language === 'fil'
      ? `Answer in natural Taglish about the photo, or reply ${NO_ANSWER}.`
      : `Answer in English about the photo, or reply ${NO_ANSWER}.`;
  return `${numbered}Question: ${question.trim()}\n\n${reminder}`;
}

export type PhotoMessage =
  | ChatMessage
  | {
      role: 'user';
      content: ({ type: 'image_url'; image_url: { url: string } } | { type: 'text'; text: string })[];
    };

/** The photo first, then the text, so the photo stays in the reusable prefix. */
export function buildPhotoMessages(
  language: Language,
  passages: readonly Chunk[],
  question: string,
  photoUri: string,
): PhotoMessage[] {
  return [
    { role: 'system', content: photoSystemPrompt(language) },
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: photoUri } },
        { type: 'text', text: photoUserText(language, passages, question) },
      ],
    },
  ];
}
