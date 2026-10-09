// eslint-disable-next-line import/namespace -- the registry is legitimately empty before any module exists.
import * as registry from './registry';
import type { FeatureModule, TabId } from './types';

export type { FeatureModule, HikeMode, TabId } from './types';

const featureModules: FeatureModule[] = Object.values(registry);

function indexByTab(modules: FeatureModule[]): Partial<Record<TabId, FeatureModule>> {
  const byTab: Partial<Record<TabId, FeatureModule>> = {};
  const ids = new Set<string>();
  for (const module of modules) {
    if (ids.has(module.id)) throw new Error(`Two Feature Modules use the id "${module.id}".`);
    const taken = byTab[module.tab];
    if (taken) {
      throw new Error(
        `Feature Modules "${taken.id}" and "${module.id}" both claim the ${module.tab} tab.`,
      );
    }
    ids.add(module.id);
    byTab[module.tab] = module;
  }
  return byTab;
}

/** The module that provides each tab's screen, if any. */
export const modulesByTab = indexByTab(featureModules);
