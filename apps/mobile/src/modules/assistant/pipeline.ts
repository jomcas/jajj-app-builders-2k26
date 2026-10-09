// The Assistant's answer pipeline (ADR 0003, ADR 0005), in this order:
//
//   answer(question) = emergencyRoute? → relevanceGate → retrieve → generate
//
// 1. emergencyRoute (#15): an emergency or medical question opens its Guide; nothing else runs.
// 2. relevanceGate: the question is embedded and searched; if the closest passage scores
//    below the threshold, the fixed off-topic reply is shown and the model never runs.
// 3. retrieve: the best few passages (one per language pair) go into the prompt.
// 4. generate: the model answers from them under a scope-restricted system prompt. An answer
//    that cites none of them falls back to the off-topic reply.
//
// Pure: the search, the model and the emergency route are passed in, so tests run in Node.

import type { Language } from '../../i18n/types';
import { displayText, trimUnfinished, usedPassages } from './citations.ts';
import type { Chunk } from './corpus';
import { gateDecision, type GateDecision } from './gate.ts';
import { buildMessages, MAX_PROMPT_PASSAGES, PASSAGE_SCORE_SPREAD, type ChatMessage } from './prompt.ts';

export type Hit = { chunk: Chunk; score: number };

/** What #15's emergency route returns when it takes over a question. */
export type EmergencyReply = { kind: 'emergency'; guideId: string; summary?: string };

export type GenerateResult = {
  text: string;
  /** True if the answer hit the token cap rather than ending on its own. */
  truncated: boolean;
  ttftMs: number;
  generationTps: number;
  /** Prompt tokens reused from llama.rn's cache rather than evaluated. */
  cachedTokens?: number;
  promptTokens: number;
  generatedTokens: number;
};

export type PipelineDeps = {
  /** Stage 1, from #15. Returns null when the question is not an emergency. */
  emergencyRoute?: (question: string, language: Language) => Promise<EmergencyReply | null>;
  /** Embeds the question and returns the closest chunks, best first. */
  search: (question: string) => Promise<Hit[]>;
  threshold: number;
  /** Which language's twin of each passage goes into the prompt, per UI language (default en; the app passes the UI language). */
  passageLanguage?: (ui: Language) => Language;
  /** Runs the model, calling onText with the raw text so far. */
  generate: (messages: ChatMessage[], onText: (raw: string) => void) => Promise<GenerateResult>;
};

export type OffTopicReply = {
  kind: 'off-topic';
  /** gate: below the threshold, model not run. no-source: the model's answer cited nothing. */
  reason: 'gate' | 'no-source';
  gate: GateDecision;
  hits: Hit[];
  /** Only for no-source: what the model said (for the bench log; never shown). */
  raw?: string;
  generation?: GenerateResult;
};

export type AnswerReply = {
  kind: 'answer';
  text: string;
  /** The passages the answer cited, in first-cited order. Never empty. */
  sources: Chunk[];
  /** The passages the model was given. */
  passages: Chunk[];
  gate: GateDecision;
  hits: Hit[];
  raw: string;
  generation: GenerateResult;
};

export type Reply = EmergencyReply | OffTopicReply | AnswerReply;

/**
 * The passages for the prompt: the best hits, one per group (an en/fil pair counts once),
 * at most max and within PASSAGE_SCORE_SPREAD of the best (fewer prompt tokens, less noise),
 * using the twin in the prefer language when there is one.
 */
export function selectPassages(
  hits: readonly Hit[],
  all: readonly Chunk[],
  max = MAX_PROMPT_PASSAGES,
  prefer: Language = 'en',
): Chunk[] {
  const groups: string[] = [];
  const floor = (hits[0]?.score ?? 0) - PASSAGE_SCORE_SPREAD;
  for (const hit of hits) {
    if (hit.score < floor) break;
    if (!groups.includes(hit.chunk.group)) groups.push(hit.chunk.group);
    if (groups.length === max) break;
  }
  return groups.map((group) => {
    const twins = all.filter((c) => c.group === group);
    const fromHits = hits.find((h) => h.chunk.group === group)!.chunk;
    return twins.find((c) => c.language === prefer) ?? fromHits;
  });
}

export async function answerQuestion(
  question: string,
  language: Language,
  deps: PipelineDeps & { corpus: () => readonly Chunk[] },
  onDisplay?: (text: string) => void,
): Promise<Reply> {
  const emergency = await deps.emergencyRoute?.(question, language);
  if (emergency) return emergency;

  const hits = await deps.search(question);
  const gate = gateDecision(hits, deps.threshold);
  if (!gate.pass) return { kind: 'off-topic', reason: 'gate', gate, hits };

  const passages = selectPassages(hits, deps.corpus(), MAX_PROMPT_PASSAGES, deps.passageLanguage?.(language) ?? 'en');
  const messages = buildMessages(language, passages, question);
  const generation = await deps.generate(messages, (raw) => onDisplay?.(displayText(raw, passages.length)));
  const raw = generation.truncated ? trimUnfinished(generation.text) : generation.text;
  const sources = usedPassages(raw, passages);
  const text = displayText(raw, passages.length);
  if (sources.length === 0 || !text) {
    return { kind: 'off-topic', reason: 'no-source', gate, hits, raw: generation.text, generation };
  }
  return { kind: 'answer', text, sources, passages, gate, hits, raw, generation };
}
