#!/usr/bin/env python3
"""Build trail.geojson and waypoints.geojson for Mt. Batulao from a saved
Overpass response (raw/overpass.json, made by queries/batulao.overpassql).

Standard library only. Run from content/batulao/:

    python3 -I scripts/build_geojson.py raw/overpass.json

Every choice of which OSM elements to use is written out in TRAILS and
WAYPOINTS below, so a reviewer can check each one against openstreetmap.org.
"""

import json
import math
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
MAX_GAP_M = 30.0  # joined ways must meet within this distance

# Both Trails share the approach from the trailhead to the fork (node
# 1995658778, near Kubo 2 / Peak 1), then split. They meet again just below
# the summit. Ways are listed jump-off -> summit; "rev" means the OSM way is
# drawn the other way and is reversed here. "from_node" trims a way so the
# Trail starts at the trailhead instead of at the highway.
SHARED_APPROACH = [
    {"way": 885765978, "from_node": 661099448},  # Batulao Trail Road, from the "Batulao Jumpoff" trailhead node
    {"way": 188934002},  # path "Batulao", past the kubo stores to the fork
]

TRAILS = [
    {
        "id": "batulao-new-trail",
        "name": "New Trail",
        "name_fil": "Bagong Trail",
        "is_main": True,
        "description": "West ridge over Peaks 1 to 11. Reported as the gentler, more common way up for first-timers.",
        "ways": SHARED_APPROACH + [
            {"way": 51822351},   # New Trail: fork -> Peak 3 area
            {"way": 188933993},  # New Trail: over Peaks 3-11 to just below the summit
            {"way": 188933994},  # New Trail: last metres to the summit node
        ],
    },
    {
        "id": "batulao-old-trail",
        "name": "Old Trail",
        "name_fil": "Lumang Trail",
        "is_main": False,
        "description": "East side via Camps 1 to 9, with the steep roped section below the summit. Often used for the descent of a New-to-Old traverse.",
        "ways": SHARED_APPROACH + [
            {"way": 51822692, "rev": True},  # Old Trail: fork -> Camp 1 -> Camp 9 (drawn summit-first in OSM)
            {"way": 188933995},  # Old Trail: Camp 9 -> rappel point
            {"way": 188933999},  # "Summit Trail": last metres to the summit node
        ],
    },
]

# Curated Waypoints. type is one of jump_off | campsite | water | summit.
# osm is "node/<id>" or "way/<id>" (a way's centre is used).
WAYPOINTS = [
    # New Trail (main)
    {"trail": "batulao-new-trail", "type": "jump_off", "osm": "node/661099448",
     "name": "Batulao jump-off", "name_fil": "Jump-off ng Batulao",
     "note": "OSM highway=trailhead \"Batulao Jumpoff\" at the end of Batulao Trail Road. The registration booth (OSM shop=ticket, node 6389746485) is about 120 m before it on the same road."},
    {"trail": "batulao-new-trail", "type": "campsite", "osm": "way/188933996",
     "name": "Peak 8 campsite", "name_fil": "Kampuhan sa Peak 8",
     "note": "The New Trail's campsite and fee checkpoint. Some trip reports call it \"Camp 8\"; it is not the Old Trail's Camp 8 near the summit."},
    {"trail": "batulao-new-trail", "type": "summit", "osm": "node/332020556",
     "name": "Mt. Batulao summit", "name_fil": "Tuktok ng Bundok Batulao",
     "note": "811 m (OSM ele). Camping at the summit is reported as not allowed."},
    # Old Trail (alternate)
    {"trail": "batulao-old-trail", "type": "jump_off", "osm": "node/661099448",
     "name": "Batulao jump-off", "name_fil": "Jump-off ng Batulao",
     "note": "Shared with the New Trail up to the fork past the kubo stores."},
    {"trail": "batulao-old-trail", "type": "water", "osm": "node/3042655992",
     "name": "Spring east of Camp 1", "name_fil": "Bukal sa silangan ng Camp 1",
     "note": "OSM natural=spring, off the path. Reported seasonal and not reliably safe: treat or filter before drinking."},
    {"trail": "batulao-old-trail", "type": "water", "osm": "node/1995658223",
     "name": "Spring at Camp 1", "name_fil": "Bukal sa Camp 1",
     "note": "OSM natural=spring beside Camp 1. Reported seasonal and not reliably safe: treat or filter before drinking."},
    {"trail": "batulao-old-trail", "type": "campsite", "osm": "node/662722021",
     "name": "Camp 1", "name_fil": "Camp 1 (kampuhan)",
     "note": "The designated campsite at the foot of the Old Trail: the largest tent area, with toilets and a store reported."},
    {"trail": "batulao-old-trail", "type": "summit", "osm": "node/332020556",
     "name": "Mt. Batulao summit", "name_fil": "Tuktok ng Bundok Batulao",
     "note": "811 m (OSM ele). The last section from Camp 9 is steep, with fixed ropes."},
]


def haversine(a, b):
    """Metres between two (lon, lat) points."""
    r = 6371008.8
    lon1, lat1, lon2, lat2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def line_length(coords):
    return sum(haversine(coords[i], coords[i + 1]) for i in range(len(coords) - 1))


def project(point, coords):
    """Distance along the line to the closest point, and the offset to it (metres).
    Uses a local equirectangular plane, accurate to well under a metre at this scale."""
    lat0 = math.radians(point[1])
    kx = 111320.0 * math.cos(lat0)
    ky = 110574.0

    def xy(p):
        return ((p[0] - point[0]) * kx, (p[1] - point[1]) * ky)

    best = (float("inf"), 0.0)
    along = 0.0
    for i in range(len(coords) - 1):
        ax, ay = xy(coords[i])
        bx, by = xy(coords[i + 1])
        dx, dy = bx - ax, by - ay
        seg2 = dx * dx + dy * dy
        t = 0.0 if seg2 == 0 else max(0.0, min(1.0, -(ax * dx + ay * dy) / seg2))
        px, py = ax + t * dx, ay + t * dy
        off = math.hypot(px, py)
        seg_len = haversine(coords[i], coords[i + 1])
        if off < best[0]:
            best = (off, along + t * seg_len)
        along += seg_len
    return best[1], best[0]


def main(raw_path):
    raw = json.loads(Path(raw_path).read_text())
    osm_base = raw["osm3s"]["timestamp_osm_base"]
    by_key = {f'{e["type"]}/{e["id"]}': e for e in raw["elements"]}
    relation = by_key["relation/3350629"]

    trail_features = []
    trail_lines = {}
    report = []
    for t in TRAILS:
        coords, node_ids, ids, stamps = [], [], [], []
        joins = []
        for spec in t["ways"]:
            w = by_key[f'way/{spec["way"]}']
            pts = [(g["lon"], g["lat"]) for g in w["geometry"]]
            nds = list(w["nodes"])
            if spec.get("rev"):
                pts.reverse()
                nds.reverse()
            if "from_node" in spec:
                i = nds.index(spec["from_node"])
                pts, nds = pts[i:], nds[i:]
            if coords:
                gap = haversine(coords[-1], pts[0])
                shared = node_ids[-1] == nds[0]
                joins.append({"after_way": ids[-1], "way": spec["way"], "gap_m": round(gap, 2), "shared_node": shared})
                if gap > MAX_GAP_M:
                    raise SystemExit(f'{t["id"]}: gap of {gap:.1f} m before way {spec["way"]}')
                if shared:
                    pts, nds = pts[1:], nds[1:]
            coords.extend(pts)
            node_ids.extend(nds)
            ids.append(spec["way"])
            stamps.append(w["timestamp"])
        length = line_length(coords)
        trail_lines[t["id"]] = coords
        report.append({"trail": t["id"], "length_m": round(length, 1), "vertices": len(coords),
                       "start": coords[0], "end": coords[-1], "joins": joins})
        trail_features.append({
            "type": "Feature",
            "id": t["id"],
            "properties": {
                "id": t["id"],
                "destination": "mt-batulao",
                "name": t["name"],
                "name_fil": t["name_fil"],
                "is_main": t["is_main"],
                "description": t["description"],
                "length_m": round(length),
                "osm_ids": [f"relation/{relation['id']}"] + [f"way/{i}" for i in ids],
                "osm_timestamp": max(stamps),
                "osm_data_as_of": osm_base,
                "source": "© OpenStreetMap contributors, ODbL",
            },
            "geometry": {"type": "LineString", "coordinates": [[round(x, 7), round(y, 7)] for x, y in coords]},
        })

    wp_features = []
    for trail_id in [t["id"] for t in TRAILS]:
        rows = []
        for spec in [w for w in WAYPOINTS if w["trail"] == trail_id]:
            el = by_key[spec["osm"]]
            if el["type"] == "node":
                pt = (el["lon"], el["lat"])
            else:
                pt = (el["center"]["lon"], el["center"]["lat"])
            along, offset = project(pt, trail_lines[trail_id])
            rows.append((along, offset, pt, el, spec))
        rows.sort(key=lambda r: r[0])
        for order, (along, offset, pt, el, spec) in enumerate(rows, start=1):
            tags = el.get("tags") or {}
            props = {
                "id": f'{trail_id}-{order:02d}-{spec["type"].replace("_", "-")}',
                "trail": trail_id,
                "type": spec["type"],
                "name": spec["name"],
                "name_fil": spec["name_fil"],
                "order": order,
                "distance_from_start_m": round(along),
                "offset_from_trail_m": round(offset, 1),
                "source": f'osm:{spec["osm"]}',
                "osm_timestamp": el["timestamp"],
                "note": spec["note"],
            }
            if "ele" in tags:
                props["ele_m"] = float(tags["ele"])
            wp_features.append({
                "type": "Feature",
                "id": props["id"],
                "properties": props,
                "geometry": {"type": "Point", "coordinates": [round(pt[0], 7), round(pt[1], 7)]},
            })

    meta = {"attribution": "© OpenStreetMap contributors", "license": "ODbL-1.0",
            "osm_data_as_of": osm_base, "generator": "content/batulao/scripts/build_geojson.py"}
    (HERE / "trail.geojson").write_text(json.dumps(
        {"type": "FeatureCollection", "metadata": meta, "features": trail_features}, ensure_ascii=False, indent=1) + "\n")
    (HERE / "waypoints.geojson").write_text(json.dumps(
        {"type": "FeatureCollection", "metadata": meta, "features": wp_features}, ensure_ascii=False, indent=1) + "\n")
    print(json.dumps(report, indent=1))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else HERE / "raw" / "overpass.json")
