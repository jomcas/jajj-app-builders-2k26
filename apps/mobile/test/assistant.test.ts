// The Assistant's pure core (issue #14, ADR 0005): vector search, the relevance gate, the
// "answer used no source" fallback, the prompt per UI language, markdown stripping, the
// re-embed skip logic, and the search corpus.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { APP_HELP } from '../src/modules/assistant/appHelp.ts';
import { citedNumbers, displayText, usedPassages } from '../src/modules/assistant/citations.ts';
import {
  contentHash,
  guideChunks,
  helpChunks,
  needsReembed,
  packChunks,
  twinKey,
  type Chunk,
} from '../src/modules/assistant/corpus.ts';
import { gateDecision } from '../src/modules/assistant/gate.ts';
import { stripMarkdown } from '../src/modules/assistant/markdown.ts';
import { answerQuestion, selectPassages, type GenerateResult, type Hit } from '../src/modules/assistant/pipeline.ts';
import { buildMessages, systemPrompt, userPrompt } from '../src/modules/assistant/prompt.ts';
import { chipLabel, chipSources } from '../src/modules/assistant/sources.ts';
import { TEST_SET } from '../src/modules/assistant/testSet.ts';
import { cosine, normalize, topK } from '../src/modules/assistant/vectors.ts';

// ---- vectors -------------------------------------------------------------------------------

test('cosine: same direction 1, opposite -1, orthogonal 0, zero vector 0', () => {
  assert.ok(Math.abs(cosine([1, 2], [2, 4]) - 1) < 1e-12);
  assert.equal(cosine([1, 0], [-3, 0]), -1);
  assert.equal(cosine([1, 0], [0, 5]), 0);
  assert.equal(cosine([0, 0], [1, 1]), 0);
  assert.throws(() => cosine([1], [1, 2]), /lengths differ/);
});

test('normalize gives unit length', () => {
  const v = normalize([3, 4]);
  assert.ok(Math.abs(v[0] - 0.6) < 1e-6 && Math.abs(v[1] - 0.8) < 1e-6);
});

test('topK returns the k most similar, best first, with scores; ties keep order', () => {
  const items = [
    { id: 'a', v: [1, 0] },
    { id: 'b', v: [0, 1] },
    { id: 'c', v: [1, 1] },
    { id: 'd', v: [0, 1] },
  ];
  const hits = topK([0, 1], items, (i) => i.v, 3);
  assert.deepEqual(
    hits.map((h) => h.item.id),
    ['b', 'd', 'c'],
  );
  assert.equal(hits[0].score, 1);
  assert.ok(Math.abs(hits[2].score - Math.SQRT1_2) < 1e-9);
  assert.deepEqual(topK([0, 1], items, (i) => i.v, 0), []);
  assert.equal(topK([0, 1], [], (i: { v: number[] }) => i.v, 3).length, 0);
});

// ---- gate ----------------------------------------------------------------------------------

test('the gate passes at or above the threshold and refuses below it', () => {
  assert.deepEqual(gateDecision([{ score: 0.5 }, { score: 0.1 }], 0.5), { pass: true, best: 0.5, threshold: 0.5 });
  assert.equal(gateDecision([{ score: 0.49 }], 0.5).pass, false);
  assert.deepEqual(gateDecision([], 0.5), { pass: false, best: -1, threshold: 0.5 });
});

// ---- corpus --------------------------------------------------------------------------------

const pack = {
  destination: { id: 'batulao', name: 'Mt. Batulao', packVersion: 2 },
  passages: [
    { id: 'batulao-water-1-en', topic: 'water', language: 'en' as const, text: 'No water on the trail.', source: 'a.com (2026)' },
    { id: 'batulao-water-1-fil', topic: 'water', language: 'fil' as const, text: 'Walang tubig sa trail.', source: 'a.com (2026)' },
  ],
};

test('pack passages become chunks whose en and fil twins share a group', () => {
  const chunks = packChunks(pack);
  assert.equal(twinKey('batulao-water-1-fil'), 'batulao-water-1');
  assert.deepEqual(
    chunks.map((c) => [c.id, c.group, c.language]),
    [
      ['pack:batulao-water-1-en', 'pack:batulao-water-1', 'en'],
      ['pack:batulao-water-1-fil', 'pack:batulao-water-1', 'fil'],
    ],
  );
  assert.deepEqual(chunks[0].target, { type: 'passage', destinationId: 'batulao' });
});

test('Guide JSON becomes overview, step, do-not and watch-for chunks in both languages', () => {
  const guide = {
    id: 'snakebite',
    kind: 'emergency',
    title: { en: 'Snakebite', fil: 'Kagat ng ahas' },
    summary: { en: 'Keep calm.', fil: 'Manatiling kalmado.' },
    callForHelp: { en: 'Call 911.', fil: 'Tumawag sa 911.' },
    steps: { en: ['Keep still.', 'Remove rings.'], fil: ['Huwag gumalaw.', 'Tanggalin ang singsing.'] },
    doNot: { en: ['Do not cut the wound.'], fil: ['Huwag hiwain ang sugat.'] },
    keywords: { en: ['snake', 'bite'], fil: ['ahas'] },
    sources: [{ title: 'IFRC', url: 'https://example.org' }],
  };
  const chunks = guideChunks(guide);
  const en = chunks.filter((c) => c.language === 'en').map((c) => c.text);
  assert.deepEqual(en, ['Keep calm. Call 911. (snake, bite)', '1. Keep still.\n2. Remove rings.', 'Do not:\n- Do not cut the wound.']);
  const fil = chunks.filter((c) => c.language === 'fil');
  assert.equal(fil[0].title, 'Kagat ng ahas');
  assert.ok(fil[2].text.startsWith('Huwag:'));
  assert.ok(chunks.every((c) => c.target.type === 'guide' && c.target.guideId === 'snakebite'));
  assert.ok(!chunks.some((c) => c.text.includes('IFRC')), 'sources are not passage text');
  assert.deepEqual(guideChunks({ title: { en: 'x' } }), []);
});

test('app help is in both languages and marked as app-written help', () => {
  const chunks = helpChunks(APP_HELP);
  assert.equal(chunks.length, APP_HELP.length * 2);
  assert.ok(chunks.every((c) => c.target.type === 'help' && /not Destination facts/.test(c.source)));
  for (const id of ['download-pack', 'hike', 'deviation', 'flare', 'food', 'packing', 'jump-off']) {
    assert.ok(APP_HELP.some((p) => p.id === id), `help topic ${id}`);
  }
  assert.ok(chunks.every((c) => c.text.length > 100 && c.text.length < 800));
});

// ---- re-embed skip logic -------------------------------------------------------------------

test('stored vectors are reused only for the same model and the same content', () => {
  const chunks = packChunks(pack);
  const hash = contentHash('gemma', chunks);
  assert.equal(hash, contentHash('gemma', packChunks(pack)), 'the hash is stable');
  assert.equal(needsReembed({ modelId: 'gemma', hash }, { modelId: 'gemma', hash }), false);
  assert.equal(needsReembed(null, { modelId: 'gemma', hash }), true);
  assert.equal(needsReembed({ modelId: 'e5', hash }, { modelId: 'gemma', hash }), true);
  const updated = packChunks({ ...pack, passages: [{ ...pack.passages[0], text: 'Bring 3 litres.' }, pack.passages[1]] });
  assert.equal(needsReembed({ modelId: 'gemma', hash }, { modelId: 'gemma', hash: contentHash('gemma', updated) }), true);
  assert.notEqual(contentHash('e5', chunks), hash);
});

// ---- prompt --------------------------------------------------------------------------------

const help = helpChunks(APP_HELP);

test('the English UI prompt asks for English and has no Taglish examples', () => {
  const system = systemPrompt('en');
  assert.match(system, /Answer only from the numbered passages/);
  assert.match(system, /reply\s+with exactly: NONE/);
  assert.match(system, /Always answer in clear, simple English/);
  assert.match(system, /under 70 words/);
  assert.doesNotMatch(system, /Taglish:/);
});

test('the Filipino UI prompt asks for natural Taglish with example answers', () => {
  const system = systemPrompt('fil');
  assert.match(system, /natural Taglish/);
  assert.equal((system.match(/^Q: /gm) ?? []).length, 3);
  assert.equal((system.match(/^A: \[\d\]/gm) ?? []).length, 3);
  assert.match(userPrompt('fil', help.slice(0, 1), 'Paano?'), /Answer in natural Taglish/);
});

test('passages are numbered in the user message, and the system message is the same each time', () => {
  const a = buildMessages('en', [help[0], help[2]], '  How do I download? ');
  const b = buildMessages('en', [help[4]], 'Other');
  assert.equal(a[0].content, b[0].content, 'cacheable system prefix');
  assert.match(a[1].content, /^Passages:\n\[1\] Tahak app help: Downloading a Destination Pack\n/);
  assert.match(a[1].content, /\n\n\[2\] Tahak app help: /);
  assert.match(a[1].content, /Question: How do I download\?\n/);
});

// ---- markdown and citations ----------------------------------------------------------------

test('markdown is stripped to plain text', () => {
  assert.equal(stripMarkdown('**Bring water.** Use *one* litre.'), 'Bring water. Use one litre.');
  assert.equal(stripMarkdown('## Water\n- Bring 2 L\n* Filter it\n1. Boil'), 'Water\n• Bring 2 L\n• Filter it\n1. Boil');
  assert.equal(stripMarkdown('Use `filter` and [this guide](https://x.org).'), 'Use filter and this guide.');
  assert.equal(stripMarkdown('snake_case stays, 3 * 4 stays'), 'snake_case stays, 3 * 4 stays');
  assert.equal(stripMarkdown('Half-streamed **bold'), 'Half-streamed bold');
  assert.equal(stripMarkdown('> quoted\n\n\n\nnext'), 'quoted\n\nnext');
});

test('citations: only numbers of given passages count, in first-cited order', () => {
  assert.deepEqual(citedNumbers('[2][1] Bring water. [2]', 3), [2, 1]);
  assert.deepEqual(citedNumbers('[1, 3] text [Passage 2]', 3), [1, 3, 2]);
  assert.deepEqual(citedNumbers('[4] [0] no', 3), []);
  assert.deepEqual(usedPassages('NONE', ['a', 'b']), []);
  assert.deepEqual(usedPassages('[2] yes', ['a', 'b']), ['b']);
});

test('the chat shows nothing until a citation appears, then text without markers', () => {
  assert.equal(displayText('Wala', 3), '');
  assert.equal(displayText('NONE', 3), '');
  assert.equal(displayText('[1', 3), '');
  assert.equal(displayText('[1] **Walang** tubig sa trail [1].', 3), 'Walang tubig sa trail.');
  assert.equal(displayText('[1][2] Bring 3 L [', 3), 'Bring 3 L');
  assert.ok(displayText(`[1] ${'Long sentence here. '.repeat(60)}`, 3).length <= 600);
});

// ---- pipeline ------------------------------------------------------------------------------

const chunks: Chunk[] = [...packChunks(pack), ...help];
const hit = (id: string, score: number): Hit => ({ chunk: chunks.find((c) => c.id === id)!, score });

function generation(text: string): GenerateResult {
  return { text, truncated: false, ttftMs: 5000, generationTps: 10, promptTokens: 300, generatedTokens: 40 };
}

function deps(hits: Hit[], modelText: string, calls: { generate: number; messages?: unknown }) {
  return {
    search: async () => hits,
    corpus: () => chunks,
    threshold: 0.5,
    generate: async (messages: unknown, onText: (raw: string) => void) => {
      calls.generate++;
      calls.messages = messages;
      onText(modelText.slice(0, 4));
      onText(modelText);
      return generation(modelText);
    },
  };
}

test('below the threshold: the off-topic reply, and the model never runs', async () => {
  const calls = { generate: 0 };
  const reply = await answerQuestion('Sino ang presidente?', 'fil', deps([hit('help:food:en', 0.31)], '[1] x', calls));
  assert.equal(reply.kind, 'off-topic');
  assert.equal(reply.kind === 'off-topic' && reply.reason, 'gate');
  assert.equal(calls.generate, 0);
});

test('an answer that cites a passage is shown with that passage as its source', async () => {
  const calls = { generate: 0 };
  const shown: string[] = [];
  const reply = await answerQuestion(
    'May tubig ba?',
    'en',
    deps([hit('pack:batulao-water-1-fil', 0.7), hit('help:water:en', 0.6)], '[1] **No** water on the trail.', calls),
    (t) => shown.push(t),
  );
  assert.equal(reply.kind, 'answer');
  if (reply.kind !== 'answer') return;
  assert.equal(reply.text, 'No water on the trail.');
  assert.deepEqual(reply.sources.map((s) => s.id), ['pack:batulao-water-1-en'], 'the English twin went to the model');
  assert.deepEqual(shown, ['', 'No water on the trail.']);
});

test('an answer that cites no passage, or says NONE, falls back to the off-topic reply', async () => {
  for (const modelText of ['There is no water there.', 'NONE', '[7] made-up citation']) {
    const calls = { generate: 0 };
    const shown: string[] = [];
    const reply = await answerQuestion('q', 'en', deps([hit('help:water:en', 0.6)], modelText, calls), (t) => shown.push(t));
    assert.equal(reply.kind, 'off-topic', modelText);
    assert.equal(reply.kind === 'off-topic' && reply.reason, 'no-source');
    assert.equal(calls.generate, 1);
    assert.ok(shown.every((t) => t === ''), 'no answer text was ever shown');
  }
});

test('the emergency route runs first and skips everything else', async () => {
  const calls = { generate: 0 };
  let searched = false;
  const reply = await answerQuestion('Natuklaw ng ahas!', 'fil', {
    ...deps([hit('help:water:en', 0.9)], '[1] x', calls),
    search: async () => {
      searched = true;
      return [];
    },
    emergencyRoute: async () => ({ kind: 'emergency', guideId: 'snakebite' }),
  });
  assert.deepEqual(reply, { kind: 'emergency', guideId: 'snakebite' });
  assert.equal(searched, false);
  assert.equal(calls.generate, 0);
});

test('the prompt gets the best 3 passages, one per en/fil pair', () => {
  const hits = [
    hit('pack:batulao-water-1-fil', 0.8),
    hit('pack:batulao-water-1-en', 0.79),
    hit('help:water:fil', 0.7),
    hit('help:packing:en', 0.6),
    hit('help:food:en', 0.5),
  ];
  assert.deepEqual(
    selectPassages(hits, chunks).map((c) => c.id),
    ['pack:batulao-water-1-en', 'help:water:en', 'help:packing:en'],
  );
});

// ---- source chips --------------------------------------------------------------------------

test('one chip per pack passage pair, Guide and help topic, with a readable label', () => {
  const guide = guideChunks({ id: 'snakebite', title: { en: 'Snakebite', fil: 'Kagat ng ahas' }, summary: { en: 'a', fil: 'b' }, steps: { en: ['x'], fil: ['y'] } });
  const chips = chipSources([chunks[0], chunks[1], guide[0], guide[1]]);
  assert.deepEqual(chips.map((c) => c.id), ['pack:batulao-water-1-en', 'guide:snakebite:en:0']);
  const s = {
    appHelp: 'App help',
    guideChip: 'Guide: {title}',
    topicGettingThere: 'Getting there',
    topicRegistration: 'Registration and fees',
    topicWater: 'Water',
    topicCampsites: 'Campsites',
    topicHazards: 'Hazards',
  };
  assert.equal(chipLabel(chunks[0], s), 'Mt. Batulao · Water');
  assert.equal(chipLabel(guide[0], s), 'Guide: Snakebite');
  assert.equal(chipLabel(help[0], s), 'App help · Downloading a Destination Pack');
});

// ---- test set ------------------------------------------------------------------------------

test('the test set has ~30 questions in all three languages, both kinds, with the issue examples', () => {
  assert.ok(TEST_SET.length >= 28 && TEST_SET.length <= 40);
  assert.equal(new Set(TEST_SET.map((q) => q.id)).size, TEST_SET.length);
  for (const lang of ['en', 'fil', 'taglish']) assert.ok(TEST_SET.some((q) => q.lang === lang), lang);
  assert.ok(TEST_SET.filter((q) => q.expect === 'off-topic').length >= 8);
  for (const q of ['Sino ang presidente?', 'Write me a poem', "What's the capital of France?"]) {
    assert.ok(TEST_SET.some((t) => t.question === q && t.expect === 'off-topic'), q);
  }
});
