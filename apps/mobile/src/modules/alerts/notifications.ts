// What the phone does when an Alert from another member arrives, beyond the banner and the
// red dot: a vibration and a notification on the "Group Alerts" channel, which a paired watch
// mirrors. All on the phone (ADR 0002). Like #8's Deviation channel, the channel itself is
// silent and does not vibrate; the app vibrates, so a Galaxy's vibrate mode cannot cut it short.

import * as Notifications from 'expo-notifications';
import { Platform, Vibration } from 'react-native';

export const GROUP_CHANNEL_ID = 'group-alerts';
/** Four short pulses: unlike this hiker's own Deviation (three long ones). */
export const GROUP_VIBRATION = [0, 350, 150, 350, 150, 350, 150, 350];
const DANGER = '#A8201A';

let channelReady: Promise<unknown> | null = null;
let posting: Promise<unknown> = Promise.resolve();

function ensureChannel(text: { channelName: string; channelDescription: string }) {
  if (Platform.OS !== 'android') return Promise.resolve();
  channelReady ??= Notifications.setNotificationChannelAsync(GROUP_CHANNEL_ID, {
    name: text.channelName,
    description: text.channelDescription,
    importance: Notifications.AndroidImportance.MAX,
    sound: null,
    enableVibrate: false,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: false,
  }).catch(() => {
    channelReady = null;
  });
  return channelReady;
}

const notificationId = (memberId: string) => `tahak-group-${memberId}`;

/** A member's Deviation or Flare started: vibrate and post (or replace) their notification. */
export function postMemberAlert(
  memberId: string,
  text: { title: string; body: string; channelName: string; channelDescription: string },
) {
  Vibration.vibrate(GROUP_VIBRATION);
  posting = posting
    .then(() => ensureChannel(text))
    .then(() =>
      Notifications.scheduleNotificationAsync({
        identifier: notificationId(memberId),
        content: {
          title: text.title,
          body: text.body,
          priority: Notifications.AndroidNotificationPriority.MAX,
          color: DANGER,
        },
        trigger: { channelId: GROUP_CHANNEL_ID },
      }),
    )
    .catch(() => undefined);
}

/** The member is fine again (or gone): remove their notification. */
export function clearMemberAlert(memberId: string) {
  posting = posting.then(() => Notifications.dismissNotificationAsync(notificationId(memberId))).catch(() => undefined);
}
