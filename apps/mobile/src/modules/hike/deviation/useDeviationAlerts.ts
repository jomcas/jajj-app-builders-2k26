import { useEffect, useRef } from 'react';

import { useStrings } from '../../../settings/preferences';
import { fill, formatDistance } from '../format';
import strings from '../strings';
import { clearDeviationAlert, prepareDeviationAlerts, startDeviationAlert } from './alerts';

/**
 * Runs the Deviation's phone alerts for the Hike screen: sets up notifications when a Hike
 * starts, and fires the vibration, sound and notification once when a Deviation starts
 * (`startedMs` changes from null), clearing them when it ends or the Hike does.
 */
export function useDeviationAlerts(
  hikeId: number | null,
  deviation: { startedMs: number; startedOffM: number } | null,
) {
  const s = useStrings(strings);
  // The latest text, read when an alert fires, so a language switch does not fire it again.
  const text = useRef(s);
  useEffect(() => {
    text.current = s;
  }, [s]);

  useEffect(() => {
    if (hikeId === null) return;
    const t = text.current;
    void prepareDeviationAlerts({
      channelName: t.deviationChannelName,
      channelDescription: t.deviationChannelDescription,
      askTitle: t.notificationsAskTitle,
      askBody: t.notificationsAskBody,
      allow: t.allowNotifications,
      notNow: t.notNow,
    });
  }, [hikeId]);

  const startedMs = deviation?.startedMs ?? null;
  const startedOffM = deviation?.startedOffM ?? 0;
  useEffect(() => {
    if (hikeId === null || startedMs === null) return;
    const t = text.current;
    startDeviationAlert({
      title: t.deviationNotificationTitle,
      body: fill(t.deviationNotificationBody, { distance: formatDistance(startedOffM) }),
    });
    return clearDeviationAlert;
    // startedOffM belongs to the Deviation that startedMs names.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hikeId, startedMs]);
}
