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
