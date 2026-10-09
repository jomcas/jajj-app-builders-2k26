// The Assistant's adb deep links: the test-set bench, the no-pack test switch, and the Wave 0
// model benchmark (adb shell am start -d "tahak://spike/bench…"), which moved into the module.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  parseAssistantBenchUrl,
  parseSpikeBenchUrl,
  parseTestUrl,
  sweepThresholds,
} from '../src/modules/assistant/benchLink.ts';

test('a bare spike bench link runs on the CPU with the default thread count', () => {
  assert.deepEqual(parseSpikeBenchUrl('tahak://spike/bench', 6), {
    backends: ['cpu'],
    threads: 6,
    imageMaxTokens: undefined,
  });
});

test('spike bench backend and threads come from the query', () => {
  assert.deepEqual(parseSpikeBenchUrl('tahak://spike/bench?backend=gpu&threads=4', 6), {
    backends: ['gpu'],
    threads: 4,
    imageMaxTokens: undefined,
  });
  assert.deepEqual(parseSpikeBenchUrl('tahak://spike/bench?threads=8&backend=both', 6), {
    backends: ['cpu', 'gpu'],
    threads: 8,
    imageMaxTokens: undefined,
  });
});

test('a bad thread count falls back to the default', () => {
  assert.equal(parseSpikeBenchUrl('tahak://spike/bench?threads=abc', 6)?.threads, 6);
  assert.equal(parseSpikeBenchUrl('tahak://spike/bench?threads=0', 6)?.threads, 6);
});

test('other links are not bench links', () => {
  assert.equal(parseSpikeBenchUrl(null, 6), null);
  assert.equal(parseSpikeBenchUrl('tahak://spike/benchmark', 6), null);
  assert.equal(parseSpikeBenchUrl('exp+tahak://expo-development-client/?url=x', 6), null);
  assert.equal(parseAssistantBenchUrl('tahak://assistant/benchmark'), null);
  assert.equal(parseAssistantBenchUrl('tahak://spike/bench'), null);
});

test('image_tokens caps the photo tokens; absent or bad means the engine default', () => {
  assert.equal(parseSpikeBenchUrl('tahak://spike/bench?image_tokens=256', 6)?.imageMaxTokens, 256);
  assert.equal(parseSpikeBenchUrl('tahak://spike/bench', 6)?.imageMaxTokens, undefined);
  assert.equal(parseSpikeBenchUrl('tahak://spike/bench?image_tokens=-1', 6)?.imageMaxTokens, undefined);
});

test('the Assistant bench defaults to the fast gate-only mode', () => {
  assert.deepEqual(parseAssistantBenchUrl('tahak://assistant/bench'), {
    mode: 'gate',
    ui: undefined,
    ignorePacks: false,
    embed: undefined,
    threshold: undefined,
    ids: undefined,
    passagesInEnglish: undefined,
  });
});

test('the Assistant bench reads mode, ui, packs, embed, threshold and ids', () => {
  assert.deepEqual(
    parseAssistantBenchUrl(
      'tahak://assistant/bench?mode=full&ui=fil&packs=none&embed=multilingual-e5-small-Q8_0.gguf&threshold=0.45&ids=a,b',
    ),
    {
      mode: 'full',
      ui: 'fil',
      ignorePacks: true,
      embed: 'multilingual-e5-small-Q8_0.gguf',
      threshold: 0.45,
      ids: ['a', 'b'],
      passagesInEnglish: undefined,
    },
  );
  assert.equal(parseAssistantBenchUrl('tahak://assistant/bench?ui=de')?.ui, undefined);
  assert.equal(parseAssistantBenchUrl('tahak://assistant/bench?passages=en')?.passagesInEnglish, true);
  assert.equal(parseAssistantBenchUrl('tahak://assistant/bench?threshold=x')?.threshold, undefined);
});

test('the test switch hides or restores the Destination Packs', () => {
  assert.deepEqual(parseTestUrl('tahak://assistant/test?packs=none'), { ignorePacks: true });
  assert.deepEqual(parseTestUrl('tahak://assistant/test?packs=all'), { ignorePacks: false });
  assert.equal(parseTestUrl('tahak://assistant/test'), null);
  assert.equal(parseTestUrl('tahak://assistant/bench?packs=none'), null);
});

test('the threshold sweep counts refused in-scope and passed off-topic questions', () => {
  const results = [
    { best: 0.6, expect: 'answer' as const },
    { best: 0.45, expect: 'answer' as const },
    { best: 0.4, expect: 'off-topic' as const },
    { best: 0.2, expect: 'off-topic' as const },
  ];
  const at = (t: number) => sweepThresholds(results).find((s) => s.threshold === t)!;
  assert.deepEqual(at(0.42), { threshold: 0.42, refused: 0, passed: 0 });
  assert.deepEqual(at(0.5), { threshold: 0.5, refused: 1, passed: 0 });
  assert.deepEqual(at(0.3), { threshold: 0.3, refused: 0, passed: 1 });
});
