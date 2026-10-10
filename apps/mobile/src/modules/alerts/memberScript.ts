// The simulated group member's scripted moment, for the demo (#24). Pure, tested under plain
// Node with #8's Deviation detector.
//
// The member walks the Trail. When the incident starts, its walk goes 60 m off the Trail for
// 45 s (the player's goOffTrail). The Deviation is not scripted: #8's detector, fed the
// member's own track, decides when it starts and clears, exactly as for this hiker. Once it
// has cleared, the member fires the Flare FLARE_AFTER_S later and stops it FLARE_FOR_S after
// that. All times are the member's simulated seconds.

import type { AlertType } from './types.ts';

export const MEMBER_SCRIPT = {
  /** After the Deviation clears, the member fires the Flare this much later, in s. */
  flareAfterS: 20,
  /** And stops it this much later, in s. */
  flareForS: 60,
} as const;

export type MemberScriptState =
  | { phase: 'walking' }
  | { phase: 'off-trail' }
  | { phase: 'waiting-flare'; sinceS: number }
  | { phase: 'flare'; sinceS: number }
  | { phase: 'done' };

export function startMemberScript(): MemberScriptState {
  return { phase: 'walking' };
}

/** The incident starts (the caller sends the walk off the Trail at the same moment). */
export function startIncident(state: MemberScriptState): MemberScriptState {
  return state.phase === 'walking' || state.phase === 'done' ? { phase: 'off-trail' } : state;
}

export function incidentRunning(state: MemberScriptState): boolean {
  return state.phase !== 'walking' && state.phase !== 'done';
}

/**
 * One position of the member: tS in simulated seconds, and the Deviation detector's event for
 * that position. Returns the Alerts to send, in order.
 */
export function stepMemberScript(
  state: MemberScriptState,
  { tS, deviationEvent }: { tS: number; deviationEvent: 'started' | 'cleared' | null },
): { state: MemberScriptState; alerts: AlertType[] } {
  const alerts: AlertType[] = [];
  let next = state;
  if (deviationEvent === 'started') alerts.push('deviation');
  if (deviationEvent === 'cleared') {
    alerts.push('deviation-cleared');
    if (next.phase === 'off-trail') next = { phase: 'waiting-flare', sinceS: tS };
  }
  if (next.phase === 'waiting-flare' && tS - next.sinceS >= MEMBER_SCRIPT.flareAfterS) {
    alerts.push('flare');
    next = { phase: 'flare', sinceS: tS };
  } else if (next.phase === 'flare' && tS - next.sinceS >= MEMBER_SCRIPT.flareForS) {
    alerts.push('flare-stopped');
    next = { phase: 'done' };
  }
  return { state: next, alerts };
}
