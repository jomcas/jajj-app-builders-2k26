// Reads Destination Pack content from Supabase over its REST API (PostgREST) with the
// anonymous key. Read-only: the tables allow nothing else (RLS). Used only while online, to
// list Destinations and to download a pack (ADR 0002). No runtime imports, so plain Node
// tests can load it.

import type { Language } from '../../i18n/types';
import type {
  Destination,
  PackContent,
  ReferencePassage,
  Trail,
  Waypoint,
  WaypointType,
} from './types';

export type CatalogConfig = {
  /** Project URL, e.g. https://<ref>.supabase.co */
  url: string;
  /** The anonymous (publishable) key. Never the service role key. */
  anonKey: string;
  fetch?: typeof fetch;
  /** Give up on a request after this long. */
  timeoutMs?: number;
};

export type Catalog = {
  listDestinations(): Promise<Destination[]>;
  /** All of a Destination's rows, plus how many bytes they took, for download progress. */
  fetchContent(destinationId: string): Promise<{ content: PackContent; bytes: number }>;
  /** Public download URL of a map file in the 'maps' bucket. */
  mapUrl(mapPath: string): string;
};

type DestinationRow = {
  id: string;
  name: string;
  region: string;
  summary_en: string;
  summary_fil: string;
  latitude: number;
  longitude: number;
  elevation_m: number | null;
  pack_version: number;
  map_path: string;
  map_bytes: number;
  is_placeholder: boolean;
};

type TrailRow = {
  id: string;
  destination_id: string;
  name: string;
  distance_m: number;
  geometry: Trail['geometry'];
};

type WaypointRow = {
  id: string;
  trail_id: string;
  type: WaypointType;
  name: string;
  latitude: number;
  longitude: number;
  elevation_m: number | null;
  position: number;
  distance_m: number;
};

type PassageRow = {
  id: string;
  destination_id: string;
  topic: string;
  language: Language;
  text: string;
  source: string;
};

export function toDestination(row: DestinationRow): Destination {
  return {
    id: row.id,
    name: row.name,
    region: row.region,
    summary: { en: row.summary_en, fil: row.summary_fil },
    latitude: row.latitude,
    longitude: row.longitude,
    elevationM: row.elevation_m,
    packVersion: row.pack_version,
    mapPath: row.map_path,
    // bigint arrives as a number from PostgREST; Number() guards against a string.
    mapBytes: Number(row.map_bytes),
    isPlaceholder: row.is_placeholder,
  };
}

export function toTrail(row: TrailRow): Trail {
  return {
    id: row.id,
    destinationId: row.destination_id,
    name: row.name,
    distanceM: row.distance_m,
    geometry: row.geometry,
  };
}

export function toWaypoint(row: WaypointRow): Waypoint {
  return {
    id: row.id,
    trailId: row.trail_id,
    type: row.type,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    elevationM: row.elevation_m,
    position: row.position,
    distanceM: row.distance_m,
  };
}

export function toPassage(row: PassageRow): ReferencePassage {
  return {
    id: row.id,
    destinationId: row.destination_id,
    topic: row.topic,
    language: row.language,
    text: row.text,
    source: row.source,
  };
}

export function createCatalog(config: CatalogConfig): Catalog {
  const doFetch = config.fetch ?? fetch;
  const timeoutMs = config.timeoutMs ?? 15000;
  const base = config.url.replace(/\/+$/, '');

  async function get<T>(query: string): Promise<{ rows: T[]; bytes: number }> {
    if (!base || !config.anonKey) throw new Error('Supabase is not configured.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await doFetch(`${base}/rest/v1/${query}`, {
        headers: {
          apikey: config.anonKey,
          // The legacy anon key is a JWT and must also be the bearer token; a publishable
          // key (sb_publishable_…) goes in the apikey header only.
          ...(config.anonKey.startsWith('sb_') ? {} : { Authorization: `Bearer ${config.anonKey}` }),
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      const body = await response.text();
      if (!response.ok) throw new Error(`Supabase answered ${response.status}.`);
      return { rows: JSON.parse(body) as T[], bytes: body.length };
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    async listDestinations() {
      const { rows } = await get<DestinationRow>('destinations?select=*&order=name.asc');
      return rows.map(toDestination);
    },

    async fetchContent(destinationId) {
      const id = encodeURIComponent(destinationId);
      const [destinations, trails, passages] = await Promise.all([
        get<DestinationRow>(`destinations?select=*&id=eq.${id}`),
        get<TrailRow>(`trails?select=*&destination_id=eq.${id}&order=name.asc`),
        get<PassageRow>(`reference_passages?select=*&destination_id=eq.${id}&order=topic.asc,language.asc`),
      ]);
      const destination = destinations.rows[0];
      if (!destination) throw new Error(`No Destination "${destinationId}".`);
      const trailIds = trails.rows.map((trail) => `"${trail.id}"`).join(',');
      const waypoints = trailIds
        ? await get<WaypointRow>(
            `waypoints?select=*&trail_id=in.(${encodeURIComponent(trailIds)})&order=trail_id.asc,position.asc`,
          )
        : { rows: [], bytes: 0 };
      return {
        content: {
          destination: toDestination(destination),
          trails: trails.rows.map(toTrail),
          waypoints: waypoints.rows.map(toWaypoint),
          passages: passages.rows.map(toPassage),
        },
        bytes: destinations.bytes + trails.bytes + passages.bytes + waypoints.bytes,
      };
    },

    mapUrl(mapPath) {
      return `${base}/storage/v1/object/public/maps/${mapPath.split('/').map(encodeURIComponent).join('/')}`;
    },
  };
}
