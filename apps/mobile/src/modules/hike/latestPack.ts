// Which downloaded Destination the Hike map shows. Pure (type-only imports), tested under Node.

import type { DestinationPack } from '../destination-pack';

/**
 * The most recently downloaded pack, or null if there are none. Packs with an unreadable
 * download time count as oldest; ties go to the Destination name, so the choice is stable.
 */
export function pickLatestPack(packs: readonly (DestinationPack | null)[]): DestinationPack | null {
  let latest: DestinationPack | null = null;
  let latestTime = -Infinity;
  for (const pack of packs) {
    if (!pack) continue;
    const parsed = Date.parse(pack.downloadedAt);
    const time = Number.isNaN(parsed) ? -Infinity : parsed;
    if (
      !latest ||
      time > latestTime ||
      (time === latestTime && pack.destination.name.localeCompare(latest.destination.name) < 0)
    ) {
      latest = pack;
      latestTime = time;
    }
  }
  return latest;
}

/** True when two picks show the same map and content, so the map need not re-render. */
export function samePack(a: DestinationPack | null, b: DestinationPack | null): boolean {
  if (!a || !b) return a === b;
  return (
    a.destination.id === b.destination.id &&
    a.downloadedAt === b.downloadedAt &&
    a.mapFileUri === b.mapFileUri
  );
}
