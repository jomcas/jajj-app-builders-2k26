#!/bin/bash
# Save a still of the Flip 6's main display.
#   ./capture.sh <name>          → ../02-screenshots/raw-flip6/<name>.png
#   ./capture.sh                 → asks for names in a loop (stage the screen, type a name, Enter)
set -euo pipefail
cd "$(dirname "$0")"
OUT=../02-screenshots/raw-flip6
mkdir -p "$OUT"
# The Flip 6 has two displays (main and cover); screencap needs the main one's id.
DISPLAY_ID=$(adb shell dumpsys SurfaceFlinger --display-id | head -1 | awk '{print $2}')

snap() { adb exec-out screencap -p -d "$DISPLAY_ID" > "$OUT/$1.png" && echo "saved $OUT/$1.png"; }

if [ $# -gt 0 ]; then snap "$1"; exit; fi
while read -r -p "Stage the screen, then type a name (empty to quit): " name && [ -n "$name" ]; do
  snap "$name"
done
