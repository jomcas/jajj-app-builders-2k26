// What the spike sends to the model. Model-facing text, not UI text, so it is not in the
// string catalog.

/** The Assistant's instructions: offline hiking helper that mirrors the hiker's language. */
export const SYSTEM_PROMPT = [
  'You are the Assistant in Tahak, an offline hiking helper for Filipino mountain trails.',
  'Answer in the same language and style the hiker uses: English in, English out;',
  'Filipino in, Filipino out; Taglish in, Taglish out.',
  'Keep answers short and practical.',
  'For questions about the trail, answer from the trail notes below; if the notes do not',
  'cover the question, say so plainly instead of guessing.',
  'When the hiker sends a photo, describe what you see in it and point out anything that',
  'matters for their safety.',
].join(' ');

/**
 * Stand-in for the reference info a Destination Pack will provide through RAG.
 * Marked as sample data so nobody mistakes it for real trail facts.
 */
export const SAMPLE_TRAIL_NOTES = [
  'Trail notes (SAMPLE spike data, not real Batulao info):',
  '- Destination: Mt. Batulao, New Trail.',
  '- Camp 2 has a water source: a small spring about 50 m below the campsite. Boil or filter it first.',
  '- From Camp 2 the summit is about 1.2 km away, roughly 45 minutes of steady hiking.',
  '- The last stretch to the summit is steep and rocky, with ropes in some places.',
].join('\n');

export const SYSTEM_MESSAGE = `${SYSTEM_PROMPT}\n\n${SAMPLE_TRAIL_NOTES}`;

/** The benchmark's Taglish question. */
export const BENCH_QUESTION = 'May tubig ba sa Camp 2? Gaano kalayo pa ang summit?';

/** The benchmark's photo task, asked about the bundled photo. */
export const BENCH_PHOTO_PROMPT =
  'Describe this photo for a hiker: the terrain, the trail, and anything that matters for safety.';
