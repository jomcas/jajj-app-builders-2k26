#!/usr/bin/env python3
"""Check the Mt. Ulap content files. Standard library only.

    python3 -I content/ulap/scripts/validate.py

Prints every problem found and exits non-zero if there were any. Checks the map file too
if ulap.pmtiles exists and the pmtiles CLI is on the PATH (or in the PMTILES env var).
"""

import json
import math
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
PASSAGES = HERE.parent / "destinations" / "mt-ulap"
TYPES = {"jump_off", "campsite", "water", "summit"}
MAX_SEGMENT_M = 60.0
MAX_OFFSET_M = 50.0
MIN_MARGIN_M = 1000.0
MAX_MAP_BYTES = 15_000_000

problems = []


def fail(msg):
    problems.append(msg)
    print("  FAIL", msg)


def haversine(a, b):
    r = 6371008.8
    lon1, lat1, lon2, lat2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def check_trail():
    print("trail.geojson")
    raw = json.loads((HERE / "raw" / "overpass.json").read_text())
    osm_vertices = {(round(g["lon"], 7), round(g["lat"], 7))
                    for e in raw["elements"] if e["type"] == "way" and "geometry" in e for g in e["geometry"]}
    trails = json.loads((HERE / "trail.geojson").read_text())["features"]
    if len(trails) != 1:
        fail(f"expected 1 Trail, found {len(trails)}")
    for f in trails:
        c = f["geometry"]["coordinates"]
        length = sum(haversine(a, b) for a, b in zip(c, c[1:]))
        if abs(length - f["properties"]["length_m"]) > 10:
            fail(f"length_m {f['properties']['length_m']} but geometry is {length:.0f} m")
        longest = max(haversine(a, b) for a, b in zip(c, c[1:]))
        if longest > MAX_SEGMENT_M:
            fail(f"a segment is {longest:.1f} m long (max {MAX_SEGMENT_M})")
        stray = [p for p in c if (round(p[0], 7), round(p[1], 7)) not in osm_vertices]
        if stray:
            fail(f"{len(stray)} vertices are not OSM vertices, e.g. {stray[0]}")
        if len({tuple(p) for p in c}) != len(c):
            fail("the Trail visits a vertex twice")
        print(f"  ok {f['properties']['id']}: {length:.0f} m, {len(c)} vertices, longest segment {longest:.1f} m")
    return trails


def check_waypoints(trails):
    print("waypoints.geojson")
    line = trails[0]["geometry"]["coordinates"]
    wps = json.loads((HERE / "waypoints.geojson").read_text())["features"]
    props = [w["properties"] for w in wps]
    if [p["order"] for p in props] != list(range(1, len(props) + 1)):
        fail("order does not run 1..n")
    if props[0]["type"] != "jump_off" or props[-1]["type"] != "summit":
        fail("the Trail must start with jump_off and end with summit")
    along = [p["distance_from_start_m"] for p in props]
    if along != sorted(along):
        fail(f"distances do not increase: {along}")
    for w, p in zip(wps, props):
        if p["type"] not in TYPES:
            fail(f"{p['id']}: type {p['type']}")
        if not p.get("name") or not p.get("name_fil"):
            fail(f"{p['id']}: missing name or name_fil")
        if not re.fullmatch(r"osm:(node|way)/\d+", p["source"]):
            fail(f"{p['id']}: source {p['source']}")
        off = min(haversine(w["geometry"]["coordinates"], v) for v in line)
        if off > MAX_OFFSET_M:
            fail(f"{p['id']}: {off:.0f} m from the Trail (max {MAX_OFFSET_M})")
        print(f"  ok {p['order']}. {p['type']} {p['name']} at {p['distance_from_start_m']} m, {off:.1f} m off")


def check_passages():
    print("passages (content/destinations/mt-ulap)")
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from build_seed import TOPICS, load_sources, parse_passage
    sources = load_sources()
    files = sorted((PASSAGES / "passages").glob("*.md"))
    for path in files:
        meta, en, fil = parse_passage(path)
        n = int(path.stem.split("-", 1)[0])
        if meta.get("id") != f"mt-ulap-{path.stem}":
            fail(f"{path.name}: id {meta.get('id')}")
        if n not in TOPICS:
            fail(f"{path.name}: no topic in build_seed.TOPICS")
        for lang, text in (("en", en), ("fil", fil)):
            words = len(text.split())
            if not 40 <= words <= 160:
                fail(f"{path.name} {lang}: {words} words")
        missing = [s for s in meta.get("sources", []) if s not in sources]
        if missing or not meta.get("sources"):
            fail(f"{path.name}: sources {missing or 'none'} not in SOURCES.md")
        if not meta.get("last_checked"):
            fail(f"{path.name}: no last_checked")
    print(f"  ok {len(files)} passages, each with English and Filipino text and resolved sources")


def check_map(trails):
    pmtiles = os.environ.get("PMTILES") or shutil.which("pmtiles")
    path = HERE / "ulap.pmtiles"
    if not path.exists() or not pmtiles:
        print("ulap.pmtiles: skipped (no file or no pmtiles CLI)")
        return
    print("ulap.pmtiles")
    size = path.stat().st_size
    if size > MAX_MAP_BYTES:
        fail(f"map is {size} bytes (max {MAX_MAP_BYTES})")
    header = json.loads(subprocess.run([pmtiles, "show", str(path), "--header-json"],
                                       capture_output=True, text=True, check=True).stdout)
    w, s, e, n = header["bounds"]
    c = trails[0]["geometry"]["coordinates"]
    margin = min(min(haversine(p, (w, p[1])), haversine(p, (e, p[1])),
                     haversine(p, (p[0], s)), haversine(p, (p[0], n))) for p in c)
    if margin < MIN_MARGIN_M:
        fail(f"map margin around the Trail is only {margin:.0f} m")
    print(f"  ok {size} bytes, bounds {w:.4f},{s:.4f},{e:.4f},{n:.4f}, at least {margin:.0f} m around the Trail")


def main():
    trails = check_trail()
    check_waypoints(trails)
    check_passages()
    check_map(trails)
    if problems:
        print(f"{len(problems)} problem(s)")
        sys.exit(1)
    print("all checks passed")


if __name__ == "__main__":
    main()
