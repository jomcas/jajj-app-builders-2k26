// Reads and writes Destination Pack content as the logged-in team member. Uses the anon
// (publishable) key plus the member's session; RLS decides what they may write
// (supabase/migrations/20261010061115_admin_portal_team_writes.sql). Never the service role.

import { createClient, type PostgrestError } from '@supabase/supabase-js';
import { buildPublishPayload, mapPathFor, packSnapshot, type PackSnapshot } from './publish';
import type { DestinationRow, PackContent, PassageRow, TrailRow, WaypointRow } from './types';
import type { DestinationValues, PassageValues, TrailValues } from './validate';
import { planWaypointSave } from './waypoints';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const configError =
  !url || !anonKey ? 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in apps/admin/.env.local.' : null;

export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'missing', {
  auth: { persistSession: true, autoRefreshToken: true },
});

const MAPS_BUCKET = 'maps';
const now = () => new Date().toISOString();

/** A write the database refused, with a message a team member can act on. */
export class WriteError extends Error {}

function fail(error: PostgrestError | { message: string; code?: string }): never {
  if ('code' in error && error.code === '42501') {
    throw new WriteError('Not allowed: only team accounts can change Destination Pack content.');
  }
  if ('code' in error && error.code === '23505') {
    throw new WriteError(`That id is already used. ${error.message}`);
  }
  throw new WriteError(error.message);
}

/** RLS hides rows it refuses to update or delete instead of raising, so check something changed. */
function expectRows<T>(data: T[] | null, what: string): T[] {
  if (!data || data.length === 0) {
    throw new WriteError(`Nothing was saved (${what}). Your account may not be a team account.`);
  }
  return data;
}

// Team membership --------------------------------------------------------------------------

export type Membership = 'member' | 'not-member' | 'migration-missing';

export async function checkMembership(): Promise<Membership> {
  const { data, error } = await supabase.rpc('is_team_member');
  if (error) {
    // PGRST202: the function does not exist, so the portal's migration is not applied yet.
    if (error.code === 'PGRST202') return 'migration-missing';
    throw new Error(error.message);
  }
  return data === true ? 'member' : 'not-member';
}

// Reading ----------------------------------------------------------------------------------

export async function listDestinations(): Promise<DestinationRow[]> {
  const { data, error } = await supabase.from('destinations').select('*').order('name');
  if (error) fail(error);
  return data as DestinationRow[];
}

/** Everything in a Destination Pack, read the same way the phone reads it. */
export async function loadPack(destinationId: string): Promise<PackContent> {
  const [destination, trails, passages] = await Promise.all([
    supabase.from('destinations').select('*').eq('id', destinationId).single(),
    supabase.from('trails').select('*').eq('destination_id', destinationId).order('name'),
    supabase
      .from('reference_passages')
      .select('*')
      .eq('destination_id', destinationId)
      .order('topic')
      .order('language'),
  ]);
  if (destination.error) fail(destination.error);
  if (trails.error) fail(trails.error);
  if (passages.error) fail(passages.error);
  const trailIds = (trails.data as TrailRow[]).map((trail) => trail.id);
  const waypoints = trailIds.length
    ? await supabase.from('waypoints').select('*').in('trail_id', trailIds).order('trail_id').order('position')
    : { data: [], error: null };
  if (waypoints.error) fail(waypoints.error);
  return {
    destination: destination.data as DestinationRow,
    trails: trails.data as TrailRow[],
    waypoints: waypoints.data as WaypointRow[],
    passages: passages.data as PassageRow[],
  };
}

export type LastPublish = { packVersion: number; publishedAt: string; publishedBy: string; content: PackSnapshot };

/** The last publish recorded by the Admin Portal, or null if there is none. */
export async function lastPublish(destinationId: string): Promise<LastPublish | null> {
  const { data, error } = await supabase
    .from('pack_publishes')
    .select('*')
    .eq('destination_id', destinationId)
    .order('pack_version', { ascending: false })
    .limit(1);
  if (error) fail(error);
  const row = data?.[0] as
    | { pack_version: number; published_at: string; published_by: string; content: PackSnapshot }
    | undefined;
  return row
    ? { packVersion: row.pack_version, publishedAt: row.published_at, publishedBy: row.published_by, content: row.content }
    : null;
}

// Destinations ------------------------------------------------------------------------------

async function uploadMap(path: string, file: File): Promise<void> {
  const { error } = await supabase.storage.from(MAPS_BUCKET).upload(path, file, {
    contentType: 'application/vnd.pmtiles',
    cacheControl: '300',
    // A publish that failed after its upload left the file behind; replace it.
    upsert: true,
  });
  if (error) throw new WriteError(`Could not upload the map file: ${error.message}`);
}

/** A new Destination needs its map file from the start: map_path and map_bytes are required. */
export async function createDestination(values: DestinationValues, map: File): Promise<DestinationRow> {
  if (map.size <= 0) throw new WriteError('The map file is empty.');
  const mapPath = mapPathFor(values.id, 1);
  await uploadMap(mapPath, map);
  const { data, error } = await supabase
    .from('destinations')
    .insert({ ...values, pack_version: 1, map_path: mapPath, map_bytes: map.size, is_placeholder: false, updated_at: now() })
    .select();
  if (error) fail(error);
  return expectRows(data, 'Destination')[0] as DestinationRow;
}

export async function updateDestination(values: DestinationValues): Promise<void> {
  const { id, ...rest } = values;
  const { data, error } = await supabase.from('destinations').update({ ...rest, updated_at: now() }).eq('id', id).select('id');
  if (error) fail(error);
  expectRows(data, 'Destination');
}

// Trails ------------------------------------------------------------------------------------

export async function saveTrail(values: TrailValues, isNew: boolean): Promise<void> {
  const row = { ...values, updated_at: now() };
  const { data, error } = isNew
    ? await supabase.from('trails').insert(row).select('id')
    : await supabase.from('trails').update(row).eq('id', values.id).select('id');
  if (error) fail(error);
  expectRows(data, 'Trail');
}

/** Deletes a Trail and, through the foreign key, its Waypoints. */
export async function deleteTrail(id: string): Promise<void> {
  const { data, error } = await supabase.from('trails').delete().eq('id', id).select('id');
  if (error) fail(error);
  expectRows(data, 'Trail');
}

// Waypoints ---------------------------------------------------------------------------------

/** Saves a Trail's whole Waypoint list in order: deletes removed ones, then two-step positions. */
export async function saveWaypoints(
  trailId: string,
  savedIds: readonly string[],
  list: readonly Omit<WaypointRow, 'updated_at' | 'position' | 'trail_id'>[],
): Promise<void> {
  const plan = planWaypointSave(trailId, savedIds, list);
  if (plan.deleteIds.length > 0) {
    const { error } = await supabase.from('waypoints').delete().in('id', plan.deleteIds);
    if (error) fail(error);
  }
  if (plan.staged.length === 0) return;
  const stamp = now();
  for (const rows of [plan.staged, plan.final]) {
    const { data, error } = await supabase
      .from('waypoints')
      .upsert(rows.map((row) => ({ ...row, updated_at: stamp })), { onConflict: 'id' })
      .select('id');
    if (error) fail(error);
    expectRows(data, 'Waypoints');
  }
}

// Reference passages ------------------------------------------------------------------------

export async function savePassage(values: PassageValues, isNew: boolean): Promise<void> {
  const row = { ...values, updated_at: now() };
  const { data, error } = isNew
    ? await supabase.from('reference_passages').insert(row).select('id')
    : await supabase.from('reference_passages').update(row).eq('id', values.id).select('id');
  if (error) fail(error);
  expectRows(data, 'reference passage');
}

export async function deletePassage(id: string): Promise<void> {
  const { data, error } = await supabase.from('reference_passages').delete().eq('id', id).select('id');
  if (error) fail(error);
  expectRows(data, 'reference passage');
}

// Publishing --------------------------------------------------------------------------------

/**
 * Publishes the Destination Pack: optionally uploads a new map file, bumps pack_version so
 * phones download the pack again, then records what was published.
 */
export async function publishPack(content: PackContent, map: File | null): Promise<DestinationRow> {
  const { destination } = content;
  const upload = map ? { path: mapPathFor(destination.id, destination.pack_version + 1), bytes: map.size } : null;
  const payload = buildPublishPayload(destination, upload, new Date());
  if (map && upload) await uploadMap(upload.path, map);

  const { data, error } = await supabase
    .from('destinations')
    .update(payload.update)
    .eq('id', destination.id)
    .eq('pack_version', payload.expectedVersion)
    .select();
  if (error) fail(error);
  if (!data || data.length === 0) {
    throw new WriteError('Not published: someone else published this Destination first, or your account cannot write. Reload and try again.');
  }
  const published = data[0] as DestinationRow;

  const record = await supabase.from('pack_publishes').insert({
    destination_id: destination.id,
    pack_version: published.pack_version,
    content: packSnapshot({ ...content, destination: published }),
  });
  if (record.error) {
    throw new WriteError(
      `Published version ${published.pack_version}, but could not record it for "what changed": ${record.error.message}`,
    );
  }
  return published;
}
