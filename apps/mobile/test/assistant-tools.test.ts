// Assistant tools (issue #19, ADR 0001): the registry collecting modules' tools, the intent
// matches in English, Filipino and Taglish (and the questions they must leave to RAG), the
// Hike's distance tool with and without a Hike, the Flare tool opening but never firing, and
// the pipeline order: emergency routing, then tools, then the relevance gate.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { answerQuestion, type GenerateResult, type Hit } from '../src/modules/assistant/pipeline.ts';
import { TEST_SET } from '../src/modules/assistant/testSet.ts';
import { collectTools, matchTool } from '../src/modules/assistant/tools.ts';
import type { Waypoint, WaypointType } from '../src/modules/destination-pack/types.ts';
import { createFlareTool, FLARE_TOOL_ID, matchSignal } from '../src/modules/flare/tools/signal.ts';
import { etaText, formatDistance } from '../src/modules/hike/format.ts';
import hikeStrings from '../src/modules/hike/strings.ts';
import { distanceAnswer, DISTANCE_TOOL_ID, matchDistance, type LiveHike } from '../src/modules/hike/tools/distance.ts';
import { destinationPoint, prepareTrail, type PreparedTrail } from '../src/modules/hike/trail/geometry.ts';
import { placeWaypoints, startTracker, trackPosition, type HikeTracker } from '../src/modules/hike/trail/progress.ts';
import type { AssistantTool } from '../src/modules/types.ts';

// ---- intents -----------------------------------------------------------------------------

const DISTANCE_QUESTIONS: [string, WaypointType | undefined][] = [
  ['How far to the next campsite?', 'campsite'],
  ['How far is the summit?', 'summit'],
  ['How much further to the top?', 'summit'],
  ['How far is the next water source?', 'water'],
  ['How far are we from the summit?', 'summit'],
  ['How far to the next waypoint?', undefined],
  ['How long until the campsite?', 'campsite'],
  ['Are we almost there?', undefined],
  ['How far back to the jump-off?', 'jump_off'],
  // Filipino
  ['Gaano kalayo pa ang summit?', 'summit'],
  ['Gaano pa kalayo ang campsite?', 'campsite'],
  ['Malayo pa ba?', undefined],
  ['Malapit na ba tayo sa tuktok?', 'summit'],
  ['Ilang km pa papuntang kampuhan?', 'campsite'],
  ['Gaano katagal pa bago ang susunod na tubig?', 'water'],
  // Taglish
  ['Gaano kalayo pa yung next campsite?', 'campsite'],
  ['Malayo pa ba yung summit?', 'summit'],
  ['How far pa yung water source?', 'water'],
];

const SIGNAL_QUESTIONS = [
  'Help me signal',
  'help us signal for rescue',
  'How do I signal for help?',
  'How can we signal the rescuers?',
  'Open the Flare',
  'I need to get the rescuers attention',
  // Filipino
  'Paano humingi ng tulong sa mga rescuer?',
  'Paano mag-signal para makita kami?',
  'Ano gagawin para makita kami ng mga rescuer?',
  'Buksan ang Flare',
  // Taglish
  'Paano mag signal sa rescuers?',
  'I-open mo yung flare',
  'Help me mag-signal, nawawala kami',
];

/** Ordinary questions: they go on to the gate and RAG, never to a tool. */
const ORDINARY = [
  'How far is Batulao from Manila?',
  'How far is the jump-off from the town proper?',
  'Gaano kalayo ang Batulao mula sa Maynila?',
  'How long is the trail?',
  'How long does it take to climb Batulao?',
  'How many hours to hike Batulao?',
  'How far should I hike on my first day?',
  'Is there water at the campsite?',
  'What is the next campsite called?',
  'Is there cell signal at the summit?',
  'May signal ba sa campsite?',
  'What is the Flare?',
  'How does the Flare work?',
  'Paano gamitin yung SOS sa app?',
  'What should I bring on a day hike?',
];

test('distance intent: en, fil and Taglish, with the Waypoint type asked for', () => {
  for (const [question, type] of DISTANCE_QUESTIONS) {
    assert.deepEqual(matchDistance(question), type ? { type } : {}, question);
    assert.equal(matchSignal(question), null, question);
  }
});

test('Flare intent: en, fil and Taglish', () => {
  for (const question of SIGNAL_QUESTIONS) {
    assert.deepEqual(matchSignal(question), {}, question);
    assert.equal(matchDistance(question), null, question);
  }
});

test('ordinary questions, and every question in the Assistant test set, match no tool', () => {
  for (const question of [...ORDINARY, ...TEST_SET.map((q) => q.question)]) {
    assert.equal(matchDistance(question), null, question);
    assert.equal(matchSignal(question), null, question);
  }
});

// ---- the distance tool -----------------------------------------------------------------------

// A straight Trail 2 km due north, with a Waypoint of each type.
const START = { latitude: 14.05, longitude: 120.8 };
const coordinates: [number, number][] = [0, 500, 1000, 1500, 2000].map((m) => {
  const p = destinationPoint(START, m, 0);
  return [p.longitude, p.latitude];
});
const trail = prepareTrail(coordinates) as PreparedTrail;

function waypoint(id: string, type: WaypointType, alongM: number, position: number): Waypoint {
  const p = destinationPoint(START, alongM, 0);
  return { id, trailId: 't', type, name: id, latitude: p.latitude, longitude: p.longitude, elevationM: null, position, distanceM: alongM };
}
const placed = placeWaypoints(trail, [
  waypoint('Jump-off', 'jump_off', 0, 1),
  waypoint('Spring', 'water', 600, 2),
  waypoint('Camp 1', 'campsite', 1200, 3),
  waypoint('Peak', 'summit', 2000, 4),
]);

/** The live Hike after walking north at 1 m/s and stopping at `alongM`. */
function walkTo(alongM: number): LiveHike {
  let tracker: HikeTracker = startTracker();
  let view;
  for (let m = 0, t = 0; m <= alongM; m += 10, t += 10_000) {
    const p = destinationPoint(START, m, 0);
    const result = trackPosition(tracker, trail, placed, { ...p, timestamp: t })!;
    tracker = result.tracker;
    view = result.view;
  }
  return { hikeId: 1, view: view!, tracker, placed };
}

test('distance tool: with no Hike running it says to start one, in both languages', () => {
  const en = distanceAnswer(false, null, {}, 'en');
  assert.equal(en.text, hikeStrings.en.toolNoHike);
  assert.match(en.text, /^Start a Hike first/);
  assert.equal(distanceAnswer(false, null, { type: 'campsite' }, 'fil').text, hikeStrings.fil.toolNoHike);
  assert.equal(distanceAnswer(true, null, {}, 'en').text, hikeStrings.en.toolNoPosition);
});

test('distance tool: the next Waypoint is exactly what the Hike panel shows', () => {
  const live = walkTo(300);
  const next = live.view.next!;
  assert.equal(next.waypoint.name, 'Spring');
  const reply = distanceAnswer(true, live, {}, 'en');
  const s = hikeStrings.en;
  // The panel's chip: formatDistance(next.distanceM) · etaText(s, next.etaS).
  assert.equal(reply.text, `Spring (Water) is ${formatDistance(next.distanceM)} ahead along the Trail, ${etaText(s, next.etaS)} away.`);
  assert.equal(reply.data?.distanceM, Math.round(next.distanceM));
  assert.equal(reply.data?.etaS, Math.round(next.etaS));
  assert.match(reply.text, /^Spring \(Water\) is 300 m ahead along the Trail, about [56] min away\.$/);
});

test('distance tool: the next Waypoint of a type, at the recent pace, in Filipino too', () => {
  const live = walkTo(300);
  const camp = distanceAnswer(true, live, { type: 'campsite' }, 'en');
  // 900 m at the measured 1 m/s (15 min, give or take the rounding up).
  assert.match(camp.text, /^Camp 1 \(Campsite\) is 900 m ahead along the Trail, about 1[56] min away\.$/);
  const summit = distanceAnswer(true, live, { type: 'summit' }, 'fil');
  assert.match(summit.text, /^1\.7 km pa sa Trail ang Peak \(Tuktok\), mga 2[89] minuto pa\.$/);
  // Asking for the type the panel already shows gives the panel's numbers.
  const water = distanceAnswer(true, live, { type: 'water' }, 'en');
  assert.equal(water.data?.distanceM, Math.round(live.view.next!.distanceM));
});

test('distance tool: a Waypoint already passed is behind; none left says so', () => {
  const live = walkTo(1500);
  const back = distanceAnswer(true, live, { type: 'jump_off' }, 'en');
  assert.equal(back.data?.direction, 'behind');
  assert.match(back.text, /^Jump-off \(Jump-off\) is behind you: 1\.5 km back/);
  const noTrailWater = distanceAnswer(true, { ...live, placed: live.placed.filter((p) => p.waypoint.type !== 'water') }, { type: 'water' }, 'en');
  assert.equal(noTrailWater.text, 'There is no Water Waypoint on this Trail.');
  const top = distanceAnswer(true, { ...live, view: { ...live.view, next: null } }, {}, 'fil');
  assert.equal(top.text, hikeStrings.fil.toolNoneAhead);
});

// ---- the Flare tool ------------------------------------------------------------------------

test('Flare tool: opens the Flare screen and never fires it', async () => {
  let opened = 0;
  const tool = createFlareTool(() => {
    opened++;
    return true;
  });
  const reply = await tool.run({}, { language: 'en' });
  assert.equal(opened, 1);
  assert.deepEqual(reply.data, { opened: true, fired: false });
  assert.match(reply.text, /hold the red button for 1\.5 seconds/);
  const fil = await tool.run({}, { language: 'fil' });
  assert.match(fil.text, /^Binuksan ko ang Flare/);
  // No SOS control listening: tell the hiker where SOS is instead.
  const unopened = await createFlareTool(() => false).run({}, { language: 'en' });
  assert.match(unopened.text, /^Tap SOS/);
});

test('Flare tool: its code cannot fire the Flare', () => {
  const dir = join(import.meta.dirname, '..', 'src', 'modules', 'flare');
  for (const file of ['tools/signal.ts', 'tools/index.ts', 'openRequest.ts']) {
    const source = readFileSync(join(dir, file), 'utf8').replace(/\/\/.*$/gm, '');
    assert.doesNotMatch(source, /fireFlare|flareStore|startTorch/, file);
  }
});

// ---- the registry ------------------------------------------------------------------------

const fakeTool = (id: string, word: string): AssistantTool => ({
  id,
  description: { en: id, fil: id },
  parameters: [],
  match: (q) => (q.includes(word) ? { word } : null),
  run: async () => ({ text: id }),
});

test('the registry collects every module’s tools in order, and ids must be unique', () => {
  const a = fakeTool('a.one', 'one');
  const b = fakeTool('b.two', 'two');
  const tools = collectTools([{ id: 'a', tools: [a] }, { id: 'none' }, { id: 'b', tools: [b] }]);
  assert.deepEqual(tools.map((t) => t.id), ['a.one', 'b.two']);
  assert.equal(matchTool(tools, 'two please')?.tool, b);
  assert.deepEqual(matchTool(tools, 'two please')?.args, { word: 'two' });
  assert.equal(matchTool(tools, 'three'), null);
  assert.throws(() => collectTools([{ id: 'a', tools: [a] }, { id: 'c', tools: [a] }]), /Two Assistant tools use the id "a.one"/);
});

test('the hike and flare tools have the ids and translated descriptions the registry expects', () => {
  const flare = createFlareTool(() => true);
  assert.equal(flare.id, FLARE_TOOL_ID);
  assert.ok(flare.description.en && flare.description.fil && flare.description.en !== flare.description.fil);
  assert.equal(DISTANCE_TOOL_ID, 'hike.distance-to-next-waypoint');
  const hikeIndex = readFileSync(join(import.meta.dirname, '..', 'src', 'modules', 'hike', 'index.ts'), 'utf8');
  const flareIndex = readFileSync(join(import.meta.dirname, '..', 'src', 'modules', 'flare', 'index.ts'), 'utf8');
  assert.match(hikeIndex, /tools: \[distanceTool\]/);
  assert.match(flareIndex, /tools: \[flareTool\]/);
});

// ---- pipeline order ------------------------------------------------------------------------

const noGenerate = async (): Promise<GenerateResult> => {
  throw new Error('the model must not run');
};

function deps(over: Partial<Parameters<typeof answerQuestion>[2]> = {}) {
  let searched = 0;
  const d = {
    tools: [createFlareTool(() => true), { ...fakeTool(DISTANCE_TOOL_ID, ''), match: matchDistance, run: async () => distanceAnswer(false, null, {}, 'en') }],
    search: async (): Promise<Hit[]> => {
      searched++;
      return [];
    },
    corpus: () => [],
    threshold: 0.4,
    generate: noGenerate,
    ...over,
  };
  return { d, searched: () => searched };
}

test('pipeline: a tool answers before the gate, and the model never runs', async () => {
  const { d, searched } = deps();
  const reply = await answerQuestion('How far to the next campsite?', 'en', d);
  assert.equal(reply.kind, 'tool');
  assert.equal(reply.kind === 'tool' && reply.toolId, DISTANCE_TOOL_ID);
  assert.equal(reply.kind === 'tool' && reply.result.text, hikeStrings.en.toolNoHike);
  assert.equal(searched(), 0);
  const flare = await answerQuestion('Paano mag-signal para makita kami?', 'fil', d);
  assert.equal(flare.kind === 'tool' && flare.toolId, FLARE_TOOL_ID);
});

test('pipeline: an emergency still wins over a tool', async () => {
  const { d } = deps({
    emergencyRoute: async (q) => (/lost/.test(q) ? { kind: 'emergency', guideId: 'lost-on-the-trail' } : null),
  });
  const reply = await answerQuestion('We are lost, help me signal', 'en', d);
  assert.deepEqual(reply, { kind: 'emergency', guideId: 'lost-on-the-trail' });
});

test('pipeline: a question no tool matches goes on to the relevance gate', async () => {
  const { d, searched } = deps();
  const reply = await answerQuestion('How far is Batulao from Manila?', 'en', d);
  assert.equal(reply.kind, 'off-topic');
  assert.equal(searched(), 1);
});
