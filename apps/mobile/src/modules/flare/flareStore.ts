// Whether the Flare is on, kept outside React so the shell's SOS control (on every tab's
// header) and the Flare screen share it, and the Flare keeps running when its screen is
// hidden, for example while the hiker reads an Emergency Guide.
//
// While on: the flashlight blinks SOS in Morse (native thread, tahak-flare-native), the
// whistle tone loops on the media stream at full media volume (expo-audio; like #8's tone it
// plays with the ringer muted), and the screen stays awake (expo-keep-awake). The screen
// strobe belongs to FlareScreen, because it only exists while the screen is showing.
// Everything is on the phone, nothing over the network (ADR 0002).

import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useSyncExternalStore } from 'react';

import flareNative from '../../../modules/tahak-flare-native';
import { morseTimeline } from './morse';

const WHISTLE = require('../../../assets/sounds/flare_whistle.wav');
const KEEP_AWAKE_TAG = 'tahak-flare';

export type FlareState = {
  active: boolean;
  /** Whether the flashlight is blinking: false if the phone has none or it is in use. */
  torch: boolean;
};

let state: FlareState = { active: false, torch: false };
const listeners = new Set<() => void>();
let player: AudioPlayer | null = null;

function setState(next: FlareState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;

function whistle(): AudioPlayer | null {
  try {
    player ??= createAudioPlayer(WHISTLE);
    return player;
  } catch {
    return null;
  }
}

function startTorch(): boolean {
  try {
    return flareNative?.startTorch(morseTimeline('SOS')) ?? false;
  } catch {
    return false;
  }
}

/** Fires the Flare: flashlight, whistle tone and a screen that stays on, until stopFlare. */
export function fireFlare(): void {
  if (state.active) return;
  const torch = startTorch();
  try {
    flareNative?.raiseMediaVolume();
  } catch {
    // The tone still plays at the hiker's own volume.
  }
  const sound = whistle();
  if (sound) {
    sound.loop = true;
    sound.volume = 1;
    sound.seekTo(0).catch(() => undefined);
    sound.play();
  }
  activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
  setState({ active: true, torch });
}

/** Stops everything the Flare started. */
export function stopFlare(): void {
  if (!state.active) return;
  try {
    flareNative?.stopTorch();
  } catch {
    // Nothing more to do: the native module also stops the torch when the app closes.
  }
  player?.pause();
  try {
    flareNative?.restoreMediaVolume();
  } catch {
    // Leave the volume where it is.
  }
  deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
  setState({ active: false, torch: false });
}

export function useFlareState(): FlareState {
  return useSyncExternalStore(subscribe, getSnapshot);
}

/** True while the Flare is on. The shell's SOS control turns fully red on it (ADR 0004). */
export function useFlareActive(): boolean {
  return useFlareState().active;
}

/** Full screen brightness while the strobe shows; the phone's own level otherwise. */
export function setStrobeBrightness(on: boolean): void {
  try {
    flareNative?.setMaxBrightness(on);
  } catch {
    // The strobe still runs at the current brightness.
  }
}
