# Mt. Ulap content

Source content for the Mt. Ulap Destination Pack ([#22](https://github.com/jomcas/jajj-app-builders-2k26/issues/22)): the Trail, its Waypoints and the offline map. The reference passages are the RAG drafts in [`content/destinations/mt-ulap/`](../destinations/mt-ulap/). The layout follows [`content/batulao/`](../batulao/README.md), so read that first.

The OSM data is as of 2026-10-09T21:27Z.

## Files

| File | What it is |
|---|---|
| `trail.geojson` | One `LineString`, from the Ampucao jump-off to the summit. Same properties as Batulao's. |
| `waypoints.geojson` | The jump-off, Camp Site 1 and the summit. Same properties as Batulao's. |
| `make-pmtiles.sh` | Cuts `ulap.pmtiles` from the same pinned Protomaps build as Batulao (20261009). |
| `ulap.pmtiles` | The offline map. It's generated and git-ignored, 1.79 MB (1,788,256 bytes). |
| `queries/ulap.overpassql` | The Overpass query: every footpath, track and minor road around the ridge, plus Waypoint candidates. |
| `raw/overpass.json` | That query's saved response. |
| `scripts/build_geojson.py` | Chains the Trail and places the Waypoints. The OSM ways it uses are listed at the top. |
| `scripts/build_seed.py` | Writes `supabase/seed/ulap.sql` from the GeoJSON and the passage drafts. |
| `scripts/validate.py` | Checks all of the above. |

## The Trail

OSM has no route relation for the Mt. Ulap Eco-Trail. Its named ways ("Mount Ulap Eco Trail" and "Philex Ridge Trail") run along the same ridge and share nodes. `build_geojson.py` takes the shortest path over the area's footpaths from the jump-off to the summit, and makes unnamed paths cost 1.5 times as much so the named ways win.

| Trail | From → to | Length |
|---|---|---|
| **Eco-Trail from Ampucao** (`ulap-eco-trail`) | Node 3707404857 (the north end of the Philex Ridge Trail) → node 7101488066, 11 m from summit node 7101485014 | 5,086 m |

Decisions:

- **The Trail goes only from the jump-off to the summit.** Most hikers traverse down to Sta. Fe, but the Hike screen expects an out-and-back Trail (the end-of-Trail and back-at-the-jump-off cards). The passages describe the descent to Sta. Fe. A hiker on the descent sees a Deviation alert. Drawing the traverse needs a Hike change first.
- **The jump-off is the north end of the mapped trail**, about 700 m west of the Ampucao Barangay Hall (node 4794386922), where hikers register. OSM doesn't connect the trail to the barangay road. The nearest road is 109 m away.
- **The summit** is node 7101485014 "Mount Ulap Summit" (1,843 m in OSM), which matches Pinoy Mountaineer's coordinates. The other summit node, 5235980108 (1,845 m), is about 370 m south near Camp Site 2. The Destination shows "about 1,846 m" (see `docs/research/rag-sources.md`, 4.1).
- Sources give 8 to 9.5 km for the full traverse, with the summit at about km 6 (LakbayPinas 2026). OSM's 5.1 km to the summit is in line with that, since the trace is smoother than a GPS track.

## Waypoints

| # | Type | Name | Along | Off the Trail | OSM |
|---|---|---|---|---|---|
| 1 | jump_off | Ampucao jump-off | 0 m | 0 m | node/3707404857 |
| 2 | campsite | Camp Site 1 | 2,156 m | 34 m | node/7101485010 |
| 3 | summit | Mt. Ulap summit | 5,086 m | 11 m | node/7101485014 |

- **No water Waypoint.** OSM maps no water source on the ridge, and every source says there is none. The store at Camp Site 2 is covered in the passages.
- **Ambanaw-Paoay and Gungal Rock** aren't Waypoints. The app has only four Waypoint types (jump-off, campsite, water, summit), and neither peak is one of them. The passages cover both.
- **Camp Site 2** (node 7101485015) is south of the summit, on the way down to Sta. Fe, so it's past the end of this Trail.

## Passages

The seed reads `content/destinations/mt-ulap/passages/*.md`, all 16, and writes two rows for each: `ulap-<file>-en` and `ulap-<file>-fil`. Each passage's sources are resolved from `SOURCES.md` into the `sources` jsonb column. `as_of` is `last_checked`. Topics use Batulao's five values (`getting_there`, `registration`, `campsites`, `water`, `hazards`), mapped in `build_seed.TOPICS`.

Before shipping: a native speaker needs to review the Filipino text, and the 9 passages with `verify: true` must be confirmed or stay worded as "confirm at registration". The Eco-Trail resumed on 16 Sep 2026 after the latest provincial suspension. Check for a newer closure notice before any demo.

## How it was made

From the repo root:

```sh
# 1. OSM data (Overpass sometimes answers "server too busy"; retry)
curl -s -A "tahak-content" --data-urlencode data@content/ulap/queries/ulap.overpassql \
  https://overpass-api.de/api/interpreter -o content/ulap/raw/overpass.json

# 2. Trail and Waypoints
python3 -I content/ulap/scripts/build_geojson.py content/ulap/raw/overpass.json

# 3. Offline map (needs the pmtiles CLI: brew install pmtiles)
content/ulap/make-pmtiles.sh

# 4. Check everything
python3 -I content/ulap/scripts/validate.py
```

## Loading into Supabase

Run `supabase/seed/seed-ulap.sh` from the repo root, after `supabase link`. It works like `seed-batulao.sh`: it uploads the map as `maps/ulap-v<PACK_VERSION>.pmtiles`, then upserts the `ulap` Destination and replaces its Trail, Waypoints and passages in one transaction. Once it has run, Mt. Ulap appears in Explore.

## Attribution and licenses

The same as Batulao: "© OpenStreetMap contributors · © Protomaps" wherever the map appears. `trail.geojson` and `waypoints.geojson` are ODbL derived databases. The passages are original text that paraphrases the sources in `content/destinations/mt-ulap/SOURCES.md`.
