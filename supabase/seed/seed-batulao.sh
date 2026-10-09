#!/usr/bin/env bash
# Seeds the thin, PLACEHOLDER Mt. Batulao Destination Pack (issue #4) into the linked Supabase
# project: cuts the PMTiles map file, uploads it to the public 'maps' bucket, then writes the
# Destination, Trail, Waypoints and reference passages from batulao.sql.
#
# Needs only the Supabase CLI login (access token): run `supabase link --project-ref <ref>`
# once from the repo root. No database password or service-role key is stored anywhere.
#
# Usage, from the repo root:
#   supabase/seed/seed-batulao.sh                    # cut a fresh map file, then seed
#   supabase/seed/seed-batulao.sh path/to/map.pmtiles  # seed with an existing map file
#
# The map file is never committed. It covers Mt. Batulao and the roads around it
# (Nasugbu to Tagaytay) up to zoom 15, about 4 MB.
set -euo pipefail

SUPABASE="${SUPABASE:-$(command -v supabase || echo "$HOME/.local/bin/supabase")}"
PMTILES="${PMTILES:-$(command -v pmtiles || echo "$HOME/.local/bin/pmtiles")}"
# A Protomaps daily planet build (https://maps.protomaps.com/builds/). Builds are kept for a
# limited time, so pass a newer date if this one is gone.
PROTOMAPS_BUILD="${PROTOMAPS_BUILD:-20261009}"
BBOX="120.66,13.96,120.95,14.12"
MAXZOOM=15
MAP_PATH="batulao.pmtiles"

cd "$(dirname "$0")/../.."

map_file="${1:-}"
if [[ -z "$map_file" ]]; then
  map_file="$(mktemp -d)/batulao.pmtiles"
  echo "Cutting the map file from Protomaps build ${PROTOMAPS_BUILD}…"
  "$PMTILES" extract "https://build.protomaps.com/${PROTOMAPS_BUILD}.pmtiles" "$map_file" \
    --bbox="$BBOX" --maxzoom="$MAXZOOM"
fi
map_bytes="$(wc -c < "$map_file" | tr -d ' ')"
echo "Map file: $map_file ($map_bytes bytes)"

echo "Uploading it to Storage as maps/${MAP_PATH}…"
"$SUPABASE" storage cp "$map_file" "ss:///maps/$MAP_PATH" --linked --experimental \
  --content-type application/vnd.pmtiles --cache-control "max-age=300"

echo "Writing the Batulao rows…"
"$SUPABASE" db query --linked -f supabase/seed/batulao.sql > /dev/null
# The seed file carries the size of the map file it was written with; record the real one.
# A new map file is new pack content, so bump the version when the size changes.
"$SUPABASE" db query --linked \
  "update public.destinations
      set pack_version = pack_version + (map_bytes <> $map_bytes)::int,
          map_bytes = $map_bytes, updated_at = now()
    where id = 'batulao'" > /dev/null

"$SUPABASE" db query --linked \
  "select d.id, d.pack_version, d.map_bytes,
          (select count(*) from public.trails t where t.destination_id = d.id) as trails,
          (select count(*) from public.waypoints w join public.trails t on t.id = w.trail_id
            where t.destination_id = d.id) as waypoints,
          (select count(*) from public.reference_passages p where p.destination_id = d.id) as passages
     from public.destinations d where d.id = 'batulao'"
echo "Done."
