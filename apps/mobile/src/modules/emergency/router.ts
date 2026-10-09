// Emergency routing (issue #15, ADR 0003): decides whether a question is about an emergency
// and, if so, which Guide answers it. Pure, deterministic and offline: no model, no embedding,
// no network, so it runs first in the Assistant's pipeline, before the relevance gate and the
// model (ADR 0005), in about a millisecond. Tested under plain Node.
//
// The scoring rules and the words live in lexicon.ts; normalisation in normalize.ts.
import type { Language } from '../../i18n/types';
import type { Guide } from '../guides/types';
import {
  CUES,
  DISTANT_PAST,
  FIRE_AT,
  NEGATION_EXCEPTIONS,
  NEGATORS,
  NOW_CUES,
  PATTERN_STOPWORDS,
  PRIORITY,
  RULES,
  SHORT_QUESTION_WORDS,
  type GuideRules,
} from './lexicon.ts';
import { BOUNDARY, tokenize, wordMatches } from './normalize.ts';

/** What routeEmergency returns when a question is an emergency. */
export type EmergencyRoute = {
  /** The Guide to open. Always one in the Guide Library. */
  guideId: string;
  /** 0–1. 1 means a decisive phrase plus a distress cue, or two decisive phrases. */
  confidence: number;
  /** The phrases that decided it, as written in the lexicon or the Guide's keywords. */
  matched: string[];
};

/**
 * An optional second stage for near misses, such as an embedding check (issue #14's embedder
 * could fill it). Given the question and the Guides that scored something without firing, it
 * returns the Guide to open, or null. The lexicon alone decides everything else.
 */
export type SecondStage = (
  question: string,
  candidates: readonly { guideId: string; score: number }[],
) => Promise<string | null>;

/** Every Guide's score for one question, for tests and the bench. */
export type Explanation = {
  tokens: string[];
  scores: Record<string, number>;
  matched: Record<string, string[]>;
  cue: string | null;
  distantPast: boolean;
};

export type EmergencyRouter = {
  route(question: string, uiLanguage: Language): EmergencyRoute | null;
  routeWithSecondStage(question: string, uiLanguage: Language, secondStage?: SecondStage): Promise<EmergencyRoute | null>;
  explain(question: string): Explanation;
};

/**
 * At most this many words may sit between two words of a pattern, not counting small words
 * ("kulang na kami sa tubig" matches "kulang … tubig"), and never more than MAX_SPAN in all.
 */
const MAX_GAP = 2;
const MAX_SPAN = 4;
/** Near misses at or above this score go to the second stage, if there is one. */
const NEAR_MISS = 0.5;

type Pattern = { text: string; words: string[]; hasNegator: boolean };

/** Lexicon patterns drop small words; the cue and time lists keep every word. */
function compile(text: string, keepSmallWords = false): Pattern {
  const tokens = tokenize(text).filter((word) => word !== BOUNDARY);
  const content = keepSmallWords ? tokens : tokens.filter((word) => !PATTERN_STOPWORDS.has(word));
  const words = content.length ? content : tokens;
  return { text, words, hasNegator: words.some((word) => NEGATORS.has(word)) };
}

/** Positions of each match of a pattern in the question, in order, within one clause. */
function findMatches(tokens: readonly string[], pattern: Pattern): number[][] {
  const matches: number[][] = [];
  for (let start = 0; start < tokens.length; start++) {
    if (tokens[start] === BOUNDARY || !wordMatches(tokens[start], pattern.words[0])) continue;
    const positions = [start];
    for (let k = 1; k < pattern.words.length; k++) {
      const last = positions[positions.length - 1];
      let found = -1;
      let gap = 0;
      for (let p = last + 1; p <= last + 1 + MAX_SPAN && p < tokens.length; p++) {
        if (tokens[p] === BOUNDARY) break;
        if (wordMatches(tokens[p], pattern.words[k])) {
          found = p;
          break;
        }
        if (!PATTERN_STOPWORDS.has(tokens[p]) && ++gap > MAX_GAP) break;
      }
      if (found < 0) break;
      positions.push(found);
    }
    if (positions.length === pattern.words.length) matches.push(positions);
  }
  return matches;
}

/**
 * Is the match negated: a negator up to two words before it in the same clause, or between its
 * words ("I'm not lost" must not match "im … lost")?
 */
function negated(tokens: readonly string[], positions: readonly number[]): boolean {
  const start = positions[0];
  for (let p = start + 1; p < positions[positions.length - 1]; p++) {
    if (!positions.includes(p) && NEGATORS.has(tokens[p])) return true;
  }
  for (let p = start - 1; p >= Math.max(0, start - 2); p--) {
    if (tokens[p] === BOUNDARY) return false;
    if (NEGATORS.has(tokens[p])) {
      // "I don't know", "hindi ko alam": the negator belongs to another verb.
      const after = tokens.slice(p + 1, p + 3);
      return !after.some((word) => NEGATION_EXCEPTIONS.has(word));
    }
  }
  return false;
}

function firstMatch(tokens: readonly string[], patterns: readonly Pattern[]): Pattern | null {
  for (const pattern of patterns) if (findMatches(tokens, pattern).length) return pattern;
  return null;
}

type CompiledConcept = { id: string; weight: number; anchor: boolean; curated: boolean; patterns: Pattern[] };
type CompiledRules = {
  guideId: string;
  cueBoost: boolean;
  concepts: CompiledConcept[];
  dampeners: { weight: number; patterns: Pattern[] }[];
};

function compileRules(rules: GuideRules, guide: Guide): CompiledRules {
  const concepts: CompiledConcept[] = rules.concepts.map((concept) => ({
    id: concept.id,
    weight: concept.weight,
    anchor: concept.anchor === true,
    curated: true,
    patterns: concept.patterns.map((pattern) => compile(pattern)),
  }));
  if (rules.useGuideKeywords) {
    const keywords = new Set([...guide.keywords.en, ...guide.keywords.fil].map((keyword) => keyword.trim()).filter(Boolean));
    for (const keyword of keywords) {
      concepts.push({ id: `keyword:${keyword}`, weight: 0.5, anchor: false, curated: false, patterns: [compile(keyword)] });
    }
  }
  return {
    guideId: rules.guideId,
    cueBoost: rules.cueBoost,
    concepts,
    dampeners: (rules.dampeners ?? []).map((dampener) => ({ weight: dampener.weight, patterns: dampener.patterns.map((pattern) => compile(pattern)) })),
  };
}

type Candidate = { concept: CompiledConcept; pattern: Pattern; positions: number[] };

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Builds a router over a Guide Library. Rules whose Guide is not in the library are left out,
 * so the router never names a Guide that cannot be opened.
 */
export function createEmergencyRouter(guides: readonly Guide[]): EmergencyRouter {
  const byId = new Map(guides.map((guide) => [guide.id, guide]));
  const compiled = RULES.flatMap((rules) => {
    const guide = byId.get(rules.guideId);
    return guide ? [compileRules(rules, guide)] : [];
  });
  const cues = CUES.map((cue) => compile(cue, true));
  const nowCues = NOW_CUES.map((cue) => compile(cue, true));
  const distantPast = DISTANT_PAST.map((marker) => compile(marker, true));
  const rank = (guideId: string) => {
    const index = PRIORITY.indexOf(guideId);
    return index < 0 ? PRIORITY.length : index;
  };

  function explain(question: string): Explanation {
    const tokens = tokenize(question);
    const words = tokens.filter((word) => word !== BOUNDARY);
    const cue = firstMatch(tokens, cues);
    const isPast = firstMatch(tokens, distantPast) !== null && firstMatch(tokens, nowCues) === null;
    const short = words.length > 0 && words.length <= SHORT_QUESTION_WORDS;

    // Every match of every pattern, per Guide, leaving out negated ones.
    const candidates = new Map<string, Candidate[]>();
    for (const rules of compiled) {
      const list: Candidate[] = [];
      for (const concept of rules.concepts) {
        for (const pattern of concept.patterns) {
          for (const positions of findMatches(tokens, pattern)) {
            if (!pattern.hasNegator && negated(tokens, positions)) continue;
            list.push({ concept, pattern, positions });
          }
        }
      }
      // Strongest first, then the curated lexicon before the Guide's keywords (so an anchor
      // is not hidden behind a keyword phrase), then longest.
      list.sort(
        (a, b) =>
          b.concept.weight - a.concept.weight ||
          Number(b.concept.curated) - Number(a.concept.curated) ||
          b.positions.length - a.positions.length,
      );
      candidates.set(rules.guideId, list);
    }

    // A word that is part of a decisive phrase of one Guide ("hilo sa taas") cannot also count
    // as a single word for another Guide ("hilo" for heat illness).
    const phraseOwner = new Map<number, string>();
    for (const [guideId, list] of candidates) {
      for (const candidate of list) {
        if (candidate.concept.weight >= FIRE_AT && candidate.positions.length > 1) {
          for (const position of candidate.positions) if (!phraseOwner.has(position)) phraseOwner.set(position, guideId);
        }
      }
    }

    const scores: Record<string, number> = {};
    const matched: Record<string, string[]> = {};
    for (const rules of compiled) {
      const used = new Set<number>();
      const conceptScores = new Map<string, number>();
      const phrases: string[] = [];
      let anchored = false;
      for (const candidate of candidates.get(rules.guideId) ?? []) {
        const { concept, pattern, positions } = candidate;
        if (positions.some((position) => used.has(position))) continue;
        if (positions.length === 1 && (phraseOwner.get(positions[0]) ?? rules.guideId) !== rules.guideId) continue;
        for (const position of positions) used.add(position);
        if ((conceptScores.get(concept.id) ?? 0) < concept.weight) conceptScores.set(concept.id, concept.weight);
        if (concept.anchor) anchored = true;
        phrases.push(pattern.text);
      }
      let score = [...conceptScores.values()].reduce((sum, weight) => sum + weight, 0);
      if (score > 0 && rules.cueBoost && anchored && (cue || short)) {
        score += 0.5;
        phrases.push(cue ? `cue: ${cue.text}` : 'cue: short question');
      }
      for (const dampener of rules.dampeners) {
        const hit = firstMatch(tokens, dampener.patterns);
        if (hit && score > 0) {
          score -= dampener.weight;
          phrases.push(`dampened: ${hit.text}`);
        }
      }
      if (isPast) score = 0;
      scores[rules.guideId] = round(Math.max(0, score));
      matched[rules.guideId] = phrases;
    }
    return { tokens, scores, matched, cue: cue?.text ?? null, distantPast: isPast };
  }

  function ranked(explanation: Explanation) {
    return Object.entries(explanation.scores)
      .filter(([, score]) => score > 0)
      .sort(([a, sa], [b, sb]) => sb - sa || rank(a) - rank(b))
      .map(([guideId, score]) => ({ guideId, score }));
  }

  function route(question: string, _uiLanguage: Language): EmergencyRoute | null {
    const explanation = explain(question);
    const best = ranked(explanation)[0];
    if (!best || best.score < FIRE_AT) return null;
    return {
      guideId: best.guideId,
      confidence: round(Math.min(1, best.score / 1.5)),
      matched: explanation.matched[best.guideId],
    };
  }

  async function routeWithSecondStage(
    question: string,
    uiLanguage: Language,
    secondStage?: SecondStage,
  ): Promise<EmergencyRoute | null> {
    const decided = route(question, uiLanguage);
    if (decided || !secondStage) return decided;
    const nearMisses = ranked(explain(question)).filter(({ score }) => score >= NEAR_MISS);
    if (!nearMisses.length) return null;
    const guideId = await secondStage(question, nearMisses);
    if (!guideId || !nearMisses.some((candidate) => candidate.guideId === guideId)) return null;
    return { guideId, confidence: 0.5, matched: ['second stage'] };
  }

  return { route, routeWithSecondStage, explain };
}
