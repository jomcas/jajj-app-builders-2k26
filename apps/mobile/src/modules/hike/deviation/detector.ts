// The Deviation rule (issue #8, CONTEXT.md): a hiker is in Deviation once they have been more
// than 40 m from the active Trail continuously for more than 30 s. A pure state machine, fed
// one position at a time, tested under plain Node.
//
// Time comes only from the positions' own timestamps, never the wall clock, so the rule holds
// for a real GPS and for the simulated walk at any playback speed.
//
// The numbers:
//   start   more than 40 m off the Trail (startOffM) on every position for more than 30 s
//           (startAfterS), counted from the first position beyond 40 m.
//   clear   back within 30 m of the Trail (clearOffM). Between 30 and 40 m a Deviation stays
//           on, so GPS jitter around 40 m cannot switch the alert off and on again.
//   gaps    a gap of up to 60 s (maxGapS) between positions counts as off-Trail time when the
//           positions on both sides of it are beyond 40 m: no position said the hiker came
//           back. After a longer gap the 30 s start again from the first position after it,
//           since nothing is known about where the hiker was. A gap never clears a Deviation:
//           only a position back near the Trail does.
//   order   a position no newer than the last one (a repeat or out of order) is ignored.

export const DEVIATION = {
  /** Further than this from the Trail counts towards a Deviation, in metres. */
  startOffM: 40,
  /** How long the hiker must stay further than startOffM before a Deviation starts, in seconds. */
  startAfterS: 30,
  /** A Deviation clears at this distance from the Trail or closer, in metres. */
  clearOffM: 30,
  /** The longest gap between positions that still counts as continuous, in seconds. */
  maxGapS: 60,
} as const;

/** What the detector needs from one position. */
export type DeviationFix = {
  /** Distance to the nearest point of the active Trail, in metres. */
  offTrailM: number;
  /** When the position was taken, in ms since the epoch. */
  timestamp: number;
};

export type DeviationState =
  /** Near the Trail, or off it by 40 m or less. */
  | { status: 'on-trail'; lastMs: number | null }
  /** Beyond 40 m since sinceMs, not yet for long enough. */
  | { status: 'off'; sinceMs: number; lastMs: number }
  /** In Deviation since startedMs (beyond 40 m since sinceMs). */
  | { status: 'deviation'; sinceMs: number; startedMs: number; lastMs: number };

/** started: a Deviation began with this position. cleared: it ended with this position. */
export type DeviationEvent = 'started' | 'cleared' | null;

export function startDeviationDetector(): DeviationState {
  return { status: 'on-trail', lastMs: null };
}

export function isDeviation(state: DeviationState): state is Extract<DeviationState, { status: 'deviation' }> {
  return state.status === 'deviation';
}

/** The detector after one more position, and whether a Deviation started or ended with it. */
export function stepDeviation(
  state: DeviationState,
  fix: DeviationFix,
): { state: DeviationState; event: DeviationEvent } {
  const at = fix.timestamp;
  if (!Number.isFinite(at) || !Number.isFinite(fix.offTrailM)) return { state, event: null };
  if (state.lastMs !== null && at <= state.lastMs) return { state, event: null };

  if (state.status === 'deviation') {
    if (fix.offTrailM <= DEVIATION.clearOffM) {
      return { state: { status: 'on-trail', lastMs: at }, event: 'cleared' };
    }
    return { state: { ...state, lastMs: at }, event: null };
  }

  if (fix.offTrailM <= DEVIATION.startOffM) {
    return { state: { status: 'on-trail', lastMs: at }, event: null };
  }

  // Beyond 40 m: continue the run, or start one (also after a gap too long to count).
  const continues = state.status === 'off' && at - state.lastMs <= DEVIATION.maxGapS * 1000;
  const sinceMs = continues ? state.sinceMs : at;
  if (at - sinceMs > DEVIATION.startAfterS * 1000) {
    return { state: { status: 'deviation', sinceMs, startedMs: at, lastMs: at }, event: 'started' };
  }
  return { state: { status: 'off', sinceMs, lastMs: at }, event: null };
}
