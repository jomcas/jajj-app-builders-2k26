#!/usr/bin/env bash
# Cut ulap.pmtiles (the offline map for the Mt. Ulap Destination Pack)
# from a Protomaps daily basemap build. `pmtiles extract` reads only the tiles
# it needs over HTTP range requests; nothing like a full planet is downloaded.
#
# Usage (from anywhere):   content/ulap/make-pmtiles.sh
# Overrides:               BUILD=20261009 MARGIN_KM=5 MAXZOOM=15 PMTILES=$(which pmtiles)
#
# Daily builds are listed at https://maps.protomaps.com/builds and in
# https://build-metadata.protomaps.dev/builds.json. Old builds are eventually
# deleted; if the pinned one is gone, pick a newer date and note it in README.md.
set -euo pipefail

cd "$(dirname "$0")"

BUILD="${BUILD:-20261009}"          # pinned: Protomaps basemap v4.15.2, uploaded 2026-10-09
MARGIN_KM="${MARGIN_KM:-5}"         # margin around the Trails' bounding box
MAXZOOM="${MAXZOOM:-15}"            # Protomaps basemap tops out at z15; MapLibre overzooms beyond
PMTILES="${PMTILES:-$(command -v pmtiles || echo "$HOME/.local/bin/pmtiles")}"
SRC="https://build.protomaps.com/${BUILD}.pmtiles"
OUT="ulap.pmtiles"

# Bounding box of every Trail in trail.geojson, grown by MARGIN_KM on each side.
BBOX="$(python3 -I - "$MARGIN_KM" <<'PY'
import json, math, sys
margin_km = float(sys.argv[1])
fc = json.load(open("trail.geojson"))
pts = [c for f in fc["features"] for c in f["geometry"]["coordinates"]]
lons = [p[0] for p in pts]; lats = [p[1] for p in pts]
mid_lat = (min(lats) + max(lats)) / 2
dlat = margin_km / 110.574
dlon = margin_km / (111.320 * math.cos(math.radians(mid_lat)))
print(f"{min(lons)-dlon:.4f},{min(lats)-dlat:.4f},{max(lons)+dlon:.4f},{max(lats)+dlat:.4f}")
PY
)"

echo "source:  $SRC"
echo "bbox:    $BBOX  (Trails + ${MARGIN_KM} km)"
echo "maxzoom: $MAXZOOM"

"$PMTILES" extract "$SRC" "$OUT" --bbox="$BBOX" --maxzoom="$MAXZOOM"
"$PMTILES" show "$OUT"
ls -l "$OUT"
