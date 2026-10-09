#!/usr/bin/env python3
"""Build trail.geojson and waypoints.geojson for Mt. Ulap from the saved Overpass response.

    python3 -I content/ulap/scripts/build_geojson.py content/ulap/raw/overpass.json

OSM has no route relation for the Mt. Ulap Eco-Trail, so the Trail is chained here: the
shortest path over the area's footpaths from the jump-off to the summit, with ways named
"Mount Ulap Eco Trail" or "Philex Ridge Trail" preferred over unnamed paths.

The chain it produces today (data as of 2026-10-09), 5,086 m:
  366755651 Philex Ridge Trail (from its north end, node 3707404857) -> 760182512 Philex Ridge
  Trail -> 366755651 -> 760185742 Mount Ulap Eco Trail -> 366755651 -> 760182513 Mount Ulap
  Eco Trail -> 760182514 Philex Ridge Trail -> 760182515 Mount Ulap Eco Trail (to node
  7101488066, 11 m from summit node 7101485014)

The Trail is the way up only (jump-off to summit), like Batulao's. The descent to Sta. Fe
on the traverse is described in the passages, not drawn: the Hike screen expects an
out-and-back Trail.

Standard library only.
"""

import heapq
import json
import math
import sys
from pathlib import Path

CONTENT = Path(__file__).resolve().parent.parent

JUMP_OFF_NODE = 3707404857   # north end of "Philex Ridge Trail", ~700 m west of Ampucao Barangay Hall
SUMMIT_TRAIL_NODE = 7101488066  # the Trail vertex nearest the summit node
SUMMIT_NODE = 7101485014     # "Mount Ulap Summit", ele 1843 (matches Pinoy Mountaineer's 16.2904 N, 120.6312 E)
PATH_TYPES = {"path", "footway", "steps"}
PREFERRED_NAMES = {"Mount Ulap Eco Trail", "Philex Ridge Trail"}
UNNAMED_PENALTY = 1.5        # unnamed paths cost 1.5x, so named Trail ways win when they run alongside

TRAIL_ID = "ulap-eco-trail"
DESTINATION = "ulap"

# Waypoints after the jump-off, in order up the Trail. Only the four app types exist
# (jump_off, campsite, water, summit), so Ambanaw-Paoay and Gungal are covered in the
# passages, not as Waypoints. OSM maps no water source on the Trail.
WAYPOINTS = [
    {"node": 7101485010, "type": "campsite", "name": "Camp Site 1", "name_fil": "Camp Site 1",
     "note": "Near Ambanaw-Paoay, the first peak. No water here; carry your own."},
    {"node": SUMMIT_NODE, "type": "summit", "name": "Mt. Ulap summit", "name_fil": "Tuktok ng Mt. Ulap",
     "note": "About 1,846 m. Camp Site 2, with a small store, is just below the summit on the way down to Sta. Fe."},
]


def dist(a, b):
    """Metres between two (lon, lat) points (equirectangular; fine at these distances)."""
    r = 6371000.0
    lon1, lat1, lon2, lat2 = map(math.radians, (*a, *b))
    x = (lon2 - lon1) * math.cos((lat1 + lat2) / 2)
    return r * math.hypot(x, lat2 - lat1)


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
    ways = {e["id"]: e for e in elements if e["type"] == "way" and "geometry" in e
            and e.get("tags", {}).get("highway") in PATH_TYPES}
    nodes = {e["id"]: e for e in elements if e["type"] == "node"}

    coord, adj = {}, {}
    for w in ways.values():
        for n, g in zip(w["nodes"], w["geometry"]):
            coord[n] = (g["lon"], g["lat"])
        penalty = 1.0 if w["tags"].get("name") in PREFERRED_NAMES else UNNAMED_PENALTY
        for a, b in zip(w["nodes"], w["nodes"][1:]):
            d = dist(coord[a], coord[b]) * penalty
            adj.setdefault(a, []).append((b, d, w["id"]))
            adj.setdefault(b, []).append((a, d, w["id"]))

    best, prev, queue = {JUMP_OFF_NODE: 0.0}, {}, [(0.0, JUMP_OFF_NODE)]
    while queue:
        cost, u = heapq.heappop(queue)
        if u == SUMMIT_TRAIL_NODE:
            break
        if cost > best[u]:
            continue
        for v, d, wid in adj[u]:
            if cost + d < best.get(v, float("inf")):
                best[v], prev[v] = cost + d, (u, wid)
                heapq.heappush(queue, (cost + d, v))
    if SUMMIT_TRAIL_NODE not in prev:
        sys.exit("No path from the jump-off to the summit in this OSM data.")

    path, used = [SUMMIT_TRAIL_NODE], []
    while path[-1] != JUMP_OFF_NODE:
        u, wid = prev[path[-1]]
        path.append(u)
        if not used or used[-1] != wid:
            used.append(wid)
    path.reverse()
    used.reverse()
    line = [list(coord[n]) for n in path]
    cum = [0.0]
    for a, b in zip(line, line[1:]):
        cum.append(cum[-1] + dist(a, b))
    length = round(cum[-1])

    trail = {
        "type": "Feature",
        "geometry": {"type": "LineString", "coordinates": line},
        "properties": {
            "id": TRAIL_ID, "destination": DESTINATION,
            "name": "Eco-Trail from Ampucao", "name_fil": "Eco-Trail mula Ampucao",
            "is_main": True,
            "description": "The Mt. Ulap Eco-Trail from the Ampucao side up to the summit, past Ambanaw-Paoay "
                           "and Gungal Rock. The usual traverse continues down to Sta. Fe.",
            "length_m": length,
            "osm_ids": [f"way/{w}" for w in used],
            "osm_timestamp": max(ways[w]["timestamp"] for w in set(used)),
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

    jump = coord[JUMP_OFF_NODE]
    features = [{
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": list(jump)},
        "properties": {
            "id": "ulap-eco-trail-jump-off", "trail": TRAIL_ID, "type": "jump_off",
            "name": "Ampucao jump-off", "name_fil": "Jump-off sa Ampucao", "order": 1,
            "distance_from_start_m": 0, "offset_from_trail_m": 0.0,
            "source": f"osm:node/{JUMP_OFF_NODE}",
            "osm_timestamp": ways[used[0]]["timestamp"],
            "note": "Register first at the Ampucao Barangay Hall, about 700 m east, then walk to the start of the trail.",
        },
    }]
    for i, wp in enumerate(WAYPOINTS, start=2):
        n = nodes[wp["node"]]
        pt = (n["lon"], n["lat"])
        off, along = locate(pt)
        props = {
            "id": f"ulap-eco-trail-{wp['type']}" + ("" if wp["type"] == "summit" else f"-{i}"),
            "trail": TRAIL_ID, "type": wp["type"], "name": wp["name"], "name_fil": wp["name_fil"],
            "order": i,
            "distance_from_start_m": length if wp["type"] == "summit" else round(along),
            "offset_from_trail_m": round(off, 1),
            "source": f"osm:node/{wp['node']}", "osm_timestamp": n["timestamp"], "note": wp["note"],
        }
        if "ele" in n.get("tags", {}):
            props["ele_m"] = float(n["tags"]["ele"])
        features.append({"type": "Feature", "geometry": {"type": "Point", "coordinates": list(pt)},
                         "properties": props})

    (CONTENT / "trail.geojson").write_text(
        json.dumps({"type": "FeatureCollection", "features": [trail]}, ensure_ascii=False, indent=1) + "\n")
    (CONTENT / "waypoints.geojson").write_text(
        json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False, indent=1) + "\n")
    print(f"Trail {TRAIL_ID}: {length} m, {len(line)} vertices, ways {used}")
    for f in features:
        p = f["properties"]
        print(f"  {p['order']}. {p['type']:9} {p['name']:22} {p['distance_from_start_m']:>5} m along, "
              f"{p['offset_from_trail_m']} m off")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else CONTENT / "raw" / "overpass.json")
