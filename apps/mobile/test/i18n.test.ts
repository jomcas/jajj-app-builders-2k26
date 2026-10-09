// Every string catalog (the shell's and each Feature Module's) must have the same keys in
// English and Filipino, with no empty or untranslated entries.
// Run with: npm test  (Node's built-in test runner; Node strips the TypeScript types.)
import assert from 'node:assert/strict';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';

type Catalog = { en: Record<string, string>; fil: Record<string, string> };

// Strings that are correctly identical in both languages.
const SAME_IN_BOTH = new Set([
  'SOS',
  'Filipino',
  // Units and hiking loanwords that Filipino hikers use as is.
  '{km} km',
  '{elevation} m',
  '{region} · {elevation} m',
  'Jump-off',
  'Campsite',
]);

const srcDir = join(import.meta.dirname, '..', 'src');

function catalogFiles(): string[] {
  const files = [join(srcDir, 'i18n', 'shell.strings.ts')];
  const modulesDir = join(srcDir, 'modules');
  for (const entry of readdirSync(modulesDir, { withFileTypes: true })) {
    const file = join(modulesDir, entry.name, 'strings.ts');
    if (entry.isDirectory() && existsSync(file)) files.push(file);
  }
  return files;
}

for (const file of catalogFiles()) {
  const name = file.slice(srcDir.length + 1);

  test(`${name}: English and Filipino have identical keys`, async () => {
    const catalog: Catalog = (await import(pathToFileURL(file).href)).default;
    assert.deepEqual(Object.keys(catalog.fil).sort(), Object.keys(catalog.en).sort());
  });

  test(`${name}: no empty or untranslated strings`, async () => {
    const catalog: Catalog = (await import(pathToFileURL(file).href)).default;
    for (const [key, english] of Object.entries(catalog.en)) {
      const filipino = catalog.fil[key];
      assert.ok(english.trim(), `en.${key} is empty`);
      assert.ok(filipino?.trim(), `fil.${key} is empty`);
      if (!SAME_IN_BOTH.has(english)) {
        assert.notEqual(filipino, english, `fil.${key} is still the English text`);
      }
    }
  });
}
