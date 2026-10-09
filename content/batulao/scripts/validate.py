#!/usr/bin/env python3
"""Check the Mt. Batulao content files. Standard library only.

    python3 -I scripts/validate.py          # from content/batulao/

Exits non-zero on the first class of failure, after printing every problem
found. Checks the map file too if batulao.pmtiles exists and the pmtiles CLI
is available (PMTILES env var, default ~/.local/bin/pmtiles).
"""

import json
import math
import os
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
TYPES = {"jump_off", "campsite", "water", "summit"}
TOPICS = {"water", "registration", "campsites", "hazards", "getting_there"}
MAX_GAP_M = 30.0
MIN_WORDS, MAX_WORDS = 40, 90
MIN_MARGIN_M = 1000.0

problems = []


def fail(msg):
    problems.append(msg)
    print("  FAIL", msg)


def haversine(a, b):
    r = 6371008.8
    lon1, lat1, lon2, lat2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def check_trails(raw):
    print("Trails (trail.geojson)")
    fc = json.loads((HERE / "trail.geojson").read_text())
    ways = {e["id"]: e for e in raw["elements"] if e["type"] == "way"}
    trails = {}
    for f in fc["features"]:
        p, coords = f["properties"], f["geometry"]["coordinates"]
        trails[p["id"]] = coords
        if f["geometry"]["type"] != "LineString":
            fail(f'{p["id"]}: geometry is {f["geometry"]["type"]}')
        for key in ("name", "length_m", "osm_ids", "osm_timestamp"):
            if not p.get(key):
                fail(f'{p["id"]}: missing {key}')
        # Every vertex must be a vertex of one of the listed OSM ways.
        osm_pts = set()
        for ref in p["osm_ids"]:
            kind, i = ref.split("/")
            if kind == "way":
                if int(i) not in ways:
                    fail(f'{p["id"]}: {ref} not in raw/overpass.json')
                    continue
                osm_pts |= {(round(g["lon"], 7), round(g["lat"], 7)) for g in ways[int(i)]["geometry"]}
        off_osm = [c for c in coords if (round(c[0], 7), round(c[1], 7)) not in osm_pts]
        if off_osm:
            fail(f'{p["id"]}: {len(off_osm)} vertices are not OSM vertices of its ways')
        segs = [haversine(coords[i], coords[i + 1]) for i in range(len(coords) - 1)]
        length = sum(segs)
        if abs(length - p["length_m"]) > 1:
            fail(f'{p["id"]}: length_m {p["length_m"]} but computed {length:.1f}')
        longest = max(segs)
        print(f'  {p["id"]}: {len(coords)} vertices, {length:.0f} m, all vertices from OSM ways: {not off_osm}, '
              f'longest segment {longest:.1f} m')
        # Joins between consecutive ways: the last vertex of one way and the first of the next.
        prev_end = None
        for ref in p["osm_ids"]:
            kind, i = ref.split("/")
            if kind != "way":
                continue
            g = ways[int(i)]["geometry"]
            ends = [(g[0]["lon"], g[0]["lat"]), (g[-1]["lon"], g[-1]["lat"])]
            if prev_end is not None:
                gap = min(haversine(prev_end, e) for e in ends)
                ok = gap <= MAX_GAP_M
                print(f'    join -> {ref}: gap {gap:.1f} m {"ok" if ok else "TOO BIG"}')
                if not ok:
                    fail(f'{p["id"]}: gap {gap:.1f} m before {ref}')
            # The end that continues the line is the one away from where we came in.
            # The first way is trimmed at the trailhead, so use the end farther from the Trail's start.
            prev_end = max(ends, key=lambda e: haversine(e, prev_end if prev_end is not None else coords[0]))
    return trails, fc


def check_waypoints(trails):
    print("Waypoints (waypoints.geojson)")
    fc = json.loads((HERE / "waypoints.geojson").read_text())
    by_trail = defaultdict(list)
    for f in fc["features"]:
        p = f["properties"]
        tag = p.get("id", "?")
        if p.get("type") not in TYPES:
            fail(f"{tag}: type {p.get('type')!r} not in {sorted(TYPES)}")
        for key in ("name", "name_fil"):
            if not (isinstance(p.get(key), str) and p[key].strip()):
                fail(f"{tag}: missing {key}")
        if p.get("trail") not in trails:
            fail(f"{tag}: unknown trail {p.get('trail')!r}")
        src = p.get("source", "")
        if not (re.fullmatch(r"osm:(node|way)/\d+", src) or src.startswith("derived: ")):
            fail(f"{tag}: bad source {src!r}")
        if f["geometry"]["type"] != "Point":
            fail(f"{tag}: geometry is not a Point")
        by_trail[p["trail"]].append(p)
        print(f'  {p["trail"]:18} #{p["order"]} {p["type"]:9} {p["name"]!r:28} / {p["name_fil"]!r:30} '
              f'{p["distance_from_start_m"]:>5} m along, {p["offset_from_trail_m"]:>5} m off, {src}')
    for trail, ps in by_trail.items():
        ps.sort(key=lambda p: p["order"])
        if [p["order"] for p in ps] != list(range(1, len(ps) + 1)):
            fail(f"{trail}: order is not 1..n")
        d = [p["distance_from_start_m"] for p in ps]
        if d != sorted(d):
            fail(f"{trail}: distance_from_start_m not increasing with order")
        if ps[0]["type"] != "jump_off" or ps[-1]["type"] != "summit":
            fail(f"{trail}: must start with jump_off and end with summit")
        far = [p["id"] for p in ps if p["offset_from_trail_m"] > 50]
        if far:
            fail(f"{trail}: Waypoints more than 50 m off the Trail: {far}")
    missing = set(trails) - set(by_trail)
    if missing:
        fail(f"Trails without Waypoints: {sorted(missing)}")


def check_passages():
    print("Passages (passages.json)")
    ps = json.loads((HERE / "passages.json").read_text())
    ids = set()
    counts = defaultdict(lambda: {"en": 0, "fil": 0})
    for p in ps:
        if p["id"] in ids:
            fail(f'duplicate id {p["id"]}')
        ids.add(p["id"])
        if p["lang"] not in ("en", "fil"):
            fail(f'{p["id"]}: lang {p["lang"]!r}')
        if not p["id"].endswith("-" + p["lang"]):
            fail(f'{p["id"]}: id does not end with -{p["lang"]}')
        if p["topic"] not in TOPICS:
            fail(f'{p["id"]}: topic {p["topic"]!r}')
        if not p.get("as_of"):
            fail(f'{p["id"]}: missing as_of')
        words = len(p["text"].split())
        if not MIN_WORDS <= words <= MAX_WORDS:
            fail(f'{p["id"]}: {words} words')
        if not p.get("sources"):
            fail(f'{p["id"]}: no sources')
        for s in p.get("sources", []):
            if not all(s.get(k) for k in ("title", "url", "accessed")):
                fail(f'{p["id"]}: incomplete source {s}')
        counts[p["topic"]][p["lang"]] += 1
        print(f'  {p["id"]:22} {words:>3} words, {len(p["sources"])} sources, as_of {p["as_of"]}')
    for p in ps:
        base, lang = p["id"].rsplit("-", 1)
        other = f'{base}-{"fil" if lang == "en" else "en"}'
        if other not in ids:
            fail(f'{p["id"]}: no {other}')
    print("  pairs per topic:", {t: c for t, c in sorted(counts.items())})


def check_map(trail_fc):
    print("Map (batulao.pmtiles)")
    path = HERE / "batulao.pmtiles"
    cli = os.environ.get("PMTILES", str(Path.home() / ".local/bin/pmtiles"))
    if not path.exists():
        print("  skipped: run ./make-pmtiles.sh first")
        return
    hdr = json.loads(subprocess.run([cli, "show", "--header-json", str(path)], check=True,
                                    capture_output=True, text=True).stdout)
    w, s, e, n = hdr["bounds"]
    pts = [c for f in trail_fc["features"] for c in f["geometry"]["coordinates"]]
    tw, ts = min(p[0] for p in pts), min(p[1] for p in pts)
    te, tn = max(p[0] for p in pts), max(p[1] for p in pts)
    mid = (ts + tn) / 2
    margins = {
        "west": haversine((w, mid), (tw, mid)), "east": haversine((te, mid), (e, mid)),
        "south": haversine((tw, s), (tw, ts)), "north": haversine((tw, tn), (tw, n)),
    }
    size = path.stat().st_size
    print(f"  trail bbox  {tw:.4f},{ts:.4f},{te:.4f},{tn:.4f}")
    print(f"  map bounds  {w:.4f},{s:.4f},{e:.4f},{n:.4f}  zoom {hdr['minzoom']}-{hdr['maxzoom']}")
    print("  margins     " + ", ".join(f"{k} {v / 1000:.2f} km" for k, v in margins.items()))
    print(f"  size        {size} bytes ({size / 1e6:.2f} MB)")
    if not (w <= tw and s <= ts and e >= te and n >= tn):
        fail("map bounds do not contain the Trails")
    if min(margins.values()) < MIN_MARGIN_M:
        fail(f"map margin under {MIN_MARGIN_M} m")
    if size > 15e6:
        fail("map file over 15 MB")


def main():
    raw = json.loads((HERE / "raw" / "overpass.json").read_text())
    trails, trail_fc = check_trails(raw)
    check_waypoints(trails)
    check_passages()
    check_map(trail_fc)
    print("OK" if not problems else f"{len(problems)} problem(s)")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
