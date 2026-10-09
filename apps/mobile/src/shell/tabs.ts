import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

import type shellStrings from '../i18n/shell.strings';
import type { TabId } from '../modules';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type TabDefinition = {
  id: TabId;
  labelKey: keyof typeof shellStrings.en;
  icon: IconName;
};

// The four bottom tabs, in order (docs/plan.md, U2). The shell owns these; modules only fill them.
export const TABS: readonly TabDefinition[] = [
  { id: 'explore', labelKey: 'tabExplore', icon: 'compass-outline' },
  { id: 'hike', labelKey: 'tabHike', icon: 'map-marker-path' },
  { id: 'ask', labelKey: 'tabAsk', icon: 'message-outline' },
  { id: 'guides', labelKey: 'tabGuides', icon: 'book-open-page-variant-outline' },
];

export function tabDefinition(id: string): TabDefinition {
  const tab = TABS.find((candidate) => candidate.id === id);
  if (!tab) throw new Error(`Unknown tab "${id}"`);
  return tab;
}
