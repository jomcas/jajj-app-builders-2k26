#!/usr/bin/env bash
# Seeds the Mt. Pulag Destination Pack (issue #22) into the linked Supabase project:
# makes sure the map file exists, writes pulag.sql from content/pulag/, uploads the map to
# the public 'maps' bucket, then writes the Destination, Trails, Waypoints and reference passages.
#
# Needs only the Supabase CLI login (access token): run `supabase link --project-ref <ref>`
# once from the repo root. No database password or service-role key is stored anywhere.
# Needs migration 20261009183000_content_extras.sql applied (`supabase db push --linked`).
#
# Usage, from the repo root:
#   supabase/seed/seed-pulag.sh                      # use content/pulag/pulag.pmtiles (cut it if missing)
#   supabase/seed/seed-pulag.sh path/to/map.pmtiles  # seed with another map file
#
# The map file is never committed. content/pulag/make-pmtiles.sh cuts it from a pinned
# Protomaps build: the Trail plus 6 km, up to zoom 15, about 1.5 MB.
#
# To publish changed Trails, Waypoints or passages, bump PACK_VERSION in
# content/pulag/scripts/build_seed.py so phones see the update. A map file of a different
# size bumps the version on its own.
set -euo pipefail

SUPABASE="${SUPABASE:-$(command -v supabase || echo "$HOME/.local/bin/supabase")}"

cd "$(dirname "$0")/../.."

map_file="${1:-content/pulag/pulag.pmtiles}"
if [[ ! -f "$map_file" ]]; then
  echo "No map file at $map_file; cutting one…"
  content/pulag/make-pmtiles.sh
  map_file="content/pulag/pulag.pmtiles"
fi
map_bytes="$(wc -c < "$map_file" | tr -d ' ')"
echo "Map file: $map_file ($map_bytes bytes)"

echo "Writing supabase/seed/pulag.sql from content/pulag/…"
python3 -I content/pulag/scripts/build_seed.py --map-bytes "$map_bytes"
map_path="$(sed -n "s/^   [0-9]*, '\([^']*\.pmtiles\)', $map_bytes, false, now())\$/\1/p" supabase/seed/pulag.sql)"
[[ -n "$map_path" ]] || { echo "Could not read map_path from pulag.sql" >&2; exit 1; }

echo "Uploading the map to Storage as maps/${map_path}…"
"$SUPABASE" storage cp "$map_file" "ss:///maps/$map_path" --linked --experimental \
  --content-type application/vnd.pmtiles --cache-control "max-age=300"

echo "Writing the Pulag rows…"
"$SUPABASE" db query --linked -f supabase/seed/pulag.sql > /dev/null

"$SUPABASE" db query --linked \
  "select d.id, d.pack_version, d.map_path, d.map_bytes, d.is_placeholder,
          (select count(*) from public.trails t where t.destination_id = d.id) as trails,
          (select count(*) from public.waypoints w join public.trails t on t.id = w.trail_id
            where t.destination_id = d.id) as waypoints,
          (select count(*) from public.reference_passages p where p.destination_id = d.id) as passages
     from public.destinations d where d.id = 'pulag'"
echo "Done."
