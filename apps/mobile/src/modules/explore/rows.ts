// What the Explore list shows. Pure, type-only imports, tested under plain Node.

import type { Destination } from '../destination-pack';

export type DestinationRow = {
  destination: Destination;
  /** A complete pack is on the phone. */
  downloaded: boolean;
};

/**
 * Online (catalog is a list): every catalog Destination, marked if it is downloaded, plus any
 * downloaded one the catalog no longer lists. Offline (catalog is null): the downloaded
 * Destinations only. Sorted by name.
 */
export function destinationRows(
  catalog: readonly Destination[] | null,
  downloaded: readonly Destination[],
): DestinationRow[] {
  const downloadedIds = new Set(downloaded.map((destination) => destination.id));
  const rows = new Map<string, DestinationRow>();
  for (const destination of downloaded) rows.set(destination.id, { destination, downloaded: true });
  // The catalog entry wins: it carries the latest pack version, which shows an update.
  for (const destination of catalog ?? []) {
    rows.set(destination.id, { destination, downloaded: downloadedIds.has(destination.id) });
  }
  return [...rows.values()].sort((a, b) => a.destination.name.localeCompare(b.destination.name));
}
