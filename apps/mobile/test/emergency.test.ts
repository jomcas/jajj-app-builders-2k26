// Emergency routing (issue #15): normalisation and Filipino affixes, scoring and tie-breaking,
// the fixed test sets, the card's two-line summary, and the dev preview link.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { DISTRESS_GUIDES, PRIORITY, RULES } from '../src/modules/emergency/lexicon.ts';
import { editDistance, stems, tokenize, wordMatches } from '../src/modules/emergency/normalize.ts';
import { parsePreviewLink } from '../src/modules/emergency/previewLink.ts';
import { isBareDistress } from '../src/modules/emergency/distress.ts';
import { createEmergencyRouter, type EmergencyResult } from '../src/modules/emergency/router.ts';
import strings from '../src/modules/emergency/strings.ts';
import { cardSummary, helpOptions, TWO_LINES } from '../src/modules/emergency/summary.ts';
import { EDGE_CASES, EMERGENCY_QUESTIONS, ORDINARY_QUESTIONS, type RoutingCase } from '../src/modules/emergency/testSet.ts';
import { loadGuides } from '../src/modules/guides/loader.ts';
import type { Guide } from '../src/modules/guides/types.ts';

const contentDir = join(import.meta.dirname, '..', 'src', 'modules', 'guides', 'content');
const guides: Guide[] = loadGuides(
  readdirSync(contentDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => ({ source: file, raw: JSON.parse(readFileSync(join(contentDir, file), 'utf8')) })),
).guides;
const router = createEmergencyRouter(guides);

/** A route as the test sets write it: the Guide id, 'distress', or null. */
function outcome(result: EmergencyResult | null): string | null {
  if (!result) return null;
  return result.kind === 'guide' ? result.guideId : 'distress';
}
const EMERGENCY_IDS = guides.filter((guide) => guide.kind === 'emergency').map((guide) => guide.id);

// Normalisation

test('tokenize lowercases, strips accents, joins Taglish hyphens and marks clause boundaries', () => {
  assert.deepEqual(tokenize('NA-SPRAIN ang Ankle ko!'), ['nasprain', 'ang', 'ankle', 'ko']);
  assert.deepEqual(tokenize("I can't, he won't stop"), ['i', 'cant', '|', 'he', 'wont', 'stop']);
  assert.deepEqual(tokenize('nagbi-bleed... tulonggg'), ['nagbibleed', '|', 'tulong']);
  assert.deepEqual(tokenize('Pagdurugó'), ['pagdurugo']);
  assert.deepEqual(tokenize('di ko alam, pls'), ['hindi', 'ko', 'alam', '|', 'please']);
  assert.deepEqual(tokenize('  ?? '), []);
});

test('Filipino affixes reduce to the root', () => {
  const cases: [string, string][] = [
    ['kinagat', 'kagat'],
    ['nakagat', 'kagat'],
    ['makagat', 'kagat'],
    ['dumudugo', 'dugo'],
    ['duguan', 'dugo'],
    ['naliligaw', 'ligaw'],
    ['naligaw', 'ligaw'],
    ['nabalian', 'bali'],
    ['giniginaw', 'ginaw'],
    ['nilalamig', 'lamig'],
    ['kumikidlat', 'kidlat'],
    ['nakidlatan', 'kidlat'],
    ['rumaragasang', 'ragasa'],
    ['tinuklaw', 'tuklaw'],
    ['nahihilo', 'hilo'],
    ['nasugatan', 'sugat'],
  ];
  for (const [word, root] of cases) assert.ok(stems(word).has(root), `${word} → ${root}`);
});

test('Taglish and English inflections reduce to the root', () => {
  const cases: [string, string][] = [
    ['nagbibleed', 'bleed'],
    ['nasprain', 'sprain'],
    ['nadehydrate', 'dehydrate'],
    ['bleeding', 'bleed'],
    ['sprained', 'sprain'],
    ['stopped', 'stop'],
    ['snakes', 'snake'],
    ['shivering', 'shiver'],
  ];
  for (const [word, root] of cases) assert.ok(stems(word).has(root), `${word} → ${root}`);
});

test('a root matches its affixed forms, but an affixed lexicon word does not match its root', () => {
  assert.ok(wordMatches('kinagat', 'kagat'));
  assert.ok(wordMatches('dumudugo', 'dugo'));
  assert.ok(!wordMatches('dugo', 'dumudugo'), '"may dugo" (there is blood) is not "dumudugo" (bleeding)');
  assert.ok(!wordMatches('malamig', 'nilalamig'), '"malamig" (it is cold) is not "nilalamig" (feeling cold)');
});

test('long words match with a typo, short words and common look-alikes do not', () => {
  assert.ok(wordMatches('hypotermia', 'hypothermia'));
  assert.ok(wordMatches('heatsroke', 'heatstroke'));
  assert.ok(wordMatches('dehidrated', 'dehydrated'));
  assert.ok(wordMatches('bleding', 'bleeding'));
  assert.ok(wordMatches('snkebite', 'snakebite'));
  assert.ok(!wordMatches('ahs', 'ahas'), 'no typos in words under six letters');
  assert.ok(!wordMatches('ginawa', 'ginaw'), '"ginawa" (made) is not "ginaw" (cold)');
  assert.ok(!wordMatches('sugar', 'sugat'));
  assert.ok(!wordMatches('xleeding', 'bleeding'), 'the first letter must be right');
});

test('editDistance counts edits and adjacent swaps, and stops early', () => {
  assert.equal(editDistance('kagat', 'kagat', 2), 0);
  assert.equal(editDistance('kagat', 'kgaat', 2), 1);
  assert.equal(editDistance('bleeding', 'bleding', 2), 1);
  assert.equal(editDistance('snake', 'cobra', 1), 2);
});

// Scoring and tie-breaking

test('a tie goes to the more time-critical Guide: bleeding from a snakebite opens Snakebite', () => {
  const explanation = router.explain('bleeding from a snakebite');
  assert.equal(explanation.scores.snakebite, explanation.scores['bleeding-wounds']);
  assert.equal(outcome(router.route('bleeding from a snakebite', 'en')), 'snakebite');
});

test('a topic word alone does not fire; with a distress cue or a second concept it does', () => {
  assert.equal(router.route('May ahas ba sa Batulao?', 'fil'), null);
  assert.equal(outcome(router.route('May ahas! Tulong!', 'fil')), 'snakebite');
  assert.equal(outcome(router.route('a snake, and it bit me', 'en')), 'snakebite');
});

test('weather words that are not anchors never fire on a cue alone', () => {
  assert.equal(router.route('Malamig ba ngayon sa summit?', 'fil'), null);
  assert.equal(router.route('Is it hot on the trail now?', 'en'), null);
});

test('negation cancels a match, but not when the negator is part of the phrase', () => {
  assert.equal(router.route('hindi naman dumudugo', 'fil'), null);
  assert.equal(router.route("I'm not lost", 'en'), null);
  assert.equal(outcome(router.route("it won't stop bleeding", 'en')), 'bleeding-wounds');
  assert.equal(outcome(router.route('hindi ko alam, dumudugo siya', 'fil')), 'bleeding-wounds');
});

test('the distant past turns routing off unless the problem is still going on', () => {
  assert.equal(router.route('I was bitten by a snake last year, is the trail safe?', 'en'), null);
  assert.equal(outcome(router.route('I was bitten by a snake last year and it still hurts', 'en')), 'snakebite');
  assert.equal(outcome(router.route('Natuklaw ako ng ahas kahapon', 'fil')), 'snakebite');
});

test('a dampener stops an emergency word that is about something else', () => {
  assert.equal(router.route('Nabali ang tent pole namin, ano gagawin?', 'fil'), null);
  assert.equal(outcome(router.route('Nabali ang binti ko, ano gagawin?', 'fil')), 'sprains-fractures');
});

test('confidence is between 0 and 1 and every route says what matched', () => {
  for (const { question, expected } of EMERGENCY_QUESTIONS) {
    if (expected === 'distress') continue;
    const route = router.route(question, 'en');
    assert.ok(route?.kind === 'guide', question);
    assert.ok(route.confidence > 0 && route.confidence <= 1, question);
    assert.ok(route.matched.length > 0, question);
  }
});

test('the router never names a Guide that is not in the library', () => {
  const withoutSnakebite = createEmergencyRouter(guides.filter((guide) => guide.id !== 'snakebite'));
  assert.equal(withoutSnakebite.route('nakagat ng ahas', 'fil'), null);
  assert.equal(createEmergencyRouter([]).route('bleeding heavily, help', 'en'), null);
});

test("a Guide's own keywords take part in routing", () => {
  const hypothermia = guides.find((guide) => guide.id === 'hypothermia');
  assert.ok(hypothermia);
  const edited: Guide = { ...hypothermia, keywords: { en: [...hypothermia.keywords.en, 'zorblat', 'quxian fever'], fil: hypothermia.keywords.fil } };
  const custom = createEmergencyRouter([...guides.filter((guide) => guide.id !== 'hypothermia'), edited]);
  assert.equal(router.route('zorblat and quxian fever', 'en'), null);
  assert.equal(outcome(custom.route('zorblat and quxian fever', 'en')), 'hypothermia');
});

test('the second stage runs only for near misses and can only pick a near miss', async () => {
  const calls: string[] = [];
  const stage = async (question: string, candidates: readonly { guideId: string }[]) => {
    calls.push(question);
    return candidates[0]?.guideId ?? null;
  };
  assert.equal(outcome(await router.routeWithSecondStage('nakagat ng ahas', 'fil', stage)), 'snakebite');
  assert.deepEqual(calls, [], 'a decided question never reaches the second stage');
  const nearMiss = await router.routeWithSecondStage('May ahas ba sa Batulao?', 'fil', stage);
  assert.ok(nearMiss?.kind === 'guide');
  assert.equal(nearMiss.guideId, 'snakebite');
  assert.equal(nearMiss.confidence, 0.5);
  assert.equal(await router.routeWithSecondStage('Sino ang presidente?', 'fil', stage), null);
  assert.equal(calls.length, 1, 'a question with no score at all never reaches the second stage');
  assert.equal(await router.routeWithSecondStage('May ahas ba sa Batulao?', 'fil', async () => 'lightning'), null);
  assert.equal(await router.routeWithSecondStage('May ahas ba sa Batulao?', 'fil'), null);
});

test('routing is fast enough to run before the relevance gate', () => {
  const questions = [...EMERGENCY_QUESTIONS, ...ORDINARY_QUESTIONS, ...EDGE_CASES].map((c) => c.question);
  for (const question of questions) router.route(question, 'en'); // warm the caches
  const start = performance.now();
  for (let i = 0; i < 5; i++) for (const question of questions) router.route(question, 'en');
  const perQuestion = (performance.now() - start) / (questions.length * 5);
  assert.ok(perQuestion < 5, `${perQuestion.toFixed(2)} ms per question`);
});

// Distress

test('bare distress returns { kind: distress }, in English, Filipino and Taglish', () => {
  for (const question of ['help', 'HELP!!!', 'tulong', 'Tulong po!', 'saklolo', 'SOS', 'emergency', 'may emergency', 'help us', 'please help', 'help po', 'tulungan nyo kami', 'we need help now', 'help, I dont know what to do']) {
    assert.deepEqual(router.route(question, 'en')?.kind, 'distress', question);
  }
});

test('a Guide match always wins over distress', () => {
  assert.equal(outcome(router.route('help, nakagat ng ahas', 'fil')), 'snakebite');
  assert.equal(outcome(router.route('tulong po naliligaw kami', 'fil')), 'lost-on-the-trail');
  assert.equal(outcome(router.route('SOS dumudugo', 'fil')), 'bleeding-wounds');
});

test('distress never fires on questions about the app or on other questions', () => {
  for (const question of [
    'How do I use the Flare?',
    'paano gamitin ang SOS',
    'What does the SOS button do?',
    'Where is the SOS control?',
    'Does the app work in an emergency?',
    "What's the emergency number in the Philippines?",
    'Can you help me plan my trip?',
    'I do not need help',
    'help me pack for Batulao',
    '',
  ]) {
    assert.equal(router.route(question, 'en'), null, question);
    assert.equal(isBareDistress(question), false, question);
  }
});

test('the distress card links to the five top Emergency Guides, all in the library', () => {
  assert.deepEqual(DISTRESS_GUIDES, ['lost-on-the-trail', 'bleeding-wounds', 'snakebite', 'sprains-fractures', 'hypothermia']);
  for (const id of DISTRESS_GUIDES) assert.equal(guides.find((guide) => guide.id === id)?.kind, 'emergency', id);
});

// The lexicon

test('every lexicon rule names a bundled Guide, and the tie-break order covers them all', () => {
  const ids = new Set(guides.map((guide) => guide.id));
  for (const rules of RULES) {
    assert.ok(ids.has(rules.guideId), rules.guideId);
    assert.ok(PRIORITY.includes(rules.guideId), `${rules.guideId} is missing from PRIORITY`);
  }
  for (const id of EMERGENCY_IDS) assert.ok(RULES.some((rules) => rules.guideId === id), `no rules for ${id}`);
});

// The fixed test sets

function run(cases: readonly RoutingCase[]) {
  return cases.map((c) => ({ ...c, got: outcome(router.route(c.question, 'en')) ?? null }));
}

test('the emergency set: at least 15 questions, every Emergency Guide, three or more for snakebite, bleeding and lost', () => {
  assert.ok(EMERGENCY_QUESTIONS.length >= 15);
  const counts = new Map<string, number>();
  for (const { expected } of EMERGENCY_QUESTIONS) counts.set(expected ?? '', (counts.get(expected ?? '') ?? 0) + 1);
  for (const id of EMERGENCY_IDS) assert.ok((counts.get(id) ?? 0) >= 1, `no question for ${id}`);
  assert.ok((counts.get('distress') ?? 0) >= 5, 'bare distress');
  for (const id of ['snakebite', 'bleeding-wounds', 'lost-on-the-trail']) assert.ok((counts.get(id) ?? 0) >= 3, id);
});

test('the emergency set routes every question to the right Guide (recall 100%)', () => {
  const misses = run(EMERGENCY_QUESTIONS).filter((c) => c.got !== c.expected);
  assert.deepEqual(misses, []);
});

test('the ordinary set never triggers the emergency card (no false positives)', () => {
  assert.ok(ORDINARY_QUESTIONS.length >= 15);
  const misses = run(ORDINARY_QUESTIONS).filter((c) => c.got !== null);
  assert.deepEqual(misses, []);
});

test('the edge cases: negation, the distant past and questions about the app', () => {
  const misses = run(EDGE_CASES).filter((c) => c.got !== c.expected);
  assert.deepEqual(misses, []);
});

// The card

test('the card summary keeps whole sentences when they fit in two lines', () => {
  assert.equal(cardSummary('Short. Also short.'), 'Short. Also short.');
  const long = 'Keep the person calm and still. Get them to a hospital fast, and never cut or suck the bite whatever you do.';
  assert.equal(cardSummary(long), 'Keep the person calm and still.');
});

test('the card summary cuts a too-long first sentence at a whole word, with an ellipsis', () => {
  const sentence = 'Treat any injured arm or leg as a possible broken bone: keep it still and supported and do not move it at all.';
  const summary = cardSummary(sentence);
  assert.ok(summary.endsWith('…'));
  assert.ok(summary.length <= TWO_LINES);
  assert.ok(sentence.startsWith(summary.slice(0, -1)), 'verbatim up to the cut');
  assert.ok(!/\s…$/.test(summary));
});

test("every Guide's card summary is a verbatim prefix of its own summary, within two lines", () => {
  for (const guide of guides) {
    for (const language of ['en', 'fil'] as const) {
      const source = guide.summary[language];
      const shown = cardSummary(source);
      assert.ok(shown.length <= TWO_LINES, `${guide.id}.${language}: ${shown.length} characters`);
      assert.ok(source.startsWith(shown.replace(/…$/, '')), `${guide.id}.${language} is not verbatim`);
      assert.ok(shown.length >= 20, `${guide.id}.${language} is too short to be useful`);
    }
  }
});

test("the card offers 911 for every Emergency Guide, and the Flare where the Guide's call for help names it", () => {
  for (const guide of guides.filter((g) => g.kind === 'emergency')) {
    const help = helpOptions(guide.callForHelp.en);
    assert.ok(help.call911, guide.id);
    assert.equal(help.flare, ['lost-on-the-trail', 'flash-floods'].includes(guide.id), guide.id);
  }
});

test('the card strings have the same keys in English and Filipino', () => {
  assert.deepEqual(Object.keys(strings.fil).sort(), Object.keys(strings.en).sort());
});

// The dev preview link

test('tahak://emergency/preview/<id> and tahak://emergency/ask?q=… parse; other links do not', () => {
  assert.deepEqual(parsePreviewLink('tahak://emergency/preview/Snakebite?lang=fil&theme=night'), {
    kind: 'guide',
    guideId: 'snakebite',
    language: 'fil',
    theme: 'night',
  });
  assert.deepEqual(parsePreviewLink('tahak://emergency/ask?q=nakagat%20ng%20ahas'), {
    kind: 'ask',
    question: 'nakagat ng ahas',
    language: undefined,
    theme: undefined,
  });
  assert.deepEqual(parsePreviewLink('tahak://emergency/distress?lang=fil'), { kind: 'distress', language: 'fil', theme: undefined });
  assert.equal(parsePreviewLink('tahak://emergency/ask?q='), null);
  assert.equal(parsePreviewLink('tahak://emergency/preview'), null);
  assert.equal(parsePreviewLink('tahak://guides/snakebite'), null);
  assert.equal(parsePreviewLink(null), null);
});
