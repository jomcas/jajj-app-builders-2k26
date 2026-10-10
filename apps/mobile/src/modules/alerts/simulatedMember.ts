// The simulated group member (#24), for the demo until #23 links real phones. It walks the
// active Trail on #7's simulated walk player, with its own Deviation detector (#8), and sends
// its Alerts and positions through its end of the loopback transport, exactly as a second
// phone would. This phone receives them through the transport, never by a direct call.

import { useSyncExternalStore } from 'react';

import {
  createSimulatedWalk,
  locateOnTrail,
  startDeviationDetector,
  stepDeviation,
  type DeviationState,
  type PreparedTrail,
  type SimulatedWalk,
} from '../hike';
import { removeMember, simulatedPeerTransport } from './alertsStore';
import {
  incidentRunning,
  startIncident,
  startMemberScript,
  stepMemberScript,
  type MemberScriptState,
} from './memberScript';
import type { AlertType } from './types';

export const SIMULATED_MEMBER = {
  id: 'simulated-ana',
  /** The name as the member would give it; the UI adds "(simulated)" in the hiker's language. */
  name: 'Ana',
  /** Starts this share of the walk ahead of the hiker (behind, near the end of the walk). */
  offsetFraction: 0.03,
  /** Simulated seconds per real second during the incident, slow enough to watch it. */
  incidentSpeed: 4,
} as const;

type Running = {
  walk: SimulatedWalk;
  trail: PreparedTrail;
  detector: DeviationState;
  script: MemberScriptState;
  speed: number;
  sequence: number;
  stop: () => void;
};

let running: Running | null = null;

type View = { present: boolean; incident: boolean };
let view: View = { present: false, incident: false };
const listeners = new Set<() => void>();
function setView(next: View) {
  if (next.present === view.present && next.incident === view.incident) return;
  view = next;
  listeners.forEach((listener) => listener());
}

function onSnapshot() {
  const member = running;
  if (!member) return;
  const snapshot = member.walk.getSnapshot();
  const peer = simulatedPeerTransport();
  const { latitude, longitude, timestamp } = snapshot.position;
  const position = { latitude, longitude };
  peer.sendPosition({
    memberId: SIMULATED_MEMBER.id,
    memberName: SIMULATED_MEMBER.name,
    position,
    time: timestamp,
    simulated: true,
  });

  const offTrailM = locateOnTrail(position, member.trail)?.offTrailM;
  if (offTrailM === undefined) return;
  const step = stepDeviation(member.detector, { offTrailM, timestamp });
  member.detector = step.state;
  const result = stepMemberScript(member.script, { tS: snapshot.tS, deviationEvent: step.event });
  member.script = result.state;
  result.alerts.forEach((type: AlertType) => {
    peer.send({
      id: `${SIMULATED_MEMBER.id}:${++member.sequence}`,
      type,
      memberId: SIMULATED_MEMBER.id,
      memberName: SIMULATED_MEMBER.name,
      position,
      time: timestamp,
      simulated: true,
      ...(type === 'deviation' ? { offTrailM } : {}),
    });
  });
  if (!incidentRunning(member.script) && snapshot.speed !== member.speed) member.walk.setSpeed(member.speed);
  setView({ present: true, incident: incidentRunning(member.script) });
}

/**
 * Adds the simulated member to the running Hike: it walks `trail` from a little ahead of the
 * hiker (startFraction is the hiker's share of the walk) at the hiker's simulated speed.
 */
export function addSimulatedMember({
  trail,
  trailId,
  speed,
  startFraction = 0,
}: {
  trail: PreparedTrail;
  trailId: string;
  speed: number;
  startFraction?: number;
}) {
  removeSimulatedMember();
  const ahead = startFraction + SIMULATED_MEMBER.offsetFraction;
  const walk = createSimulatedWalk({
    trail,
    trailId,
    speed,
    startFraction: ahead <= 0.95 ? ahead : Math.max(0, startFraction - SIMULATED_MEMBER.offsetFraction),
    excursions: false,
  });
  const unsubscribe = walk.subscribe(onSnapshot);
  running = {
    walk,
    trail,
    detector: startDeviationDetector(),
    script: startMemberScript(),
    speed,
    sequence: 0,
    stop: () => {
      unsubscribe();
      walk.stop();
    },
  };
  walk.start();
  console.log(`[alerts] simulated member ${SIMULATED_MEMBER.name} added on ${trailId}`);
  setView({ present: true, incident: false });
}

/** The scripted moment: off the Trail (a Deviation), back, then the Flare, then it stops. */
export function triggerSimulatedIncident() {
  const member = running;
  if (!member || incidentRunning(member.script)) return;
  member.script = startIncident(member.script);
  member.walk.setSpeed(SIMULATED_MEMBER.incidentSpeed);
  member.walk.goOffTrail();
  setView({ present: true, incident: true });
}

export function removeSimulatedMember() {
  if (!running) return;
  running.stop();
  running = null;
  removeMember(SIMULATED_MEMBER.id);
  setView({ present: false, incident: false });
}

/** Whether the simulated member is walking, and whether its incident is under way. */
export function useSimulatedMember(): View {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => view,
  );
}
