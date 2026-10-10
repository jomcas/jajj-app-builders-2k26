# Mt. Pulag content

Source content for the Mt. Pulag Destination Pack ([#22](https://github.com/jomcas/jajj-app-builders-2k26/issues/22)): the Ambangeg Trail, its Waypoints and the offline map. The reference passages are in [`content/destinations/mt-pulag/`](../destinations/mt-pulag/). The layout follows [`content/ulap/`](../ulap/README.md), which follows [`content/batulao/`](../batulao/README.md), so read those first.

The OSM data is as of 2026-10-09T23:20Z. Passages were checked on 2026-10-10.

## Files

| File | What it is |
|---|---|
| `trail.geojson` | One `LineString`, from the Babadak ranger station to the summit. Same properties as Batulao's. |
| `waypoints.geojson` | The jump-off, Camp 1, two springs, Camp 2 and the summit. Same properties as Batulao's. |
| `make-pmtiles.sh` | Cuts `pulag.pmtiles` from the same pinned Protomaps build as Batulao and Ulap (20261009), with a 6 km margin. |
| `pulag.pmtiles` | The offline map. It's generated and git-ignored, 1.47 MB (1,469,577 bytes). |
| `queries/pulag.overpassql` | The Overpass query: hiking route relations, every footpath, track and minor road from Ambangeg to the summit, and Waypoint candidates. |
| `raw/overpass.json` | That query's saved response. |
| `scripts/build_geojson.py` | Chains the Trail from the route relation and places the Waypoints. The OSM ways it uses are listed at the top. |
| `scripts/build_seed.py` | Writes `supabase/seed/pulag.sql` from the GeoJSON and the passages. |
| `scripts/validate.py` | Checks all of the above. |

## The Trail

OSM has the hiking route relation [3625651 "Ambangeg Trail to Pulag"](https://www.openstreetmap.org/relation/3625651). `build_geojson.py` chains its five member ways in order and stops if any two don't share a node. Today every join is a shared node, so the Trail is continuous and nothing is drawn by hand.

| Trail | Ways (jump-off → summit) | Length |
|---|---|---|
| **Ambangeg Trail** (`pulag-ambangeg-trail`) | 28489050 (from trailhead node 312984720) → 712312668 → 70084439 → 28489052 → 28489053 (to node 312986304, 7 m from summit node 332020032) | 7,425 m |

Decisions:

- **The Trail starts at the ranger station, not at the DENR Visitor Center.** Hikers register and attend the orientation at the Visitor Center in Ambangeg, Bokod (OSM way 320168583, about 7.6 km away in a straight line), then ride up to the ranger station. The first way (28489050, 314 m) is a paved road from the trailhead node to where the footpath starts. It's in the relation, so it stays in the Trail.
- **The jump-off** is OSM trailhead node 312984720 "Mt. Pulag Jumpoff – Babalak", 8 m from the ranger station (way 712312667 "Babadak Ranger Station"). The Waypoint is named "Babadak Ranger Station", the spelling in the 2016 DENR notice quoted by Rappler. Passage 06 explains the other spellings (Badabak, Babalak).
- **The Trail goes up only.** Ambangeg hikers come down the same way, which is what the Hike screen expects.
- **Length.** Pinoy Mountaineer gives about 8 km; OSM gives 7.4 km. Most of the ways come from Ervin Malicdem's (Schadow1 Expeditions) Garmin traces.
- **Longest segment: 77 m.** The Ulap validator allows 60 m, and Pulag's allows 80 m. The vertices are OSM's own, so nothing is interpolated.

## Waypoints

| # | Type | Name | Along | Off the Trail | Elevation (OSM) | OSM |
|---|---|---|---|---|---|---|
| 1 | jump_off | Babadak Ranger Station | 0 m | 0 m | – | node/312984720 |
| 2 | campsite | Camp 1 | 2,254 m | 4.2 m | 2,577 m | node/1914649477 |
| 3 | water | Spring between Camp 1 and Camp 2 | 3,058 m | 0 m | 2,650 m | node/837190992 |
| 4 | water | Spring by Camp 2 | 4,848 m | 5.2 m | 2,700 m | node/3266680875 |
| 5 | campsite | Camp 2 | 4,903 m | 33.1 m | 2,709 m | way/320168582 (centre) |
| 6 | summit | Mt. Pulag summit | 7,425 m | 6.6 m | 2,928 m | node/332020032 |

- **Water.** Both springs are OSM `natural=spring` nodes. No source confirms their flow, so their notes say to treat the water, and Camp 2's spring note says there's no water above it. Pinoy Mountaineer's "source about 100 m from Camp 2" is probably the spring by Camp 2.
- **Campsites.** Camps 1 and 2 were closed for clean-up in February 2025. A November 2025 trip report camped at Camp 2, and a 2026 blog says camping is allowed on weekdays only. No official reopening notice was found, so the Waypoint notes say to ask the park office.
- **Elevation.** The summit Waypoint carries OSM's 2,928 m, and its note gives DENR-CAR's 2,922 m. The Destination uses 2,922 m, the figure from DENR-CAR, which manages the park.
- **Left out:** the "Camp 2 Extension" (way 320168581), the saddle camp (node 3238428674, 317 m off this Trail on the Akiki side), toilets, viewpoints and information nodes. None of them is one of the four Waypoint types.

## The map

- Source: `https://build.protomaps.com/20261009.pmtiles` (Protomaps basemap v4.15.2), the same pinned build as Batulao and Ulap. It was still online on 2026-10-10.
- Bbox: the Trail plus **6 km**, which is `120.8241,16.5179,120.9655,16.6525`. That's 1 km more than Ulap's margin, so the DENR Visitor Center in Ambangeg (16.521 N), where every hiker starts, is on the offline map. The validator checks this.
- Zoom: 0 to 15. Size: **1,469,577 bytes** (305 tiles).

## Passages

The seed reads `content/destinations/mt-pulag/passages/*.md`, all 20, and writes two rows for each: `pulag-<file>-en` and `pulag-<file>-fil`. Each one is **40 to 90 words** in each language, like Batulao's (Ulap's are longer). Topics use Batulao's five values, mapped in `build_seed.TOPICS`:

| Topic | Passages |
|---|---|
| getting_there | 01 about, 05 Ambangeg Trail, 06 ranger station name, 07 Akiki, 08 Tawangan, 09 Ambaguio, 20 getting to the jump-off |
| registration | 02 booking and medical certificate, 03 fees, 04 guides and porters, 17 park rules and litter, 18 DENR orientation, 19 visitor and group limits |
| campsites | 10 campsites and camping rules |
| water | 11 water |
| hazards | 12 cold, frost and hypothermia; 13 altitude; 14 sunrise timing; 15 weather, fire and closures; 16 emergency contacts |

Two changes from Ulap's seed: each source in `sources` also carries `published` (from the new column in `SOURCES.md`) and `accessed`, as the `content_extras` migration describes, and `as_of` comes from each passage's own `as_of` field (the newest dated fact), not `last_checked`.

**Sources.** The drafts' fees, visitor cap and camping rules came from one low-trust 2026 blog. Now:

- **Fees and guide rates:** the Benguet Provincial Tourism Office page (published 2026-05-11, updated 2026-09-15). It's a government page, but provincial, not DENR's. Its DENR fee (₱250 weekday, ₱350 weekend) matches the 2026 blog.
- **Visitor cap:** no official current figure. Rappler (13 Feb 2016) quotes a DENR notice: 500 trekkers a day and at most 20 per group. SunStar (2013) reported 120 at a time, and DENR-CAR (2022) mentions a daily carrying capacity with no number. 2026 blogs say 500 a day and 10 per group. The passage gives all of these with their dates.
- **Booking, orientation, medical certificate:** Benguet Province (2026) says the orientation is mandatory. Rappler (2016) describes the hand marks and the turn-backs. Philstar (2015) quotes the park head on medical clearance. A November 2025 trip report and the February 2026 blog describe the current process.
- **Cold:** Philstar (2015, −2 °C reported), Pinoy Mountaineer (2013: PAGASA had no station on the mountain), and the PIA report of frost and the mayor's warning (January 2026). **Altitude:** US CDC Yellow Book 2026. **Weather:** PAGASA's seasons and wind signals.

**Weakly sourced.** These passages have `verify: true`, and each verify note explains why:

- 02 and 18, booking channels, the clinic and orientation timing: blog and trip report only.
- 03 and 04, fees and rates: provincial page, not DENR.
- 07 and 12: the PIA page returned HTTP 403, so it was read only through search excerpts.
- 10, campsites: no official reopening notice.
- 19, visitor cap: no current official figure.
- 20, travel times: Benguet Province says 4 to 5 hours and the blog says 2 to 3; the passage gives both.
- 01, 06, 08, 09 and 16 are carried over from the drafts.

Before shipping, a native speaker must review the Filipino text, and the park office (PAMO) must confirm the fees, the caps, the campsite status and the booking channel. Medical topics name the Guide to open and give no first-aid steps ([ADR 0003](../../docs/adr/0003-emergencies-route-to-guides.md)).

## How it was made

From the repo root:

```sh
# 1. OSM data (Overpass sometimes answers "server too busy"; retry)
curl -s -A "tahak-content" --data-urlencode data@content/pulag/queries/pulag.overpassql \
  https://overpass-api.de/api/interpreter -o content/pulag/raw/overpass.json

# 2. Trail and Waypoints
python3 -I content/pulag/scripts/build_geojson.py content/pulag/raw/overpass.json

# 3. Offline map (needs the pmtiles CLI: brew install pmtiles)
content/pulag/make-pmtiles.sh

# 4. Check everything
python3 -I content/pulag/scripts/validate.py
```

## Loading into Supabase

Run `supabase/seed/seed-pulag.sh` from the repo root, after `supabase link`. It works like `seed-ulap.sh`. It cuts the map if it's missing, writes `pulag.sql`, uploads the map as `maps/pulag-v<PACK_VERSION>.pmtiles`, then upserts the `pulag` Destination (`pack_version` 1, `is_placeholder` false) and replaces its Trail, Waypoints and 40 passages in one transaction. Once it has run, Mt. Pulag appears in Explore.

## Attribution and licenses

The same as Batulao: "© OpenStreetMap contributors · © Protomaps" wherever the map appears. `trail.geojson` and `waypoints.geojson` are ODbL derived databases. The passages are original text that paraphrases the sources in `content/destinations/mt-pulag/SOURCES.md`, with each source's attribution line listed there.
