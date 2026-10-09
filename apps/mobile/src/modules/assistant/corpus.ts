// The Assistant's search corpus: passages from each downloaded Destination Pack, from the
// Guide Library, and from the app-written help and topic passages (ADR 0005). Each passage
// becomes one or more chunks, which are embedded once and searched at question time. Pure.

import type { Language } from '../../i18n/types';

export type ChunkTarget =
  /** A Guide, opened with tahak://guides/<guideId>. */
  | { type: 'guide'; guideId: string }
  /** A Destination Pack passage; the chat shows the passage itself (Explore has no deep link). */
  | { type: 'passage'; destinationId: string }
  /** App-written help: not a Destination fact, shown as such. */
  | { type: 'help' };

export type Chunk = {
  /** Unique across the whole corpus, e.g. "pack:batulao-water-1-en" or "guide:snakebite:fil:1". */
  id: string;
  language: Language;
  /**
   * The same passage in the other language has the same group, so a hit in either language
   * finds both, and one source chip stands for both.
   */
  group: string;
  /** Short heading: the pack topic, the Guide title or the help topic. Not UI text. */
  title: string;
  text: string;
  /** Where the passage comes from, as shown on its source sheet. */
  source: string;
  target: ChunkTarget;
  /** Pack chunks only: the Destination's name and the passage topic (for the chip label). */
  destinationName?: string;
  topic?: string;
};

/** The parts of a Destination Pack the corpus needs (structurally a DestinationPack). */
export type PackForCorpus = {
  destination: { id: string; name: string; packVersion: number };
  passages: readonly { id: string; topic: string; language: Language; text: string; source: string }[];
};

/** Pack passage ids end in -en or -fil (e.g. batulao-water-1-en); the twins share the rest. */
export function twinKey(passageId: string): string {
  return passageId.replace(/-(en|fil)$/, '');
}

export function packChunks(pack: PackForCorpus): Chunk[] {
  return pack.passages.map((p) => ({
    id: `pack:${p.id}`,
    language: p.language,
    group: `pack:${twinKey(p.id)}`,
    title: `${pack.destination.name} · ${p.topic.replace(/_/g, ' ')}`,
    text: p.text,
    source: p.source,
    target: { type: 'passage', destinationId: pack.destination.id },
    destinationName: pack.destination.name,
    topic: p.topic,
  }));
}

export type HelpPassage = {
  id: string;
  title: Record<Language, string>;
  text: Record<Language, string>;
};

export const HELP_SOURCE = 'Tahak app help (written by the app team, not Destination facts)';

export function helpChunks(passages: readonly HelpPassage[]): Chunk[] {
  return passages.flatMap((p) =>
    (['en', 'fil'] as const).map((language) => ({
      id: `help:${p.id}:${language}`,
      language,
      group: `help:${p.id}`,
      title: p.title[language],
      text: p.text[language],
      source: HELP_SOURCE,
      target: { type: 'help' as const },
    })),
  );
}

// ---- Guides -------------------------------------------------------------------------------
// The Guide JSON format belongs to the Guides ticket (#10/#11): id, kind, title{en,fil},
// summary{en,fil}, steps, keywords{en,fil}, and more. Steps are read without assuming their
// exact shape: every string under them is collected, taking the en or fil branch wherever an
// object has one.

const MAX_CHUNK_CHARS = 700;

/** All text in value for one language, in document order. */
export function textsFor(value: unknown, language: Language): string[] {
  if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
  if (typeof value === 'number') return [];
  if (Array.isArray(value)) return value.flatMap((v) => textsFor(v, language));
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if ('en' in record || 'fil' in record) return textsFor(record[language], language);
    return Object.entries(record)
      .filter(([key]) => !SKIP_KEYS.has(key))
      .flatMap(([, v]) => textsFor(v, language));
  }
  return [];
}

// Fields that are identifiers or styling, not reading text.
const SKIP_KEYS = new Set(['id', 'kind', 'icon', 'image', 'images', 'severity', 'emergency', 'related', 'order', 'type']);

/** Joins pieces into chunks of at most maxChars, never splitting a piece unless it alone is too long. */
export function packPieces(pieces: readonly string[], maxChars = MAX_CHUNK_CHARS): string[] {
  const chunks: string[] = [];
  let current = '';
  for (const piece of pieces) {
    const parts = piece.length > maxChars ? splitLong(piece, maxChars) : [piece];
    for (const part of parts) {
      if (current && current.length + 1 + part.length > maxChars) {
        chunks.push(current);
        current = part;
      } else {
        current = current ? `${current}\n${part}` : part;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function splitLong(text: string, maxChars: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const out: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if (current && current.length + sentence.length > maxChars) {
      out.push(current.trim());
      current = '';
    }
    current += sentence;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

type GuideJson = {
  id?: unknown;
  title?: unknown;
  summary?: unknown;
  callForHelp?: unknown;
  keywords?: unknown;
  steps?: unknown;
  doNot?: unknown;
  watchFor?: unknown;
  [key: string]: unknown;
};

// Headings for the Guide's lists inside a chunk, so the model can tell a "do not" from a step.
const LIST_HEADINGS: Record<'doNot' | 'watchFor', Record<Language, string>> = {
  doNot: { en: 'Do not:', fil: 'Huwag:' },
  watchFor: { en: 'Watch for:', fil: 'Bantayan:' },
};

/**
 * One Guide becomes, per language: an overview chunk (summary, when to call for help,
 * keywords), its steps packed into chunks of up to ~700 characters, and its "do not" and
 * "watch for" lists. Every chunk carries the Guide title, so a chunk read alone still says
 * what it is about. Sources and review notes are left out.
 */
export function guideChunks(guide: GuideJson): Chunk[] {
  if (typeof guide.id !== 'string' || !guide.id) return [];
  const id = guide.id;
  return (['en', 'fil'] as const).flatMap((language) => {
    const title = textsFor(guide.title, language)[0] ?? id;
    const summary = textsFor(guide.summary, language).join(' ');
    const callForHelp = textsFor(guide.callForHelp, language).join(' ');
    const keywords = textsFor(guide.keywords, language).join(', ');
    const overview = [summary, callForHelp, keywords && `(${keywords})`].filter(Boolean).join(' ');
    const numbered = textsFor(guide.steps, language).map((step, i) => `${i + 1}. ${step}`);
    const lists = (['doNot', 'watchFor'] as const).flatMap((field) => {
      const items = textsFor(guide[field], language);
      return items.length ? packPieces([LIST_HEADINGS[field][language], ...items.map((t) => `- ${t}`)]) : [];
    });
    const texts = [overview, ...packPieces(numbered), ...lists].filter((t) => t.trim());
    return texts.map((text, index) => ({
      id: `guide:${id}:${language}:${index}`,
      language,
      group: `guide:${id}:${index}`,
      title,
      text,
      source: `Tahak Guide Library: ${title}`,
      target: { type: 'guide' as const, guideId: id },
    }));
  });
}

// ---- Content hash -------------------------------------------------------------------------

/** FNV-1a, 32-bit, as 8 hex digits. Enough to notice that a corpus part changed. */
export function fnv1a(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** Changes whenever the embedding model or any chunk's id, title or text changes. */
export function contentHash(modelId: string, chunks: readonly Chunk[]): string {
  return fnv1a([modelId, ...chunks.map((c) => `${c.id}\u0001${c.title}\u0001${c.text}`)].join('\u0002'));
}

export type StoredIndexHeader = { modelId: string; hash: string };

/**
 * Whether a corpus part must be embedded again: no stored vectors, another embedding model,
 * or different content (a new pack version changes the passages, and so the hash).
 */
export function needsReembed(stored: StoredIndexHeader | null, current: StoredIndexHeader): boolean {
  return !stored || stored.modelId !== current.modelId || stored.hash !== current.hash;
}
