// The Alert and the group member, as the alerts module passes them around. Pure types.

export type AlertType = 'deviation' | 'deviation-cleared' | 'flare' | 'flare-stopped';

export type AlertPosition = { latitude: number; longitude: number };

/**
 * An Alert (CONTEXT.md): a message pushed to the other members of a Group Hike, such as a
 * Deviation or a Flare. A Deviation or Flare starting and ending are separate Alerts, so a
 * receiver that missed the start still learns where the member is when it ends.
 */
export type Alert = {
  /** Unique per sender: `<memberId>:<sequence>`. */
  id: string;
  type: AlertType;
  memberId: string;
  /** The member's name as they gave it (UI labels a simulated member as such). */
  memberName: string;
  /** Where the member was when the Alert was sent. */
  position: AlertPosition;
  /** When it was sent, in ms since the epoch (position time, so simulated time for a simulated member). */
  time: number;
  /** A Deviation's distance from the Trail when it started, in metres. */
  offTrailM?: number;
  /** Set by a simulated member, so every screen can say so. */
  simulated?: boolean;
};

/** A member's live position, sent between Alerts so their dot moves on the map. */
export type MemberPosition = {
  memberId: string;
  memberName: string;
  position: AlertPosition;
  time: number;
  simulated?: boolean;
};
