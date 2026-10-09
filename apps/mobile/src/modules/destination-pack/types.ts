// Destination Pack content as the app sees it. Mirrors the Supabase tables in
// supabase/migrations/*_destination_pack_schema.sql, in camelCase. Pure types, no imports
// at runtime, so plain Node tests can use them.

import type { Language } from '../../i18n/types';

export type WaypointType = 'jump_off' | 'campsite' | 'water' | 'summit';

/** A mountain or campsite that hikers travel to, as listed in the catalog. */
export type Destination = {
  id: string;
  name: string;
  region: string;
  summary: Record<Language, string>;
  latitude: number;
  longitude: number;
  elevationM: number | null;
  /** Goes up whenever the Destination's content or map changes. */
  packVersion: number;
  /** Path of the PMTiles map file in the public 'maps' Storage bucket. */
  mapPath: string;
  /** Size of the map file in bytes. */
  mapBytes: number;
  /** Stand-in seed content, not for real trail use. */
  isPlaceholder: boolean;
};

/** A GeoJSON LineString in WGS 84: [longitude, latitude] pairs, jump-off first. */
export type LineString = {
  type: 'LineString';
  coordinates: [number, number][];
};

/** A named route on a Destination. */
export type Trail = {
  id: string;
  destinationId: string;
  name: string;
  distanceM: number;
  geometry: LineString;
};

/** A named point of interest on a Trail. */
export type Waypoint = {
  id: string;
  trailId: string;
  type: WaypointType;
  name: string;
  latitude: number;
  longitude: number;
  elevationM: number | null;
  /** Order along the Trail, 1 at the jump-off. */
  position: number;
  /** Distance along the Trail from the jump-off, in metres. */
  distanceM: number;
};

/** Reference info about a Destination that the Assistant answers from. */
export type ReferencePassage = {
  id: string;
  destinationId: string;
  topic: string;
  language: Language;
  text: string;
  source: string;
};

/** Everything in a Destination Pack except the map file. */
export type PackContent = {
  destination: Destination;
  /** Sorted by name. */
  trails: Trail[];
  /** Sorted by Trail, then by position along it. */
  waypoints: Waypoint[];
  passages: ReferencePassage[];
};

/** A Destination Pack stored on the phone. Everything here works in airplane mode. */
export type DestinationPack = PackContent & {
  /** file:// URI of the local PMTiles map file, for MapLibre. */
  mapFileUri: string;
  /** When the pack was downloaded, as an ISO 8601 timestamp. */
  downloadedAt: string;
};

/** How far a pack download has got. The map file is most of the bytes. */
export type DownloadProgress = {
  bytesDone: number;
  bytesTotal: number;
  /** 0 to 1. */
  fraction: number;
};

export type DownloadState =
  | { status: 'idle' }
  | { status: 'downloading'; progress: DownloadProgress }
  | { status: 'error'; error: string };
