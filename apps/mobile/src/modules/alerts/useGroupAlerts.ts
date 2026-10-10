import { useEffect, useRef } from 'react';

import { useFlareActive } from '../flare';
import { useStrings } from '../../settings/preferences';
import { fill, formatDistance } from '../hike/format';
import { alertsStore, onAlertReceived, sendAlert, useMembers } from './alertsStore';
import { memberStatus } from './memberState';
import { clearMemberAlert, postMemberAlert } from './notifications';
import strings from './strings';
import type { AlertPosition } from './types';

/** "Ana (simulated)" for a simulated member, else the name as given. */
export function memberLabel(member: { name: string; simulated: boolean }, s: { simulatedName: string }) {
  return member.simulated ? fill(s.simulatedName, { name: member.name }) : member.name;
}

/**
 * Posts and clears the "Group Alerts" notifications (with a vibration) as Alerts from other
 * members arrive. Mount once, on the Hike screen.
 */
export function useGroupAlertNotifications() {
  const s = useStrings(strings);
  const text = useRef(s);
  useEffect(() => {
    text.current = s;
  }, [s]);

  useEffect(
    () =>
      onAlertReceived((alert) => {
        const t = text.current;
        const member = alertsStore.getMembers()[alert.memberId];
        if (!member) return;
        const name = memberLabel(member, t);
        const status = memberStatus(member);
        const shared = { channelName: t.channelName, channelDescription: t.channelDescription };
        if (alert.type === 'flare') {
          postMemberAlert(member.id, { ...shared, title: fill(t.memberFlare, { name }), body: t.notifyFlareBody });
        } else if (alert.type === 'deviation' && status === 'deviation') {
          const distance = formatDistance(alert.offTrailM ?? Number.NaN);
          postMemberAlert(member.id, {
            ...shared,
            title: alert.offTrailM === undefined ? fill(t.memberOffTrailNoDistance, { name }) : fill(t.memberOffTrail, { name, distance }),
            body: fill(t.notifyOffTrailBody, { distance }),
          });
        } else if (status === 'ok') {
          clearMemberAlert(member.id);
        }
      }),
    [],
  );

  // A member who leaves (or the simulated one being removed) takes their notification along.
  const members = useMembers();
  const seen = useRef(new Set<string>());
  useEffect(() => {
    seen.current.forEach((id) => {
      if (!members[id]) clearMemberAlert(id);
    });
    seen.current = new Set(Object.keys(members));
  }, [members]);
}

/**
 * Publishes this phone's own Deviation and Flare as outgoing Alerts while a Hike runs. Today
 * nobody receives them (the loopback's other end is the simulated member); they prove the
 * send path #23 will use, and are logged.
 */
export function useSelfAlerts(
  hikeId: number | null,
  deviation: { startedMs: number; startedOffM: number } | null,
  position: (AlertPosition & { timestamp: number }) | null,
) {
  const where = useRef(position);
  useEffect(() => {
    where.current = position;
  }, [position]);

  const startedMs = deviation?.startedMs ?? null;
  const startedOffM = deviation?.startedOffM;
  useEffect(() => {
    if (hikeId === null || startedMs === null) return;
    const at = where.current;
    if (at) sendAlert('deviation', toPosition(at), { offTrailM: startedOffM, time: startedMs });
    return () => {
      const back = where.current;
      if (back) sendAlert('deviation-cleared', toPosition(back), { time: back.timestamp });
    };
    // startedOffM belongs to the Deviation that startedMs names.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hikeId, startedMs]);

  const flare = useFlareActive();
  useEffect(() => {
    if (hikeId === null || !flare) return;
    const at = where.current;
    if (at) sendAlert('flare', toPosition(at));
    return () => {
      const now = where.current;
      if (now) sendAlert('flare-stopped', toPosition(now));
    };
  }, [hikeId, flare]);
}

function toPosition({ latitude, longitude }: AlertPosition): AlertPosition {
  return { latitude, longitude };
}
