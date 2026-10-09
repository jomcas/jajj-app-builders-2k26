// The Assistant spike's benchmark deep link (adb shell am start -d "tahak://spike/bench…").
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseBenchUrl } from '../src/modules/assistant-spike/benchLink.ts';

test('a bare bench link runs on the CPU with the default thread count', () => {
  assert.deepEqual(parseBenchUrl('tahak://spike/bench', 6), { backends: ['cpu'], threads: 6 });
});

test('backend and threads come from the query', () => {
  assert.deepEqual(parseBenchUrl('tahak://spike/bench?backend=gpu&threads=4', 6), {
    backends: ['gpu'],
    threads: 4,
  });
  assert.deepEqual(parseBenchUrl('tahak://spike/bench?threads=8&backend=both', 6), {
    backends: ['cpu', 'gpu'],
    threads: 8,
  });
});

test('a bad thread count falls back to the default', () => {
  assert.equal(parseBenchUrl('tahak://spike/bench?threads=abc', 6)?.threads, 6);
  assert.equal(parseBenchUrl('tahak://spike/bench?threads=0', 6)?.threads, 6);
});

test('other links are not bench links', () => {
  assert.equal(parseBenchUrl(null, 6), null);
  assert.equal(parseBenchUrl('tahak://spike/benchmark', 6), null);
  assert.equal(parseBenchUrl('exp+tahak://expo-development-client/?url=x', 6), null);
});
