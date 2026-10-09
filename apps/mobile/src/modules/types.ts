import type { ComponentType } from 'react';

/** The four bottom tabs. The shell owns them; Feature Modules plug screens into them. */
export type TabId = 'explore' | 'hike' | 'ask' | 'guides';

export type HikeMode = 'solo' | 'group';

/** Where a module's screen goes. A module either fills one tab or has no screen at all. */
type TabSlot =
  | {
      /** The tab whose screen this module provides. One module per tab for now. */
      tab: TabId;
      /** Rendered under the shell's header (title and SOS control) and above the tab bar. */
      Screen: ComponentType;
    }
  | {
      // No tab, e.g. the Flare, which supplies the SOS control's action rather than a screen.
      tab?: undefined;
      Screen?: undefined;
    };

/**
 * A self-contained feature (ADR 0001). Each lives in src/modules/<id>/, default-exports one
 * of these, and is listed with one line in src/modules/registry.ts. A module never edits the
 * shell or another module; it reaches other modules only through their public exports.
 */
export type FeatureModule = TabSlot & {
  /** Unique, matches the folder name. */
  id: string;
  /** Which Hike modes the feature applies to. */
  hikeModes: readonly HikeMode[];
  /** What must already be on the phone for it to work offline (ADR 0002). */
  offlineNeeds: readonly ('model' | 'destination-pack' | 'guide-library' | 'forecast')[];
};
