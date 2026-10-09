#!/usr/bin/env python3
"""Build trail.geojson and waypoints.geojson for Mt. Pulag from the saved Overpass response.

    python3 -I content/pulag/scripts/build_geojson.py content/pulag/raw/overpass.json

OSM has a hiking route relation for this Trail, 3625651 "Ambangeg Trail to Pulag". Its five
member ways are chained here in the relation's order, and each join is checked to be a shared
node, so no geometry is invented:

  28489050 "Ambangeg Trail" (paved, from trailhead node 312984720 at the Babadak ranger station)
  -> 712312668 "Ambangeg Trail" -> 70084439 "Ambangeg Trail" (past Camp 1 to Camp 2)
  -> 28489052 "Pulag Camp 2 - Pulag Camp 3" -> 28489053 "Pulag Camp 3 - Pulag Summit"
  (to node 312986304, about 7 m from summit node 332020032)

That's 7,425 m with data as of 2026-10-09. Most of the ways come from Ervin Malicdem's
(Schadow1 Expeditions) Garmin traces.

The Trail is the way up only (jump-off to summit), like Batulao's and Ulap's: the Hike screen
expects an out-and-back Trail, and on Ambangeg hikers come down the same way.

Standard library only.
"""

import json
import math
import sys
from pathlib import Path

CONTENT = Path(__file__).resolve().parent.parent

RELATION = 3625651
JUMP_OFF_NODE = 312984720   # highway=trailhead "Mt. Pulag Jumpoff - Babalak", 8 m from way 712312667 "Babadak Ranger Station"
SUMMIT_NODE = 332020032     # natural=peak "Mount Pulag", ele 2928 in OSM (DENR-CAR gives 2,922 m)

TRAIL_ID = "pulag-ambangeg-trail"
DESTINATION = "pulag"

CAMP_NOTE = ("The park office closed Camps 1 and 2 for clean-up in February 2025. Hikers reported camping "
             "here again in late 2025, and a 2026 guide says weekdays only. Ask the park office when you book. "
             "No open fires.")
WATER_NOTE = "Spring mapped in OpenStreetMap; flow isn't confirmed. Treat all water before drinking."

# Waypoints after the jump-off, in order up the Trail. Only the four app types exist (jump_off,
# campsite, water, summit). `osm` is node/<id> or way/<id> (a way's centre is used).
WAYPOINTS = [
    {"osm": "node/1914649477", "type": "campsite", "name": "Camp 1", "name_fil": "Camp 1",
     "note": "In the mossy forest, about 1 hour from the ranger station. Toilets nearby. " + CAMP_NOTE},
    {"osm": "node/837190992", "type": "water", "name": "Spring between Camp 1 and Camp 2",
     "name_fil": "Bukal sa pagitan ng Camp 1 at Camp 2", "note": WATER_NOTE},
    {"osm": "node/3266680875", "type": "water", "name": "Spring by Camp 2", "name_fil": "Bukal sa tabi ng Camp 2",
     "note": WATER_NOTE + " There's no water past Camp 2."},
    {"osm": "way/320168582", "type": "campsite", "name": "Camp 2", "name_fil": "Camp 2",
     "note": "At the edge of the grassland, about 2,700 m up. Altitude can affect people who sleep here. " + CAMP_NOTE},
    {"osm": f"node/{SUMMIT_NODE}", "type": "summit", "name": "Mt. Pulag summit", "name_fil": "Tuktok ng Mt. Pulag",
     "note": "About 2,922 m (DENR-CAR); OpenStreetMap gives 2,928 m. Cold and windy, especially before "
             "sunrise, with frost in the cool months. No camping on the summit."},
]


def dist(a, b):
    """Metres between two (lon, lat) points (haversine)."""
    r = 6371008.8
    lon1, lat1, lon2, lat2 = map(math.radians, (*a, *b))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def point_to_segment(p, a, b):
    """(distance in metres, fraction along a->b) from p to segment a-b, in a local metric frame."""
    k = math.cos(math.radians(p[1]))
    ax, ay = (a[0] - p[0]) * k, a[1] - p[1]
    bx, by = (b[0] - p[0]) * k, b[1] - p[1]
    dx, dy = bx - ax, by - ay
    t = 0.0 if dx == dy == 0 else max(0.0, min(1.0, -(ax * dx + ay * dy) / (dx * dx + dy * dy)))
    cx, cy = ax + t * dx, ay + t * dy
    return math.hypot(cx, cy) * 111195.0, t


def main(raw_path):
    raw = json.loads(Path(raw_path).read_text())
    as_of = raw["osm3s"]["timestamp_osm_base"]
    elements = raw["elements"]
    rel = next(e for e in elements if e["type"] == "relation" and e["id"] == RELATION)
    ways = {e["id"]: e for e in elements if e["type"] == "way"}
    nodes = {e["id"]: e for e in elements if e["type"] == "node"}
    members = [m["ref"] for m in rel["members"] if m["type"] == "way"]

    # Chain the member ways, flipping any that run the other way. Every join must be a shared node.
    path, line = [JUMP_OFF_NODE], []
    for wid in members:
        w = ways[wid]
        ids, pts = w["nodes"], [(g["lon"], g["lat"]) for g in w["geometry"]]
        if ids[0] != path[-1]:
            ids, pts = ids[::-1], pts[::-1]
        if ids[0] != path[-1]:
            sys.exit(f"way {wid} doesn't join the Trail at node {path[-1]}")
        if not line:
            line.append(pts[0])
        path += ids[1:]
        line += pts[1:]
    cum = [0.0]
    for a, b in zip(line, line[1:]):
        cum.append(cum[-1] + dist(a, b))
    length = round(cum[-1])

    trail = {
        "type": "Feature",
        "geometry": {"type": "LineString", "coordinates": [list(p) for p in line]},
        "properties": {
            "id": TRAIL_ID, "destination": DESTINATION,
            "name": "Ambangeg Trail", "name_fil": "Ambangeg Trail",
            "is_main": True,
            "description": "The easiest and most used Trail up Mt. Pulag: from the ranger station in Bashoy, "
                           "Kabayan, through mossy forest past Camp 1 and Camp 2, then over open grassland to "
                           "the summit. Hikers return the same way.",
            "length_m": length,
            "osm_ids": [f"relation/{RELATION}"] + [f"way/{w}" for w in members],
            "osm_timestamp": max(ways[w]["timestamp"] for w in members),
            "osm_data_as_of": as_of,
            "source": "© OpenStreetMap contributors (ODbL)",
        },
    }

    def locate(pt):
        """(offset from the Trail in m, distance along it in m) for a point."""
        best_off, best_along = float("inf"), 0.0
        for i, (a, b) in enumerate(zip(line, line[1:])):
            off, t = point_to_segment(pt, a, b)
            if off < best_off:
                best_off, best_along = off, cum[i] + t * (cum[i + 1] - cum[i])
        return best_off, best_along

    jump = nodes[JUMP_OFF_NODE]
    features = [{
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [jump["lon"], jump["lat"]]},
        "properties": {
            "id": f"{TRAIL_ID}-jump-off", "trail": TRAIL_ID, "type": "jump_off",
            "name": "Babadak Ranger Station", "name_fil": "Babadak Ranger Station", "order": 1,
            "distance_from_start_m": 0, "offset_from_trail_m": 0.0,
            "source": f"osm:node/{JUMP_OFF_NODE}", "osm_timestamp": jump["timestamp"],
            "note": "The Ambangeg Trail's ranger station in Bashoy, Kabayan (also spelled Badabak or Babalak). "
                    "Register and attend the orientation at the DENR Visitor Center in Ambangeg, Bokod, first. "
                    "Guides are hired here.",
        },
    }]
    for i, wp in enumerate(WAYPOINTS, start=2):
        kind, ref = wp["osm"].split("/")
        el = nodes[int(ref)] if kind == "node" else ways[int(ref)]
        pt = (el["lon"], el["lat"]) if kind == "node" else (el["center"]["lon"], el["center"]["lat"])
        off, along = locate(pt)
        props = {
            "id": f"{TRAIL_ID}-{wp['type']}" + ("" if wp["type"] == "summit" else f"-{i}"),
            "trail": TRAIL_ID, "type": wp["type"], "name": wp["name"], "name_fil": wp["name_fil"],
            "order": i,
            "distance_from_start_m": length if wp["type"] == "summit" else round(along),
            "offset_from_trail_m": round(off, 1),
            "source": f"osm:{wp['osm']}", "osm_timestamp": el["timestamp"], "note": wp["note"],
        }
        if "ele" in el.get("tags", {}):
            props["ele_m"] = float(el["tags"]["ele"])
        features.append({"type": "Feature", "geometry": {"type": "Point", "coordinates": list(pt)},
                         "properties": props})

    (CONTENT / "trail.geojson").write_text(
        json.dumps({"type": "FeatureCollection", "features": [trail]}, ensure_ascii=False, indent=1) + "\n")
    (CONTENT / "waypoints.geojson").write_text(
        json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False, indent=1) + "\n")
    print(f"Trail {TRAIL_ID}: {length} m, {len(line)} vertices, relation {RELATION}, ways {members}")
    for f in features:
        p = f["properties"]
        print(f"  {p['order']}. {p['type']:9} {p['name']:34} {p['distance_from_start_m']:>5} m along, "
              f"{p['offset_from_trail_m']} m off, ele {p.get('ele_m', '-')}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else CONTENT / "raw" / "overpass.json")
