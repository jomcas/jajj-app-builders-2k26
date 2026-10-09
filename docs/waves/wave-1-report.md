# Wave 1 report: offline core

Checkpoint: **download, go offline, walk off the Trail, get an alert.** Result: **met on the Flip 6 in airplane mode with the simulated walk, but on the placeholder pack.** The real Mt. Batulao content isn't on the hosted project yet, nothing has been tested with real GPS on a walk, and the watch and the sound still need the human. All five PRs are open and stacked. None is merged.

## 1. What was built

**Explore and download a Destination Pack ([#4](https://github.com/jomcas/jajj-app-builders-2k26/issues/4), PR [#28](https://github.com/jomcas/jajj-app-builders-2k26/pull/28)).** Online, the Explore tab lists the Destinations from Supabase. Tapping Mt. Batulao opens its Destination screen, which has a "Download for offline use (size)" button. While the pack downloads, a progress bar shows the percentage and the megabytes done. After the download, a grey cloud-off icon appears next to the title and on the list row. The screen then lists the pack's Trails, its Waypoints grouped by Trail, and its reference passages in the UI language, each with its source. In airplane mode, Explore says "You're offline. Showing the Destinations on your phone." and the Destination still opens with all its data. When Supabase has a newer pack version, the button says "Download the update (size)" instead. Behind the screen is `destination-pack`, a Feature Module with no tab. Its public interface (`listCatalog`, `listDownloaded`, `getPack`, `downloadPack`, `getDownloadState`/`subscribe`) is what the Hike tab uses now and the Assistant ([#14](https://github.com/jomcas/jajj-app-builders-2k26/issues/14)) will use later. It was verified with the placeholder pack: `map.pmtiles` is 4,207,071 bytes and `pack.json` is 12,392 bytes, both in `files/destination-packs/batulao/`.

**Mt. Batulao content ([#5](https://github.com/jomcas/jajj-app-builders-2k26/issues/5), PR [#32](https://github.com/jomcas/jajj-app-builders-2k26/pull/32)): built, but not on Supabase yet.** It's real content from OpenStreetMap, Protomaps and cited sources:
- **Two Trails** from OSM relation 3350629: the New Trail (the main one, 3,392 m) and the Old Trail (4,186 m).
- **8 Waypoints**, each with a type and a name: the jump-off, Peak 8 campsite, Camp 1, two springs and the summit.
- **14 reference passages, each in English and Filipino** (28 rows). They cover getting there, registration and fees, water, campsites and hazards. Each is 56–89 words with 2–6 sources and an as-of date.
- **A 1.53 MB map** (1,528,056 bytes) cut from Protomaps build 20261009 at zoom 0–15, with about 5 km of margin around the Trails.

**The hosted project still serves the placeholder pack**: version 1, a 4.2 MB map, one Trail, and the "Sample content, not for real trail use." banner. That's the pack on the phone now. Test item 1 applies the seed, which makes the pack version 2. #5 closes once the seed is applied and #6 shows the OSM attribution on the map.

**Offline Hike map ([#6](https://github.com/jomcas/jajj-app-builders-2k26/issues/6), PR [#29](https://github.com/jomcas/jajj-app-builders-2k26/pull/29)).** In airplane mode, the Hike tab shows the downloaded Destination's map, drawn from the PMTiles file on the phone. The map shows:
- place names and road shields;
- the Trail as a trail-orange line over a dark outline;
- Waypoint icons by type (a boot for the jump-off, a tent for a campsite, a drop for water, a flag for the summit), olive except water, which is blue;
- the blue GPS dot.

A dark olive re-center button sits on an opaque panel, and "© OpenStreetMap contributors · © Protomaps" is always visible. The map follows the Day and Night theme. With no pack, the Hike tab says "No map on your phone yet". If location is off or not allowed, a translated panel says how to turn it on. The colours sampled from the screen match the settled tokens:
- **Trail line:** `#D9661F` over `#3B1F0E` by day, `#FF8A3D` over `#2A1406` at night.
- **GPS dot:** `#1A6FD6` by day, `#5AA9FF` at night.

In airplane mode, logcat shows no MapLibre `http` lines.

**Start and end a Hike ([#7](https://github.com/jomcas/jajj-app-builders-2k26/issues/7), PR [#30](https://github.com/jomcas/jajj-app-builders-2k26/pull/30)).**
- **Before a Hike:** a card lists the pack's Trails with their lengths, and has a "Simulated walk" switch and a large olive Start Hike button.
- **During a Hike:**
  - The map follows the hiker and draws only the chosen Trail.
  - The next Waypoint gets an orange ring.
  - A bottom panel shows "Next Waypoint · <type>" with its name, a peach chip with the distance and ETA, an orange progress bar ("Up the Trail · N%" or "Back to the jump-off · N%"), and End Hike, which asks for confirmation.
- **At the end of the Trail:** the panel says "You've reached the end of the Trail. Head back when you're ready."
- **Back near the jump-off:** a card asks "You're back near the jump-off. End the Hike?" with Keep hiking and End Hike.

The **simulated walk** drives the same screen with no GPS. It walks up the Trail, rests 60 s at the top and walks back down. On the way it makes a short excursion (25 m off for 20 s), which must not trigger a Deviation, and a long one (60 m off), which must. The "Go off the Trail" button starts the long excursion at any time. The walk runs at 15× and can switch to 60×. Deep links can also start it at any speed from 1 to 120. Explore now groups each Destination's Waypoints by Trail. The GPS watch stops when the Hike tab isn't in use and no Hike is running.

Verified in airplane mode on the placeholder pack's single Trail:
- **The panel:** "2.1 km · about 56 min" at 2%, then "1.1 km · about 23 min" at 33%, then Camp 1 at "50 m · about 2 min" at 70%, then "Back to the jump-off · 65%" on the way down, then the end suggestion.
- **No GPS:** `dumpsys location` showed no request from Tahak during the simulated walk.

**Deviation alert ([#8](https://github.com/jomcas/jajj-app-builders-2k26/issues/8), PR [#31](https://github.com/jomcas/jajj-app-builders-2k26/pull/31)).** Being more than 40 m from the chosen Trail for more than 30 s starts a Deviation:
- **The banner:** a brick-red banner at the top with a warning icon, "Off the Trail · 60 m", "The Trail is to the north-west. Head back the way the arrow points." and an arrow toward the nearest point on the Trail. The arrow turns with the map.
- **The Trail line** turns dashed.
- **Vibration:** three 700 ms pulses.
- **Sound:** a short tone.
- **Notification:** "You're off the Trail", which a paired watch mirrors.

Coming back within 30 m clears all of it, and the short excursion triggers none of it. Verified in airplane mode with the simulated walk:
- **During the Deviation:** the banner and a north-west arrow appeared and the line turned dashed. The notification was posted at importance 5 on the `deviation` channel. Logcat showed the vibration pattern finish. `dumpsys audio` showed the Tahak player on the media stream while the ringer was muted.
- **Back on the Trail:** no banner, a solid line, and no active notification.
- **The short excursion:** nothing, in 12 checks.

**This report ([#9](https://github.com/jomcas/jajj-app-builders-2k26/issues/9)).**

**Cut or deferred**

- **First Guides.** The plan's Wave 1 row lists "first Guides", but their ticket ([#10](https://github.com/jomcas/jajj-app-builders-2k26/issues/10)) is labelled Wave 2. No Guide was built, and the Guides tab still shows "Nothing here yet".
- **Forecast and water chips in the Hike panel** (U3). Not built. Forecast is Wave 3 ([#17](https://github.com/jomcas/jajj-app-builders-2k26/issues/17)).
- **Filipino Trail and Waypoint names, and Waypoint notes.** #5 adds `name_fil` and `note` columns, but the app doesn't read them yet. The Filipino UI shows the English names.
- **Removing a downloaded pack.** There's no UI for it.
- **Background tracking.** A Deviation is only detected while Tahak is open on the screen.
- **Theme by time of day.** It's still a manual switch (carried over from Wave 0).

## 2. How it was built

**Approach.** As in Wave 0, an orchestrator agent ran one sub-agent per ticket. Each ticket got its own branch and PR. The PRs are stacked, because each one builds on the one before:

```text
main
└── #28  wave-1/4-destination-pack   (#4)
    ├── #32  wave-1/5-batulao-content   (#5)
    └── #29  wave-1/6-hike-map          (#6)
        └── #30  wave-1/7-hike              (#7)
            └── #31  wave-1/8-deviation        (#8)
                └── wave-1/9-report         (#9, this report, local only)
```

The human merges them in order: #28 first, then #32 and #29, then #30, then #31. As each base merges, the next PR is retargeted to `main`. #4, #6, #7 and #8 close when their PRs merge. The sub-agents verified each ticket on the Flip 6 over adb, in airplane mode with Wi-Fi off, using screenshots, logcat and `dumpsys`. Each app ticket passed typecheck, lint and tests, and the test count grew from 13 to 40, 60, 100 and 129. #5 has no app code. Its content is checked by `content/batulao/scripts/validate.py` instead. #5 was built in a separate worktree, `/Users/nariesss/Personal/tahak-wt-5`, which is where the seed command runs.

**Key libraries.**
- **MapLibre React Native 11.5.0**, which reads the pack's map through a `pmtiles://file://…/map.pmtiles` source.
- **The Protomaps basemap**, build 20261009, cut around the Trails with the `pmtiles` CLI (`content/batulao/make-pmtiles.sh`).
- **Bundled map assets:** Noto Sans glyphs (Latin only, 808 KB) and sprites (Protomaps' plus Tahak's Waypoint icons, 164 KB). `plugins/withMapAssets.js` copies them into the APK, and `scripts/build-map-assets.py` regenerates them.
- **Expo modules:**
  - `expo-file-system` for the pack store;
  - `expo-location`, set to best accuracy with updates every 1 s or 2 m;
  - `expo-notifications`;
  - `expo-audio`;
  - `expo-keep-awake`.
- **Supabase:**
  - Postgres tables for Destinations, Trails (geometry as GeoJSON in `jsonb`), Waypoints (with a type enum) and reference passages. RLS makes them read-only for the anonymous key.
  - A public-read `maps` Storage bucket.
- **OpenStreetMap through Overpass**, with Python scripts that build the GeoJSON and the seed SQL.

**Decisions and departures.**
- **MapLibre RN 11.5.0 loads PMTiles directly.** There's no tile server, no MBTiles conversion and no MapLibre offline-region API.
- **The style is built on the phone, with bundled glyphs and sprites.** `buildMapStyle({ mode, mapFileUri })` builds the day or night style. A unit test checks that it contains no URL other than `asset://` or `pmtiles://file://` ([ADR 0002](../adr/0002-offline-only-core.md)). In a negative control, the basemap didn't draw in airplane mode once the glyph URL pointed at https.
- **No `supabase-js`.** A thin `fetch` client reads PostgREST and Storage with the anonymous key. It's smaller, and the pack store can be tested against a fake `fetch`.
- **The Destination screen is component state in Explore**, not a nested navigator.
- **A download can't leave half a pack.** The pack store writes to `.incoming-<id>/`, writes `pack.json` last and then renames the folder into place.
- **#5's migration only adds columns** (`name_fil`, `note`, `sources`, `as_of`). The seed deletes and re-inserts Batulao's rows, sets `pack_version` to 2 and uploads the map as `maps/batulao-v2.pmtiles`. The old `maps/batulao.pmtiles` is left in Storage.
- **#6 keeps red off the map** ([ADR 0004](../adr/0004-red-means-danger-only.md)). Basemap place names are recoloured to one muted ink. The map remounts when the theme changes, because MapLibre otherwise kept the day sprites on the night map. The camera position is kept.
- **#7's Trail maths is pure and public.** `locateOnTrail`, `nextWaypoint`, `progressFraction`, `etaSeconds` and `trackPosition` are reused by #8. The ETA uses Naismith's rule, which gives a default of 2.2 km/h on a typical Philippine trail. Once the hiker's own pace over the last 5 minutes is known, the ETA uses that, kept within 1.1–5 km/h. `tsconfig.json` gained `allowImportingTsExtensions` so these modules run in plain Node tests.
- **#8 edited #7's code** in two places:
  - The walk script now walks out until it really is 60 m (or 25 m) from the *nearest* part of the Trail. On Batulao's switchbacks, the old version could stay within 38 m of another part of the Trail.
  - `HikeMap` draws the dashed line as its own layer, because changing the dash on the existing line did nothing on the phone.
- **The Deviation rule:**
  - **Start:** every position is more than 40 m off for more than 30 s, timed from the positions' timestamps, so it holds at any simulation speed.
  - **Clear:** at 30 m or closer. The 10 m difference stops it flapping on GPS jitter.
  - **Gaps:** a gap of up to 60 s counts as off-Trail time when the positions on both sides are past 40 m. After a longer gap, the 30 s count starts again. A gap never clears a Deviation.
- **The sound plays through `expo-audio` on the media stream, not the notification channel.** The channel is silent, because in vibrate mode a Samsung phone turns a channel's sound into a short buzz that cuts off the vibration pattern. The tone plays with the ringer muted, as loud as the media volume, and is silent at media volume 0. The tone is a generated sine-beep WAV, so there's no licence to track.
- **The notification permission** is asked when a Hike starts, after an explanation, at most once per session. It's already granted on the test phone.
- **Red is never the only signal** (ADR 0004). The banner also has an icon, text and the arrow, and the Trail line turns dashed.

**Known limits and shortcuts.**
- **The real Batulao content isn't seeded yet** (test item 1).
- **Known issue, to fix before the demo:** the simulation bar's "Scripted: N m off the Trail" shows the *planned* distance, not the real one. Near switchbacks it can read 47 m after the Deviation has already cleared.
- **The ETA climbs** for a few simulated minutes after an excursion.
- **The glyphs are Latin only.** Text in other scripts isn't drawn.
- **Real GPS far from the Trail:** the follow camera moves off the map tiles onto a blank background. A follow-up could warn when a Hike starts more than about 1 km from the Trail. Also, a real-GPS Hike started away from Batulao goes into a Deviation after 30 s, which is correct.
- **No background tracking.** The screen stays on only because the dev build keeps it awake, so keep-awake itself is untested.
- **Pack updates are detected by `pack_version` only.**
- **The Protomaps build is pinned to 20261009.** That build will eventually leave build.protomaps.com, and a new cut will need a newer date.
- **The placeholder pack names its Jump-off row "Jump-off"**, so the name repeats the type. The real pack names it "Batulao jump-off".
- **A leftover `deviation-alerts` notification channel is on the test phone**, from an earlier #8 build, and it has a sound. Android Settings shows two "Deviation alerts" categories for Tahak, but only `deviation` is used. It's harmless. Removing it needs a code change, never clearing the app's data.
- **Content to check:** the Filipino passages need a native speaker's review, and the human should confirm the current fees and guide rule, because the sources disagree.
- **Not yet verified, and needing the human:**
  - a fresh GPS fix outdoors in airplane mode;
  - a real-GPS walk;
  - the watch mirroring the Deviation notification;
  - the Deviation sound, heard at a normal media volume;
  - two Trails on the phone (so far only unit tests, until the seed is applied);
  - the new Hike panels in the Night theme.
- **The Mac's disk:** 6.7 GB free at the end of the wave. A native rebuild needs about 4 GB.
- **New native modules this wave** (MapLibre, `expo-location`, `expo-file-system`, `expo-notifications`, `expo-audio`) mean any later native change needs `npx expo prebuild` and a rebuild. The APK installed now has all of them.

## 3. How to test it

> ⚠️ **Never uninstall Tahak or clear its data** (no `adb uninstall`, no `pm clear`, no "Clear storage" in Android Settings). That deletes the 3.4 GB model files and the downloaded Destination Pack from the phone, and there's no copy of the model on the Mac. Reinstall only with `adb install -r`. If an install fails with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, stop. Don't uninstall to get past it.

Run everything from a Mac terminal with the phone (serial `R5CX728V0LN`) plugged in over USB. To mirror the phone on the Mac, run `scrcpy -s R5CX728V0LN`.

**Which code runs.** The installed APK (`lastUpdateTime 2026-10-10 04:00:16`) was built from #8's branch. It has all of Wave 1's native code: MapLibre, `expo-location`, `expo-file-system`, `expo-notifications` and `expo-audio`. The JavaScript comes from Metro, so run Metro in the main checkout with `wave-1/8-deviation` checked out. `wave-1/9-report` also works, because it's the same code plus this report, and so does `main` once every PR is merged. Don't run Metro from `tahak-wt-5`, because that branch has no Hike tab.

### Before you start: Metro and launch

**Start:** online, USB connected, Metro not running.

1. Check the installed build:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell dumpsys package com.tahak.app | grep lastUpdateTime
   ```
   Only if it's missing, install it. `-r` keeps the app's data:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN install -r /Users/nariesss/Personal/jajj-app-builders-2k26/apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
   ```
2. In terminal 1, check the branch, then start Metro and leave it running:
   ```sh
   cd /Users/nariesss/Personal/jajj-app-builders-2k26 && git branch --show-current
   cd /Users/nariesss/Personal/jajj-app-builders-2k26/apps/mobile && npx expo start --dev-client
   ```
3. In terminal 2, forward the port and open the dev build on Metro:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN reverse tcp:8081 tcp:8081
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am start -a android.intent.action.VIEW -d "exp+tahak://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" com.tahak.app
   ```

**Expected:**
- `lastUpdateTime=2026-10-10 04:00:16`.
- The branch is `wave-1/8-deviation` or `wave-1/9-report`.
- Terminal 1 logs `Android Bundled … index.ts`, and the app opens on Explore with no red error screen.

To relaunch cold later, use these commands (the "relaunch" in the items below):
```sh
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am force-stop com.tahak.app
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am start -a android.intent.action.VIEW -d "exp+tahak://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" com.tahak.app
```

### 1. Apply the Batulao seed, then download the update

**Start:** online (Wi-Fi on), placeholder pack (version 1) downloaded, Metro running, no Hike running, English.

1. Check which pack the phone has:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell run-as com.tahak.app cat files/destination-packs/batulao/pack.json | grep -o '"packVersion":[0-9]*'
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell run-as com.tahak.app ls -l files/destination-packs/batulao/
   ```
   In the app, open **Explore → Mt. Batulao** and look at the screen before you change anything.
2. In a Mac terminal, apply #5's migration and seed from the #5 worktree:
   ```sh
   cd /Users/nariesss/Personal/tahak-wt-5 && supabase db push --linked && supabase/seed/seed-batulao.sh
   ```
   If `db push` asks to confirm the migration, answer `Y`.
3. In the app, go back to the Explore list (**All Destinations**) and pull the list down to refresh it. Open **Mt. Batulao**.
4. Tap **Download the update (1.5 MB)** and watch the panel.
5. Go back to the list. Then run the step 1 commands again.

**Expected:**
- **Step 1, before the seed (version 1):**
  - adb prints `"packVersion":1` and a `map.pmtiles` of `4207071` bytes.
  - The screen shows the butter "Sample content, not for real trail use." chip and "On your phone since … · 4.2 MB".
  - It lists one Trail, "Old Trail".
- **Step 2:**
  - The push applies `20261009183000_content_extras.sql`.
  - The seed prints `Map file: content/batulao/batulao.pmtiles (1528056 bytes)` and uploads `maps/batulao-v2.pmtiles`.
  - It ends with one row: `batulao`, pack_version `2`, `batulao-v2.pmtiles`, `1528056`, is_placeholder `false`, trails `2`, waypoints `8`, passages `28`, then `Done.`
- **Step 3:** the olive button reads **Download the update (1.5 MB)**. The chip is still there, because the screen shows the downloaded copy until the update arrives.
- **Step 4:**
  - The panel shows "Downloading… N%" with a bar and "… of about 1.6 MB" (the map plus the rows). On Wi-Fi it can be over in a second or two.
  - Then it shows "On your phone since <today> · 1.5 MB", with no button.
  - The placeholder chip is gone, and the grey cloud-off icon is next to the title.
  - **Trails:** New Trail 3.4 km and Old Trail 4.2 km.
  - **Waypoints:** grouped under "New Trail" and "Old Trail" (see item 2).
  - **Reference info:** 14 passages in English, each ending "Source: …".
- **Step 5:** the Mt. Batulao row has the cloud-off icon. adb prints `"packVersion":2` and a `map.pmtiles` of `1528056` bytes.

**If the phone still shows version 1:** the seed didn't reach Supabase, or Explore wasn't refreshed. Pull to refresh again, or relaunch. A fresh download (not an update) can't be tested, because there's no way to remove a pack. Don't clear the app's data to try.

### 2. Airplane mode: Explore and the Destination offline

**Start:** online, pack version 2 downloaded (item 1), Metro running, no Hike running, English.

1. Turn on airplane mode, and check that Wi-Fi is off too:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell cmd connectivity airplane-mode enable
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell settings get global airplane_mode_on
   ```
   This should print `1`, and the status bar should show the plane and no Wi-Fi icon. If Wi-Fi came back on, turn it off in quick settings. adb and Metro keep working over USB.
2. Relaunch cold (the commands under "Before you start").
3. On Explore, open **Mt. Batulao** and scroll to the bottom.

**Expected:**
- **Explore:** "You're offline. Showing the Destinations on your phone." Mt. Batulao is listed with the cloud-off icon.
- **The Destination:**
  - It opens with no download button and "On your phone since … · 1.5 MB".
  - **Trails:** New Trail 3.4 km and Old Trail 4.2 km.
  - **Waypoints under "New Trail":** Batulao jump-off (0.0 km), Peak 8 campsite (2.5 km), Mt. Batulao summit (3.4 km).
  - **Waypoints under "Old Trail":** Batulao jump-off (0.0 km), Spring east of Camp 1 (3.1 km), Spring at Camp 1 (3.3 km), Camp 1 (3.3 km), Mt. Batulao summit (4.2 km).
  - Each row has its type icon. Water rows are blue, and the rest are olive.
  - The 14 reference passages are there.
- **No errors** and no loading spinner that never ends.

Leave airplane mode on for items 3–5.

### 3. The Hike map offline

**Start:** airplane mode, pack version 2, Metro running, no Hike running, Day theme, location on.

1. Open the **Hike** tab and wait for the map.
2. Pinch and drag around the Trails, and zoom in on the Waypoint icons.
3. Tap the **re-center** button (bottom right).
4. Relaunch cold, so the map opens on the Trails again. Tap the cog, choose **Night**, tap **Close**, and look at the map. Then set it back to **Day**.

**Expected:**
- **Step 1:** the map fills the screen, fitted on the Trails. It has basemap place names such as Mount Batulao and road shields. Both Trails are drawn as trail-orange lines over a dark outline, from the shared jump-off to the summit.
- **Step 2:**
  - **Waypoint icons:** a boot at the jump-off, tents at Peak 8 campsite and Camp 1, flags at the summit, and blue drops at the two springs. All are olive except the blue water icons.
  - **Labels:** place names are one muted ink, never red.
  - **The map's edge:** it ends about 5 km from the Trails.
- **Step 3:** the map moves to your real position and shows the blue GPS dot. You're not at Batulao, so that's outside the map file, on a plain beige background with no tiles. That's expected. If there's no fix yet, the panel says "No GPS position yet. Stay where you can see the sky, then try again."
- **Always visible:** the "© OpenStreetMap contributors · © Protomaps" chip, at the bottom left in both themes.
- **Night:** a dark basemap, the Trail line in a lighter orange (`#FF8A3D`) and a lighter blue GPS dot (`#5AA9FF`). The page around the map is true black.

### 4. Start a Hike with the simulated walk

**Start:** airplane mode, pack version 2, Metro running, no Hike running, Day theme, English.

1. On the **Hike** tab, the card shows **Choose a Trail**. Tap **New Trail**, turn **Simulated walk** on, and tap **Start Hike**.
2. Watch the first minute at 15×.
3. Tap **Switch to 60×**, and wait for the top of the Trail and the walk back down.
4. When the end suggestion appears, tap **End Hike**.
5. Start again on **Old Trail** with Simulated walk on. While it runs, tap the cog, choose **Night**, tap **Close**, and look at every panel. Switch back to **Day**.
6. Tap **End Hike** in the panel. A dialog asks "End this Hike?". Tap **End Hike**.

**Expected:**
- **Step 1:**
  - **The simulation bar** (top): "Simulated walk · 15×", "Not your real position.", **Switch to 60×** and **Go off the Trail**.
  - **The map** zooms in, follows the moving GPS dot, and shows only the New Trail.
  - **The bottom panel:**
    - "Hike on New Trail" and "Next Waypoint · Campsite", then "Peak 8 campsite" with an orange ring on its icon.
    - A peach chip with about 2.5 km and an ETA of about an hour at first.
    - An orange bar with "Up the Trail · N%".
    - End Hike.
- **Step 2:** the distance goes down and the percentage goes up every second. The ETA settles once the walk's own pace is known. About a minute in, the short excursion runs and nothing alarms (item 5 covers that).
- **Step 3:**
  - **Past Peak 8 campsite:** the next Waypoint becomes "Mt. Batulao summit", and the ring moves to it.
  - **At the top:** "You've reached the end of the Trail. Head back when you're ready."
  - **After the 60 s rest** (1 s at 60×): "Back to the jump-off · N%".
  - **Near the jump-off:** a card with "You're back near the jump-off. End the Hike?", **Keep hiking** and **End Hike**.
  - At 60×, the whole walk takes about 2½ minutes. At 15× it takes about 9.
- **Step 4:** the Hike ends, the map fits back on both Trails, and the Trail picker returns.
- **Step 5 (not yet verified on the phone):**
  - On Old Trail, the first next Waypoint is "Spring east of Camp 1", a blue water icon with an orange ring.
  - At night, every panel (the simulation bar, the bottom panel, the chip and the bar) is dark with light text and stays readable. The map remounts in the night style, and the Hike keeps running where it was.
- **Step 6:** the Hike ends and the Trail picker returns.

### 5. Trigger a Deviation with the simulated walk

**Start:** airplane mode, pack version 2, Metro running, no Hike running, Day theme, English. The ringer can be muted. Media volume is turned up (step 1).

1. Set the media volume to about two-thirds and check it:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell cmd media_session volume --stream 3 --set 10
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell cmd media_session volume --stream 3 --get
   ```
2. **The short excursion at 15×.** Start a simulated Hike on **New Trail** (item 4, step 1). Watch the top bar for about a minute.
3. **The scripted long excursion at 15×.** Keep watching until about 3 minutes in.
4. **A long Deviation at 1×, to see every signal.** Start a new simulated walk at real speed. This ends the running Hike first:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell 'am start -a android.intent.action.VIEW -d "tahak://hike/simulate?trail=batulao-new-trail&speed=1" com.tahak.app'
   ```
   Then tap **Go off the Trail**. The deep link `tahak://hike/simulate/off-trail` does the same.
5. About 70 s after the tap, the Deviation starts. While it lasts (about a minute), check the notification:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell dumpsys notification --noredact | grep "NotificationRecord(.*pkg=com.tahak.app"
   ```
   Pull down the notification shade, then close it. Rotate the map with two fingers, and switch to **Night** and back.
6. Wait until the banner goes. Run the step 5 command again. Then end the Hike:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am start -a android.intent.action.VIEW -d "tahak://hike/end" com.tahak.app
   ```

**Expected:**
- **Step 1:** `volume is 10 in range [0..15]`.
- **Step 2:** "Scripted: 25 m off the Trail" shows for a few seconds. No banner appears, the line stays solid, and there's no vibration, sound or notification.
- **Step 3:** "Scripted: 60 m off the Trail" shows, and a Deviation fires once, but at 15× it's on screen for only about 4 s.
- **Steps 4–5, when the Deviation starts:**
  - **The banner** appears at the top in brick red, with a warning icon, "Off the Trail · 60 m", "The Trail is to the <direction>. Head back the way the arrow points." and an arrow.
  - **The arrow** points at the Trail on screen, and keeps pointing at it when you rotate the map.
  - **The Trail line** turns dashed.
  - **Vibration:** three long pulses, once.
  - **Sound:** a short beep tone, once, even with the ringer muted. **Check by ear that it's clearly audible.** This is not yet verified.
  - **Notification:** a heads-up "You're off the Trail" with "You're 60 m from the Trail. Open Tahak and follow the arrow back." The adb command prints one line with `tag=tahak-deviation importance=5` and `channel=deviation`.
  - **At night,** the banner stays brick red with white text, and the dashed line is the night orange.
- **Step 6:** the banner goes, the line is solid again, the notification is gone and the adb command prints nothing. No "back on the Trail" notification follows.
- **Known issue:** after the banner clears, the bar can still read "Scripted: … m off the Trail" with a number above 30, up to 47 m near switchbacks. It shows the planned distance, not the real one.
- **Speeds:** at 60× everything still fires once, but the Deviation lasts about 1 s on screen.

### 6. The Deviation notification on the watch

**Start:** airplane mode **with Bluetooth turned back on**, the watch paired and connected, pack version 2, Metro running, no Hike running.

1. Airplane mode may have turned Bluetooth off. Turn it back on in quick settings, then check:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell settings get global bluetooth_on
   ```
2. In the watch's companion app on the phone (Galaxy Wearable for a Galaxy Watch), open the notification settings:
   - Make sure Tahak is allowed to send notifications to the watch.
   - If there's an option to show phone notifications on the watch even while the phone is in use, turn it on. Tahak only detects a Deviation while it's open on the screen.
3. Run item 5, steps 4–5: start the walk at 1× and tap **Go off the Trail**. Keep the phone screen on and watch the watch.
4. Wait for the Deviation to clear (about a minute later).

**Expected:**
- **Step 1:** prints `1`.
- **Step 3:** about 70 s after the tap, the watch vibrates and shows "You're off the Trail" with the same text as the phone.
- **Step 4:** the notification disappears from the watch when it's cancelled on the phone.
- **If the watch shows nothing,** check the companion app's settings for Tahak, and whether the phone's notification posted (the item 5 adb command). Record what you saw: this is not yet verified.
- **Android Settings → Apps → Tahak → Notifications** shows two "Deviation alerts" categories. Only one is used. The other is the leftover `deviation-alerts` channel on this test phone, and it's harmless.

### 7. Outdoors with real GPS (optional, recommended)

**Start:** outdoors under open sky, airplane mode with Wi-Fi off and location on, pack version 2, Metro running with the Mac on the USB cable, no Hike running. GPS works without signal.

The dev build needs Metro to launch, so launch it with the cable in. Unplugging the cable after launch hasn't been tested. If you try it, don't force-stop the app away from the Mac.

1. Relaunch cold. On the **Hike** tab, tap **re-center** and wait up to a minute.
2. Walk 20–30 m and watch the dot.
3. Re-center back onto the Trails: end any Hike, or relaunch. Choose **New Trail**, leave **Simulated walk off**, and tap **Start Hike**. Keep walking slowly for a minute: when the position stops changing, the phone sends fewer updates.
4. Tap **End Hike**, then **End Hike** again in the dialog.

**Expected:**
- **Step 1:** a fresh fix in airplane mode, with no "No GPS position yet" message. The blue dot shows your real position, outside the Batulao map. This is not yet verified.
- **Step 2:** the dot follows you.
- **Step 3:**
  - Briefly "Waiting for your GPS position… Stay where you can see the sky.", then the panel.
  - The follow camera leaves the map tiles (known).
  - About 30 s after the first fix, a Deviation starts, because you're kilometres from the Trail. The banner reads "Off the Trail · NN.N km", and the arrow points toward Mt. Batulao (south to south-west from Metro Manila). The vibration, sound and notification all fire.
  - The Deviation doesn't clear while you're far away.
- **Step 4:** everything clears.

A real walk *on* a Trail can only be tested at Batulao.

### 8. Regression pass: the Wave 0 checkpoint and earlier

**Start:** airplane mode, no Hike running (end it with `tahak://hike/end` if needed), Metro running, Day theme, English, phone cool.

**A. App shell.**
1. Tap Explore, Hike, Ask and Guides.
2. Tap the cog. Choose **Night** and go through all four tabs. Then choose **Day**.
3. Tap the cog and choose **Filipino**. Check Explore, the Destination screen and the Hike tab. Relaunch cold, then switch back to English.

**Expected:**
- **Step 1:**
  - **Tab bar:** only the tapped tab has the olive-tint pill with an orange icon, with rounded corners.
  - **Header:** the cog and the neutral SOS control (red icon and red "SOS") are at the top right on every tab. Tapping SOS does nothing.
  - **Content:** Guides shows "Nothing here yet", and Ask shows "Assistant spike".
- **Step 2:** the page is true black and the text is light on all four tabs. The SOS icon is `#FF8A80`.
- **Step 3:**
  - **Tabs:** Tuklasin, Akyat, Magtanong, Mga gabay.
  - **Explore:** "Offline ka. Ipinapakita ang mga Destination na nasa phone mo."
  - **Hike:** "Pumili ng Trail", "Kunwaring lakad" and "Simulan ang Hike".
  - **After the relaunch:** still Filipino. Trail and Waypoint names stay in English (known, see "Cut or deferred").
- **Red is for danger only** ([ADR 0004](../adr/0004-red-means-danger-only.md)): the only red is the SOS control and, during a Deviation, the banner. Buttons are olive.

**B. The Assistant spike still loads Qwen on the CPU.**
1. Check that the model files are still there:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell ls -l /sdcard/Android/data/com.tahak.app/files/assistant-models/
   ```
2. Check that the phone is cool, and wait for `Thermal Status: 0`:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell dumpsys thermalservice | grep -m1 "Thermal Status"
   ```
3. Relaunch cold and wait for Explore. In terminal 3, clear logcat and watch the benchmark tag:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN logcat -c
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN logcat -v time -s TAHAK_BENCH:I
   ```
4. In terminal 2, start the benchmark (CPU, 6 threads) and wait 2–3 minutes for the `"type":"done"` line:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am start -a android.intent.action.VIEW -d "tahak://spike/bench?backend=cpu" com.tahak.app
   ```
5. Optional: on the **Ask** tab, tap **Load on CPU** (never "Load on GPU") and ask `May tubig ba sa Camp 2? Gaano kalayo pa ang summit?`.

**Expected:**
- **Step 1:** `Qwen3.5-4B-Q4_K_M.gguf` at 2,740,937,888 bytes and `Qwen3.5-4B-mmproj-F16.gguf` at 672,423,616 bytes.
- **Step 4:**
  - The `start` line has `"airplane_mode":true`.
  - The `result` line has `"backend":"cpu"`, `"n_gpu_layers":0` and `"gpu_in_use":false`.
  - The other numbers are close to the [Wave 0 checkpoint](../plan.md#wave-0-checkpoint-model-gono-go):

| Field in the `result` line | Checkpoint value |
|---|---|
| `model_load_ms` / `mmproj_load_ms` | model 5.7 s / vision file 0.7 s |
| `taglish.prompt_tokens`, `taglish.ttft_ms` | 245 tokens, first token 5.0 s |
| `taglish.gen_tps` / `taglish.prompt_tps` | 11.2 tok/s / 49 tok/s |
| `photo.prompt_tokens`, `photo.ttft_ms` | 683 tokens, first token 92 s |
| `photo.gen_tps` | 6.6 tok/s |
| `peak_pss_kb` | about 4.7 GB (≈ 4,700,000 kB) |

- **If `taglish.gen_tps` is near 7,** the phone was warm. Let it cool and rerun. Wave 1 added no model code, so a large drop is a regression worth reporting.
- **Step 5:** the status reaches "Model ready on the CPU (6 threads)", and the answer streams in at about 11 tokens/s.
- **Never run `backend=gpu`.** It gets the app killed for memory.

When you're done, turn airplane mode off:
```sh
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell cmd connectivity airplane-mode disable
```
