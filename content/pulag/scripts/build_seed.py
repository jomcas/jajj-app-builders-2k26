#!/usr/bin/env python3
"""Write supabase/seed/pulag.sql from content/pulag/ and content/destinations/mt-pulag/.

    python3 -I content/pulag/scripts/build_seed.py --map-bytes <size of pulag.pmtiles>

supabase/seed/seed-pulag.sh runs this with the size of the map file it uploads, so the
Destination row always matches the file in Storage. Standard library only.

The same as content/ulap/scripts/build_seed.py, with two additions:
- each source in `sources` also carries `published` (from SOURCES.md) and `accessed`
  (the passage's last_checked), the shape the content_extras migration describes;
- `as_of` is the passage's own `as_of` (when its newest dated fact was reported), falling
  back to last_checked.

Trails and Waypoints come from content/pulag/{trail,waypoints}.geojson. Passages come from
content/destinations/mt-pulag/passages/*.md (format in content/README.md): each file becomes
an `-en` and a `-fil` row, with its sources resolved from SOURCES.md.

Bump PACK_VERSION whenever the Trails, Waypoints or passages change, so phones know their
downloaded pack is out of date. (A new map file of a different size bumps it on its own.)
"""

import argparse
import json
import re
from pathlib import Path
from urllib.parse import urlparse

CONTENT = Path(__file__).resolve().parent.parent
REPO = CONTENT.parent.parent
PASSAGES = REPO / "content" / "destinations" / "mt-pulag"
OUT = REPO / "supabase" / "seed" / "pulag.sql"

DEST = "pulag"
PACK_VERSION = 1
MAP_PATH = f"{DEST}-v{PACK_VERSION}.pmtiles"  # in the public 'maps' bucket

DESTINATION = {
    "id": DEST,
    "name": "Mt. Pulag",
    "region": "Kabayan and Bokod, Benguet",
    # DENR-CAR, which manages the park, gives 2,922 m. Others give 2,926 or 2,928 m
    # (docs/research/rag-sources.md, 3.1).
    "elevation_m": 2922,
    "summary_en": (
        "The highest mountain in Luzon, about 2,922 m, in the Mt. Pulag Protected Landscape. The Ambangeg Trail "
        "climbs about 7.4 km from the ranger station in Bashoy, Kabayan, through mossy forest and grassland to the "
        "summit. Book ahead, attend the DENR orientation in Ambangeg, Bokod, and hire a guide. It's cold all year, "
        "with frost in the cool months, and high enough for altitude sickness."
    ),
    "summary_fil": (
        "Ang pinakamataas na bundok sa Luzon, mga 2,922 m, sa Mt. Pulag Protected Landscape. Umaakyat ang Ambangeg "
        "Trail nang mga 7.4 km mula sa ranger station sa Bashoy, Kabayan, sa mossy forest at grassland hanggang "
        "summit. Mag-book nang maaga, dumalo sa DENR orientation sa Ambangeg, Bokod, at kumuha ng guide. Malamig "
        "buong taon, may frost sa malalamig na buwan, at sapat ang taas para sa altitude sickness."
    ),
}


# Each passage file's number -> one of the topics Batulao uses (content/batulao/README.md).
TOPICS = {
    1: "getting_there", 5: "getting_there", 6: "getting_there", 7: "getting_there", 8: "getting_there",
    9: "getting_there", 20: "getting_there",
    2: "registration", 3: "registration", 4: "registration", 17: "registration", 18: "registration",
    19: "registration",
    10: "campsites",
    11: "water",
    12: "hazards", 13: "hazards", 14: "hazards", 15: "hazards", 16: "hazards",
}


def q(value):
    """SQL literal."""
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return repr(value)
    return "'" + str(value).replace("'", "''") + "'"


def load_sources():
    """Source ID -> {id, title, publisher, url, published} from the table in SOURCES.md."""
    sources = {}
    for line in (PASSAGES / "SOURCES.md").read_text().splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) >= 5 and re.fullmatch(r"[A-Z]+\d+", cells[0]):
            sources[cells[0]] = {"id": cells[0], "title": cells[1], "publisher": cells[2], "url": cells[3],
                                 "published": cells[4]}
    return sources


def parse_passage(path):
    """(frontmatter dict, English text, Filipino text) from one passage file."""
    _, front, body = path.read_text().split("---", 2)
    meta, key = {}, None
    for line in front.strip().splitlines():
        if line.startswith("  - ") and key:
            meta.setdefault(key, []).append(line[4:].strip())
            continue
        key, _, value = line.partition(":")
        key, value = key.strip(), value.strip()
        if value.startswith("[") and value.endswith("]"):
            meta[key] = [v.strip() for v in value[1:-1].split(",") if v.strip()]
        elif value:
            meta[key] = value.strip('"')
    sections = re.split(r"^## (English|Filipino)\s*$", body, flags=re.M)
    text = {sections[i]: sections[i + 1].strip() for i in range(1, len(sections) - 1, 2)}
    return meta, text["English"], text["Filipino"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--map-bytes", type=int, required=True)
    args = ap.parse_args()

    trails = json.loads((CONTENT / "trail.geojson").read_text())["features"]
    waypoints = json.loads((CONTENT / "waypoints.geojson").read_text())["features"]
    summit = next(w for w in waypoints if w["properties"]["type"] == "summit")
    lon, lat = summit["geometry"]["coordinates"]
    sources = load_sources()

    d = DESTINATION
    lines = [
        "-- Mt. Pulag Destination Pack (issue #22). GENERATED by content/pulag/scripts/build_seed.py",
        "-- from content/pulag/{trail,waypoints}.geojson and content/destinations/mt-pulag/passages/.",
        "-- Do not edit by hand.",
        "--",
        "-- Applied by supabase/seed/seed-pulag.sh. Safe to run again: it replaces every Pulag row.",
        "-- Trails and Waypoints: © OpenStreetMap contributors, ODbL 1.0 (see content/pulag/README.md).",
        "-- Needs migration 20261009183000_content_extras.sql (name_fil, note, sources, as_of).",
        "",
        "begin;",
        "",
        "insert into public.destinations",
        "  (id, name, region, summary_en, summary_fil, latitude, longitude, elevation_m,",
        "   pack_version, map_path, map_bytes, is_placeholder, updated_at)",
        "values",
        f"  ({q(d['id'])}, {q(d['name'])}, {q(d['region'])},",
        f"   {q(d['summary_en'])},",
        f"   {q(d['summary_fil'])},",
        f"   {lat}, {lon}, {d['elevation_m']},",
        f"   {PACK_VERSION}, {q(MAP_PATH)}, {args.map_bytes}, false, now())",
        "on conflict (id) do update set",
        "  name = excluded.name, region = excluded.region,",
        "  summary_en = excluded.summary_en, summary_fil = excluded.summary_fil,",
        "  latitude = excluded.latitude, longitude = excluded.longitude, elevation_m = excluded.elevation_m,",
        "  -- At least PACK_VERSION, and one more whenever the map file itself changes.",
        "  pack_version = greatest(",
        "    excluded.pack_version,",
        "    public.destinations.pack_version",
        "      + (public.destinations.map_path <> excluded.map_path",
        "         or public.destinations.map_bytes <> excluded.map_bytes)::int),",
        "  map_path = excluded.map_path, map_bytes = excluded.map_bytes,",
        "  is_placeholder = excluded.is_placeholder, updated_at = now();",
        "",
        "-- Trails cascade to their Waypoints.",
        f"delete from public.trails where destination_id = {q(DEST)};",
        f"delete from public.reference_passages where destination_id = {q(DEST)};",
        "",
        "insert into public.trails (id, destination_id, name, name_fil, distance_m, geometry) values",
    ]
    rows = []
    for f in trails:
        p = f["properties"]
        geom = json.dumps(f["geometry"], separators=(",", ":"))
        rows.append(f"  ({q(p['id'])}, {q(DEST)}, {q(p['name'])}, {q(p['name_fil'])}, {p['length_m']},\n"
                    f"   {q(geom)})")
    lines.append(",\n".join(rows) + ";")

    lines += ["", "insert into public.waypoints",
              "  (id, trail_id, type, name, name_fil, note, latitude, longitude, elevation_m, position, distance_m)",
              "values"]
    rows = []
    for f in waypoints:
        p = f["properties"]
        wlon, wlat = f["geometry"]["coordinates"]
        ele = p.get("ele_m")
        rows.append(
            f"  ({q(p['id'])}, {q(p['trail'])}, {q(p['type'])}, {q(p['name'])}, {q(p['name_fil'])},\n"
            f"   {q(p['note'])},\n"
            f"   {wlat}, {wlon}, {q(None if ele is None else int(round(ele)))}, {p['order']}, {p['distance_from_start_m']})"
        )
    lines.append(",\n".join(rows) + ";")

    lines += ["", "insert into public.reference_passages",
              "  (id, destination_id, topic, language, text, source, sources, as_of)", "values"]
    rows = []
    files = sorted((PASSAGES / "passages").glob("*.md"))
    for path in files:
        meta, en, fil = parse_passage(path)
        cited = [{**sources[s], "accessed": meta["last_checked"]} for s in meta["sources"]]
        summary = ", ".join(dict.fromkeys(urlparse(s["url"]).netloc.removeprefix("www.") for s in cited))
        topic = TOPICS[int(path.stem.split("-", 1)[0])]
        base = f"{DEST}-{path.stem}"
        as_of = meta.get("as_of") or meta["last_checked"]
        for lang, text in (("en", en), ("fil", fil)):
            rows.append(
                f"  ({q(f'{base}-{lang}')}, {q(DEST)}, {q(topic)}, {q(lang)},\n"
                f"   {q(text)},\n"
                f"   {q(summary)},\n"
                f"   {q(json.dumps(cited, ensure_ascii=False))}::jsonb, {q(as_of)})"
            )
    lines.append(",\n".join(rows) + ";")
    lines += ["", "commit;", ""]

    OUT.write_text("\n".join(lines))
    print(f"wrote {OUT.relative_to(REPO)}: {len(trails)} trails, {len(waypoints)} waypoints, "
          f"{len(rows)} passages ({len(files)} en/fil pairs), pack_version >= {PACK_VERSION}, "
          f"map {MAP_PATH} ({args.map_bytes} bytes)")


if __name__ == "__main__":
    main()
