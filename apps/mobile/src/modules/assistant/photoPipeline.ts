// The Assistant's pipeline for a photo question (Vision, #18). The same order as a text
// question (pipeline.ts; ADR 0003, ADR 0005), with two changes for the photo:
//
//   answerPhoto(question, photo) = emergencyRoute? → tool? → photo gate → retrieve → generate → guard
//
// 1. emergencyRoute: the question TEXT goes through #15's router first. "Nakagat ako ng ahas na
//    ito" or "dumudugo ito, ano gagawin" opens the Emergency Guide card, and the model (and the
//    vision file) never run. The photo is not looked at.
// 1b. tool (#19): a question a module's tool matches runs that tool, as for text; no model runs.
// 2. photo gate (ADR 0005): the text is searched and gated as usual. Text that passes gets the
//    best passage. Text that fails is still answered when it is a short question about the
//    photo itself ("what is this?", "anong halaman ito?"): a photo taken on a hike is treated as
//    in scope. Any other text (no reference to the photo, or long) gets the fixed off-topic
//    reply without running the model.
// 3. generate: the photo plus the text under a photo system prompt (photoPrompt.ts) that keeps
//    to hiking topics, replies NONE otherwise, never calls wild food or water safe, and never
//    gives first aid: it points to the Guides.
// 4. guard (ADR 0003): the router also reads the model's own words as they stream. If the
//    answer turns to an emergency (a bite, bleeding, a fracture, lightning…), generation stops,
//    nothing more is shown, and the Emergency Guide card replaces the text. The chat shows
//    the answer one finished sentence at a time, each checked first, so first-aid text that the
//    router recognises is never on screen.
//
// Pure: the search, the model and the router are passed in, so tests run in Node.

import type { Language } from '../../i18n/types';
import type { AssistantTool } from '../types';
import { capLength, isNoAnswer, MAX_ANSWER_CHARS, trimUnfinished, usedPassages } from './citations.ts';
import type { Chunk } from './corpus';
import { gateDecision, type GateDecision } from './gate.ts';
import { stripMarkdown } from './markdown.ts';
import { buildPhotoMessages, MAX_PHOTO_PASSAGES, type PhotoMessage } from './photoPrompt.ts';
import { selectPassages, type EmergencyReply, type GenerateResult, type Hit, type ToolReply } from './pipeline.ts';
import { matchTool } from './tools.ts';

/** Most words a question may have and still count as "about the photo" when the gate fails. */
export const PHOTO_QUESTION_MAX_WORDS = 12;

// Words that point at the photo: "what is THIS?", "anong halaman ITO?", "pwede bang kainin YAN?".
const PHOTO_WORDS = new Set([
  'this', 'that', 'these', 'those', 'it', 'its', "it's", 'here', 'photo', 'picture', 'pic', 'image', 'shot',
  'ito', "'to", 'to', 'iyan', 'yan', 'yun', 'iyon', 'yon', 'ire', 'nito', 'niyan', 'niyon', 'dito', 'diyan', 'doon',
  'ganito', 'ganyan', 'ganoon', 'litrato', 'larawan', 'kuha',
]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Is this a short question about the photo itself? Empty text counts (the photo is the question). */
export function refersToPhoto(question: string): boolean {
  const w = words(question);
  if (w.length === 0) return true;
  return w.length <= PHOTO_QUESTION_MAX_WORDS && w.some((word) => PHOTO_WORDS.has(word));
}

export type PhotoScope = 'text' | 'photo';

/** ADR 0005 for photos: in scope by the text gate, or as a short question about the photo. */
export function photoScope(question: string, gate: GateDecision): PhotoScope | null {
  if (gate.pass) return 'text';
  return refersToPhoto(question) ? 'photo' : null;
}

// [1], [1,3], [1][2]
const CITATION = /\[\s*\d{1,2}(?:\s*[,;&]\s*\d{1,2})*\s*\]/g;

/**
 * What the chat shows for a photo answer: nothing for NONE; otherwise the text without citation
 * markers and markdown. While streaming, only finished sentences (each one already checked by
 * the guard); the unfinished tail waits.
 */
export function photoDisplayText(raw: string, final: boolean): string {
  if (isNoAnswer(raw)) return '';
  let text = raw;
  if (!final) {
    // The end of the last finished sentence: . ! ? (plus closing ** or quotes) before a space.
    let end = -1;
    for (const m of text.matchAll(/[.!?][*_"'”)\]]*(?=\s)|\n/g)) end = m.index + m[0].length;
    text = end >= 0 ? text.slice(0, end) : '';
  }
  const cleaned = text
    .replace(CITATION, '')
    .replace(/[ \t]+([.,;:!?])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ');
  return capLength(stripMarkdown(cleaned), MAX_ANSWER_CHARS);
}

export type PhotoEmergencyReply = EmergencyReply & {
  photo: true;
  /** question: the text was an emergency (model not run). answer: the guard stopped the answer. */
  stage: 'question' | 'answer';
  generation?: GenerateResult;
  raw?: string;
};

export type PhotoOffTopicReply = {
  kind: 'off-topic';
  photo: true;
  /** gate: the text failed the gate and is not about the photo. no-source: the model said NONE. */
  reason: 'gate' | 'no-source';
  gate: GateDecision;
  hits: Hit[];
  raw?: string;
  generation?: GenerateResult;
};

export type PhotoAnswerReply = {
  kind: 'photo-answer';
  photo: true;
  text: string;
  /** Passages the answer cited (may be empty: the photo itself is the source). */
  sources: Chunk[];
  passages: Chunk[];
  scope: PhotoScope;
  gate: GateDecision;
  hits: Hit[];
  raw: string;
  generation: GenerateResult;
};

export type PhotoToolReply = ToolReply & { photo: true; generation?: undefined; raw?: undefined };

export type PhotoReply = PhotoEmergencyReply | PhotoToolReply | PhotoOffTopicReply | PhotoAnswerReply;

export type PhotoPipelineDeps = {
  emergencyRoute: (question: string, language: Language) => Promise<EmergencyReply | null>;
  /** The registered modules' tools (#19), matched after the emergency route. */
  tools?: readonly AssistantTool[];
  /** The router on the model's own words: a Guide match, or null. Synchronous, ~1 ms. */
  guard: (text: string, language: Language) => EmergencyReply | null;
  search: (question: string) => Promise<Hit[]>;
  corpus: () => readonly Chunk[];
  threshold: number;
  passageLanguage?: (ui: Language) => Language;
  generate: (messages: PhotoMessage[], onText: (raw: string) => void) => Promise<GenerateResult>;
  /** Asks the running generation to stop early (the guard tripped). */
  stop?: () => void;
};

/**
 * Stages 1 and 1b, which never need the model: an emergency or a tool. The app runs this before
 * queueing a photo question, so an emergency never waits behind a photo being read.
 */
export async function routeBeforeModel(
  question: string,
  language: Language,
  deps: Pick<PhotoPipelineDeps, 'emergencyRoute' | 'tools'>,
): Promise<PhotoEmergencyReply | PhotoToolReply | null> {
  const emergency = await deps.emergencyRoute(question, language);
  if (emergency) return { ...emergency, photo: true, stage: 'question' };

  const call = matchTool(deps.tools ?? [], question);
  if (call) {
    const result = await call.tool.run(call.args, { language });
    return { kind: 'tool', photo: true, toolId: call.tool.id, args: call.args, result };
  }
  return null;
}

export async function answerPhotoQuestion(
  question: string,
  photoUri: string,
  language: Language,
  deps: PhotoPipelineDeps,
  onDisplay?: (text: string) => void,
): Promise<PhotoReply> {
  const early = await routeBeforeModel(question, language, deps);
  if (early) return early;

  const hits = await deps.search(question);
  const gate = gateDecision(hits, deps.threshold);
  const scope = photoScope(question, gate);
  if (!scope) return { kind: 'off-topic', photo: true, reason: 'gate', gate, hits };

  const passages =
    scope === 'text' ? selectPassages(hits, deps.corpus(), MAX_PHOTO_PASSAGES, deps.passageLanguage?.(language) ?? 'en') : [];
  const messages = buildPhotoMessages(language, passages, question, photoUri);

  const guardState: { tripped: EmergencyReply | null } = { tripped: null };
  const generation = await deps.generate(messages, (raw) => {
    if (guardState.tripped) return;
    guardState.tripped = deps.guard(raw, language);
    if (guardState.tripped) {
      deps.stop?.();
      onDisplay?.('');
      return;
    }
    onDisplay?.(photoDisplayText(raw, false));
  });
  const raw = generation.truncated ? trimUnfinished(generation.text) : generation.text;
  const guarded = guardState.tripped ?? deps.guard(raw, language);
  if (guarded) return { ...guarded, photo: true, stage: 'answer', generation, raw: generation.text };

  const text = photoDisplayText(raw, true);
  if (!text) return { kind: 'off-topic', photo: true, reason: 'no-source', gate, hits, raw: generation.text, generation };
  return { kind: 'photo-answer', photo: true, text, sources: usedPassages(raw, passages), passages, scope, gate, hits, raw, generation };
}
