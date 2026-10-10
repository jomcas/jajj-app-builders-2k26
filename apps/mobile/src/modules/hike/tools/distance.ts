// The Assistant's "distance to the next Waypoint" tool (issue #19, ADR 0001): its intent match
// and its answer. Pure (type-only imports), tested under plain Node; ./index.ts wires it to
// the running Hike.
//
// The answer reads the same numbers as the Hike panel: the live HikeView from trackPosition
// (published by the Hike screen, see ./liveHike.ts) and the Trail's placed Waypoints. With no
// type asked for, it is exactly the panel's next Waypoint, distance and ETA.

import type { Language } from '../../../i18n/types';
import type { WaypointType } from '../../destination-pack/types';
import type { ToolResult } from '../../types';
import { etaText, fill, formatDistance } from '../format.ts';
import strings from '../strings.ts';
import { etaSeconds, nextWaypoint, recentPaceMps, type HikeTracker, type HikeView, type PlacedWaypoint } from '../trail/progress.ts';

export const DISTANCE_TOOL_ID = 'hike.distance-to-next-waypoint';

/** The running Hike's latest tracked position, as the Hike screen last showed it. */
export type LiveHike = {
  hikeId: number;
  view: HikeView;
  tracker: HikeTracker;
  placed: readonly PlacedWaypoint[];
};

export type DistanceArgs = { type?: WaypointType };

// ---- intent ------------------------------------------------------------------------------

/** Lower case, no accents or punctuation, hyphens as spaces, padded: " gaano kalayo pa ". */
function normalize(question: string): string {
  return ` ${question
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim()} `;
}

/** Asking how far (a distance on its own counts as about the Hike with a Waypoint type). */
const DISTANCE_CUES = [
  / how far /,
  / how much (further|farther) /,
  / how close /,
  / distance (to|from here|left) /,
  / are we (almost |nearly )?there /,
  / gaano (pa )?(ka)?layo /,
  / (ka)?layo (pa|na) /,
  / malayo (pa|na) /,
  / malapit na /,
  / ilang (km|kilometro|kilometers?|metro|meters?|metres?) (pa|na lang|nalang|left|more|to go) /,
];

/** Asking how long: needs a "from here" cue too, or it is a planning question for RAG. */
const TIME_CUES = [/ how long /, / how many (hours|minutes|mins|hrs) /, / gaano (pa )?katagal /, / ilang (oras|minuto) /, / eta /];

/** Words that tie the question to where the hiker is right now. */
const HERE_CUES = [
  / next /,
  / susunod /,
  / pa /,
  / left /,
  / remaining /,
  / more /,
  / still /,
  / to go /,
  / until /,
  / till /,
  / from here /,
  / (dito|rito) /,
  / are we /,
  / am i /,
  / na lang /,
  / nalang /,
];

/** Two named places ("how far is Batulao from Manila"): a reference question, not the Hike. */
const FROM_PLACE = / (from|mula sa|galing sa|hanggang) /;
const ABOUT_US = / (we|us|i|me|here|kami|tayo|ako|dito|rito) /;

const TYPE_WORDS: readonly { type: WaypointType; pattern: RegExp }[] = [
  { type: 'campsite', pattern: / (camp ?sites?|camps?|camping( site| area| ground)?|campground|kampo|kampuhan) / },
  { type: 'summit', pattern: / (summit|peak|top|tuktok|rurok) / },
  { type: 'water', pattern: / (water( source| refill| point)?|tubig|igiban|refill) / },
  { type: 'jump_off', pattern: / (jump ?off|trail ?head|start of the trail) / },
];

/** The Waypoint type named in the question, the earliest one if several. */
function typeIn(text: string): WaypointType | undefined {
  let best: { type: WaypointType; at: number } | undefined;
  for (const { type, pattern } of TYPE_WORDS) {
    const at = text.search(pattern);
    if (at >= 0 && (!best || at < best.at)) best = { type, at };
  }
  return best?.type;
}

/**
 * The intent match: "How far to the next campsite?", "Gaano kalayo pa ang summit?", "malayo
 * pa ba?", "how long until the water source?". Returns the arguments, or null for anything
 * else, including two-place distances ("How far is Batulao from Manila?").
 */
export function matchDistance(question: string): DistanceArgs | null {
  const text = normalize(question);
  const type = typeIn(text);
  const here = HERE_CUES.some((cue) => cue.test(text));
  const distance = DISTANCE_CUES.some((cue) => cue.test(text));
  const time = TIME_CUES.some((cue) => cue.test(text));
  if (!distance && !time) return null;
  if (FROM_PLACE.test(text) && !ABOUT_US.test(text)) return null;
  if (distance ? !(here || type) : !here) return null;
  return type ? { type } : {};
}

// ---- answer ------------------------------------------------------------------------------

/**
 * The tool's reply: the live distance and ETA to the next Waypoint (of the type asked for, if
 * any), or why there is none. `running` says whether a Hike is on; `live` is its latest
 * tracked position, null until the first one arrives.
 */
export function distanceAnswer(running: boolean, live: LiveHike | null, args: DistanceArgs, language: Language): ToolResult {
  const s = strings[language];
  const title = s.toolTitle;
  if (!running) return { title, text: s.toolNoHike, data: { status: 'no-hike' } };
  if (!live) return { title, text: s.toolNoPosition, data: { status: 'no-position' } };

  const { view, tracker, placed } = live;
  const along = view.location.distanceAlongM;
  let found: { waypoint: PlacedWaypoint['waypoint']; distanceM: number; etaS: number } | null;
  let direction: 'ahead' | 'behind' = 'ahead';
  if (!args.type || view.next?.waypoint.type === args.type) {
    // The panel's own next Waypoint, so the two always agree.
    found = view.next && (!args.type || view.next.waypoint.type === args.type) ? view.next : null;
  } else {
    const ofType = placed.filter((p) => p.waypoint.type === args.type);
    let hit = nextWaypoint(ofType, along, view.leg);
    if (!hit) {
      hit = nextWaypoint(ofType, along, view.leg === 'up' ? 'down' : 'up');
      direction = 'behind';
    }
    found = hit ? { ...hit, etaS: etaSeconds(hit.distanceM, recentPaceMps(tracker.samples)) } : null;
  }

  if (!found) {
    const text = args.type ? fill(s.toolNoneOfType, { type: s[args.type] }) : s.toolNoneAhead;
    return { title, text, data: { status: 'none', type: args.type ?? null, leg: view.leg } };
  }
  const { waypoint, distanceM, etaS } = found;
  const text = fill(direction === 'ahead' ? s.toolAhead : s.toolBehind, {
    name: waypoint.name,
    type: s[waypoint.type],
    distance: formatDistance(distanceM),
    eta: etaText(s, etaS),
  });
  return {
    title,
    text,
    data: {
      status: 'ok',
      waypointId: waypoint.id,
      type: waypoint.type,
      direction,
      distanceM: Math.round(distanceM),
      etaS: Math.round(etaS),
      leg: view.leg,
    },
  };
}
