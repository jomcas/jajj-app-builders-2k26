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

/**
 * The Destination the Hike tab shows. A running Hike's Destination always wins (the choice is
 * locked during a Hike); then the hiker's saved choice, if that pack is still on the phone;
 * otherwise the most recently downloaded pack.
 */
export function pickShownPack(
  packs: readonly (DestinationPack | null)[],
  chosenId: string | null,
  hikeDestinationId: string | null = null,
): DestinationPack | null {
  for (const id of [hikeDestinationId, chosenId]) {
    if (!id) continue;
    const match = packs.find((pack) => pack?.destination.id === id);
    if (match) return match;
  }
  return pickLatestPack(packs);
}

/** A downloaded Destination the hiker can switch the Hike tab to. */
export type DestinationChoice = { id: string; name: string };

/** Every downloaded Destination, by name, for the Destination choice. */
export function destinationChoices(packs: readonly (DestinationPack | null)[]): DestinationChoice[] {
  return packs
    .filter((pack): pack is DestinationPack => pack !== null)
    .map((pack) => ({ id: pack.destination.id, name: pack.destination.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
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
