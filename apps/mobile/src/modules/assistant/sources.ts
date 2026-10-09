// Source chips: which chips an answer shows, and what each says. Pure.

import type { Language } from '../../i18n/types';
import type { Chunk } from './corpus';
import { fill } from './format.ts';

export type ChipStrings = {
  appHelp: string;
  guideChip: string;
  topicGettingThere: string;
  topicRegistration: string;
  topicWater: string;
  topicCampsites: string;
  topicHazards: string;
};

export type ChipGroup = { label: string; chunks: Chunk[] };

/**
 * Chips as shown: numbered parts of one pack topic (batulao-water-1 and -2) share one chip,
 * whose sheet shows both passages. Distinct passages that happen to share a topic (Mt. Ulap's
 * fees and its guides-and-porters passage are both "registration") each keep their own
 * chip, named after the passage so the two labels differ (#53).
 */
export function chipGroups(sources: readonly Chunk[], s: ChipStrings): ChipGroup[] {
  const groups: (ChipGroup & { key: string })[] = [];
  for (const chunk of chipSources(sources)) {
    const label = chipLabel(chunk, s);
    const key = mergeKey(chunk, label);
    const existing = groups.find((g) => g.key === key);
    if (existing) existing.chunks.push(chunk);
    else groups.push({ key, label, chunks: [chunk] });
  }
  return groups.map(({ key, label, chunks }) => {
    const clash = groups.some((g) => g.key !== key && g.label === label);
    return { label: clash ? (namedLabel(chunks[0]) ?? label) : label, chunks };
  });
}

/** Same key, same chip: a pack passage minus its part number, else the label itself. */
function mergeKey(chunk: Chunk, label: string): string {
  return chunk.target.type === 'passage' ? chunk.group.replace(/-\d+$/, '') : label;
}

/**
 * "Mt. Ulap · Guides and porters" from pack:ulap-05-guides-and-porters. Undefined when the
 * id carries no name of its own (batulao-water-1).
 */
function namedLabel(chunk: Chunk): string | undefined {
  if (chunk.target.type !== 'passage') return undefined;
  const slug = chunk.group
    .replace(/^pack:/, '')
    .replace(new RegExp(`^${chunk.target.destinationId}-`), '')
    .replace(/^\d+-/, '')
    .replace(/-\d+$/, '');
  if (!slug || slug.replace(/-/g, '_') === chunk.topic) return undefined;
  const name = slug.replace(/-/g, ' ');
  return `${chunk.destinationName ?? ''} · ${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

/** One chip per Guide, per pack passage pair and per help topic, in first-cited order. */
export function chipSources(sources: readonly Chunk[]): Chunk[] {
  const seen = new Set<string>();
  return sources.filter((chunk) => {
    const key = chunk.target.type === 'guide' ? `guide:${chunk.target.guideId}` : chunk.group;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** The chunk's twin in the UI language, if the corpus has one. */
export function inLanguage(chunk: Chunk, language: Language, corpus: readonly Chunk[]): Chunk {
  if (chunk.language === language) return chunk;
  return corpus.find((c) => c.group === chunk.group && c.language === language) ?? chunk;
}

const TOPIC_KEYS: Record<string, keyof ChipStrings> = {
  getting_there: 'topicGettingThere',
  registration: 'topicRegistration',
  water: 'topicWater',
  campsites: 'topicCampsites',
  hazards: 'topicHazards',
};

export function chipLabel(chunk: Chunk, s: ChipStrings): string {
  switch (chunk.target.type) {
    case 'guide':
      return fill(s.guideChip, { title: chunk.title });
    case 'help':
      return `${s.appHelp} · ${chunk.title}`;
    case 'passage': {
      const key = chunk.topic ? TOPIC_KEYS[chunk.topic] : undefined;
      const topic = key ? s[key] : (chunk.topic ?? '').replace(/_/g, ' ');
      return `${chunk.destinationName ?? ''} · ${topic}`;
    }
  }
}
