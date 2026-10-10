// What this phone knows about each other member of a Group Hike, from the Alerts and
// positions it receives. Pure, tested under plain Node.
//
// ADR 0004: a member's dot is olive, and red only while they are in a Deviation or a Flare.
// Red is never the only signal: in those states the dot also carries an icon, and the banner
// says it in words.

import type { Alert, AlertPosition, MemberPosition } from './types.ts';

export type Member = {
  id: string;
  name: string;
  simulated: boolean;
  position: AlertPosition | null;
  inDeviation: boolean;
  inFlare: boolean;
  /** The current Deviation's distance from the Trail when it started, in metres. */
  offTrailM: number | null;
  /** The newest Alert from this member. */
  lastAlertTime: number | null;
};

export type MemberStatus = 'ok' | 'deviation' | 'flare';

export function newMember(id: string, name: string, simulated: boolean): Member {
  return {
    id,
    name,
    simulated,
    position: null,
    inDeviation: false,
    inFlare: false,
    offTrailM: null,
    lastAlertTime: null,
  };
}

/** The member after one more Alert from them. */
export function applyAlert(member: Member | undefined, alert: Alert): Member {
  const base = member ?? newMember(alert.memberId, alert.memberName, alert.simulated === true);
  const next: Member = { ...base, position: alert.position, lastAlertTime: alert.time };
  switch (alert.type) {
    case 'deviation':
      return { ...next, inDeviation: true, offTrailM: alert.offTrailM ?? null };
    case 'deviation-cleared':
      return { ...next, inDeviation: false, offTrailM: null };
    case 'flare':
      return { ...next, inFlare: true };
    case 'flare-stopped':
      return { ...next, inFlare: false };
  }
}

/** The member after a position update (their Alert state does not change). */
export function applyPosition(member: Member | undefined, update: MemberPosition): Member {
  const base = member ?? newMember(update.memberId, update.memberName, update.simulated === true);
  return { ...base, position: update.position };
}

/** A Flare outranks a Deviation: it is the member asking for help. */
export function memberStatus(member: Pick<Member, 'inDeviation' | 'inFlare'>): MemberStatus {
  if (member.inFlare) return 'flare';
  if (member.inDeviation) return 'deviation';
  return 'ok';
}

export type MemberDot = {
  /** Theme colour names: olive is the palette's primary, red its danger. */
  fill: 'olive' | 'danger';
  /** MaterialCommunityIcons name shown on the dot, or null. Never red without one. */
  icon: 'map-marker-alert' | 'alarm-light' | null;
  /** A Flare pulses a ring around the dot so its position stands out. */
  pulse: boolean;
};

/** ADR 0004: olive, and red (with an icon) only in a Deviation or a Flare. */
export function memberDot(status: MemberStatus): MemberDot {
  switch (status) {
    case 'flare':
      return { fill: 'danger', icon: 'alarm-light', pulse: true };
    case 'deviation':
      return { fill: 'danger', icon: 'map-marker-alert', pulse: false };
    case 'ok':
      return { fill: 'olive', icon: null, pulse: false };
  }
}

/** Two letters for the dot: the first two letters of a one-word name, else two initials. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
