// The Feature Module registry (ADR 0001).
// To add a feature: create src/modules/<id>/ whose index.ts default-exports a FeatureModule,
// then add one line here:
//   export { default as <id> } from './<id>';
// Nothing in src/shell/ changes.

export { default as assistantModel } from './assistant-model';
export { default as assistantSpike } from './assistant-spike';
export { default as destinationPack } from './destination-pack';
export { default as explore } from './explore';
export { default as firstLaunch } from './first-launch';
export { default as flare } from './flare';
export { default as hike } from './hike';
