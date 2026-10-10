// Plays a scripted walk (walkScript.ts) in accelerated time, as a stand-in for the GPS.
// Positions carry simulated timestamps, so anything timed from them (the ETA's pace, #8's
// 30-second Deviation rule) behaves as on a real walk.

import type { PreparedTrail } from '../trail/geometry.ts';
import { DEFAULT_SPEED } from './simLink.ts';
import {
  buildSimulatedWalk,
  insertExcursion,
  sampleAt,
  walkDurationS,
  type ExcursionKind,
  type WalkPhase,
  type WalkSample,
} from './walkScript.ts';

export type SimulationSnapshot = {
  trailId: string;
  position: { latitude: number; longitude: number; accuracyM: number; timestamp: number };
  /** Simulated seconds since the start of the script, and the script's length. */
  tS: number;
  durationS: number;
  /** Simulated seconds per real second. */
  speed: number;
  phase: WalkPhase;
  /** The excursion in progress, if any, and how far off the Trail it is meant to be. */
  excursion: ExcursionKind | null;
  intendedOffM: number;
  finished: boolean;
  /** Paused by the hiker: the position and the simulated clock stand still. */
  paused: boolean;
};

export type SimulatedWalk = {
  getSnapshot(): SimulationSnapshot;
  subscribe(listener: () => void): () => void;
  start(): void;
  stop(): void;
  setSpeed(speed: number): void;
  /**
   * Freezes the walk: no new positions, and simulated time stops, so position timestamps (and
   * with them the Deviation's 30 s and the pace) skip the paused time.
   */
  pause(): void;
  /** Continues a paused walk from where it stood. */
  resume(): void;
  /** Sends the walk 60 m off the Trail for 45 s, starting now (#8's on-demand Deviation). */
  goOffTrail(): void;
};

const TICK_MS = 250;
// The simulated GPS reports a typical open-sky accuracy.
const ACCURACY_M = 5;

export function createSimulatedWalk({
  trail,
  trailId,
  speed = DEFAULT_SPEED,
  startFraction = 0,
  excursions = true,
  now = Date.now,
}: {
  trail: PreparedTrail;
  trailId: string;
  speed?: number;
  startFraction?: number;
  /** false: no scripted excursions, only goOffTrail() (the simulated group member, #24). */
  excursions?: boolean;
  now?: () => number;
}): SimulatedWalk {
  let samples: WalkSample[] = buildSimulatedWalk(trail, { excursions });
  let tS = Math.max(0, Math.min(1, startFraction)) * walkDurationS(samples);
  let currentSpeed = speed;
  const clockStart = now();
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastTick = 0;
  let paused = false;
  const listeners = new Set<() => void>();

  const snapshotAt = (): SimulationSnapshot => {
    const sample = sampleAt(samples, tS);
    const durationS = walkDurationS(samples);
    return {
      trailId,
      position: {
        latitude: sample.latitude,
        longitude: sample.longitude,
        accuracyM: ACCURACY_M,
        timestamp: Math.round(clockStart + tS * 1000),
      },
      tS,
      durationS,
      speed: currentSpeed,
      phase: sample.phase,
      excursion: sample.intendedOffM > 0 ? sample.excursion : null,
      intendedOffM: sample.intendedOffM,
      finished: tS >= durationS,
      paused,
    };
  };
  let snapshot = snapshotAt();

  const emit = () => {
    snapshot = snapshotAt();
    listeners.forEach((listener) => listener());
  };

  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  const tick = () => {
    const at = now();
    const elapsedS = (at - lastTick) / 1000;
    lastTick = at;
    tS = Math.min(walkDurationS(samples), tS + elapsedS * currentSpeed);
    emit();
    if (snapshot.finished) stop();
  };

  const start = () => {
    if (timer || paused) return;
    lastTick = now();
    timer = setInterval(tick, TICK_MS);
  };

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start,
    stop,
    pause() {
      if (paused) return;
      paused = true;
      stop();
      emit();
    },
    resume() {
      if (!paused) return;
      paused = false;
      emit();
      start();
    },
    setSpeed(next) {
      currentSpeed = next;
      emit();
    },
    goOffTrail() {
      samples = insertExcursion(trail, samples, tS, 'long').samples;
      emit();
      // A walk that had already finished starts moving again for the excursion (unless paused).
      start();
    },
  };
}
