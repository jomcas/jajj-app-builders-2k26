# Mt. Batulao content

Source content for the Mt. Batulao Destination Pack ([#5](https://github.com/jomcas/jajj-app-builders-2k26/issues/5)): the Trails, their Waypoints, the offline map, and the reference passages the Assistant quotes. These are plain data files. They get loaded into Supabase by the seed that [#4](https://github.com/jomcas/jajj-app-builders-2k26/issues/4) sets up.

Data was pulled on 2026-10-10. The OSM data is as of 2026-10-09T18:12Z.

## Files

| File | What it is |
|---|---|
| `trail.geojson` | One `LineString` per Trail, from the jump-off to the summit. Properties: `id`, `destination`, `name`, `name_fil`, `is_main`, `description`, `length_m`, `osm_ids`, `osm_timestamp` (newest edit among the ways used), `osm_data_as_of`, `source`. |
| `waypoints.geojson` | Points with `id`, `trail` (the Trail's `id`), `type` (`jump_off` \| `campsite` \| `water` \| `summit`), `name`, `name_fil`, `order`, `distance_from_start_m` (measured along that Trail), `offset_from_trail_m`, `source` (`osm:node/<id>` or `osm:way/<id>`), `osm_timestamp`, `note`, and `ele_m` when OSM has it. Shared points such as the jump-off and summit appear once per Trail, so each Trail's list stands on its own. |
| `passages.json` | Reference passages: `[{ id, topic, lang, text, sources: [{ title, url, published, accessed }], as_of }]`. Every passage has an `-en` and a `-fil` version with the same base id. `as_of` is the month of the newest dated fact in the passage. |
| `make-pmtiles.sh` | Cuts `batulao.pmtiles` from a pinned Protomaps daily build. |
| `batulao.pmtiles` | The offline map. It's generated and git-ignored, about 1.5 MB. |
| `queries/batulao.overpassql` | The Overpass query behind both GeoJSON files. |
| `raw/overpass.json` | That query's saved response, so the build can be repeated and checked offline. |
| `scripts/build_geojson.py` | Builds both GeoJSON files from the raw response. The OSM ways and nodes it uses, and why, are listed at the top of the file. |
| `scripts/validate.py` | Checks every file in this folder (see below). |

## The Trails

OSM has the hiking route relation [3350629 "Mt. Batulao New to Old Trail"](https://www.openstreetmap.org/relation/3350629), drawn from Ervin Malicdem's (Schadow1 Expeditions) 2012 Garmin traces. Both Trails start at the OSM `highway=trailhead` node [661099448 "Batulao Jumpoff"](https://www.openstreetmap.org/node/661099448), at the end of Batulao Trail Road. They share about 1.6 km to a fork near the kubo stores and split there. They meet again at summit node 661099921, about 5 m from the peak node.

| Trail | Ways (jump-off → summit) | Length |
|---|---|---|
| **New Trail** (main) | 885765978 (from node 661099448) → 188934002 → 51822351 → 188933993 → 188933994 | 3,392 m |
| **Old Trail** | 885765978 (from node 661099448) → 188934002 → 51822692 (reversed) → 188933995 → 188933999 | 4,186 m |

The New Trail is the main Trail. A 2026 trip guide calls it the gentler choice for first-timers and describes going up it and down the Old Trail as the usual plan. The relation itself is mapped New-to-Old. The approach road from the Tagaytay–Nasugbu highway (way 625845693 and part of 885765978) is in the relation but sits before the trailhead, so it's left out.

Naming trap: OSM's "Camp 8" (node 662722007) is on the **Old** Trail near the summit. The New Trail's campsite at Peak 8 (way 188933996) is what many hikers and guides call "Camp 8". The Waypoint is named "Peak 8 campsite" and its note explains the difference.

## Waypoints

| Trail | # | Type | Name | Along | OSM |
|---|---|---|---|---|---|
| New | 1 | jump_off | Batulao jump-off | 0 m | node/661099448 |
| New | 2 | campsite | Peak 8 campsite | 2,517 m | way/188933996 |
| New | 3 | summit | Mt. Batulao summit | 3,389 m | node/332020556 |
| Old | 1 | jump_off | Batulao jump-off | 0 m | node/661099448 |
| Old | 2 | water | Spring east of Camp 1 | 3,131 m | node/3042655992 |
| Old | 3 | water | Spring at Camp 1 | 3,255 m | node/1995658223 |
| Old | 4 | campsite | Camp 1 | 3,264 m | node/662722021 |
| Old | 5 | summit | Mt. Batulao summit | 4,177 m | node/332020556 |

All of them come from OSM, so none are derived. **The New Trail has no water Waypoint** on purpose. OSM has no water source on it, and the sources say the upper mountain has none either. Water sold at the campsites or the kubo isn't a water source, so it goes in the passages and not on the map. The numbered Camps 2 to 9 and Peaks 1 to 11 are in OSM as `tourism=camp_site`. They were left out because no source names them as places to camp, apart from S1 Expeditions' 2012 remark that "Camp 5 – Camp 1" are the best overnight spots. They could be added later as progress markers.

## Passages

There are 14 en/fil pairs, 28 passages, each 56 to 89 words:

| Topic | Pairs |
|---|---|
| getting_there | 2 (getting there; the two Trails) |
| registration | 3 (fees; guides; registration hours and cash) |
| water | 2 (carry your own; the Camp 1 springs) |
| campsites | 2 (Camp 1; the Peak 8 / "Camp 8" campsite) |
| hazards | 5 (sun, wind and weather; ropes and loose rock; the Peak 8 ravine and the Peak 9 wrong turn; mud and brushfires; signal and emergency contacts) |

How they were written:

- Every fact comes from a page that was read on 2026-10-10 and is cited in that passage. Distances come from the OSM data in this folder.
- Fees and guide rules disagree between sources and change often, so each passage says who reported what and when. For example: "As of June 2022, one trip report paid…" or "A 2026 guide reported…".
- The newest firsthand source is LakbayPinas (published September 2026, climbed May 2026). It's a single blog, so its claims (mandatory guide, PHP 140 + 20 + 40 fees, 5 AM booth opening, cash only) are always attributed to it and never stated as settled fact.
- No official Nasugbu LGU or DENR page on Batulao fees or rules could be found. Re-check before any public release.
- The Filipino versions are natural Tagalog that keeps the usual hiker loanwords (trail, jump-off, campsite, guide). A native speaker should review them.

## How it was made

From `content/batulao/`:

```sh
# 1. OSM data. Overpass sometimes answers "server too busy"; retry, or use https://overpass.private.coffee/api/interpreter
curl -s -A "tahak-content" --data-urlencode data@queries/batulao.overpassql \
  https://overpass-api.de/api/interpreter -o raw/overpass.json

# 2. Trails and Waypoints (standard-library Python 3)
python3 -I scripts/build_geojson.py raw/overpass.json

# 3. Offline map (needs the pmtiles CLI, https://github.com/protomaps/go-pmtiles; streams about 1.6 MB)
./make-pmtiles.sh                 # BUILD=YYYYMMDD MARGIN_KM=5 MAXZOOM=15 to override

# 4. Check everything
python3 -I scripts/validate.py
```

`passages.json` is written by hand. Edit it directly and re-run the validator.

### The map: bbox and zoom trade-off

- Source: `https://build.protomaps.com/20261009.pmtiles` (Protomaps basemap v4.15.2). Daily builds are listed at <https://maps.protomaps.com/builds>. Old builds get deleted, so if 20261009 is gone, set `BUILD` to a newer date and update this line.
- Bbox: the Trails' bounding box plus **5 km** on every side, which is `120.7549,13.9947,120.8669,14.1010`. That covers the Tagaytay–Nasugbu road and the bus drop-off at KC Hillcrest, Mt. Talamitam's slopes to the north-west, and plenty of room for a lost hiker.
- Zoom: 0 to 15. The Protomaps basemap tops out at z15, and MapLibre overzooms past it, so a z16 extract is identical (checked with `--dry-run`).
- Size: **1.53 MB** (197 tiles). Dry runs at z15 gave 0.75 MB for about a 1.5 km margin, 0.9 MB for about 3 km, and 1.6 MB for about 5 km. A 10 km margin dry-runs at 3.3 MB, so the map is nowhere near the 15 MB budget and the margin can grow if needed.

## Validation

`python3 -I scripts/validate.py` checks the following:

- **Trails.** Every vertex is a vertex of the listed OSM ways. `length_m` matches the geometry. Each join between consecutive ways is 30 m or less. Today every join is 0 m, because the ways share nodes. The longest single segment is 47.7 m.
- **Waypoints.** `type` is one of the four allowed values. `name` and `name_fil` are present. `source` is well-formed. `order` runs 1..n, and the distances increase along the Trail. Each Trail starts with `jump_off` and ends with `summit`. No Waypoint is more than 50 m off its Trail. The largest offset today is 12.2 m, the spring east of Camp 1.
- **Passages.** Every passage has an en/fil partner, an allowed topic, 40 to 90 words, at least one source with `title`, `url` and `accessed`, and an `as_of`.
- **Map.** When `batulao.pmtiles` exists, its bounds must contain the Trails with at least 1 km of margin, and the file must be 15 MB or less.

## Attribution (the app must show this wherever the map appears)

> © OpenStreetMap contributors · © Protomaps

As links: `© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>`, `<a href="https://protomaps.com">Protomaps</a>`. MapLibre's attribution control can show this from the style's source `attribution`. Keep it visible offline too, because the Hike screen is a map.

## Licenses

| Source | License and notes |
|---|---|
| OpenStreetMap: Trails, Waypoints, `raw/overpass.json` | [ODbL 1.0](https://opendatacommons.org/licenses/odbl/). Credit "© OpenStreetMap contributors". `trail.geojson` and `waypoints.geojson` are derived databases, so changes to them must stay under ODbL if they're shared publicly. |
| Protomaps basemap (`batulao.pmtiles`) | The tile data is OpenStreetMap (ODbL) plus Natural Earth (public domain), so the OSM credit is the legal requirement. The Protomaps credit is shown because #5 asks for it and as a courtesy to the build's provider. The archive's own attribution string is `© OpenStreetMap`. |
| Passages | Original text written for Tahak that paraphrases and cites the sources below. Nothing is copied beyond short quoted phrases. The blogs keep their own copyright. Sources: TransitPinas (2022), LakbayPinas (2026), The Travelling Foxes (2024), A Wanderful Sole (2024), Pinoy Mountaineer (2013, 2015), S1 Expeditions (2012), Chase Jase (around 2017), Outdoor Holiday (2025). |

## Loading into Supabase

`supabase/seed/seed-batulao.sh` (run from the repo root, after `supabase link`) does it all:

1. Uses `content/batulao/batulao.pmtiles`, and runs `make-pmtiles.sh` first if the file is missing.
2. Runs `scripts/build_seed.py --map-bytes <size>`, which writes `supabase/seed/batulao.sql` from `trail.geojson`, `waypoints.geojson` and `passages.json`.
3. Uploads the map to the public `maps` bucket as `batulao-v<PACK_VERSION>.pmtiles`. A new path per version means a CDN-cached old map is never served for a new pack.
4. Applies the SQL in one transaction. It upserts the `batulao` Destination with `is_placeholder = false`, the summaries in English and Filipino, and the map path and size. Then it replaces every Batulao Trail (New Trail first), Waypoint and passage.

Column mapping:

| File | Table and columns |
|---|---|
| `trail.geojson` | `trails`: `id`, `name`, `name_fil`\*, `distance_m` = `length_m`, `geometry` (the LineString) |
| `waypoints.geojson` | `waypoints`: `id`, `trail_id` = `trail`, `type`, `name`, `name_fil`\*, `note`\*, `latitude`/`longitude`, `elevation_m`, `position` = `order`, `distance_m` = `distance_from_start_m` |
| `passages.json` | `reference_passages`: `id` = `batulao-<id>`, `topic`, `language` = `lang`, `text`, `source` (readable summary such as `transitpinas.com (2022), lakbaypinas.com (2026)`), `sources`\* (the full jsonb array), `as_of`\* |

\* These columns come from the additive migration `20261009183000_content_extras.sql`. They are nullable, and the app ignores them until it reads them.

**Versioning.** The Destination's `pack_version` becomes `greatest(PACK_VERSION, current + 1 if the map path or size changed)`. Re-running the seed with the same files keeps the version. When you change Trails, Waypoints or passages, bump `PACK_VERSION` in `scripts/build_seed.py` so phones re-download.
