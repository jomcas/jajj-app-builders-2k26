// The Feature Module registry: modules without a tab register too, and a tab has one module.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { indexByTab } from '../src/modules/indexByTab.ts';
import type { FeatureModule } from '../src/modules/types.ts';

const Screen = () => null;

const askModule: FeatureModule = {
  id: 'assistant',
  tab: 'ask',
  Screen,
  hikeModes: ['solo', 'group'],
  offlineNeeds: ['model'],
};

// Like the Flare: supplies behaviour (the SOS action), no screen of its own.
const noTabModule: FeatureModule = {
  id: 'flare',
  hikeModes: ['solo', 'group'],
  offlineNeeds: [],
};

test('a module without a tab registers and is left out of modulesByTab', () => {
  const byTab = indexByTab([askModule, noTabModule]);
  assert.deepEqual(Object.keys(byTab), ['ask']);
  assert.equal(byTab.ask, askModule);
  assert.ok(!Object.values(byTab).includes(noTabModule as never));
});

test('two modules claiming one tab is an error that says composition is not designed yet', () => {
  assert.throws(
    () => indexByTab([askModule, { ...askModule, id: 'other' }]),
    /both claim the ask tab.*not designed yet/,
  );
});

test('duplicate module ids are an error, even without tabs', () => {
  assert.throws(() => indexByTab([noTabModule, { ...noTabModule }]), /Two Feature Modules use the id "flare"/);
});
