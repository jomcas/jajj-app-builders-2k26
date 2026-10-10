#!/usr/bin/env bash
# Runs the whole backend on this machine with Docker: no cloud project, no shared secrets.
#
#   1. Starts the local Supabase stack (Postgres, Auth, Storage, the REST API, Studio). The first
#      start applies supabase/migrations/ and loads the Batulao, Ulap and Pulag rows from supabase/seed/.
#   2. Adds a local Admin Portal account (supabase/seed/local-team.sql).
#   3. Uploads each Destination's offline map to the local 'maps' bucket, cutting it first if
#      content/<id>/<id>.pmtiles is missing (needs the `pmtiles` CLI and internet).
#   4. Writes apps/admin/.env.local and apps/mobile/.env.local with the local URL and anon key.
#
# Usage, from anywhere:   scripts/dev-setup.sh
# Overrides:              SUPABASE=/path/to/supabase   MOBILE_HOST=192.168.1.20   SKIP_MAPS=1
#
# MOBILE_HOST is the address the phone uses to reach this machine. It defaults to this machine's
# LAN IP, which works for a phone on the same Wi-Fi and for the Android emulator.
# Safe to run again. To wipe the local database and start over: `npx supabase db reset`, then rerun.
set -euo pipefail

cd "$(dirname "$0")/.."

# A working Supabase CLI: $SUPABASE, else `supabase` on PATH, else a pinned copy through npx.
if [[ -n "${SUPABASE:-}" ]]; then
  sb=("$SUPABASE")
elif command -v supabase > /dev/null && supabase --version > /dev/null 2>&1; then
  sb=(supabase)
elif command -v npx > /dev/null; then
  sb=(npx -y supabase@2.120.0)
else
  echo "Install the Supabase CLI (https://supabase.com/docs/guides/local-development/cli/getting-started) or Node.js." >&2
  exit 1
fi

docker info > /dev/null 2>&1 || { echo "Docker is not running. Start Docker Desktop and try again." >&2; exit 1; }

echo "==> Starting local Supabase (the first run downloads a few GB of images)…"
"${sb[@]}" start

# psql inside the database container, so nothing else needs installing. (`supabase db query
# --local` runs a single statement only.)
project_id="$(sed -n 's/^project_id = "\(.*\)"$/\1/p' supabase/config.toml)"
psql_local() { docker exec -i "supabase_db_$project_id" psql -U postgres -d postgres -q -v ON_ERROR_STOP=1 "$@"; }

echo "==> Adding the local Admin Portal account…"
psql_local < supabase/seed/local-team.sql

if [[ -n "${SKIP_MAPS:-}" ]]; then
  echo "==> Skipping maps (SKIP_MAPS is set). The Hike map will not download in the app."
else
  for id in batulao ulap pulag; do
    map_file="content/$id/$id.pmtiles"
    if [[ ! -f "$map_file" ]]; then
      pmtiles_bin="${PMTILES:-$(command -v pmtiles || echo "$HOME/.local/bin/pmtiles")}"
      if [[ -x "$pmtiles_bin" ]]; then
        echo "==> Cutting $map_file…"
        PMTILES="$pmtiles_bin" "content/$id/make-pmtiles.sh"
      else
        echo "==> No $map_file and no pmtiles CLI; skipping the $id map." >&2
        echo "    Install it (brew install pmtiles) and rerun to get the offline map." >&2
        continue
      fi
    fi
    # The object name the seed rows point at, e.g. batulao-v2.pmtiles.
    map_path="$(grep -oE "'$id-v[0-9]+\.pmtiles'" "supabase/seed/$id.sql" | head -1 | tr -d "'")"
    map_bytes="$(wc -c < "$map_file" | tr -d ' ')"
    echo "==> Uploading $map_file to maps/$map_path…"
    "${sb[@]}" storage cp "$map_file" "ss:///maps/$map_path" --local --experimental \
      --content-type application/vnd.pmtiles --cache-control "max-age=300" > /dev/null
    # A freshly cut map can differ in size from the committed seed; the app's progress bar uses this.
    psql_local -c "update public.destinations set map_bytes = $map_bytes where id = '$id'" > /dev/null
  done
fi

echo "==> Writing app env files…"
api_url="$("${sb[@]}" status -o env | sed -n 's/^API_URL="\(.*\)"$/\1/p')"
anon_key="$("${sb[@]}" status -o env | sed -n 's/^ANON_KEY="\(.*\)"$/\1/p')"
[[ -n "$api_url" && -n "$anon_key" ]] || { echo "Could not read API_URL / ANON_KEY from 'supabase status'." >&2; exit 1; }

if [[ -z "${MOBILE_HOST:-}" ]]; then
  MOBILE_HOST="$(ipconfig getifaddr en0 2> /dev/null || hostname -I 2> /dev/null | awk '{print $1}' || true)"
  MOBILE_HOST="${MOBILE_HOST:-10.0.2.2}"  # the Android emulator's alias for this machine
fi
api_port="${api_url##*:}"

cat > apps/admin/.env.local <<EOF
# Written by scripts/dev-setup.sh for the local Supabase stack. Git-ignored.
VITE_SUPABASE_URL=$api_url
VITE_SUPABASE_ANON_KEY=$anon_key
EOF

cat > apps/mobile/.env.local <<EOF
# Written by scripts/dev-setup.sh for the local Supabase stack. Git-ignored.
# The phone cannot reach "localhost" on this machine, so this is the machine's LAN address.
EXPO_PUBLIC_SUPABASE_URL=http://$MOBILE_HOST:$api_port
EXPO_PUBLIC_SUPABASE_ANON_KEY=$anon_key
EOF

cat <<EOF

Done. Local backend is running.
  API:           $api_url   (mobile uses http://$MOBILE_HOST:$api_port)
  Studio:        http://127.0.0.1:54323
  Admin login:   team@tahak.local / tahak-local
Next:  cd apps/admin && npm install && npm run dev
Stop:  npx supabase stop   (data is kept; 'npx supabase db reset' wipes it)
EOF
