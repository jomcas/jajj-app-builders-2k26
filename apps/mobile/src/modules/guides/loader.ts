// Validates Guide content files. Pure (type-only imports), tested under plain Node.
//
// A Guide that fails validation is skipped and reported, never thrown: one bad file must not
// take the whole Guide Library down with it. English is required for every text field. A
// missing or empty Filipino field falls back to the English one and is reported, because
// showing an Emergency Guide in English beats not showing it at all.
import type { Guide, GuideCategory, GuideKind, GuideReview, GuideSource, Localized } from './types';

export const KINDS: readonly GuideKind[] = ['emergency', 'ordinary'];
export const CATEGORIES: readonly GuideCategory[] = ['injury', 'hazard', 'camp'];
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type GuideProblem = {
  /** Where the Guide came from, e.g. its file name. */
  source: string;
  /** 'error': the Guide was skipped. 'warning': it loaded with a fallback. */
  level: 'error' | 'warning';
  message: string;
};

export type ParseResult = { guide: Guide | null; problems: GuideProblem[] };

type Raw = Record<string, unknown>;

class Invalid extends Error {}

function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isTextList(value: unknown, allowEmpty: boolean): value is string[] {
  return Array.isArray(value) && (allowEmpty || value.length > 0) && value.every(isText);
}

/**
 * Parses one Guide. Returns the Guide (or null when it must be skipped) and every problem found.
 */
export function parseGuide(raw: unknown, source: string): ParseResult {
  const problems: GuideProblem[] = [];
  const warn = (message: string) => problems.push({ source, level: 'warning', message });

  try {
    if (!isRecord(raw)) throw new Invalid('is not a JSON object');
    const id = raw.id;
    if (typeof id !== 'string' || !ID.test(id)) throw new Invalid('has no valid "id" (lowercase-with-dashes)');
    if (!KINDS.includes(raw.kind as GuideKind)) throw new Invalid(`"kind" must be one of ${KINDS.join(', ')}`);
    if (!CATEGORIES.includes(raw.category as GuideCategory)) {
      throw new Invalid(`"category" must be one of ${CATEGORIES.join(', ')}`);
    }
    if (typeof raw.order !== 'number' || !Number.isFinite(raw.order)) throw new Invalid('"order" must be a number');

    const localized = <T>(field: string, valid: (value: unknown) => value is T, required: boolean): Localized<T> => {
      const value = raw[field];
      if (!isRecord(value)) throw new Invalid(`"${field}" must be an object with "en" and "fil"`);
      if (!valid(value.en)) {
        throw new Invalid(`"${field}.en" is missing or ${required ? 'empty' : 'not a list of text'}`);
      }
      if (valid(value.fil)) return { en: value.en, fil: value.fil };
      warn(`"${field}.fil" is missing or invalid; showing English instead`);
      return { en: value.en, fil: value.en };
    };
    const text = (value: unknown): value is string => isText(value);
    const steps = (value: unknown): value is string[] => isTextList(value, false);
    const list = (value: unknown): value is string[] => isTextList(value, true);

    const guide: Guide = {
      id,
      kind: raw.kind as GuideKind,
      category: raw.category as GuideCategory,
      order: raw.order,
      title: localized('title', text, true),
      summary: localized('summary', text, true),
      callForHelp: localized('callForHelp', text, true),
      steps: localized('steps', steps, true),
      doNot: localized('doNot', list, false),
      watchFor: localized('watchFor', list, false),
      keywords: localized('keywords', list, false),
      sources: parseSources(raw.sources, warn),
      review: parseReview(raw.review, warn),
    };
    if (guide.steps.en.length !== guide.steps.fil.length) {
      warn(`"steps" has ${guide.steps.en.length} English and ${guide.steps.fil.length} Filipino entries`);
    }
    return { guide, problems };
  } catch (error) {
    if (!(error instanceof Invalid)) throw error;
    problems.push({ source, level: 'error', message: `skipped: ${error.message}` });
    return { guide: null, problems };
  }
}

function parseSources(value: unknown, warn: (message: string) => void): GuideSource[] {
  if (!Array.isArray(value)) {
    warn('"sources" is missing');
    return [];
  }
  const sources: GuideSource[] = [];
  for (const entry of value) {
    if (isRecord(entry) && isText(entry.title) && isText(entry.org)) {
      sources.push({
        title: entry.title,
        org: entry.org,
        url: typeof entry.url === 'string' ? entry.url : '',
        accessed: typeof entry.accessed === 'string' ? entry.accessed : '',
      });
    } else {
      warn('a source without a "title" and "org" was left out');
    }
  }
  return sources;
}

/** An unreadable review block counts as not checked: the safe default. */
function parseReview(value: unknown, warn: (message: string) => void): GuideReview {
  if (!isRecord(value)) {
    warn('"review" is missing; treating the Guide as not yet checked');
    return { redCrossChecked: false, checkedBy: null, notes: '' };
  }
  return {
    redCrossChecked: value.redCrossChecked === true,
    checkedBy: typeof value.checkedBy === 'string' ? value.checkedBy : null,
    notes: typeof value.notes === 'string' ? value.notes : '',
  };
}

export type ContentFile = { source: string; raw: unknown };

/**
 * Parses every content file. Invalid Guides and later duplicates of an id are skipped. The
 * result is sorted by category (the plan's group order), then order, then id.
 */
export function loadGuides(files: readonly ContentFile[]): { guides: Guide[]; problems: GuideProblem[] } {
  const guides: Guide[] = [];
  const problems: GuideProblem[] = [];
  const seen = new Set<string>();
  for (const { source, raw } of files) {
    const result = parseGuide(raw, source);
    problems.push(...result.problems);
    if (!result.guide) continue;
    if (seen.has(result.guide.id)) {
      problems.push({ source, level: 'error', message: `skipped: another Guide already uses the id "${result.guide.id}"` });
      continue;
    }
    seen.add(result.guide.id);
    guides.push(result.guide);
  }
  guides.sort(compareGuides);
  return { guides, problems };
}

export function compareGuides(a: Guide, b: Guide): number {
  return (
    CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) ||
    a.order - b.order ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}
