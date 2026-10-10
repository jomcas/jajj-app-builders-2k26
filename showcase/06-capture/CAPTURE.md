# Capturing the rest on the Flip 6

The stills in `02-screenshots/raw-flip6/` were captured from the real app on the Flip 6 on 2026-10-10 at 05:29–05:32, in airplane mode, in the night theme, from `main` at `313b5af`. Capture the remaining shots below once the build you're demoing is on the phone.

**Before you start: check that no Claude session is testing on the phone.** At 05:32 another session had Metro running on port 8081 and was driving the phone with `uiautomator`, so this capture stopped there. Recording while an agent taps the screen ruins both jobs.

## Phone prep (5 min)

1. Charge above 60% (the status bar shows the battery), and clean the screen.
2. Airplane mode **on**, Wi-Fi **off**, Bluetooth off. The airplane icon must be visible.
3. Do Not Disturb on, so no other notifications appear (Tahak's Deviation notification still shows; check that once).
4. Brightness at maximum; the Flare sets it anyway.
5. Pick one theme for the whole video. The kit's stills are **night** (gear icon → theme). Night makes the orange Trail and red Flare pop on camera; day looks right for outdoor shots of the phone.
6. Close the cover screen's widgets so nothing lights up when you flip the phone.
7. **The Flare whistle is loud** and it sets the volume to maximum. Warn people nearby.

## Recording the screen

`scrcpy` is installed (`~/.local/bin/scrcpy`). It records the screen with the phone's audio (the Deviation tone and the Flare whistle):

```bash
# Main display, 1080 × 2640, with the phone's sound, no mirror window lag
scrcpy --display-id=0 --record=shot05-deviation.mp4 --max-fps=60 --video-bit-rate=16M

# Show your taps while recording (turn it off afterwards)
adb shell settings put system show_touches 1
adb shell settings put system show_touches 0
```

If `--display-id=0` shows the cover screen, run `scrcpy --list-displays` and pick the 1080 × 2640 one.

Without scrcpy, the phone's own recorder works (Quick settings → Screen recorder, "Media sounds" on), or adb (no sound, 3-minute limit):

```bash
adb shell screenrecord --display-id 4630946564756762243 /sdcard/shot.mp4   # Ctrl-C to stop
adb pull /sdcard/shot.mp4
```

The long number is the Flip 6's main display (the first one in `adb shell dumpsys SurfaceFlinger --display-id`).

## Stills

```bash
./capture.sh night-ask-answer       # saves ../02-screenshots/raw-flip6/night-ask-answer.png
```

Then rebuild the promo cards if you add a new one (see `README.md`).

## Staging shortcuts (deep links)

```bash
L() { adb shell am start -a android.intent.action.VIEW -d "'$1'" com.tahak.app; }
L 'tahak://hike/simulate?speed=15'        # start the simulated walk on the first Trail at 15×
L 'tahak://hike/simulate?speed=1&at=0.42' # at 1×, partway up (good for a calm map shot)
L 'tahak://hike/simulate/off-trail'       # 60 m off the Trail for 45 s → Deviation after 30 s
L 'tahak://hike/end'                      # end the Hike
```

The link can land on Explore; tap the Hike tab and the walk is already running. While the simulated walk runs, the app shows a "Simulated walk · Not your real position" banner. Keep it in frame and add `badge-simulated-walk.png`. Hiding it would misrepresent the demo.

## Shots still needed

| Shot | What | Notes |
|---|---|---|
| 1 | Airplane-mode swipe, phone in hand | Camera or second phone. Outdoors if you can. |
| 3 | Explore → Mt. Batulao scroll | Screen recording, slow scroll. |
| 4 | Start Hike, the map following the dot | Simulated walk at 1×–15×. |
| 5 | **Deviation** banner, arrow, dashed line, buzz, tone | Screen recording with sound, plus a camera close-up of the phone buzzing. Cut the 30 s wait. Not in the stills yet. |
| 6 | Assistant answer in Taglish with source chips | Needs the Assistant on the build. Record the full answer at real speed. |
| 7 | Snakebite → Emergency Guide card → Guide | Same. Fallback: Guides tab → Snakebite. |
| 8 | **Flare firing** | Camera, dim room, 1–2 m away, so the torch and strobe read on video. A screen recording alone misses the flashlight. |
| — | Day-theme versions | Optional: same shots in the day theme for outdoor B-roll. |
| — | First-launch model download | Optional B-roll: `tahak://setup/reset` shows setup again without deleting anything. |

## Don't film

- The launcher icon or the app switcher. The app icon is still Expo's placeholder (`apps/mobile/assets/icon.png`). Use `04-brand/logo/tahak-mark-*_1024.png` in the edit instead.
- The "Failed to compile" red screen: it appears when the dev build's Metro server is gone. Use a release APK for the shoot if you can.
