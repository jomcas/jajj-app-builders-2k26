// app.config.js cannot import the TypeScript tokens, so check the copied colour by test.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

import { palettes } from '../src/theme/tokens.ts';

const require = createRequire(import.meta.url);
const { expo } = require('../app.config.js');

test('app.config.js background colours match the day page token', () => {
  assert.equal(expo.backgroundColor, palettes.day.page);
  assert.equal(expo.android.adaptiveIcon.backgroundColor, palettes.day.page);
});
