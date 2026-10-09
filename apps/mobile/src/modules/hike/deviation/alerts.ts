// What happens on the phone when a Deviation starts and ends (issue #8), beyond the banner and
// the dashed Trail line: a vibration, a sound and a system notification. All on the phone,
// nothing over the network (ADR 0002).
//
// - Vibration: React Native's Vibration API (VIBRATE is in the manifest), three long pulses,
//   once per Deviation. Not repeated while it lasts: the banner and the notification stay.
// - Sound: assets/sounds/deviation_alert.wav (made by scripts/build-deviation-sound.py), played
//   once by expo-audio on the media stream. Android's silent and vibrate modes mute the ring
//   and notification streams, not the media stream, so the tone plays with the ringer muted
//   (expo-audio's playsInSilentMode, on by default). It is as loud as the phone's media
//   volume, and silent at volume 0.
// - Notification: posted once on the "Deviation alerts" channel, at the highest importance so
//   it shows as a heads-up. A paired watch mirrors phone notifications, so this is also the
//   watch alert. Cancelled when the hiker is back on the Trail or the Hike ends; no "back on
//   the Trail" notification follows (the banner going away says it).
//
// The channel itself makes no sound and no vibration. With the ringer on vibrate, a Galaxy
// turns a channel's sound into its own short buzz, which cuts the vibration pattern off; and
// with the sound and vibration in the app, they work even if the hiker turns notifications off.
// Android fixes a channel's sound and importance when it is first created: to change them,
// use a new channel id.

import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Notifications from 'expo-notifications';
import { Alert, Platform, Vibration } from 'react-native';

export const DEVIATION_CHANNEL_ID = 'deviation';
const NOTIFICATION_ID = 'tahak-deviation';
/** Off, then on and off in ms: three 700 ms pulses, unlike a message's short buzz. */
export const DEVIATION_VIBRATION = [0, 700, 250, 700, 250, 700];
/** The Deviation banner's red (docs/plan.md, Danger), as the notification's accent. */
const DANGER = '#A8201A';
const DEVIATION_SOUND = require('../../../../assets/sounds/deviation_alert.wav');

// The app is in front whenever a Deviation is detected (detection stops with the app), and
// expo-notifications shows nothing in front unless asked to. On Android a notification shown
// without "sound" gets no heads-up, so shouldPlaySound stays true; the channel has no sound.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export type DeviationAlertText = {
  channelName: string;
  channelDescription: string;
  askTitle: string;
  askBody: string;
  allow: string;
  notNow: string;
};

let askedThisSession = false;
/** The notification being posted, so a quick return to the Trail cannot beat it. */
let posting: Promise<unknown> = Promise.resolve();
let player: AudioPlayer | null = null;

function tone(): AudioPlayer | null {
  try {
    player ??= createAudioPlayer(DEVIATION_SOUND);
    return player;
  } catch {
    return null;
  }
}

async function ensureChannel(text: Pick<DeviationAlertText, 'channelName' | 'channelDescription'>) {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(DEVIATION_CHANNEL_ID, {
    name: text.channelName,
    description: text.channelDescription,
    importance: Notifications.AndroidImportance.MAX,
    sound: null,
    enableVibrate: false,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: false,
  });
}

/**
 * At the start of a Hike: loads the tone, sets up the channel and, if Tahak may not post
 * notifications yet (Android 13 and later), explains why in the hiker's language and then
 * asks. Asks at most once per app session, and never once Android says not to ask again.
 */
export async function prepareDeviationAlerts(text: DeviationAlertText): Promise<void> {
  // expo-audio's defaults suit a short alert: it plays in silent mode and mixes with other
  // audio. (setAudioModeAsync is left alone: on Android it also switches the call route.)
  tone();
  try {
    await ensureChannel(text);
    const permission = await Notifications.getPermissionsAsync();
    if (permission.granted || !permission.canAskAgain || askedThisSession) return;
    askedThisSession = true;
    Alert.alert(text.askTitle, text.askBody, [
      { text: text.notNow, style: 'cancel' },
      { text: text.allow, onPress: () => void Notifications.requestPermissionsAsync().catch(() => undefined) },
    ]);
  } catch {
    // Without notifications the banner, the vibration and the sound still work.
  }
}

/** A Deviation started: vibrate, sound the tone, and post the notification. */
export function startDeviationAlert(text: { title: string; body: string }): void {
  Vibration.vibrate(DEVIATION_VIBRATION);
  const sound = tone();
  if (sound) {
    sound.seekTo(0).catch(() => undefined);
    sound.play();
  }
  posting = posting
    .then(() =>
      Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_ID,
        content: {
          title: text.title,
          body: text.body,
          priority: Notifications.AndroidNotificationPriority.MAX,
          color: DANGER,
        },
        trigger: { channelId: DEVIATION_CHANNEL_ID },
      }),
    )
    .catch(() => undefined);
}

/** The Deviation is over (back on the Trail, or the Hike ended): stop and remove the alerts. */
export function clearDeviationAlert(): void {
  Vibration.cancel();
  player?.pause();
  posting = posting.then(() => Notifications.dismissNotificationAsync(NOTIFICATION_ID)).catch(() => undefined);
}
