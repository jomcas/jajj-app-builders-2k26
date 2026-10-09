import { useMemo } from 'react';

import { usePreferences } from '../../settings/preferences';
import type { FeatureModule } from '../types';
import type { Language } from '../../i18n/types';
import { localizeGuide, localizeLibrary, type LocalizedLibrary } from './library';
import { GuidesScreen } from './GuidesScreen';
import { library, listenForGuideLinks } from './store';
import type { Guide, LocalizedGuide } from './types';

// The Guide Library (issue #10): the how-to and Emergency Guides that ship inside the app and
// work offline from the first launch (ADR 0002). Content is one JSON file per Guide in
// content/<id>.json, bundled at build time; a malformed file is skipped and logged.
//
// Public interface for other modules (the Flare #12, emergency routing #15, the Assistant):
//
//   openGuide(id) → boolean
//       Opens that Guide in the Guides tab and brings the tab to the front, from anywhere.
//       False (and nothing happens) when no Guide has that id.
//   getGuide(id) → Guide | undefined          the Guide in both languages
//   getLocalizedGuide(id, language) → LocalizedGuide | undefined
//   listGuides() → Guide[]                     sorted by group, then order, then id
//   useGuides() → { guides, sections }         in the UI language, for screens (a React hook)
//   types: Guide, LocalizedGuide, GuideKind, GuideCategory, GuideSection
//
// Deep link: tahak://guides/<id> opens a Guide, tahak://guides the list.
// Ids: snakebite, bleeding-wounds, sprains-fractures, hypothermia, heat-illness, dehydration,
// lost-on-the-trail, lightning, flash-floods, altitude-sickness (Emergency Guides);
// insect-stings, leech-bites, blisters, pitching-a-tent, purifying-water.

// Listen from import time, not from the screen: tabs mount lazily, and a link may come first.
listenForGuideLinks();

export { openGuide } from './store';
export type { Guide, GuideCategory, GuideKind, GuideSection, LocalizedGuide } from './types';
export type { LocalizedLibrary } from './library';

export function getGuide(id: string): Guide | undefined {
  return library.getGuide(id);
}

export function getLocalizedGuide(id: string, language: Language): LocalizedGuide | undefined {
  const guide = library.getGuide(id);
  return guide ? localizeGuide(guide, language) : undefined;
}

export function listGuides(): readonly Guide[] {
  return library.guides;
}

/** The Guide Library in the UI language. */
export function useGuides(): LocalizedLibrary {
  const { language } = usePreferences();
  return useMemo(() => localizeLibrary(library, language), [language]);
}

export default {
  id: 'guides',
  tab: 'guides',
  Screen: GuidesScreen,
  hikeModes: ['solo', 'group'],
  offlineNeeds: ['guide-library'],
} satisfies FeatureModule;
