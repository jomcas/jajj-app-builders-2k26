// The Guide Library: the content loader, grouping and order, lookup by id, the deep link, and
// the bundled content itself (English and Filipino parity, the Emergency Guides of #10).
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { parseGuideLink } from '../src/modules/guides/guideLink.ts';
import { createLibrary, groupGuides, localizeGuide, localizeLibrary } from '../src/modules/guides/library.ts';
import { loadGuides, parseGuide } from '../src/modules/guides/loader.ts';
import type { Guide } from '../src/modules/guides/types.ts';

const guidesDir = join(import.meta.dirname, '..', 'src', 'modules', 'guides');
const readJson = (file: string): unknown => JSON.parse(readFileSync(file, 'utf8'));
const fixture = readJson(join(import.meta.dirname, 'fixtures', 'guide-sample.json')) as Record<string, unknown>;

/** The fixture with some fields replaced. */
function variant(overrides: Record<string, unknown>): Record<string, unknown> {
  return { ...structuredClone(fixture), ...overrides };
}

function guide(id: string, category: Guide['category'], order: number, kind: Guide['kind'] = 'emergency'): Guide {
  const parsed = parseGuide(variant({ id, category, order, kind }), id).guide;
  assert.ok(parsed);
  return parsed;
}

// The loader

test('a valid Guide loads with no problems', () => {
  const { guide: parsed, problems } = parseGuide(fixture, 'sample');
  assert.deepEqual(problems, []);
  assert.ok(parsed);
  assert.equal(parsed.id, 'sample-ordinary');
  assert.equal(parsed.kind, 'ordinary');
  assert.equal(parsed.steps.fil.length, 3);
  assert.equal(parsed.review.redCrossChecked, false);
});

test('malformed Guides are skipped with an error, not thrown', () => {
  const cases: [string, unknown][] = [
    ['not an object', ['a list']],
    ['null', null],
    ['bad id', variant({ id: 'Snake Bite' })],
    ['bad kind', variant({ kind: 'urgent' })],
    ['bad category', variant({ category: 'medical' })],
    ['no order', variant({ order: undefined })],
    ['no title', variant({ title: undefined })],
    ['steps not a list', variant({ steps: { en: 'one step', fil: 'isang hakbang' } })],
    ['no steps', variant({ steps: { en: [], fil: [] } })],
  ];
  for (const [name, raw] of cases) {
    const { guide: parsed, problems } = parseGuide(raw, name);
    assert.equal(parsed, null, name);
    assert.equal(problems.length, 1, name);
    assert.equal(problems[0].level, 'error', name);
    assert.match(problems[0].message, /^skipped: /, name);
  }
});

test('a malformed file is skipped and the rest of the library still loads', () => {
  const { guides, problems } = loadGuides([
    { source: 'good.json', raw: variant({ id: 'good' }) },
    { source: 'bad.json', raw: { id: 'bad' } },
    { source: 'also-good.json', raw: variant({ id: 'also-good' }) },
  ]);
  assert.deepEqual(guides.map((g) => g.id).sort(), ['also-good', 'good']);
  assert.equal(problems.filter((p) => p.level === 'error').length, 1);
  assert.equal(problems[0].source, 'bad.json');
});

test('a duplicate id is skipped', () => {
  const { guides, problems } = loadGuides([
    { source: 'a.json', raw: variant({ id: 'twin', order: 1 }) },
    { source: 'b.json', raw: variant({ id: 'twin', order: 2 }) },
  ]);
  assert.equal(guides.length, 1);
  assert.equal(guides[0].order, 1);
  assert.match(problems[0].message, /already uses the id "twin"/);
});

test('a missing Filipino field falls back to English with a warning', () => {
  const { guide: parsed, problems } = parseGuide(
    variant({ summary: { en: 'English only' }, steps: { en: ['One.', 'Two.'], fil: [] } }),
    'partial',
  );
  assert.ok(parsed);
  assert.equal(parsed.summary.fil, 'English only');
  assert.deepEqual(parsed.steps.fil, ['One.', 'Two.']);
  assert.deepEqual(
    problems.map((p) => [p.level, p.message]),
    [
      ['warning', '"summary.fil" is missing or invalid; showing English instead'],
      ['warning', '"steps.fil" is missing or invalid; showing English instead'],
    ],
  );
});

test('a missing English field skips the Guide', () => {
  const { guide: parsed, problems } = parseGuide(variant({ callForHelp: { fil: 'Tumawag' } }), 'no-english');
  assert.equal(parsed, null);
  assert.match(problems[0].message, /"callForHelp.en" is missing/);
});

test('a missing review block counts as not checked', () => {
  const { guide: parsed } = parseGuide(variant({ review: undefined }), 'no-review');
  assert.ok(parsed);
  assert.equal(parsed.review.redCrossChecked, false);
});

// Grouping, order and lookup

test('Guides group into injury, hazard, camp in that order, each sorted by order then id', () => {
  const guides = [
    guide('pitching-a-tent', 'camp', 1, 'ordinary'),
    guide('lost-on-the-trail', 'hazard', 1),
    guide('hypothermia', 'injury', 7),
    guide('snakebite', 'injury', 1),
    guide('blisters', 'injury', 6, 'ordinary'),
    guide('bleeding-wounds', 'injury', 1),
  ];
  const sections = groupGuides(guides);
  assert.deepEqual(
    sections.map((section) => [section.category, section.guides.map((g) => g.id)]),
    [
      ['injury', ['bleeding-wounds', 'snakebite', 'blisters', 'hypothermia']],
      ['hazard', ['lost-on-the-trail']],
      ['camp', ['pitching-a-tent']],
    ],
  );
});

test('an empty group is left out', () => {
  assert.deepEqual(
    groupGuides([guide('lightning', 'hazard', 1)]).map((section) => section.category),
    ['hazard'],
  );
});

test('getGuide finds a Guide by id and returns undefined for an unknown id', () => {
  const library = createLibrary([guide('snakebite', 'injury', 1), guide('lightning', 'hazard', 1)]);
  assert.equal(library.getGuide('snakebite')?.id, 'snakebite');
  assert.equal(library.getGuide('nope'), undefined);
  assert.deepEqual(library.guides.map((g) => g.id), ['snakebite', 'lightning']);
});

test('localizing picks the UI language', () => {
  const parsed = guide('sample', 'camp', 1, 'ordinary');
  assert.equal(localizeGuide(parsed, 'en').title, 'Sample Guide (development only)');
  assert.equal(localizeGuide(parsed, 'fil').steps[0], 'Unang halimbawang hakbang.');
  const view = localizeLibrary(createLibrary([parsed]), 'fil');
  assert.equal(view.sections[0].guides[0].title, 'Halimbawang Guide (pang-development lang)');
});

// The deep link

test('tahak://guides/<id> opens that Guide; tahak://guides the list; other links are ignored', () => {
  assert.deepEqual(parseGuideLink('tahak://guides/snakebite'), { id: 'snakebite' });
  assert.deepEqual(parseGuideLink('tahak://guides/Snakebite/'), { id: 'snakebite' });
  assert.deepEqual(parseGuideLink('tahak://guides/lost-on-the-trail?from=flare'), { id: 'lost-on-the-trail' });
  assert.deepEqual(parseGuideLink('tahak://guides'), { id: null });
  assert.deepEqual(parseGuideLink('tahak://guides/'), { id: null });
  assert.equal(parseGuideLink('tahak://guidesx/snakebite'), null);
  assert.equal(parseGuideLink('tahak://hike/end'), null);
  assert.equal(parseGuideLink(null), null);
});

// The bundled content

const contentDir = join(guidesDir, 'content');
const contentFiles = existsSync(contentDir)
  ? readdirSync(contentDir).filter((name) => name.endsWith('.json')).sort()
  : [];

test('every bundled Guide loads cleanly, with its file named after its id', () => {
  const { guides, problems } = loadGuides(
    contentFiles.map((name) => ({ source: name, raw: readJson(join(contentDir, name)) })),
  );
  assert.deepEqual(problems, []);
  assert.deepEqual(guides.map((g) => `${g.id}.json`).sort(), contentFiles);
});

test('every bundled Guide has the same structure in English and Filipino', () => {
  for (const name of contentFiles) {
    const raw = readJson(join(contentDir, name)) as Record<string, Record<string, unknown>>;
    for (const field of ['title', 'summary', 'callForHelp', 'steps', 'doNot', 'watchFor', 'keywords']) {
      const { en, fil } = raw[field];
      if (Array.isArray(en)) {
        assert.ok(Array.isArray(fil), `${name}: ${field}.fil is not a list`);
        if (field !== 'keywords') assert.equal(fil.length, en.length, `${name}: ${field} counts differ`);
        assert.ok(fil.length > 0 || en.length === 0, `${name}: ${field}.fil is empty`);
      } else {
        assert.ok(typeof fil === 'string' && fil.trim(), `${name}: ${field}.fil is empty`);
        assert.notEqual(fil, en, `${name}: ${field}.fil is still the English text`);
      }
    }
  }
});

const FIRST_EMERGENCY_GUIDES = ['snakebite', 'bleeding-wounds', 'sprains-fractures', 'hypothermia', 'lost-on-the-trail'];

test(
  'the five Emergency Guides of #10 are bundled as Emergency Guides',
  { skip: contentFiles.length === 0 ? 'no Guide content merged into this branch yet' : false },
  () => {
    const library = createLibrary(
      loadGuides(contentFiles.map((name) => ({ source: name, raw: readJson(join(contentDir, name)) }))).guides,
    );
    for (const id of FIRST_EMERGENCY_GUIDES) {
      assert.equal(library.getGuide(id)?.kind, 'emergency', `${id} is missing or not an Emergency Guide`);
    }
  },
);
