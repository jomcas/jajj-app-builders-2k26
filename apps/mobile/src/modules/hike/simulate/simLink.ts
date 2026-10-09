// Parses the Hike deep links used for scripted testing. Pure, tested under plain Node.
//
//   tahak://hike/simulate?trail=<id>&speed=<n>&at=<0..1>
//       Starts a simulated walk Hike (ending any running Hike first). trail defaults to the
//       first Trail, speed to 15 (1 to 120), at (where in the script to start) to 0.
//   tahak://hike/simulate/off-trail
//       Sends the running simulated walk 60 m off the Trail for 45 s now (#8's Deviation).
//   tahak://hike/end
//       Ends the running Hike.

export const SPEEDS = [15, 60] as const;
export const DEFAULT_SPEED = SPEEDS[0];
const MAX_SPEED = 120;

export type HikeLink =
  | { action: 'simulate'; trailId: string | null; speed: number; startFraction: number }
  | { action: 'off-trail' }
  | { action: 'end' };

export function parseHikeLink(url: string | null): HikeLink | null {
  if (!url) return null;
  const match = url.match(/^tahak:\/\/hike\/([a-z/-]+?)\/?(?:[?#]|$)/);
  if (!match) return null;
  // React Native's URL has no searchParams, so read the query by hand.
  const param = (name: string) => {
    const value = url.match(new RegExp(`[?&]${name}=([^&#]*)`))?.[1];
    return value === undefined ? undefined : decodeURIComponent(value);
  };
  switch (match[1]) {
    case 'simulate': {
      const speed = Number(param('speed'));
      const at = Number(param('at'));
      return {
        action: 'simulate',
        trailId: param('trail') || null,
        speed: Number.isFinite(speed) && speed >= 1 ? Math.min(MAX_SPEED, speed) : DEFAULT_SPEED,
        startFraction: Number.isFinite(at) ? Math.max(0, Math.min(1, at)) : 0,
      };
    }
    case 'simulate/off-trail':
      return { action: 'off-trail' };
    case 'end':
      return { action: 'end' };
    default:
      return null;
  }
}
