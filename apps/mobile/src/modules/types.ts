import type { ComponentType } from 'react';

import type { Language } from '../i18n/types';

/** The four bottom tabs. The shell owns them; Feature Modules plug screens into them. */
export type TabId = 'explore' | 'hike' | 'ask' | 'guides';

export type HikeMode = 'solo' | 'group';

/** Props of a launch gate: it calls onDone once the hiker may continue, optionally naming the tab to open. */
export type LaunchGateProps = { onDone: (next?: { tab: TabId }) => void };

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
 * What the shell's SOS control does (ADR 0001: the shell owns where it sits, the Flare module
 * what it does). One module supplies it.
 */
export type SosAction = {
  /** Opened by a tap on the SOS control, from any tab. Shows itself (a modal) while visible. */
  Screen: ComponentType<{ visible: boolean; onClose: () => void }>;
  /** A hook: true while the signal runs, which turns the SOS control fully red (ADR 0004). */
  useActive: () => boolean;
  /**
   * Lets the module open its Screen without a tap on SOS, e.g. the Assistant's Flare tool.
   * The shell subscribes the SOS control of the focused tab; returns the unsubscribe.
   */
  onOpenRequest?: (open: () => void) => () => void;
};

/** One parameter an Assistant tool takes, JSON-schema style. */
export type ToolParameter = {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  enum?: readonly string[];
  required?: boolean;
};

/**
 * What a tool returns: fixed, translated text written by the module (never by the model),
 * an optional title for its card, and structured data for logs and tests.
 */
export type ToolResult = {
  text: string;
  title?: string;
  data?: Record<string, unknown>;
};

/**
 * A tool the Assistant may call (ADR 0001). The owning module defines it and lists it in its
 * `tools`; adding one touches only that module. The Assistant picks a tool with `match`, a
 * cheap deterministic intent match (en, fil, Taglish), after emergency routing and before
 * the relevance gate, then shows `run`'s result as is.
 */
export type AssistantTool = {
  /** Unique across modules, e.g. 'hike.distance-to-next-waypoint'. */
  id: string;
  /** What the tool does, in each language. */
  description: Record<Language, string>;
  parameters: readonly ToolParameter[];
  /** The arguments when the question asks for this tool, or null when it does not. */
  match: (question: string) => Record<string, unknown> | null;
  run: (args: Record<string, unknown>, context: { language: Language }) => Promise<ToolResult>;
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
  /**
   * Optional full screen the shell shows before the tabs at launch, such as first-launch
   * setup. It decides itself whether it is needed and calls onDone (at once, if not).
   */
  launchGate?: ComponentType<LaunchGateProps>;
  /** The SOS control's action. Only the Flare supplies one. */
  sos?: SosAction;
  /** Tools the Assistant may call (ADR 0001). */
  tools?: readonly AssistantTool[];
};
