# Wave 4 report: Admin Portal, Destinations 2 and 3, Group Hike Alerts

Checkpoint: **Wave 4 is "ordered, cut from the bottom": 4a the custom Admin Portal (guaranteed), then 4b Destinations 2 and 3, then 4c Group Hike.** Result: **4a and 4b are built, and 4c shipped as Alerts with a simulated member. Group Hike joining is deferred.** The caveats:
- **The Admin Portal has no live check yet.** Its code is merged and its migration is applied to the hosted project, and the team allowlist has 3 emails. The 3 team accounts don't exist in Supabase Auth yet, so nobody has logged in, previewed a GPX file or published from it against the live project. That's a human step (item 1A), and [#21](https://github.com/jomcas/jajj-app-builders-2k26/issues/21) stays open until it's done.
- **The Hike tab's map hides part of the Trail before a Hike.** The new Destination choice made the Trail card taller, and the map still fits with a fixed bottom padding, so much of Batulao's Trail sits under the card until the Hike starts. The fix is planned for Wave 5.
- **Group Hike joining ([#23](https://github.com/jomcas/jajj-app-builders-2k26/issues/23)) is deferred** and shows as "coming soon". Group Hike Alerts ([#24](https://github.com/jomcas/jajj-app-builders-2k26/issues/24)) work on one phone through a loopback, with a clearly labelled simulated member. They don't link two phones yet.
- **Alerts and the Deviation check run only while Tahak is open on screen.** There's no Android foreground service yet. This is being tested now, and a post-tournament ticket is being filed.

Mt. Ulap and Mt. Pulag both passed on the Flip 6, and [#22](https://github.com/jomcas/jajj-app-builders-2k26/issues/22) is closed. The Hike tab's Destination choice ([#52](https://github.com/jomcas/jajj-app-builders-2k26/issues/52), PR [#58](https://github.com/jomcas/jajj-app-builders-2k26/pull/58)) and Group Hike Alerts ([#24](https://github.com/jomcas/jajj-app-builders-2k26/issues/24), PR [#60](https://github.com/jomcas/jajj-app-builders-2k26/pull/60)) are merged.

## 1. What was built

**The Admin Portal ([#21](https://github.com/jomcas/jajj-app-builders-2k26/issues/21), PR [#43](https://github.com/jomcas/jajj-app-builders-2k26/pull/43)).** A thin web tool replaces the Supabase dashboard for authoring Destination Packs. It runs on a team member's laptop (`cd apps/admin && npm run dev`, then `http://localhost:5174`), and nothing is hosted. From the team member's side:
- **Log in** with email and password. An account whose email isn't on the team allowlist sees "Not a team account" and can change nothing. The database refuses its writes even if the UI is bypassed.
- **Destinations:** add or edit the name, region, English and Filipino summaries, position (click the map) and elevation. A new Destination needs its PMTiles map file from the start.
- **Trails:** upload a GPX file and see the Trail as a dashed line on the map **before** saving it ("New Trail from GPX", then "Save Trail"). Each Trail can be replaced by a new GPX file, or deleted.
- **Waypoints:** add, edit, remove and reorder them by clicking the map or typing coordinates. "Order by distance" and "Re-measure distances" work along the Trail.
- **Reference passages:** topic, language (English or Filipino), text, source and an optional as-of date.
- **Publish:** the Publish tab shows "What changed since the last publish", takes an optional new map file, and "Publish version N" raises the Destination Pack version. A phone that has the pack sees "Download the update (size)" in Explore. **The phone app didn't change for this:** it already re-downloads when the catalog's version is higher.
- **Guides aren't managed here.** They ship inside the app.

Status: the migration is applied to the hosted project, and `team_members` holds 3 rows. **Still to do (human):** create the 3 Auth users, then the live check (log in, GPX preview, publish to a throwaway Test Destination, the phone sees it). Item 1 covers both.

**Mt. Ulap ([#22](https://github.com/jomcas/jajj-app-builders-2k26/issues/22), PRs [#40](https://github.com/jomcas/jajj-app-builders-2k26/pull/40) and [#48](https://github.com/jomcas/jajj-app-builders-2k26/pull/48)).** The second Destination, at the same standard as Batulao:
- **Trail:** the Eco-Trail from the Ampucao jump-off to the summit, 5,086 m.
- **Waypoints:** Ampucao jump-off, Camp Site 1 and Mt. Ulap summit. There's no water Waypoint, because OSM and every source agree there's no water on the ridge.
- **Reference passages:** 16 English and Filipino pairs (32 passages).
- **Map:** 1.79 MB (1,788,257 bytes).
- **Status:** it's seeded on the hosted project as pack version 1. It was checked on the Flip 6: download, the offline map, a simulated walk, a Deviation, and the Assistant answering with Mt. Ulap chips after `pack-ulap` was embedded.

**Mt. Pulag (#22, PR [#50](https://github.com/jomcas/jajj-app-builders-2k26/pull/50)).** The third Destination:
- **Trail:** the Ambangeg Trail (OSM relation 3625651), 7,425 m.
- **Waypoints (6):** Babadak Ranger Station (jump-off), Camp 1, Spring between Camp 1 and Camp 2, Spring by Camp 2, Camp 2, and the summit (2,922 m, per DENR-CAR).
- **Reference passages:** 20 English and Filipino pairs. **14 are flagged `verify: true`** for the park office to confirm. Fees and guides come from the Benguet Provincial Tourism Office (2026). The cold and altitude passages point to the Guides, with no first-aid steps ([ADR 0003](../adr/0003-emergencies-route-to-guides.md)).
- **Map:** 1.47 MB, the Trail plus 6 km, so it includes the DENR Visitor Center in Ambangeg where hikers register.
- **Status:** it's seeded as pack version 1. It was checked on the Flip 6:
  - the 1.5 MB download;
  - the Ambangeg Trail (7.4 km) with its 6 Waypoints;
  - the Forecast, after a retry, because the first automatic fetch failed;
  - the offline map through the Hike tab's Destination choice, and a simulated walk updating the next Waypoint;
  - the Assistant's "Is there water on Mt. Pulag?" answer, with a **Mt. Pulag · Water** chip.

#22 is closed. Its open human items are the 14 Pulag and 9 Ulap `verify: true` flags, and a native speaker's read of the Filipino text.

**The Hike tab's Destination choice and Solo / Group ([#52](https://github.com/jomcas/jajj-app-builders-2k26/issues/52), PR [#58](https://github.com/jomcas/jajj-app-builders-2k26/pull/58)).** The Hike tab no longer jumps to the most recent download:
- **The Destination choice.** The "Choose a Trail" card now starts with a "Mt. Batulao ▾" control. It opens a "Choose a Destination" sheet listing every downloaded Destination. Choosing one redraws the map for that Destination and swaps the Trail list.
- **The choice is saved.** It survives a relaunch, and stays put when another Destination is downloaded. If the saved Destination is no longer on the phone, the Hike tab falls back to the most recent download.
- **It's locked during a Hike.** A running Hike keeps its own Destination: "End the Hike to switch Destination".
- **Solo | Group.** The same card has a Solo | Group choice. Solo is selected and is the default. Group carries an olive "Coming soon" badge. Tapping it only opens a sheet: "Group Hike: Join friends by QR code and see each other offline. Coming soon." It never starts a group.
- **Filipino:** "Mag-isa | Grupo", "Malapit na".

This removes the Wave 3 demo risk: Batulao no longer has to be the last download.

**Group Hike Alerts ([#24](https://github.com/jomcas/jajj-app-builders-2k26/issues/24), PR [#60](https://github.com/jomcas/jajj-app-builders-2k26/pull/60)).** When a Group Hike member goes off the Trail or fires the Flare, this phone gets an Alert. Until #23 links phones, the Alerts go through a local loopback, and the member is a clearly labelled simulated one:
- **The simulated member.** During a simulated walk, the simulation bar has **Add simulated member**. "Ana (simulated)" ("Ana (kunwari)" in Filipino) then walks the same Trail a little ahead of the hiker. During a GPS Hike, a small card offers the same button.
- **The incident.** One button, **Ana: off Trail, then Flare**, plays a scripted incident: Ana walks 60 m off the Trail, comes back, fires the Flare 20 s later, and stops it 60 s after that. The walk slows to 4× during the incident so it can be watched. The Deviation shows about 27 s after the tap.
- **The banner.** It's one compact row with a danger border, an icon, the words and **Show on map**: "Ana (simulated) is off the Trail · 60 m", then "Ana (simulated) fired the Flare". In Filipino: "Lihis sa Trail si Ana (kunwari) · 60 m".
- **The notification.** It goes on a new **Group Alerts** channel, with its own vibration, and is mirrored to a paired watch. It's dismissed when the Deviation clears or the Flare stops.
- **The dot.** It's olive with **AN** and an "Ana (simulated)" caption. It's red with an icon only during a Deviation, and red with a pulsing ring during a Flare ([ADR 0004](../adr/0004-red-means-danger-only.md)). Tapping the dot or **Show on map** centres the map on Ana.
- **This phone's own Deviation and Flare** are sent out as Alerts too, ready for when other phones can receive them. For now they're only logged.

All of this works in airplane mode.

**Every cited source gets a chip ([#53](https://github.com/jomcas/jajj-app-builders-2k26/issues/53), PR [#55](https://github.com/jomcas/jajj-app-builders-2k26/pull/55)).** The Wave 3 bug is fixed. An answer that cites 3 passages now shows 3 chips. "Magkano ang bayad sa Mt. Ulap?" shows **Mt. Ulap · Fees**, **Mt. Ulap · Guides and porters** and **Mt. Ulap · Campsites**. When two different passages share a topic, each chip is named after its passage.

**This report ([#25](https://github.com/jomcas/jajj-app-builders-2k26/issues/25)).**

**Also in this period**
- **[#54](https://github.com/jomcas/jajj-app-builders-2k26/issues/54) is open:** delete the superseded 672 MB F16 vision file on the demo phone, by hand. The steps are item 0 in the Wave 3 report.
- **PR [#57](https://github.com/jomcas/jajj-app-builders-2k26/pull/57), "Run the backend locally with Docker",** came from outside this session and isn't merged. It adds `scripts/dev-setup.sh`, which runs Supabase locally with a local-only team account. If it merges, the Admin Portal can be tried against a local stack instead of the live project.
- **Draft PR [#56](https://github.com/jomcas/jajj-app-builders-2k26/pull/56)** holds the demo script and the airplane-mode run-through checklist for [#26](https://github.com/jomcas/jajj-app-builders-2k26/issues/26). Its Alert beat needs #24's final button labels.

**Cut or deferred**
- **Group Hike joining (#23): deferred to after the tournament,** shown as "coming soon". The QR code, Google Nearby Connections and the Kotlin Expo module are not built, so no second phone is needed for this wave. #23 stays open. #24's `AlertTransport` is the seam it will plug into.
- **Deleting a Destination in the Admin Portal.** It isn't there. The test cleanup in item 1F uses the Supabase CLI.
- **Removing old map files.** Each publish with a new map leaves the previous `<id>-v<n>.pmtiles` in Storage, because there's no delete policy. Remove old ones by hand.
- **Removing superseded model files** on the phone (#54).

## 2. How it was built

**Approach.** As in Waves 2 and 3, an orchestrator agent ran one sub-agent per ticket in parallel. Each had its own branch and worktree off `main`, and they shared the one phone through a lock. The content for Ulap and Pulag was built by a separate content session. Merge order so far:

```text
main
├── #40  wave-4/22-mt-ulap            (#22, part 1)  2026-10-09 21:32Z
├── #43  wave-4/21-admin-portal       (#21)          2026-10-09 22:43Z
├── #48  wave-4/22-ulap-seeded        (#22)          2026-10-09 23:22Z
├── #50  wave-4/22-pulag              (#22, part 2)  2026-10-09 23:40Z
├── #55  wave-4/53-chips              (#53)          2026-10-10 00:01Z
├── #58  wave-4/52-hike-destination   (#52)          2026-10-10 00:19Z
└── #60  wave-4/24-group-alerts       (#24)          2026-10-10 00:33Z
```

The mobile test count went from 324 to 325 (#55), 326 (#58) and 343 (#60, with 16 new tests in `test/alerts.test.ts`). The Admin Portal has its own 33 Vitest tests. **No native build so far this wave:** #43, #40, #48 and #50 changed no app code, and #55, #58 and #60 were JavaScript-only.

**Key libraries.**
- **The Admin Portal:** Vite and React 18, `@supabase/supabase-js` with the anon key plus the member's session (never the service-role key), and MapLibre GL JS on OpenStreetMap tiles for the GPX preview and Waypoint placing. The GPX parsing, distances, validation, publish payload, "what changed" and Waypoint reordering are pure functions in `src/lib/`, tested with Vitest.
- **The content pipeline,** the same for both Destinations: Overpass (OSM) for the Trail and Waypoints, Python scripts (`build_geojson.py`, `build_seed.py`, `validate.py`, run with `python3 -I`), the `pmtiles` CLI cutting from the same pinned Protomaps build as Batulao, and a `seed-<id>.sh` that uploads the map and applies the seed.

**Decisions and departures.**
- **The database decides who can write, not the portal.** `is_team_member()` is true only for a logged-in user whose JWT email is in `team_members`, whose email is confirmed, and whose JWT email belongs to that user. RLS write policies on `destinations`, `trails`, `waypoints`, `reference_passages`, `pack_publishes` and the `maps` bucket all require it. Anonymous reads are unchanged, so the phones work as before. `team_members` shipped empty, and its rows were added by hand, because the repo is public.
- **Publishing can't overwrite a newer version.** Publish runs `update … set pack_version = n+1 … where pack_version = n`, so two publishes can't both land on n+1. It records a snapshot in `pack_publishes`, which powers "what changed".
- **Waypoint reordering saves in two steps** (positions 100001… first, then 1…n), so `unique (trail_id, position)` never trips.
- **Trails go up only, jump-off to summit,** because the Hike screen expects an out-and-back walk. On Ulap, most hikers traverse down to Sta. Fe. **A hiker who does that gets a Deviation on the descent.**
- **Ulap's jump-off is the north end of the mapped trail,** about 700 m west of the Ampucao Barangay Hall where hikers register. OSM doesn't connect the trail to the road.
- **Pulag's map is the Trail plus 6 km** (not 5 km), so it includes the DENR Visitor Center. Its summit elevation is 2,922 m (DENR-CAR), not OSM's 2,928.
- **Pulag's fees and guide rates now come from the Benguet Provincial Tourism Office (2026),** replacing the low-trust blog in the first drafts. The orientation, the visitor cap and campsite status (including the February 2025 closure) are each attributed to their own source and date.
- **Chips are grouped by passage, not by label (#55).** The numbered parts of one topic (Batulao `water-1` and `water-2`) still share a chip. A chip is named after its passage only when its label would clash with another.
- **#23 was deferred and #24 revised (2026-10-10).** Instead of waiting for Nearby Connections, Alerts were built so the Nearby link can be added later without touching their UI:
  - **The `alerts` module** (`src/modules/alerts/`, no tab) defines `Alert = { id, type, memberId, memberName, position, time }`. The type is `deviation`, `deviation-cleared`, `flare` or `flare-stopped`.
  - **The `AlertTransport` interface** has `send`/`onReceive` for Alerts and `sendPosition`/`onPosition` so a member's dot can move. Today it's a linked-pair `LoopbackTransport`. `setTransport()` is the seam where #23 will plug in Nearby.
  - **Every Alert reaches this phone through the transport,** never by a direct call.
- **The simulated member reuses the Hike's own parts.** It walks on the simulated-walk player (with a new `excursions: false` option), and the Deviation detector runs on Ana's own track, so it decides when her Deviation starts and clears, with the real 40 m / 30 s rule. Tests check that the script gives exactly one Deviation Alert and one Flare Alert, at 2× and at 15×.
- **The notification channel is `group-alerts` at maximum importance** (5), so the Alert shows as a heads-up.
- **Small edits to `hike`:**
  - `createSimulatedWalk({ excursions })`, exported from `hike/index.ts`;
  - `members`/`onMemberPress` props on `HikeMap`, and `centerOn` takes coordinates;
  - `children` on `SimulationBar`;
  - the wiring in `HikeScreen`.
- **The Solo | Group "Coming soon" criterion of #24** shipped in #58.
- **The Hike tab's Destination choice (#58)** is saved in AsyncStorage (`tahak.hike.destination`). It uses only `destination-pack`'s public interface (`listDownloaded`, `getPack`, `subscribe`), and the shown pack is picked by the pure helper `pickShownPack` in `hike/latestPack.ts`: the saved choice if it's still downloaded, else the latest download, and always the running Hike's own Destination. Switching remounts the map so it refits. The Solo | Group choice, part of #24, landed in the same PR, because it sits on the same card. "Destination" and "Group Hike" are in the i18n glossary of words kept the same in Filipino.

**Known limits and shortcuts.**
- **A new Destination appears in every phone's Explore as soon as it's added, before it's published.** Never add or publish anything on the live project during the demo. Publishing over Batulao, Ulap or Pulag makes every phone that has it show "Download the update".
- **The Admin Portal edits the live project directly.** There's no staging. PR #57's local stack (unmerged) would be one.
- **The Filipino text for Ulap and Pulag needs a native speaker's review.** 9 Ulap and 14 Pulag passages still need their facts confirmed (`verify: true`).
- **In the Filipino UI, a chip named after its passage reads in English** (for example "Mt. Ulap · Guides and porters"). The source sheet's heading still shows the topic label.
- **Before a Hike, the Trail card hides part of the Trail (#58).** `HikeMap` fits the Destination with a fixed bottom padding of 140, and the card is now taller, so Batulao's Trail is the most affected. The fix belongs in `hike/map/` (fit with the card's measured height) and is planned for Wave 5. During the demo, pinch out or start the Hike, which follows the hiker.
- **The Forecast's first automatic fetch after the Pulag download failed,** and it needed a retry. It refreshes by itself every 30 s while it's missing.
- **Group Hike Alerts only loop back on one phone** until #23 adds Nearby Connections. The only other member is the simulated one.
- **Alerts and the Deviation check run only while Tahak is open on screen.** There's no Android foreground service. This is being tested now, and a post-tournament ticket is being filed. For the demo, keep Tahak in the foreground.
- **During a Hike, the bars and the panel leave little map space on the Flip** (the simulation bar, the Alert banner and the Hike panel). This is a Wave 5 fix.
- **The `alerts` and `hike` modules import each other** through their public `index.ts` files. Babel's live bindings resolve the cycle, and the app runs, but it's a seam to untangle later.
- **The Group Alerts channel name is fixed by whichever language first creates it.** Android lets the app rename the channel later, but not change its importance.
- **Still open from earlier waves:** the Red Cross check on all 15 Guides ([#11](https://github.com/jomcas/jajj-app-builders-2k26/issues/11)), Assistant latency, the dev-only MapLibre toast on a theme switch, and the F16 file (#54).

## 3. How to test it

> ⚠️ **Never uninstall Tahak or clear its data** (no `adb uninstall`, no `pm clear`, no "Clear storage" in Android Settings). That deletes the Assistant's model files (**3.4 GB**: Qwen3.5-4B Q4_K_M, its Q8_0 vision file and embeddinggemma) and every downloaded Destination Pack, and there's no copy of the models on the Mac. Test "fresh install" with `tahak://setup/reset`, never an uninstall. Reinstall only with `adb install -r`. If an install fails with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, stop. Don't uninstall to get past it.

> ⚠️ **Never press Publish on Batulao, Ulap or Pulag during a demo,** and don't add Destinations on the live project then either. Use only the throwaway Test Destination in item 1, and delete it afterwards.

> **Airplane mode on this phone leaves Wi-Fi on.** For every offline test, turn Wi-Fi off separately and check that `wifi_on` is `0` (commands below).

Run everything from a Mac terminal with the phone (serial `R5CX728V0LN`) plugged in over USB. To mirror the phone on the Mac, run `scrcpy -s R5CX728V0LN`.

**Which code runs.** The installed APK was built from #12's branch at 05:12 on 2026-10-10. #55, #58 and #60 were all JavaScript-only, so it still has everything needed. The JavaScript comes from Metro, so run Metro in the main checkout on `main`.

**Photosensitivity:** the Flare strobes the screen at 2 Hz. Look away from it if flashing light bothers you.

### Before you start: Metro, launch and the model folder

**Start:** online (Wi-Fi on), USB connected, Metro not running.

1. Check the installed build and the model files:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell dumpsys package com.tahak.app | grep lastUpdateTime
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell ls -l /sdcard/Android/data/com.tahak.app/files/assistant-models/
   ```
2. In terminal 1, update `main`, then start Metro and leave it running:
   ```sh
   cd /Users/nariesss/Personal/jajj-app-builders-2k26 && git checkout main && git pull && git branch --show-current
   cd /Users/nariesss/Personal/jajj-app-builders-2k26/apps/mobile && npx expo start --dev-client
   ```
3. In terminal 2, forward the port and open the dev build on Metro:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN reverse tcp:8081 tcp:8081
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am start -a android.intent.action.VIEW -d "exp+tahak://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" com.tahak.app
   ```

**Expected:**
- `lastUpdateTime` is 2026-10-10 05:12 or later.
- The model folder has `Qwen3.5-4B-Q4_K_M.gguf` (2,740,937,888 bytes), `Qwen3.5-4B-mmproj-Q8_0.gguf` (366,894,656) and `embeddinggemma-300M-Q8_0.gguf` (333,590,944). If `Qwen3.5-4B-mmproj-F16.gguf` is still there, delete that one file by following Wave 3's item 0 (#54).
- The branch is `main`. Terminal 1 logs `Android Bundled … index.ts`, and the app opens on Explore with no red error screen.

To relaunch cold later, use these commands (the "relaunch" in the items below):
```sh
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am force-stop com.tahak.app
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am start -a android.intent.action.VIEW -d "exp+tahak://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" com.tahak.app
```

**Going offline.** Airplane mode doesn't turn Wi-Fi off on this phone, so do both, then check (`airplane_mode_on` must be `1`, `wifi_on` must be `0`):
```sh
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell cmd connectivity airplane-mode enable
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell cmd wifi set-wifi-enabled disabled
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell settings get global airplane_mode_on
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell settings get global wifi_on
```
If `wifi_on` is still `1`, swipe down on the phone and tap Wi-Fi off. **Going back online:**
```sh
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell cmd connectivity airplane-mode disable
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell cmd wifi set-wifi-enabled enabled
```

Check the temperature before any Assistant item, and wait for `Thermal Status: 0`:
```sh
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell dumpsys thermalservice | grep -m1 "Thermal Status"
```

In terminal 3, keep the Assistant's log open for items 2 and 5:
```sh
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN logcat -c
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN logcat -v time -s TAHAK_ASSISTANT:I
```

### 1. Admin Portal: author, publish, re-download, clean up

Use a throwaway **Test Destination** (id `test-destination`) for this item, and nothing else. Don't choose it on the Hike tab. If you do, choose Batulao again after the cleanup (step F7).

**A. One-time setup (human).**
1. Check the allowlist has the 3 team emails:
   ```sh
   cd /Users/nariesss/Personal/jajj-app-builders-2k26 && supabase db query --linked "select email from public.team_members order by email;"
   ```
2. In the Supabase dashboard, open **Authentication → Users → Add user → Create new user** for each of the 3 emails. Give each a password and tick **Auto Confirm User**. The email must match the allowlist row exactly (case doesn't matter).
3. Set up the portal. Copy `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from `apps/mobile/.env.local` into `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. **Never the service-role key.**
   ```sh
   cd /Users/nariesss/Personal/jajj-app-builders-2k26/apps/admin && npm install && cp .env.example .env.local
   ```
4. In terminal 4, start the portal and leave it running. Open `http://localhost:5174` in a browser.
   ```sh
   cd /Users/nariesss/Personal/jajj-app-builders-2k26/apps/admin && npm run dev
   ```

**Expected:**
- **Step 1:** 3 rows.
- **Step 4:** "Tahak Admin Portal" with "For the Tahak team. Log in with your team account to author Destination Packs."

**B. Who can log in.**
1. Log in with a wrong password.
2. Log in with a team account.

**Expected:**
- **Step 1:** "Wrong email or password."
- **Step 2:** "Checking your account…", then the **Destinations** list with Mt. Batulao, Mt. Ulap and Mt. Pulag.
- **Optional:** an account that isn't on the allowlist sees "Not a team account" and nothing else.

**C. Create the Test Destination, preview a GPX, add Waypoints and a passage.**
1. Tap **New Destination**. Fill in Id `test-destination`, Name `Test Destination`, Region `Test only, delete me`, both summaries, elevation `1200`, and click the map near Mt. Ulap for the position (or type `16.3100` / `120.6450`). For **Map file**, choose `/Users/nariesss/Personal/jajj-app-builders-2k26/content/ulap/ulap.pmtiles` (it's git-ignored, so it's only in the main checkout). Click **Add Destination**.
2. On **Trails**, under **New Trail from GPX**, choose `/Users/nariesss/Personal/jajj-app-builders-2k26/apps/admin/test/fixtures/test-trail.gpx`. Look at the map, then click **Save Trail**.
3. On **Waypoints**, click **Add Waypoint**, set Type **Jump-off**, and click the map at the start of the Trail. Add a **Campsite** in the middle and a **Summit** at the end. Click **Order by distance**, then **Save Waypoints**.
4. On **Reference passages**, add an English passage: Topic **Water**, text `Test passage: there is no water on the Test Destination. Bring 2 liters.`, Source `Tahak team test`. Click **Save reference passage**.
5. On **Publish**, read "What changed since the last publish", and click **Publish version 2**. Confirm.

**Expected:**
- **Step 1:** the Test Destination opens with its tabs. **It's already in the phone's Explore list** (version 1).
- **Step 2:** the Trail "Test Trail & Ridge" shows as a **dashed line** on the map before saving, with its distance. After saving, it's listed under **Trails**.
- **Step 3:** the three Waypoints show on the map in order, each with a distance along the Trail. "Waypoints saved. Publish the Destination Pack so phones download the change."
- **Step 4:** "Saved. Publish the Destination Pack so phones download the change."
- **Step 5:** the list shows the Trail, the 3 Waypoints and the passage. After publishing, the button says **Publish version 3**, and the panel says "Nothing has changed since the last publish."

**D. The phone downloads it.**

**Start:** online, Metro running, English.
1. On **Explore**, pull down on the list (or relaunch cold). Open **Test Destination** and tap **Download for offline use (…)**.
2. Go offline (both commands). Relaunch cold, then open **Explore → Test Destination**.

**Expected:**
- **Step 1:** Test Destination is listed. The download finishes with "On your phone since … · 1.8 MB".
- **Step 2:** it opens offline, with the Trail "Test Trail & Ridge", its 3 Waypoints, and the test passage under **Reference info** with "Source: Tahak team test".

**E. Edit, publish again, re-download.**
1. Go back online (both commands).
2. In the portal, edit the passage: change `2 liters` to `3 liters` and save. Rename the Campsite Waypoint to `Test camp`, then **Save Waypoints**.
3. On **Publish**, check that both changes are listed, and click **Publish version 3**.
4. On the phone, go back to **Explore**, pull down on the list, and open **Test Destination**.
5. Tap **Download the update (…)**. Then go offline (both commands), relaunch cold and open it again.

**Expected:**
- **Step 3:** "What changed" lists the edited passage and the renamed Waypoint.
- **Step 4:** the button says **Download the update (1.8 MB)**, not "On your phone since".
- **Step 5:** offline, the passage says **3 liters** and the Waypoint is **Test camp**. No step after the download needed the network.

**F. Clean up (always).**

The portal has no Destination delete, so use the Supabase CLI from the main checkout (it's linked). Deleting the Destination row also deletes its Trails, Waypoints, passages and publish history (`on delete cascade`).
1. Delete the Test Destination, and check it's gone:
   ```sh
   cd /Users/nariesss/Personal/jajj-app-builders-2k26
   supabase db query --linked "delete from public.destinations where id = 'test-destination' returning id;"
   supabase db query --linked "select id, pack_version from public.destinations order by id;"
   ```
2. Delete its map file from Storage. List it first, and delete only `test-destination-…` files:
   ```sh
   supabase storage ls --linked ss:///maps/
   supabase storage rm --linked ss:///maps/test-destination-v1.pmtiles
   ```
   If the CLI refuses, delete it in the dashboard under **Storage → maps**.
3. Remove the pack from the phone. Copy the command exactly. **Don't use a wildcard, and never touch any other folder:**
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell run-as com.tahak.app rm -r files/destination-packs/test-destination
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell run-as com.tahak.app ls files/destination-packs
   ```
4. Go back online, relaunch cold and pull down on **Explore**.
5. Log out of the portal and stop it (Ctrl-C in terminal 4).
6. Optional: the Assistant drops the Test Destination's index part by itself on the next launch. To remove its files too, run:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell run-as com.tahak.app ls files/assistant-index/embeddinggemma-300m-q8_0
   ```
   Then `rm` only the `pack-test-destination.json` and `pack-test-destination.f32` files listed there, one at a time.
7. Open **Hike** and check that it shows **Destination: Mt. Batulao**. If not, tap the Destination control and choose **Mt. Batulao**.

**Expected:**
- **Step 1:** `test-destination` is returned once, and the list is `batulao`, `pulag` and `ulap` at their usual versions (Batulao 2, Ulap 1, Pulag 1).
- **Step 3:** the folder list shows only the real Destinations (`batulao`, `ulap`, maybe `pulag`).
- **Step 4:** Explore lists exactly 3 Destinations.
- **Step 7:** the Hike tab shows Mt. Batulao, and the "Choose a Destination" sheet lists no Test Destination.

### 2. Destinations 2 and 3: Mt. Ulap and Mt. Pulag

**Start:** online, Metro running, English, Day theme, no Hike running, phone cool.

1. Relaunch cold. On **Explore**, check the list.
2. Open **Mt. Ulap**. If it isn't downloaded, tap **Download for offline use (…)**. Read its Trails, Waypoints and Reference info.
3. Do the same for **Mt. Pulag**.
4. Go offline (both commands). Relaunch cold and open each one again from **Explore**.
5. On **Hike**, tap the Destination control ("Mt. … ▾") and choose **Mt. Ulap**. Choose its Trail, turn **Simulated walk** on, and tap **Start Hike**. Pinch and zoom over the Trail, then tap **Go off the Trail** and wait for the Deviation. End the Hike:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am start -a android.intent.action.VIEW -d "tahak://hike/end" com.tahak.app
   ```
6. Repeat step 5 for **Mt. Pulag**.
7. Open **Ask** and ask:
   - `Magkano ang bayad sa Mt. Ulap?`
   - `Is there water on the Mt. Ulap trail?`
   - `How much is the registration fee for Mt. Pulag?`
   - `Is there water on the Ambangeg Trail?`
   - `How cold does it get at the Mt. Pulag summit?`

   Tap one chip from each answer.
8. Ask `My friend has hypothermia at Camp 2`.

**Expected:**
- **Step 1:** exactly 3 Destinations: Mt. Batulao, Mt. Ulap (Itogon, Benguet) and Mt. Pulag. No Test Destination.
- **Step 2:** Mt. Ulap is about 1.8 MB, with "Eco-Trail from Ampucao · 5.1 km" and Waypoints Ampucao jump-off, Camp Site 1 and Mt. Ulap summit. There's no water Waypoint (that's correct).
- **Step 3:** Mt. Pulag is about 1.5 MB, with "Ambangeg Trail · 7.4 km" and Waypoints Babadak Ranger Station, Camp 1, Spring between Camp 1 and Camp 2, Spring by Camp 2, Camp 2 and Mt. Pulag summit. The water ones have blue drop icons.
- **Step 4:** both open offline with "On your phone since …". Nothing waits on the network.
- **Steps 5 and 6:** each Trail draws as a trail-orange line on its own offline map, with its Waypoint icons and "© OpenStreetMap contributors · © Protomaps". The Deviation fires: the brick-red "Off the Trail" banner, the dashed line, vibration, a beep and the notification.
- **Step 7:** every answer cites its own Destination with peach chips:
  - Ulap fees: **Mt. Ulap · Fees**, **Mt. Ulap · Guides and porters** and **Mt. Ulap · Campsites** (3 chips for 3 sources; the #53 fix).
  - Ulap water: no reliable water on the ridge, so bring your own.
  - Pulag fees: Benguet tourism figures (2026), with Mt. Pulag chips.
  - Ambangeg water: the springs near Camp 1 and Camp 2, and to treat the water.
  - The cold: an answer that points to the Hypothermia Guide, with no first-aid steps.

  Each chip opens a sheet with its passage and source. The log has `"llm_ran":true` and the matching `pack:ulap-…` or `pack:pulag-…` sources. **Never a Batulao chip on an Ulap or Pulag question.**
- **Step 8:** the **Hypothermia** Emergency Guide card at once, with `"llm_ran":false`.

### 3. The Hike tab: Destination choice and Group "coming soon" (#52, PR #58)

**Start:** airplane mode with Wi-Fi off, Batulao, Ulap and Pulag downloaded, Metro running, English, Day theme, no Hike running.

1. Open **Hike**. Read the top of the **Choose a Trail** card, then tap the Destination control ("Mt. … ▾").
2. Choose **Mt. Ulap**, then open the control again and choose **Mt. Pulag**, then **Mt. Batulao**.
3. Relaunch cold and open **Hike** again.
4. Turn **Simulated walk** on and tap **Start Hike** on Batulao's New Trail. Look for the Destination control, and try to change the Destination. End the Hike:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am start -a android.intent.action.VIEW -d "tahak://hike/end" com.tahak.app
   ```
5. Tap **Group** on the Solo | Group choice. Read the sheet and close it.
6. Tap the cog and choose **Filipino**. Read the card, tap **Grupo**, and close the sheet. Switch back to **English**.

**Expected:**
- **Step 1:** the card starts with the Destination control (its accessibility label reads "Destination: Mt. …"). The sheet is titled **Choose a Destination** and lists only the downloaded Destinations: Mt. Batulao, Mt. Ulap and Mt. Pulag.
- **Step 2:** each choice redraws the map for that Destination, with its attribution, and swaps the Trail list: "Eco-Trail from Ampucao · 5.1 km", then "Ambangeg Trail · 7.4 km", then Batulao's New Trail (3.4 km) and Old Trail (4.2 km). Nothing is re-downloaded.
- **Step 3:** the Hike tab still shows **Mt. Batulao** (the choice is saved).
- **Step 4:** the Hike runs on Batulao, and the Destination can't be changed while it runs ("End the Hike to switch Destination"). After `hike/end`, the Trail picker returns, still on Batulao.
- **Step 5:** **Solo** is selected by default. **Group** has an olive **Coming soon** badge. Tapping it opens the **Group Hike** sheet, "Join friends by QR code and see each other offline. Coming soon.", and doesn't start anything. No red anywhere.
- **Step 6:** "Pumili ng Destination", **Mag-isa | Grupo**, "Malapit na", and the Filipino sheet text.
- **Known (Wave 5 fix):** before the Hike, the taller card hides much of Batulao's Trail at the bottom of the map. Pinch out to see it all. It's not a failure for this item.

### 4. Group Hike Alerts with the simulated member (#24, PR #60)

**Start:** airplane mode with Wi-Fi off, Metro running, English, Day theme, a Destination downloaded, no Hike running, media volume about two-thirds, **Tahak open on screen the whole time** (Alerts don't run in the background). The watch is paired (optional).

In terminal 3, watch the Alerts log:
```sh
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN logcat -c
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN logcat -v time -s ReactNativeJS:I | grep alerts
```

1. On **Hike**, keep **Solo** selected, choose a Trail, turn **Simulated walk** on, and tap **Start Hike**.
2. On the simulation bar, tap **Add simulated member**. Watch its dot.
3. Tap **Ana: off Trail, then Flare** and start a timer. Watch the map and the top of the screen.
4. Tap **Show on map** on the banner.
5. Keep watching as Ana comes back, then fires the Flare (about 20 s later).
6. While the Flare Alert is up, pull down the notification shade and look at the watch. In terminal 2, run:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell dumpsys notification | grep -i "group-alerts"
   ```
7. Wait for the Flare to stop (about 60 s at 4×). Then tap **Go off the Trail** for this phone's own Deviation and check the log.
8. Tap the cog: choose **Filipino** and **Night**. Tap **Remove**, then add the member again (**Magdagdag ng kunwaring kasama**) and run the incident once more (**Ana: lihis, saka Flare**). Switch back to **English** and **Day**.
9. End the Hike with `tahak://hike/end`.

**Expected:**
- **Step 2:** a clearly labelled **"Ana (simulated)"** caption under an **olive dot with AN**, a little ahead of the hiker on the Trail and moving along it. The button now says **Ana: off Trail, then Flare**.
- **Step 3:** the button says "Ana: running…" and the walk slows to 4×. **About 27 s after the tap**:
  - the Alert banner, one compact row with a danger border and icon: **"Ana (simulated) is off the Trail · 60 m"** and **Show on map**;
  - a heads-up notification;
  - **Ana's dot turns red with an icon**. Red is never the only signal.
  - The log has `received deviation` from Ana (simulated-ana).
- **Step 4:** the map centres on Ana, off the Trail.
- **Step 5:** when Ana is back on the Trail, the dot turns **olive** again, the banner goes, and the notification is dismissed (`deviation-cleared`). About 20 s later: **"Ana (simulated) fired the Flare"**, and the dot is red with a **pulsing ring** at her position (`received flare`).
- **Step 6:** the notification is in the shade (and on the watch). The `dumpsys` output has `channel=group-alerts` with `importance=5`.
- **Step 7:** when the Flare stops, the dot is olive, and no Group Alerts notification is left (`flare-stopped`). The phone's own Deviation works as before (banner, vibration, sound), and the log adds `[alerts] sent deviation from this phone`, then `sent deviation-cleared`.
- **Step 8:** "Ana (kunwari)", **"Lihis sa Trail si Ana (kunwari) · 60 m"**, then "Pinaputok ni Ana (kunwari) ang Flare". It's readable in Night, and the dot follows the same colour rule.
- **Step 9:** Ana disappears with the Hike. Nothing needed the network.
- **Known (Wave 5 fix):** during the Hike, the bars and the panel leave little map; pinch out if Ana's dot is under them.

### 5. Regression pass: the core loop, Waves 1–3

**Start:** airplane mode **and** Wi-Fi off (`wifi_on` is `0`), Batulao pack version 2 downloaded, Metro running, English, Day theme, no Hike running, media volume about two-thirds, phone cool.

1. Relaunch cold. On **Explore**, open **Mt. Batulao**.
2. On **Hike**, check that the card shows Mt. Batulao (tap the Destination control to change it), and choose its Trail. Pinch and zoom over the map. Turn **Simulated walk** on and tap **Start Hike**.
3. Tap **Go off the Trail**, or:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am start -a android.intent.action.VIEW -d "tahak://hike/simulate/off-trail" com.tahak.app
   ```
4. While the banner is up, open **Ask** and ask `Is there water on the Batulao trail?` Tap its chip.
5. Ask `How far to the next campsite?` and compare with the Hike panel.
6. Ask `My friend got bitten by a snake what do we do`. Tap **Open Guide**.
7. Tap **SOS**, tap the hold button once, then hold it to fire the Flare for a few seconds. Tap **Stop Flare**.
8. Go back to **Hike**. When the banner clears, end the Hike with `tahak://hike/end`.
9. Check that the radios were off the whole time:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell settings get global airplane_mode_on
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell settings get global wifi_on
   ```

**Expected:**
- **Step 1:** "On your phone since …", no download button, and the Forecast card with its age.
- **Step 2:** the offline map with the trail-orange Trail, the Waypoint icons and the attribution.
- **Step 3:** "… m off the Trail", then the brick-red "Off the Trail" banner, the arrow, the dashed line, three vibrations, a beep and the "You're off the Trail" notification.
- **Step 4:** the Hike keeps running. "Answering…", then an answer with a peach **Mt. Batulao · Water** chip that opens the passage.
- **Step 5:** a "From your Hike" card with the same distance and ETA as the panel, at once.
- **Step 6:** the **Snakebite** Emergency Guide card at once (`"llm_ran":false`). **Open Guide** opens the Guide on the Guides tab.
- **Step 7:** the tap shows "Press and hold until the bar fills. A tap does nothing." The hold fires the flashlight SOS, the strobe and the whistle over the running Hike. **Stop Flare** ends everything.
- **Step 8:** the banner clears, the Hike ends and the Trail picker returns.
- **Step 9:** `1` and `0`. No step needed the network.

When you're done, go back online:
```sh
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell cmd connectivity airplane-mode disable
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell cmd wifi set-wifi-enabled enabled
```
