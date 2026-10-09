// The Guide Library loaded from the bundled content, and which Guide the Guides tab shows.
import { useSyncExternalStore } from 'react';
import { Linking } from 'react-native';

import { focusTab } from '../../shell/navigation';
import { contentFiles } from './content';
import { parseGuideLink } from './guideLink';
import { createLibrary, type GuideLibrary } from './library';
import { loadGuides } from './loader';

function load(): GuideLibrary {
  const { guides, problems } = loadGuides(contentFiles());
  for (const problem of problems) {
    const log = problem.level === 'error' ? console.error : console.warn;
    log(`[guides] ${problem.source}: ${problem.message}`);
  }
  return createLibrary(guides);
}

/** Loaded once, synchronously: the content is part of the bundle. */
export const library = load();

let openId: string | null = null;
const listeners = new Set<() => void>();

function setOpenId(next: string | null) {
  if (next === openId) return;
  openId = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The id of the Guide open in the Guides tab, or null for the list. */
export function useOpenGuideId(): string | null {
  return useSyncExternalStore(subscribe, () => openId);
}

/**
 * Opens a Guide in the Guides tab and brings the tab to the front. Returns false, and changes
 * nothing, when no Guide has that id.
 */
export function openGuide(id: string): boolean {
  if (!library.getGuide(id)) return false;
  setOpenId(id);
  focusTab('guides');
  return true;
}

/** Back to the Guide Library list. */
export function closeGuide() {
  setOpenId(null);
}

function handleLink(url: string | null) {
  const link = parseGuideLink(url);
  if (!link) return;
  if (link.id && openGuide(link.id)) return;
  if (link.id) console.warn(`[guides] tahak://guides/${link.id}: no Guide has that id`);
  closeGuide();
  focusTab('guides');
}

// Kept on globalThis so a Fast Refresh, which re-runs this file, replaces the listener
// instead of adding another.
type LinkGlobals = { tahakGuideLinks?: { remove(): void }; tahakGuideInitialUrlSeen?: boolean };
const linkGlobals = globalThis as LinkGlobals;

/** Handles tahak://guides/<id> links, whether or not the Guides tab has been opened yet. */
export function listenForGuideLinks() {
  if (!linkGlobals.tahakGuideInitialUrlSeen) {
    linkGlobals.tahakGuideInitialUrlSeen = true;
    void Linking.getInitialURL().then(handleLink, () => undefined);
  }
  linkGlobals.tahakGuideLinks?.remove();
  linkGlobals.tahakGuideLinks = Linking.addEventListener('url', ({ url }) => handleLink(url));
}
