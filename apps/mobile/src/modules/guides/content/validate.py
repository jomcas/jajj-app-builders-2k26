#!/usr/bin/env python3
"""Check the Guide Library content files.

Standard library only. Run from anywhere:

    python3 -I apps/mobile/src/modules/guides/content/validate.py

Exits 0 when every check passes, 1 otherwise. With --partial, only the Guides
present on disk are checked (useful while the library is being filled in).
"""

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent

# The 15 Guides from docs/plan.md, with their kind per CONTEXT.md ("Emergency Guide":
# snakebite, bleeding wounds, sprains and fractures, hypothermia, heat exhaustion and
# heatstroke, dehydration, lost on the trail, lightning, flash floods and river crossings,
# altitude sickness; stings, leech bites, blisters and camp skills are ordinary Guides)
# and their group per docs/plan.md ("Injury and illness", "Hazards", "Camp skills").
EXPECTED = {
    "snakebite": ("emergency", "injury"),
    "insect-stings": ("ordinary", "injury"),
    "leech-bites": ("ordinary", "injury"),
    "sprains-fractures": ("emergency", "injury"),
    "bleeding-wounds": ("emergency", "injury"),
    "blisters": ("ordinary", "injury"),
    "hypothermia": ("emergency", "injury"),
    "heat-illness": ("emergency", "injury"),
    "dehydration": ("emergency", "injury"),
    "lost-on-the-trail": ("emergency", "hazard"),
    "lightning": ("emergency", "hazard"),
    "flash-floods": ("emergency", "hazard"),
    "altitude-sickness": ("emergency", "hazard"),
    "pitching-a-tent": ("ordinary", "camp"),
    "purifying-water": ("ordinary", "camp"),
}

TOP_KEYS = {
    "id", "kind", "category", "order", "title", "summary", "callForHelp",
    "steps", "doNot", "watchFor", "keywords", "sources", "review",
}
LANGS = ("en", "fil")
TEXT_FIELDS = ("title", "summary", "callForHelp")
PAIRED_LISTS = ("steps", "doNot", "watchFor")
SOURCE_KEYS = {"title", "org", "url", "accessed"}
REVIEW_KEYS = {"redCrossChecked", "checkedBy", "notes"}
PRC = "Philippine Red Cross"
PRC_BASIS = re.compile(r"^PRC basis: (full|partial|hotline only|none)\.")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
MIN_STEPS, MAX_STEPS = 5, 10


def nonempty_str(value):
    return isinstance(value, str) and value.strip() != ""


def check_guide(path, errors):
    def err(msg):
        errors.append(f"{path.name}: {msg}")

    try:
        guide = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        err(f"not valid JSON ({e})")
        return None
    if not isinstance(guide, dict):
        err("top level is not an object")
        return None

    keys = set(guide)
    if keys != TOP_KEYS:
        if TOP_KEYS - keys:
            err(f"missing keys {sorted(TOP_KEYS - keys)}")
        if keys - TOP_KEYS:
            err(f"unknown keys {sorted(keys - TOP_KEYS)}")

    gid = guide.get("id")
    if gid != path.stem:
        err(f"id {gid!r} does not match the file name")
    if gid not in EXPECTED:
        err(f"id {gid!r} is not one of the 15 Guides")
        return guide

    kind, category = EXPECTED[gid]
    if guide.get("kind") != kind:
        err(f"kind is {guide.get('kind')!r}, CONTEXT.md says {kind!r}")
    if guide.get("category") != category:
        err(f"category is {guide.get('category')!r}, docs/plan.md says {category!r}")
    order = guide.get("order")
    if not isinstance(order, int) or isinstance(order, bool) or not 1 <= order <= len(EXPECTED):
        err(f"order {order!r} is not an integer from 1 to {len(EXPECTED)}")

    for field in TEXT_FIELDS:
        value = guide.get(field)
        if not isinstance(value, dict) or set(value) != set(LANGS):
            err(f"{field} must have exactly the keys {list(LANGS)}")
            continue
        for lang in LANGS:
            if not nonempty_str(value[lang]):
                err(f"{field}.{lang} is empty")

    for field in PAIRED_LISTS:
        value = guide.get(field)
        if not isinstance(value, dict) or set(value) != set(LANGS):
            err(f"{field} must have exactly the keys {list(LANGS)}")
            continue
        en, fil = value["en"], value["fil"]
        if not isinstance(en, list) or not isinstance(fil, list):
            err(f"{field}.en and {field}.fil must be lists")
            continue
        if len(en) != len(fil):
            err(f"{field}: {len(en)} en items but {len(fil)} fil items (they pair one to one)")
        for lang, items in (("en", en), ("fil", fil)):
            for i, item in enumerate(items, 1):
                if not nonempty_str(item):
                    err(f"{field}.{lang} item {i} is empty or not a string")
        # Ordinary camp-skill Guides may leave doNot and watchFor empty; nothing else may.
        if not en and not (field != "steps" and kind == "ordinary"):
            err(f"{field} is empty")
        if field == "steps" and not MIN_STEPS <= len(en) <= MAX_STEPS:
            err(f"steps has {len(en)} items, expected {MIN_STEPS}-{MAX_STEPS}")

    keywords = guide.get("keywords")
    if not isinstance(keywords, dict) or set(keywords) != set(LANGS):
        err(f"keywords must have exactly the keys {list(LANGS)}")
    else:
        for lang in LANGS:
            words = keywords[lang]
            if not isinstance(words, list) or not words or not all(nonempty_str(w) for w in words):
                err(f"keywords.{lang} must be a non-empty list of non-empty strings")
            elif len({w.lower() for w in words}) != len(words):
                err(f"keywords.{lang} has duplicates")

    if kind == "emergency":
        for lang in LANGS:
            text = (guide.get("callForHelp") or {}).get(lang, "")
            if isinstance(text, str) and "911" not in text:
                err(f"callForHelp.{lang} of an Emergency Guide must give the emergency number 911")

    sources = guide.get("sources")
    has_prc_source = False
    if not isinstance(sources, list) or not sources:
        err("sources must be a non-empty list")
    else:
        for i, src in enumerate(sources, 1):
            if not isinstance(src, dict) or set(src) != SOURCE_KEYS:
                err(f"source {i} must have exactly the keys {sorted(SOURCE_KEYS)}")
                continue
            for key in ("title", "org", "url"):
                if not nonempty_str(src[key]):
                    err(f"source {i} {key} is empty")
            if isinstance(src["url"], str) and not src["url"].startswith("https://"):
                err(f"source {i} url is not https")
            if not isinstance(src["accessed"], str) or not DATE.match(src["accessed"]):
                err(f"source {i} accessed must be YYYY-MM-DD")
            if src.get("org") == PRC:
                has_prc_source = True

    review = guide.get("review")
    if not isinstance(review, dict) or set(review) != REVIEW_KEYS:
        err(f"review must have exactly the keys {sorted(REVIEW_KEYS)}")
    else:
        checked = review["redCrossChecked"]
        if not isinstance(checked, bool):
            err("review.redCrossChecked must be true or false")
        elif checked and not nonempty_str(review["checkedBy"]):
            err("review.checkedBy must name the human who did the Red Cross check")
        elif not checked and review["checkedBy"] is not None:
            err("review.checkedBy must be null until the Red Cross check is done")
        notes = review["notes"]
        if not nonempty_str(notes):
            err("review.notes is empty")
        else:
            m = PRC_BASIS.match(notes)
            if not m:
                err("review.notes must start with 'PRC basis: full|partial|hotline only|none.'")
            elif not has_prc_source and m.group(1) != "none":
                err("no Philippine Red Cross source, so review.notes must start 'PRC basis: none.' and say why")
            elif has_prc_source and m.group(1) == "none":
                err("a Philippine Red Cross source is listed, so PRC basis cannot be 'none'")
            if not has_prc_source and "No Philippine Red Cross" not in notes:
                err("no Philippine Red Cross source: review.notes must explain ('No Philippine Red Cross ...')")
    return guide


def main(argv):
    partial = "--partial" in argv
    errors = []
    guides = {}
    files = sorted(HERE.glob("*.json"))
    for path in files:
        guide = check_guide(path, errors)
        if guide is not None and isinstance(guide.get("id"), str):
            guides[guide["id"]] = guide

    missing = sorted(set(EXPECTED) - set(guides))
    if missing and not partial:
        errors.append(f"missing Guides: {', '.join(missing)}")

    orders = [g.get("order") for g in guides.values()]
    dupes = sorted({o for o in orders if orders.count(o) > 1 and o is not None})
    if dupes:
        errors.append(f"duplicate order values: {dupes}")

    checked = [gid for gid, g in guides.items() if (g.get("review") or {}).get("redCrossChecked") is True]
    print(f"{len(guides)} of {len(EXPECTED)} Guides found" + (" (partial run)" if partial else ""))
    print(f"Red Cross check done by a human: {len(checked)} of {len(guides)}")
    for gid in sorted(guides, key=lambda k: guides[k].get("order") or 0):
        g = guides[gid]
        steps = len((g.get("steps") or {}).get("en") or [])
        status = "checked" if gid in checked else "NOT YET CHECKED"
        print(f"  {g.get('order'):>2} {gid:<20} {g.get('kind'):<9} {steps:>2} steps  {status}")

    if errors:
        print(f"\n{len(errors)} problem(s):")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("\nAll checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
