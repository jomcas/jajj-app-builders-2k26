// Firing the Flare takes a deliberate gesture, never a single tap (ADR 0004): the hiker holds
// the button for 1.5 s while a bar fills. Letting go early only shows a hint. Pure, so it can
// be tested with plain Node; FlareScreen feeds it press, release and timer ticks.

export const HOLD_TO_FIRE_MS = 1500;

export type HoldState =
  | { phase: 'idle' }
  /** The finger is down; fires once it has been down HOLD_TO_FIRE_MS. */
  | { phase: 'holding'; since: number }
  /** Let go too early: show "press and hold". */
  | { phase: 'hint' }
  | { phase: 'fired' };

export type HoldEvent =
  | { type: 'press'; at: number }
  | { type: 'release'; at: number }
  | { type: 'tick'; at: number }
  | { type: 'reset' };

export const IDLE: HoldState = { phase: 'idle' };

export function stepHold(state: HoldState, event: HoldEvent): HoldState {
  if (event.type === 'reset') return IDLE;
  switch (state.phase) {
    case 'idle':
    case 'hint':
      return event.type === 'press' ? { phase: 'holding', since: event.at } : state;
    case 'holding': {
      const held = event.at - state.since >= HOLD_TO_FIRE_MS;
      if (event.type === 'tick') return held ? { phase: 'fired' } : state;
      if (event.type === 'release') return held ? { phase: 'fired' } : { phase: 'hint' };
      return state;
    }
    case 'fired':
      return state;
  }
}

/** How full the hold bar is, 0 to 1. */
export function holdProgress(state: HoldState, now: number): number {
  if (state.phase === 'fired') return 1;
  if (state.phase !== 'holding') return 0;
  return Math.min(1, Math.max(0, (now - state.since) / HOLD_TO_FIRE_MS));
}
