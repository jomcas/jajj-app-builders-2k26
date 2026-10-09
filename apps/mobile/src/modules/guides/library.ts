// Grouping, lookup and localizing of loaded Guides. Pure, tested under plain Node.
import type { Language } from '../../i18n/types';
import { CATEGORIES, compareGuides } from './loader.ts';
import type { Guide, GuideSection, LocalizedGuide } from './types';

export type GuideLibrary = {
  /** Every Guide, sorted by group, then order, then id. */
  guides: readonly Guide[];
  /** The plan's three groups, in order, leaving out any group with no Guides. */
  sections: readonly GuideSection[];
  getGuide(id: string): Guide | undefined;
};

export function groupGuides(guides: readonly Guide[]): GuideSection[] {
  return CATEGORIES.map((category) => ({
    category,
    guides: guides.filter((guide) => guide.category === category).sort(compareGuides),
  })).filter((section) => section.guides.length > 0);
}

export function createLibrary(guides: readonly Guide[]): GuideLibrary {
  const sorted = [...guides].sort(compareGuides);
  const byId = new Map(sorted.map((guide) => [guide.id, guide]));
  return { guides: sorted, sections: groupGuides(sorted), getGuide: (id) => byId.get(id) };
}

export function localizeGuide(guide: Guide, language: Language): LocalizedGuide {
  return {
    id: guide.id,
    kind: guide.kind,
    category: guide.category,
    title: guide.title[language],
    summary: guide.summary[language],
    callForHelp: guide.callForHelp[language],
    steps: guide.steps[language],
    doNot: guide.doNot[language],
    watchFor: guide.watchFor[language],
    keywords: guide.keywords[language],
    sources: guide.sources,
    review: guide.review,
  };
}

export type LocalizedLibrary = {
  guides: LocalizedGuide[];
  sections: { category: GuideSection['category']; guides: LocalizedGuide[] }[];
};

/** The whole library in one language. */
export function localizeLibrary(library: GuideLibrary, language: Language): LocalizedLibrary {
  return {
    guides: library.guides.map((guide) => localizeGuide(guide, language)),
    sections: library.sections.map((section) => ({
      category: section.category,
      guides: section.guides.map((guide) => localizeGuide(guide, language)),
    })),
  };
}
