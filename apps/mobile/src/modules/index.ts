import { indexByTab } from './indexByTab';
import * as registry from './registry';
import type { FeatureModule } from './types';

export type { TabModule } from './indexByTab';
export type { FeatureModule, HikeMode, TabId } from './types';

/** Every registered Feature Module, including those without a tab. */
export const featureModules: readonly FeatureModule[] = Object.values(registry);

/** The module that provides each tab's screen, if any. */
export const modulesByTab = indexByTab(featureModules);
