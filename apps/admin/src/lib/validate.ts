// Form validation for Destinations, Trails, Waypoints and reference passages. Forms hold text;
// each validator returns either the row values to write or a message per field. The database
// checks the same rules (supabase/migrations), so these only make the errors readable.

import {
  LANGUAGES,
  WAYPOINT_TYPES,
  type DestinationRow,
  type Language,
  type LineString,
  type PassageRow,
  type TrailRow,
  type WaypointRow,
  type WaypointType,
} from './types';

export type FieldErrors<F> = Partial<Record<keyof F, string>>;
export type Validated<F, V> = { ok: true; value: V } | { ok: false; errors: FieldErrors<F> };

const ID = /^[a-z0-9-]+$/;

/** A readable id from a name: 'Mt. Ulap Eco-Trail' → 'mt-ulap-eco-trail'. */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Ids are lower-case letters, digits and dashes, like 'batulao-old-trail'. */
function checkId(id: string, existing: ReadonlySet<string>): string | undefined {
  if (!id) return 'Required.';
  if (!ID.test(id)) return 'Use lower-case letters, digits and dashes only.';
  if (existing.has(id)) return 'Already used. Pick another id.';
  return undefined;
}

function required(text: string): string | undefined {
  return text.trim() ? undefined : 'Required.';
}

function parseNumber(text: string, { min, max }: { min: number; max: number }): number | string {
  if (!text.trim()) return 'Required.';
  const value = Number(text);
  if (!Number.isFinite(value)) return 'Enter a number.';
  if (value < min || value > max) return `Must be between ${min} and ${max}.`;
  return value;
}

function parseOptionalInteger(text: string, { min, max }: { min: number; max: number }): number | null | string {
  if (!text.trim()) return null;
  const value = Number(text);
  if (!Number.isInteger(value)) return 'Enter a whole number, or leave it empty.';
  if (value < min || value > max) return `Must be between ${min} and ${max}.`;
  return value;
}

const optional = (text: string) => (text.trim() ? text.trim() : null);

// Destinations ------------------------------------------------------------------------------

export type DestinationForm = {
  id: string;
  name: string;
  region: string;
  summary_en: string;
  summary_fil: string;
  latitude: string;
  longitude: string;
  elevation_m: string;
};

export type DestinationValues = Pick<
  DestinationRow,
  'id' | 'name' | 'region' | 'summary_en' | 'summary_fil' | 'latitude' | 'longitude' | 'elevation_m'
>;

export function destinationForm(row?: DestinationRow): DestinationForm {
  return {
    id: row?.id ?? '',
    name: row?.name ?? '',
    region: row?.region ?? '',
    summary_en: row?.summary_en ?? '',
    summary_fil: row?.summary_fil ?? '',
    latitude: row ? String(row.latitude) : '',
    longitude: row ? String(row.longitude) : '',
    elevation_m: row?.elevation_m == null ? '' : String(row.elevation_m),
  };
}

/** existingIds: ids already taken, when creating a Destination. Empty when editing one. */
export function validateDestination(
  form: DestinationForm,
  existingIds: ReadonlySet<string> = new Set(),
): Validated<DestinationForm, DestinationValues> {
  const errors: FieldErrors<DestinationForm> = {};
  errors.id = checkId(form.id, existingIds);
  errors.name = required(form.name);
  errors.region = required(form.region);
  errors.summary_en = required(form.summary_en);
  errors.summary_fil = required(form.summary_fil);
  const latitude = parseNumber(form.latitude, { min: -90, max: 90 });
  const longitude = parseNumber(form.longitude, { min: -180, max: 180 });
  const elevation = parseOptionalInteger(form.elevation_m, { min: -500, max: 9000 });
  if (typeof latitude === 'string') errors.latitude = latitude;
  if (typeof longitude === 'string') errors.longitude = longitude;
  if (typeof elevation === 'string') errors.elevation_m = elevation;
  if (hasErrors(errors)) return { ok: false, errors: clean(errors) };
  return {
    ok: true,
    value: {
      id: form.id,
      name: form.name.trim(),
      region: form.region.trim(),
      summary_en: form.summary_en.trim(),
      summary_fil: form.summary_fil.trim(),
      latitude: latitude as number,
      longitude: longitude as number,
      elevation_m: elevation as number | null,
    },
  };
}

// Trails ------------------------------------------------------------------------------------

export type TrailForm = { id: string; name: string; name_fil: string };
export type TrailValues = Omit<TrailRow, 'updated_at'>;

export function validateTrail(
  form: TrailForm,
  destinationId: string,
  line: { geometry: LineString; distanceM: number } | null,
  existingIds: ReadonlySet<string> = new Set(),
): Validated<TrailForm & { geometry: string }, TrailValues> {
  const errors: FieldErrors<TrailForm & { geometry: string }> = {};
  errors.id = checkId(form.id, existingIds);
  errors.name = required(form.name);
  if (!line) errors.geometry = 'Upload a GPX file with the Trail.';
  else if (line.geometry.coordinates.length < 2 || line.distanceM <= 0) {
    errors.geometry = 'The Trail needs at least two different points.';
  }
  if (hasErrors(errors) || !line) return { ok: false, errors: clean(errors) };
  return {
    ok: true,
    value: {
      id: form.id,
      destination_id: destinationId,
      name: form.name.trim(),
      name_fil: optional(form.name_fil),
      distance_m: Math.round(line.distanceM),
      geometry: line.geometry,
    },
  };
}

// Waypoints ---------------------------------------------------------------------------------

export type WaypointForm = {
  type: string;
  name: string;
  name_fil: string;
  note: string;
  latitude: string;
  longitude: string;
  elevation_m: string;
  distance_m: string;
};

/** A Waypoint without its id, Trail or position, which the Waypoint list assigns. */
export type WaypointValues = Pick<
  WaypointRow,
  'type' | 'name' | 'name_fil' | 'note' | 'latitude' | 'longitude' | 'elevation_m' | 'distance_m'
>;

export function waypointForm(row?: Partial<WaypointRow>): WaypointForm {
  return {
    type: row?.type ?? '',
    name: row?.name ?? '',
    name_fil: row?.name_fil ?? '',
    note: row?.note ?? '',
    latitude: row?.latitude == null ? '' : String(row.latitude),
    longitude: row?.longitude == null ? '' : String(row.longitude),
    elevation_m: row?.elevation_m == null ? '' : String(row.elevation_m),
    distance_m: row?.distance_m == null ? '' : String(row.distance_m),
  };
}

/** trailLengthM: the Trail's length; a Waypoint cannot be further along than that. */
export function validateWaypoint(
  form: WaypointForm,
  trailLengthM: number,
): Validated<WaypointForm, WaypointValues> {
  const errors: FieldErrors<WaypointForm> = {};
  if (!(WAYPOINT_TYPES as readonly string[]).includes(form.type)) errors.type = 'Pick a type.';
  errors.name = required(form.name);
  const latitude = parseNumber(form.latitude, { min: -90, max: 90 });
  const longitude = parseNumber(form.longitude, { min: -180, max: 180 });
  const elevation = parseOptionalInteger(form.elevation_m, { min: -500, max: 9000 });
  const distance = parseOptionalInteger(form.distance_m, { min: 0, max: Math.max(0, Math.ceil(trailLengthM)) });
  if (typeof latitude === 'string') errors.latitude = latitude;
  if (typeof longitude === 'string') errors.longitude = longitude;
  if (typeof elevation === 'string') errors.elevation_m = elevation;
  if (typeof distance === 'string') errors.distance_m = distance;
  else if (distance === null) errors.distance_m = 'Required.';
  if (hasErrors(errors)) return { ok: false, errors: clean(errors) };
  return {
    ok: true,
    value: {
      type: form.type as WaypointType,
      name: form.name.trim(),
      name_fil: optional(form.name_fil),
      note: optional(form.note),
      latitude: latitude as number,
      longitude: longitude as number,
      elevation_m: elevation as number | null,
      distance_m: distance as number,
    },
  };
}

// Reference passages ------------------------------------------------------------------------

export type PassageForm = {
  id: string;
  topic: string;
  language: string;
  text: string;
  source: string;
  as_of: string;
};

export type PassageValues = Omit<PassageRow, 'updated_at' | 'sources'>;

export function passageForm(row?: PassageRow): PassageForm {
  return {
    id: row?.id ?? '',
    topic: row?.topic ?? '',
    language: row?.language ?? 'en',
    text: row?.text ?? '',
    source: row?.source ?? '',
    as_of: row?.as_of ?? '',
  };
}

const AS_OF = /^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/;

export function validatePassage(
  form: PassageForm,
  destinationId: string,
  existingIds: ReadonlySet<string> = new Set(),
): Validated<PassageForm, PassageValues> {
  const errors: FieldErrors<PassageForm> = {};
  errors.id = checkId(form.id, existingIds);
  errors.topic = required(form.topic);
  if (!(LANGUAGES as readonly string[]).includes(form.language)) errors.language = 'Pick English or Filipino.';
  errors.text = required(form.text);
  errors.source = required(form.source);
  if (form.as_of.trim() && !AS_OF.test(form.as_of.trim())) errors.as_of = 'Use YYYY-MM or YYYY-MM-DD.';
  if (hasErrors(errors)) return { ok: false, errors: clean(errors) };
  return {
    ok: true,
    value: {
      id: form.id,
      destination_id: destinationId,
      topic: form.topic.trim(),
      language: form.language as Language,
      text: form.text.trim(),
      source: form.source.trim(),
      as_of: optional(form.as_of),
    },
  };
}

// --------------------------------------------------------------------------------------------

function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}

function clean<T extends Record<string, string | undefined>>(errors: T): T {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message)) as T;
}
