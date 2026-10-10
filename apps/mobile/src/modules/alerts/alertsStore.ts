// This phone's side of the Group Hike Alerts: the transport, the other members as this phone
// knows them, and the Alerts it has received. Kept outside React so it survives tab switches.

import { useSyncExternalStore } from 'react';

import { applyAlert, applyPosition, type Member } from './memberState.ts';
import { createLoopbackPair, type AlertTransport, type LoopbackTransport } from './transport.ts';
import type { Alert, AlertPosition, AlertType } from './types.ts';

/** This phone's member id. #23 replaces it with the id the Group Hike gives this phone. */
export const SELF_ID = 'this-phone';
const SELF_NAME = 'This phone';
const MAX_ALERTS = 50;

type State = {
  members: Readonly<Record<string, Member>>;
  /** Alerts received from other members, newest last. */
  alerts: readonly Alert[];
};

let state: State = { members: {}, alerts: [] };
const listeners = new Set<() => void>();
const receivedListeners = new Set<(alert: Alert) => void>();

function setState(next: State) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Today: an in-memory link. This phone holds one end, the simulated member the other.
const [phoneEnd, otherEnd] = createLoopbackPair();
let transport: AlertTransport = phoneEnd;
let unlisten: (() => void)[] = [];

function receive(alert: Alert) {
  if (alert.memberId === SELF_ID) return;
  console.log(`[alerts] received ${alert.type} from ${alert.memberName} (${alert.memberId})`);
  setState({
    members: { ...state.members, [alert.memberId]: applyAlert(state.members[alert.memberId], alert) },
    alerts: [...state.alerts, alert].slice(-MAX_ALERTS),
  });
  receivedListeners.forEach((listener) => listener(alert));
}

function listen(to: AlertTransport) {
  unlisten.forEach((stop) => stop());
  unlisten = [
    to.onReceive(receive),
    to.onPosition((update) => {
      if (update.memberId === SELF_ID) return;
      setState({
        ...state,
        members: { ...state.members, [update.memberId]: applyPosition(state.members[update.memberId], update) },
      });
    }),
  ];
}
listen(transport);

/**
 * The seam for #23: replaces the loopback with another AlertTransport (Nearby). The Alert
 * UI, notifications and map dots stay as they are.
 */
export function setTransport(next: AlertTransport): void {
  transport = next;
  listen(next);
}

/** The other end of the loopback: the simulated member sends through it, as a second phone would. */
export function simulatedPeerTransport(): LoopbackTransport {
  return otherEnd;
}

let selfSequence = 0;

/** Sends this phone's own Deviation or Flare to the other members of the Group Hike. */
export function sendAlert(type: AlertType, position: AlertPosition, extra: { offTrailM?: number; time?: number } = {}) {
  const alert: Alert = {
    id: `${SELF_ID}:${++selfSequence}`,
    type,
    memberId: SELF_ID,
    memberName: SELF_NAME,
    position,
    time: extra.time ?? Date.now(),
    ...(extra.offTrailM === undefined ? {} : { offTrailM: extra.offTrailM }),
  };
  console.log(`[alerts] sent ${type} from this phone at ${position.latitude.toFixed(5)},${position.longitude.toFixed(5)}`);
  transport.send(alert);
  return alert;
}

/** Forgets a member (they left the Group Hike, or the simulated member was removed). */
export function removeMember(memberId: string) {
  if (!state.members[memberId]) return;
  const members = { ...state.members };
  delete members[memberId];
  setState({ ...state, members });
}

/** Calls listener for every Alert received from another member. */
export function onAlertReceived(listener: (alert: Alert) => void) {
  receivedListeners.add(listener);
  return () => {
    receivedListeners.delete(listener);
  };
}

const getMembers = () => state.members;
const getAlerts = () => state.alerts;

/** The other members of the Group Hike, by id. */
export function useMembers(): Readonly<Record<string, Member>> {
  return useSyncExternalStore(subscribe, getMembers);
}

/** Alerts received from other members, newest last. */
export function useAlerts(): readonly Alert[] {
  return useSyncExternalStore(subscribe, getAlerts);
}

export const alertsStore = { subscribe, getMembers, getAlerts };
