// The Assistant's fixed test set (ADR 0005): in-scope and off-topic questions in English,
// Filipino and Taglish. The adb bench (bench.ts) runs it on the phone; the relevance gate's
// threshold is tuned against it, and any change to the gate, the prompt or a model must keep
// it passing. Pure data.
//
//   expect  'answer': in scope, must pass the gate and be answered with a source.
//           'off-topic': must get the fixed off-topic reply.
//   ui      the UI language to answer in (English UI → English, Filipino UI → Taglish).
//   source  for in-scope questions, the start of a chunk id the answer should come from.

import type { Language } from '../../i18n/types';

export type TestQuestion = {
  id: string;
  question: string;
  lang: 'en' | 'fil' | 'taglish';
  ui: Language;
  expect: 'answer' | 'off-topic';
  source?: string;
};

export const TEST_SET: readonly TestQuestion[] = [
  // Batulao, from its Destination Pack.
  { id: 'bat-water-en', question: 'Is there water on the trail at Batulao?', lang: 'en', ui: 'en', expect: 'answer', source: 'pack:batulao-water' },
  { id: 'bat-water-tl', question: 'May tubig ba sa trail ng Batulao?', lang: 'taglish', ui: 'fil', expect: 'answer', source: 'pack:batulao-water' },
  { id: 'bat-fee-en', question: 'How much is the registration fee at Mt. Batulao?', lang: 'en', ui: 'en', expect: 'answer', source: 'pack:batulao-registration' },
  { id: 'bat-fee-fil', question: 'Magkano ang bayad sa pag-akyat sa Batulao?', lang: 'fil', ui: 'fil', expect: 'answer', source: 'pack:batulao-registration' },
  { id: 'bat-guide-en', question: 'Do I need to hire a guide for Batulao?', lang: 'en', ui: 'en', expect: 'answer', source: 'pack:batulao-registration' },
  { id: 'bat-commute-en', question: 'How do I get to the Batulao jump-off from Manila?', lang: 'en', ui: 'en', expect: 'answer', source: 'pack:batulao-getting-there' },
  { id: 'bat-commute-tl', question: 'Paano pumunta sa jump-off ng Batulao kung magko-commute?', lang: 'taglish', ui: 'fil', expect: 'answer', source: 'pack:batulao-getting-there' },
  { id: 'bat-camp-en', question: 'Can we camp on the summit of Batulao?', lang: 'en', ui: 'en', expect: 'answer', source: 'pack:batulao-campsites' },
  { id: 'bat-open-en', question: 'What time does registration open?', lang: 'en', ui: 'en', expect: 'answer', source: 'pack:batulao-registration' },
  { id: 'bat-danger-tl', question: 'Delikado ba yung trail papuntang summit?', lang: 'taglish', ui: 'fil', expect: 'answer', source: 'pack:batulao-hazards' },
  { id: 'bat-rain-en', question: 'Is the trail slippery in the rainy season?', lang: 'en', ui: 'en', expect: 'answer', source: 'pack:batulao-hazards' },
  // App help and in-scope topics, answerable without a Destination Pack.
  { id: 'help-download-en', question: 'How do I download a Destination Pack?', lang: 'en', ui: 'en', expect: 'answer', source: 'help:download-pack' },
  { id: 'help-download-tl', question: 'Paano mag-download ng pack para magamit offline?', lang: 'taglish', ui: 'fil', expect: 'answer', source: 'help:download-pack' },
  { id: 'help-food-en', question: 'What should I eat before a climb?', lang: 'en', ui: 'en', expect: 'answer', source: 'help:food' },
  { id: 'help-food-fil', question: 'Ano ang dapat kainin bago umakyat ng bundok?', lang: 'fil', ui: 'fil', expect: 'answer', source: 'help:food' },
  { id: 'help-jumpoff-en', question: 'How do I get to the jump-off?', lang: 'en', ui: 'en', expect: 'answer', source: '' },
  { id: 'help-bring-en', question: 'What should I bring on a day hike?', lang: 'en', ui: 'en', expect: 'answer', source: 'help:packing' },
  { id: 'help-gear-tl', question: 'Anong gear ang kailangan ko for an overnight camp?', lang: 'taglish', ui: 'fil', expect: 'answer', source: 'help:' },
  { id: 'help-deviation-en', question: 'What happens if I wander off the trail?', lang: 'en', ui: 'en', expect: 'answer', source: 'help:deviation' },
  { id: 'help-flare-en', question: 'What is the Flare?', lang: 'en', ui: 'en', expect: 'answer', source: 'help:flare' },
  { id: 'help-flare-tl', question: 'Paano gamitin yung SOS sa app?', lang: 'taglish', ui: 'fil', expect: 'answer', source: 'help:flare' },
  { id: 'help-culture-en', question: 'How should I behave around the locals near the mountain?', lang: 'en', ui: 'en', expect: 'answer', source: 'help:culture' },
  // Off-topic: must get the fixed reply without running the model.
  { id: 'off-president-fil', question: 'Sino ang presidente?', lang: 'fil', ui: 'fil', expect: 'off-topic' },
  { id: 'off-poem-en', question: 'Write me a poem', lang: 'en', ui: 'en', expect: 'off-topic' },
  { id: 'off-france-en', question: "What's the capital of France?", lang: 'en', ui: 'en', expect: 'off-topic' },
  { id: 'off-nba-en', question: 'Who won the NBA finals this year?', lang: 'en', ui: 'en', expect: 'off-topic' },
  { id: 'off-python-en', question: 'Can you write Python code to sort a list?', lang: 'en', ui: 'en', expect: 'off-topic' },
  { id: 'off-movie-tl', question: 'Ano ang magandang movie na panoorin ngayon?', lang: 'taglish', ui: 'fil', expect: 'off-topic' },
  { id: 'off-bitcoin-en', question: 'What is the price of bitcoin today?', lang: 'en', ui: 'en', expect: 'off-topic' },
  { id: 'off-passport-fil', question: 'Paano mag-renew ng passport?', lang: 'fil', ui: 'fil', expect: 'off-topic' },
  { id: 'off-joke-en', question: 'Tell me a joke', lang: 'en', ui: 'en', expect: 'off-topic' },
  { id: 'off-math-tl', question: 'Pwede mo ba akong tulungan sa math homework ko?', lang: 'taglish', ui: 'fil', expect: 'off-topic' },
];
