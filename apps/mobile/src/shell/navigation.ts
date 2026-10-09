import { createNavigationContainerRef } from '@react-navigation/native';

import type { TabId } from '../modules/types';
import type { TabParamList } from './tabs';

/**
 * Lets a Feature Module bring its own tab to the front, e.g. the Guides module when another
 * feature (or a tahak://guides/<id> link) opens a Guide. The shell still owns the tabs;
 * this only selects one. A call made before navigation is ready is applied once it is.
 */
export const navigationRef = createNavigationContainerRef<TabParamList>();

let pendingTab: TabId | null = null;

export function focusTab(tab: TabId) {
  if (navigationRef.isReady()) navigationRef.navigate(tab);
  else pendingTab = tab;
}

/** Called by the shell's NavigationContainer onReady. */
export function applyPendingTab() {
  if (pendingTab && navigationRef.isReady()) navigationRef.navigate(pendingTab);
  pendingTab = null;
}
