import type { FeatureModule } from '../types';
import { listenForHikeLinks } from './hikeStore';
import { HikeScreen } from './HikeScreen';

// The Hike tab: the downloaded Destination's offline map (issue #6), and the Hike itself
// (issue #7): a Trail picker and Start Hike, then follow mode, the next Waypoint with distance
// and ETA, progress along the Trail, the end-of-Hike suggestion, and a simulated walk mode.
// Packs come from the destination-pack module's public interface only (ADR 0001).
//
// Public interface for other modules (#8's Deviation uses the Trail maths):
//
//   locateOnTrail(position, trail, { nearAlongM? })
//       → { distanceAlongM, offTrailM, nearestPoint, bearingToNearestDeg, beyond, segmentIndex,
//           fraction } | null. trail is a pack Trail's geometry.coordinates or a PreparedTrail.
//   prepareTrail(coordinates)        → PreparedTrail | null (cache it for repeated lookups)
//   distanceM(a, b), bearingDeg(a, b) great-circle distance and initial bearing
//   placeWaypoints(trail, waypoints) → Waypoints ordered by distance along the Trail
//   nextWaypoint(placed, alongM, leg), progressFraction(alongM, lengthM, leg),
//   recentPaceMps(samples), etaSeconds(distanceM, pace), shouldSuggestEnd(...)
//   trackPosition(tracker, trail, placed, position) → the Hike screen's view of one position
//
// Simulated walk, for demos and tests without GPS: the "Simulated walk" switch on the Trail
// picker, or tahak://hike/simulate?trail=<id>&speed=<n>&at=<0..1>, then
// tahak://hike/simulate/off-trail for an on-demand excursion 60 m off the Trail for 45 s.

// Listen from import time, not from the screen: tabs mount lazily, and a link may come first.
listenForHikeLinks();

export {
  bearingDeg,
  distanceM,
  locateOnTrail,
  prepareTrail,
  type LatLon,
  type PreparedTrail,
  type TrailLocation,
} from './trail/geometry';
export {
  END_SUGGESTION,
  PACE,
  etaSeconds,
  nextWaypoint,
  placeWaypoints,
  progressFraction,
  recentPaceMps,
  shouldSuggestEnd,
  trackPosition,
  type HikeView,
  type Leg,
  type PlacedWaypoint,
} from './trail/progress';

export default {
  id: 'hike',
  tab: 'hike',
  Screen: HikeScreen,
  hikeModes: ['solo', 'group'],
  offlineNeeds: ['destination-pack'],
} satisfies FeatureModule;
