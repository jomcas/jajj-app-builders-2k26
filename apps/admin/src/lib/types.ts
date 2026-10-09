// Rows of the Destination Pack tables, as the portal reads and writes them. Column names follow
// supabase/migrations; vocabulary follows CONTEXT.md.

export type LngLat = [longitude: number, latitude: number];

/** A GeoJSON LineString in WGS 84, coordinates as [longitude, latitude], jump-off first. */
export type LineString = { type: 'LineString'; coordinates: LngLat[] };

export const WAYPOINT_TYPES = ['jump_off', 'campsite', 'water', 'summit'] as const;
export type WaypointType = (typeof WAYPOINT_TYPES)[number];

export const WAYPOINT_TYPE_LABELS: Record<WaypointType, string> = {
  jump_off: 'Jump-off',
  campsite: 'Campsite',
  water: 'Water source',
  summit: 'Summit',
};

/** The reference passage topics the seeded content uses (content/batulao/README.md). */
export const PASSAGE_TOPICS = ['getting_there', 'registration', 'water', 'campsites', 'hazards'] as const;

export const PASSAGE_TOPIC_LABELS: Record<(typeof PASSAGE_TOPICS)[number], string> = {
  getting_there: 'Getting there and the Trails',
  registration: 'Registration, fees and guides',
  water: 'Water',
  campsites: 'Campsites',
  hazards: 'Hazards, weather and emergencies',
};

export const LANGUAGES = ['en', 'fil'] as const;
export type Language = (typeof LANGUAGES)[number];

export type DestinationRow = {
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
  updated_at: string;
};

export type TrailRow = {
  id: string;
  destination_id: string;
  name: string;
  name_fil: string | null;
  distance_m: number;
  geometry: LineString;
  updated_at?: string;
};

export type WaypointRow = {
  id: string;
  trail_id: string;
  type: WaypointType;
  name: string;
  name_fil: string | null;
  note: string | null;
  latitude: number;
  longitude: number;
  elevation_m: number | null;
  position: number;
  distance_m: number;
  updated_at?: string;
};

export type PassageRow = {
  id: string;
  destination_id: string;
  topic: string;
  language: Language;
  text: string;
  source: string;
  sources: unknown[] | null;
  as_of: string | null;
  updated_at?: string;
};

/** Everything in one Destination Pack, as the phone downloads it. */
export type PackContent = {
  destination: DestinationRow;
  trails: TrailRow[];
  waypoints: WaypointRow[];
  passages: PassageRow[];
};
