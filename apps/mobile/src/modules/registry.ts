// The Feature Module registry (ADR 0001).
// To add a feature: create src/modules/<id>/ whose index.ts default-exports a FeatureModule,
// then add one line here:
//   export { default as <id> } from './<id>';
// Nothing in src/shell/ changes.

export { default as assistant } from './assistant';
export { default as destinationPack } from './destination-pack';
export { default as explore } from './explore';
export { default as hike } from './hike';
