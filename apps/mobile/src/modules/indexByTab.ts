import type { FeatureModule, TabId } from './types';

/** A module that fills a tab. */
export type TabModule = Extract<FeatureModule, { tab: TabId }>;

/**
 * Maps each tab to the module that provides its screen. Modules without a tab are skipped.
 * Pure (type-only imports) so it can be tested with plain Node.
 */
export function indexByTab(modules: readonly FeatureModule[]): Partial<Record<TabId, TabModule>> {
  const byTab: Partial<Record<TabId, TabModule>> = {};
  const ids = new Set<string>();
  for (const module of modules) {
    if (ids.has(module.id)) throw new Error(`Two Feature Modules use the id "${module.id}".`);
    ids.add(module.id);
    if (module.tab === undefined) continue;
    const taken = byTab[module.tab];
    if (taken) {
      throw new Error(
        `Feature Modules "${taken.id}" and "${module.id}" both claim the ${module.tab} tab. ` +
          'Only one module can fill a tab: sharing a tab between modules is not designed yet.',
      );
    }
    byTab[module.tab] = module;
  }
  return byTab;
}
