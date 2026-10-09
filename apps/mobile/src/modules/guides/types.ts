// The Guide data model. Pure types, so tests and other modules can import it under plain Node.
import type { Language } from '../../i18n/types';

export type GuideKind = 'emergency' | 'ordinary';

/** The plan's three Guide Library groups (docs/plan.md, "Guide Library (15)"). */
export type GuideCategory = 'injury' | 'hazard' | 'camp';

export type Localized<T> = Record<Language, T>;

export type GuideSource = {
  title: string;
  org: string;
  url: string;
  /** When the source was read, as written in the content file (an ISO date). */
  accessed: string;
};

export type GuideReview = {
  /** False until a human has checked the Guide against Philippine Red Cross material. */
  redCrossChecked: boolean;
  checkedBy: string | null;
  notes: string;
};

/** One Guide, as validated from its content file in content/<id>.json. */
export type Guide = {
  id: string;
  kind: GuideKind;
  category: GuideCategory;
  /** Position within its category; lower comes first. */
  order: number;
  title: Localized<string>;
  summary: Localized<string>;
  callForHelp: Localized<string>;
  steps: Localized<string[]>;
  doNot: Localized<string[]>;
  watchFor: Localized<string[]>;
  keywords: Localized<string[]>;
  sources: GuideSource[];
  review: GuideReview;
};

/** A Guide in one language: what a screen or the Assistant reads. */
export type LocalizedGuide = {
  id: string;
  kind: GuideKind;
  category: GuideCategory;
  title: string;
  summary: string;
  callForHelp: string;
  steps: string[];
  doNot: string[];
  watchFor: string[];
  keywords: string[];
  sources: GuideSource[];
  review: GuideReview;
};

export type GuideSection = { category: GuideCategory; guides: Guide[] };
