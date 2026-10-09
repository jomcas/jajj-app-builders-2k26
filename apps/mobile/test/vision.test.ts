// Vision (#18): the photo pipeline's pure core. The question text goes through the emergency
// router first (ADR 0003), the photo gate (ADR 0005), the photo prompt, and the guard that
// swaps first-aid answer text for the Emergency Guide card.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { APP_HELP } from '../src/modules/assistant/appHelp.ts';
import { parseVisionBenchUrl } from '../src/modules/assistant/benchLink.ts';
import { helpChunks } from '../src/modules/assistant/corpus.ts';
import {
  answerPhotoQuestion,
  photoDisplayText,
  photoScope,
  refersToPhoto,
  type PhotoPipelineDeps,
} from '../src/modules/assistant/photoPipeline.ts';
import { buildPhotoMessages, photoSystemPrompt } from '../src/modules/assistant/photoPrompt.ts';
import type { GenerateResult, Hit } from '../src/modules/assistant/pipeline.ts';
import { toAssistantReply } from '../src/modules/emergency/assistantReply.ts';
import { createEmergencyRouter } from '../src/modules/emergency/router.ts';
import { loadGuides } from '../src/modules/guides/loader.ts';

const contentDir = join(import.meta.dirname, '..', 'src', 'modules', 'guides', 'content');
const router = createEmergencyRouter(
  loadGuides(
    readdirSync(contentDir)
      .filter((file) => file.endsWith('.json'))
      .map((file) => ({ source: file, raw: JSON.parse(readFileSync(join(contentDir, file), 'utf8')) })),
  ).guides,
);

const chunks = helpChunks(APP_HELP);
const hit = (score: number): Hit => ({ chunk: chunks.find((c) => c.language === 'en')!, score });
const PHOTO = 'file:///data/user/0/com.tahak.app/cache/ImagePicker/x.jpg';

function generation(text: string): GenerateResult {
  return { text, truncated: false, ttftMs: 9000, generationTps: 6, promptTokens: 300, generatedTokens: 40 };
}

type Calls = { generate: number; stopped: number; messages?: unknown; shown: string[] };

/** The real router, a fake search and a fake model that streams modelText in pieces. */
function deps(hits: Hit[], modelText: string, calls: Calls): PhotoPipelineDeps {
  return {
    emergencyRoute: async (q, l) => toAssistantReply(router.route(q, l)),
    guard: (text, l) => {
      const route = router.route(text, l);
      return route?.kind === 'guide' ? { kind: 'emergency', guideId: route.guideId } : null;
    },
    search: async () => hits,
    corpus: () => chunks,
    threshold: 0.5,
    generate: async (messages, onText) => {
      calls.generate++;
      calls.messages = messages;
      const words = modelText.split(' ');
      for (let i = 1; i <= words.length; i++) {
        onText(words.slice(0, i).join(' '));
        if (calls.stopped) break;
      }
      return generation(modelText);
    },
    stop: () => {
      calls.stopped++;
    },
  };
}

const newCalls = (): Calls => ({ generate: 0, stopped: 0, shown: [] });

test('an emergency question about a photo opens the Emergency Guide and never runs the model', async () => {
  for (const [question, guideId] of [
    ['nakagat ako ng ahas na ito', 'snakebite'],
    ['dumudugo ito, ano gagawin', 'bleeding-wounds'],
    ['I got bitten by this snake', 'snakebite'],
    ['what should I do with this wound?', 'bleeding-wounds'],
  ]) {
    const calls = newCalls();
    const reply = await answerPhotoQuestion(question, PHOTO, 'fil', deps([hit(0.9)], 'anything', calls));
    assert.equal(reply.kind, 'emergency', question);
    assert.equal(reply.kind === 'emergency' && reply.guideId, guideId, question);
    assert.equal(reply.kind === 'emergency' && reply.stage, 'question');
    assert.equal(calls.generate, 0, question);
  }
});

test('order: emergency, then a module tool, then the photo gate; neither runs the model', async () => {
  const tool = {
    id: 'test.distance',
    description: { en: 'Distance', fil: 'Layo' },
    parameters: [],
    match: (q: string) => (/how far/i.test(q) ? {} : null),
    run: async () => ({ text: '1.2 km to Camp 2' }),
  };
  const calls = newCalls();
  const toolReply = await answerPhotoQuestion('how far is this campsite?', PHOTO, 'en', { ...deps([hit(0.9)], 'x', calls), tools: [tool] });
  assert.equal(toolReply.kind, 'tool');
  const emergency = await answerPhotoQuestion('how far is help? nakagat ako ng ahas na ito', PHOTO, 'en', { ...deps([hit(0.9)], 'x', calls), tools: [tool] });
  assert.equal(emergency.kind, 'emergency');
  assert.equal(calls.generate, 0);
});

test('photo gate: short questions about the photo are in scope even below the threshold', () => {
  for (const q of ['what is this?', 'anong halaman ito?', 'Pwede bang kainin yan?', 'is it safe to touch?', 'Ano to?', '']) {
    assert.equal(refersToPhoto(q), true, q);
  }
  for (const q of ['who won the NBA finals?', 'magkano ang bitcoin ngayon', 'write me a long essay about the history of the philippines and this whole country']) {
    assert.equal(refersToPhoto(q), false, q);
  }
  assert.equal(photoScope('who is the president?', { pass: true, best: 0.7, threshold: 0.5 }), 'text');
  assert.equal(photoScope('what is this?', { pass: false, best: 0.3, threshold: 0.5 }), 'photo');
  assert.equal(photoScope('who is the president?', { pass: false, best: 0.3, threshold: 0.5 }), null);
});

test('off-topic text with a photo gets the fixed reply and the model never runs', async () => {
  const calls = newCalls();
  const reply = await answerPhotoQuestion('Sino ang presidente ng Pilipinas?', PHOTO, 'fil', deps([hit(0.3)], 'x', calls));
  assert.equal(reply.kind, 'off-topic');
  assert.equal(reply.kind === 'off-topic' && reply.reason, 'gate');
  assert.equal(calls.generate, 0);
});

test('a photo-only question runs with no passages; the photo goes first in the user message', async () => {
  const calls = newCalls();
  const reply = await answerPhotoQuestion(
    'anong halaman ito?',
    PHOTO,
    'fil',
    deps([hit(0.3)], 'Mukhang makahiya ito. Tumitiklop ang dahon kapag hinawakan.', calls),
    (t) => calls.shown.push(t),
  );
  assert.equal(reply.kind, 'photo-answer');
  if (reply.kind !== 'photo-answer') return;
  assert.equal(reply.scope, 'photo');
  assert.deepEqual(reply.passages, []);
  assert.deepEqual(reply.sources, []);
  assert.equal(reply.text, 'Mukhang makahiya ito. Tumitiklop ang dahon kapag hinawakan.');
  const [system, user] = calls.messages as { role: string; content: unknown }[];
  assert.equal(system.role, 'system');
  assert.match(String(system.content), /Never give first aid/);
  assert.match(String(system.content), /natural Taglish/);
  const parts = user.content as { type: string }[];
  assert.deepEqual(parts.map((p) => p.type), ['image_url', 'text']);
  // Streaming shows whole sentences only.
  assert.ok(calls.shown.every((t) => t === '' || /[.!?]$/.test(t)), calls.shown.join(' | '));
});

test('in-scope text gets one passage, and a cited passage becomes a source chip', async () => {
  const calls = newCalls();
  const reply = await answerPhotoQuestion('What food should I bring?', PHOTO, 'en', deps([hit(0.8)], '[1] That is trail mix, good food for the trail.', calls));
  assert.equal(reply.kind, 'photo-answer');
  if (reply.kind !== 'photo-answer') return;
  assert.equal(reply.scope, 'text');
  assert.equal(reply.passages.length, 1);
  assert.equal(reply.sources.length, 1);
  assert.equal(reply.text, 'That is trail mix, good food for the trail.');
});

test('guard: an answer that turns to first aid stops and becomes the Emergency Guide card', async () => {
  const calls = newCalls();
  const reply = await answerPhotoQuestion(
    'what is this?',
    PHOTO,
    'en',
    deps([hit(0.3)], 'This looks like a deep cut on the knee and it is bleeding. Clean the wound with water and press a cloth on it.', calls),
    (t) => calls.shown.push(t),
  );
  assert.equal(reply.kind, 'emergency');
  assert.equal(reply.kind === 'emergency' && reply.guideId, 'bleeding-wounds');
  assert.equal(reply.kind === 'emergency' && reply.stage, 'answer');
  assert.equal(calls.stopped, 1);
  assert.ok(calls.shown.every((t) => !/clean|press/i.test(t)), calls.shown.join(' | '));
  assert.equal(calls.shown.at(-1), '');
});

test('the model saying NONE gives the fixed reply, with no model text', async () => {
  const calls = newCalls();
  const reply = await answerPhotoQuestion('what is this?', PHOTO, 'en', deps([hit(0.3)], 'NONE', calls));
  assert.equal(reply.kind, 'off-topic');
  assert.equal(reply.kind === 'off-topic' && reply.reason, 'no-source');
});

test('photoDisplayText: drops NONE, citations and markdown; streams finished sentences only', () => {
  assert.equal(photoDisplayText('NONE', true), '');
  assert.equal(photoDisplayText('[1] **Fern.** Common here', false), 'Fern.');
  assert.equal(photoDisplayText('[1] **Fern.** Common here', true), 'Fern. Common here');
  assert.equal(photoDisplayText('No full stop yet', false), '');
});

test('photo prompts: one per UI language, with the safety rules', () => {
  for (const language of ['en', 'fil'] as const) {
    const system = photoSystemPrompt(language);
    assert.match(system, /reply only: NONE/);
    assert.match(system, /Never say a wild plant, mushroom, berry or water is safe to eat or drink/);
    assert.match(system, /open the matching Guide/);
  }
  const messages = buildPhotoMessages('en', [], 'what is this?', PHOTO);
  assert.equal(messages.length, 2);
});

test('vision bench links', () => {
  assert.equal(parseVisionBenchUrl('tahak://assistant/bench'), null);
  assert.deepEqual(parseVisionBenchUrl('tahak://assistant/vision-bench'), {
    photo: 'bundled',
    question: 'What is this?',
    ui: 'en',
    imageMaxTokens: undefined,
    mmproj: undefined,
    ahead: false,
    runs: 1,
  });
  assert.deepEqual(
    parseVisionBenchUrl('tahak://assistant/vision-bench?photo=plant.jpg&q=anong%20halaman%20ito%3F&ui=fil&tokens=192&mmproj=x.gguf&ahead=1&runs=9'),
    { photo: 'plant.jpg', question: 'anong halaman ito?', ui: 'fil', imageMaxTokens: 192, mmproj: 'x.gguf', ahead: true, runs: 5 },
  );
});
