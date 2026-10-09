#!/usr/bin/env python3
"""Builds the map assets bundled in the APK (ADR 0002: no network at use time).

Writes apps/mobile/assets/map/, which plugins/withMapAssets.js copies into the Android
assets at prebuild, where MapLibre reads them through asset:// URLs:

  glyphs/<font-id>/<range>.pbf   Protomaps Noto Sans glyphs, only the Latin ranges that
                                 Philippine labels use (Basic Latin and Latin-1, Latin
                                 Extended-A, General Punctuation).
  sprites/protomaps-{light,dark}[@2x].{json,png}
                                 The Protomaps basemap icons.
  sprites/tahak-{day,night}[@2x].{json,png}
                                 Waypoint pins drawn from MaterialCommunityIcons: olive
                                 pins, blue for water, with the type's icon.

Run from apps/mobile (needs Pillow and node_modules):
  python3 -I scripts/build-map-assets.py
"""

import json
import pathlib
import shutil
import subprocess
import sys
import urllib.parse

from PIL import Image, ImageDraw, ImageFont

APP = pathlib.Path(__file__).resolve().parent.parent
OUT = APP / "assets" / "map"

# protomaps/basemaps-assets, pinned so a rebuild gives the same files.
ASSETS_COMMIT = "028c18f713baecad011301ff7a69acc39bcc2ae7"
ASSETS_URL = f"https://raw.githubusercontent.com/protomaps/basemaps-assets/{ASSETS_COMMIT}/"

# Font ids must match FONT_IDS in src/modules/hike/map/mapStyle.ts.
FONTS = {
    "Noto Sans Regular": "noto-sans-regular",
    "Noto Sans Medium": "noto-sans-medium",
    "Noto Sans Italic": "noto-sans-italic",
}
RANGES = ["0-255", "256-511", "8192-8447"]

MCI = APP / "node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons"
MCI_FONT = MCI / "Fonts/MaterialCommunityIcons.ttf"
MCI_GLYPHS = MCI / "glyphmaps/MaterialCommunityIcons.json"

# Waypoint type -> MaterialCommunityIcons name. MCI has no boot, so the jump-off uses the
# hiking-shoe print.
WAYPOINT_ICONS = {
    "jump_off": "shoe-print",
    "campsite": "tent",
    "water": "water",
    "summit": "flag-variant",
}

# Pin colours per theme (docs/plan.md: pins are olive, water pins are blue). Each is
# (fill, icon, border). They mirror the palette in src/theme/tokens.ts.
PINS = {
    "day": {
        "olive": ("#353F2A", "#F7F4EC", "#FFFDF8"),
        "water": ("#0E3F7A", "#F7F4EC", "#FFFDF8"),
    },
    "night": {
        "olive": ("#C9D4B0", "#1B1F1A", "#000000"),
        "water": ("#A9CDF5", "#0E3F7A", "#000000"),
    },
}

PIN_W, PIN_H, ICON = 30, 38, 18  # at 1x


def fetch(path: str) -> bytes:
    # curl rather than urllib: python.org builds on macOS ship without CA certificates.
    url = ASSETS_URL + urllib.parse.quote(path)
    return subprocess.run(["curl", "-fsSL", url], check=True, capture_output=True).stdout


def build_glyphs() -> None:
    for name, font_id in FONTS.items():
        folder = OUT / "glyphs" / font_id
        folder.mkdir(parents=True, exist_ok=True)
        for glyph_range in RANGES:
            (folder / f"{glyph_range}.pbf").write_bytes(fetch(f"fonts/{name}/{glyph_range}.pbf"))
    (OUT / "glyphs" / "OFL.txt").write_bytes(fetch("fonts/OFL.txt"))


def build_protomaps_sprites() -> None:
    folder = OUT / "sprites"
    folder.mkdir(parents=True, exist_ok=True)
    for flavor in ("light", "dark"):
        for suffix in ("", "@2x"):
            for ext in ("json", "png"):
                data = fetch(f"sprites/v4/{flavor}{suffix}.{ext}")
                (folder / f"protomaps-{flavor}{suffix}.{ext}").write_bytes(data)


def draw_pin(scale: int, colors: tuple[str, str, str], icon_char: str) -> Image.Image:
    """A teardrop pin with its point at the bottom centre, drawn 4x and scaled down."""
    ss = 4 * scale
    w, h = PIN_W * ss, PIN_H * ss
    image = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    fill, icon, border = colors
    r = w / 2
    border_w = 2 * ss

    def teardrop(inset: float, color: str) -> None:
        cx, cy = r, r
        rr = r - inset
        draw.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=color)
        # The point: a triangle from the circle's lower sides to the bottom.
        tip = h - inset * 1.6
        draw.polygon(
            [(cx - rr * 0.72, cy + rr * 0.69), (cx + rr * 0.72, cy + rr * 0.69), (cx, tip)],
            fill=color,
        )

    teardrop(0, border)
    teardrop(border_w, fill)

    font = ImageFont.truetype(str(MCI_FONT), ICON * ss)
    box = draw.textbbox((0, 0), icon_char, font=font)
    iw, ih = box[2] - box[0], box[3] - box[1]
    draw.text((r - iw / 2 - box[0], r - ih / 2 - box[1]), icon_char, font=font, fill=icon)
    return image.resize((PIN_W * scale, PIN_H * scale), Image.LANCZOS)


def build_pin_sprites() -> None:
    glyphs = json.loads(MCI_GLYPHS.read_text())
    folder = OUT / "sprites"
    folder.mkdir(parents=True, exist_ok=True)
    for theme, colors in PINS.items():
        for scale in (1, 2):
            names = list(WAYPOINT_ICONS)
            sheet = Image.new("RGBA", (PIN_W * scale * len(names), PIN_H * scale), (0, 0, 0, 0))
            index = {}
            for i, waypoint_type in enumerate(names):
                pin_colors = colors["water" if waypoint_type == "water" else "olive"]
                char = chr(glyphs[WAYPOINT_ICONS[waypoint_type]])
                sheet.paste(draw_pin(scale, pin_colors, char), (i * PIN_W * scale, 0))
                index[f"waypoint-{waypoint_type}"] = {
                    "x": i * PIN_W * scale,
                    "y": 0,
                    "width": PIN_W * scale,
                    "height": PIN_H * scale,
                    "pixelRatio": scale,
                }
            suffix = "" if scale == 1 else "@2x"
            sheet.save(folder / f"tahak-{theme}{suffix}.png", optimize=True)
            (folder / f"tahak-{theme}{suffix}.json").write_text(json.dumps(index, indent=2) + "\n")


def main() -> None:
    if not MCI_FONT.exists():
        sys.exit("Run npm install first: MaterialCommunityIcons.ttf is missing.")
    shutil.rmtree(OUT, ignore_errors=True)
    build_glyphs()
    build_protomaps_sprites()
    build_pin_sprites()
    total = sum(f.stat().st_size for f in OUT.rglob("*") if f.is_file())
    print(f"Wrote {OUT} ({total / 1e6:.2f} MB)")


if __name__ == "__main__":
    main()
