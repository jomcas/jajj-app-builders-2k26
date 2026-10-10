# Wave 3 report: Forecast, Vision and Assistant tools

Checkpoint: **the Assistant uses tools and images.** Result: **met on the Flip 6 in airplane mode, with three caveats.** A hiker can ask "How far to the next campsite?" during a Hike and get the same distance and ETA as the Hike panel, ask the Assistant to help them signal and land on the Flare screen ready to fire (never fired), and take a photo, ask "what is this?" and get an answer on the phone with no network. A photo with an emergency question still opens the Emergency Guide card at once. The Forecast is saved with each downloaded Destination and shows its age offline. The caveats:
- **Plant identification was only seen through the Vision bench.** The bench runs the same photo pipeline as the chat and named a Mimosa pudica, but there's no in-app screenshot of a plant answer yet. Item 2 below covers it.
- **The 4B model's species names are hit or miss.** The photo prompt makes it hedge, and its Taglish is awkward.
- **Heat dominates the timings.** A photo read takes about 15–25 s on a cool phone and over 40 s on a hot one.

All three Wave 3 PRs are merged into `main`, and #17, #18 and #19 are closed. This report was written from the merged PRs; its author didn't run the phone.

## 1. What was built

**The Forecast ([#17](https://github.com/jomcas/jajj-app-builders-2k26/issues/17), PR [#44](https://github.com/jomcas/jajj-app-builders-2k26/pull/44)).** Every downloaded Destination now carries a saved 7-day Forecast (and so does the hiker's last known location):
- **In Explore,** the Destination screen has a **Forecast** card: "As of just now", then Today, Tomorrow and the next days, each with the conditions, the high and low, and the rain. Days 3 and later are dimmed and tagged "Less reliable". Weather warnings (thunderstorms, heavy rain, strong wind, extreme heat) are amber tags, never red ([ADR 0004](../adr/0004-red-means-danger-only.md)).
- **On the Hike panel,** a chip under the progress bar shows today's Forecast, for example "Thunderstorms · 25° / 20° · As of 2 minutes ago". It's amber when today has a warning.
- **Offline,** both keep showing the saved Forecast with its age ("As of 2 days ago"). The age turns into an amber tag after 12 hours. Past days drop off, and when every saved day has passed it says "The saved Forecast has run out of days." **Update now** offline says "Couldn't update. It updates by itself once you're back online."
- **Back online,** it refreshes by itself within about 30 s, with no tap. A pack download saves a fresh Forecast within about a minute.

**Vision in the Assistant ([#18](https://github.com/jomcas/jajj-app-builders-2k26/issues/18), PR [#49](https://github.com/jomcas/jajj-app-builders-2k26/pull/49)).** The camera button in the Ask tab works now:
- **Take a photo or choose one from the gallery.** The photo shows as a preview with a remove button ("Photo attached. Ask about it, or just send."). It stays on the phone.
- **The photo is read ahead** while the hiker types ("Reading the photo… n s"). After Send, the first words come in about 2 s instead of 15–25 s. The answer ends with a timing line: "From your photo · first words after N s".
- **Short questions about the photo** ("what is this?", "ano ito?", or no text at all) are answered even though they'd fail the topic gate on their own ([ADR 0006](../adr/0006-photo-questions.md)).
- **An emergency question with a photo** ("dumudugo ito, ano gagawin" with a wound, "nakagat ako ng ahas na ito" with a snake) shows the Emergency Guide card in about 0.1 s, even while the photo is still being read. The model doesn't run ([ADR 0003](../adr/0003-emergencies-route-to-guides.md)).
- **If the answer itself turns to an emergency** (bleeding, a bite…), the card replaces the text before it's shown.
- **A photo that has nothing to do with the outdoors** (a wall) gets a fixed reply: "I can only help with photos from the trail or camp: plants, animals, terrain, sky and weather, water, gear or your campsite. For an injury or a bite, open the Guides."
- **The model never gives first aid from a photo,** and never calls a wild plant, mushroom, berry or water safe to eat or drink.

**Assistant tools ([#19](https://github.com/jomcas/jajj-app-builders-2k26/issues/19), PR [#47](https://github.com/jomcas/jajj-app-builders-2k26/pull/47)).** Feature Modules can now give the Assistant tools, and two ship ([ADR 0001](../adr/0001-feature-modules-and-assistant-tools.md)):
- **Distance to the next Waypoint (Hike).** During a Hike, "How far to the next campsite?" answers in a "From your Hike" card: "Peak 8 campsite (Campsite) is 1.9 km ahead along the Trail, about 52 min away." The Hike panel shows the same "1.9 km · about 52 min". It also works for the summit, water and the jump-off, and in Filipino ("Gaano kalayo pa ang summit?" → "2.7 km pa … mga 1 oras 16 minuto pa"). With no Hike running: "Start a Hike first on the Hike tab (a simulated walk works too). Then I can tell you how far the next Waypoint is."
- **Open the Flare (Flare).** "Help me signal" or "Paano humingi ng tulong sa mga rescuer?" opens the Flare screen, idle and ready, and the chat says how to fire it. **It never fires the Flare;** that still takes the 1.5 s hold (ADR 0004).
- Both answer in milliseconds, with no model run. An emergency still beats a tool: "We are lost, help me signal" opens the Lost on the trail card.

**This report ([#20](https://github.com/jomcas/jajj-app-builders-2k26/issues/20)).**

**Also merged during this wave, outside Wave 3's tickets**
- **Mt. Ulap is live (PR [#48](https://github.com/jomcas/jajj-app-builders-2k26/pull/48), part of [#22](https://github.com/jomcas/jajj-app-builders-2k26/issues/22)).** The seed was applied: 1 Trail, 3 Waypoints, 32 passages, and a 1.79 MB map.
- **Mt. Pulag (PR [#50](https://github.com/jomcas/jajj-app-builders-2k26/pull/50), part 2 of #22).** The Ambangeg Trail (7.4 km), 6 Waypoints (Babadak Ranger Station, Camp 1, two springs, Camp 2, the summit), 20 passage pairs and a 1.47 MB map. 14 passages are flagged for the park office to confirm. #22 stays open.
- **The live catalog** now returns three Destinations: `batulao` (pack version 2), `ulap` (1) and `pulag` (1), all real content (checked with an anon REST read while writing this report).

**Cut or deferred**
- **Llama.rn tool calling.** Tools are matched by deterministic patterns instead (see below).
- **Removing old model files.** Nothing deletes a file that left the manifest, so the old F16 vision file stays on existing installs (item 0 below deletes it by hand).
- **A Destination switcher on the Hike tab.** See "Known limits".
- **A guard in `HikeMap`** for the dev-only MapLibre toast on a theme switch (from #44).

## 2. How it was built

**Approach.** As in Wave 2, an orchestrator agent ran one sub-agent per ticket in parallel, each on its own branch and worktree off `main`, sharing the one phone through a lock. The Forecast was built by another session. Each PR was verified on the Flip 6 in airplane mode, with the human deciding the two open questions on Vision, then merged in this order:

```text
main
├── #44  wave-3/17-forecast   (#17)  22:35Z
├── #47  wave-3/19-tools      (#19)  22:57Z
└── #49  wave-3/18-vision     (#18)  23:27Z
```

The test count grew from 263 (with the Forecast) to 313 (tools) and 324 (Vision). Each PR passed typecheck, lint and tests. **No native build this wave:** the camera picker (`expo-image-picker`) has been in the APK since Wave 0, so every PR stayed JavaScript-only on the APK already installed.

**Key libraries.**
- **Open-Meteo** (free, no key) for the Forecast, stored in AsyncStorage under `tahak.forecast.*`. No NetInfo: "back online" is found by retrying every 30 s while a Forecast is missing, more than an hour old, or the last try failed.
- **llama.rn** with three files in the manifest, **3.4 GB in total** (3,441,423,488 bytes):
  - `Qwen3.5-4B-Q4_K_M.gguf` (2,740,937,888 bytes) for answers;
  - `Qwen3.5-4B-mmproj-Q8_0.gguf` (366,894,656 bytes), the vision file, **new**;
  - `embeddinggemma-300M-Q8_0.gguf` (333,590,944 bytes) for search.
- **`expo-image-picker`** for the camera and the gallery.
- **The tools** are plain TypeScript: `AssistantTool { id, description{en,fil}, parameters, match(q), run(args) }` on `FeatureModule.tools`. The Hike's tool reads the Hike panel's latest view, so the two can't disagree.

**Decisions and departures.**
- **Human decision: the third-party Q8_0 vision file, with its hash pinned.** Unsloth publishes no Q8_0, so it comes from `prithivMLmods/Qwen3.5-4B-f32-GGUF` (sha256 `40a4f07d…725ad`). It replaces F16 in the manifest. On the phone, Q8_0 reads a photo about 30% faster (23.7 s against 34.3 s for the first word) and uses about 300 MB less memory, with the same answers on the test photos. `docs/plan.md` now names it.
- **Human decision: ADR 0006 accepted.** Photo questions keep the order emergency route → tools → gate. Short questions about the photo (12 words or fewer with "this", "ito", "yan"…, or no text) pass the gate. The photo prompt is the second layer: it replies NONE for non-outdoor photos, which shows the fixed reply.
- **`image_max_tokens = 256`.** llama.cpp scales a full-size camera photo down itself, so a 12 MP photo costs about the same as a small one. At 128 tokens it was twice as fast, but answers lost detail.
- **Read-ahead.** The model reads the photo while the hiker types, and llama.rn keeps a snapshot right after it, so after Send only the question's text is evaluated. The vision file attaches lazily to the loaded chat model (0.3–0.9 s, no reload) and detaches after 5 minutes without a photo, giving back about 360 MB.
- **Emergencies and tools skip the model queue.** They need no model, so they run before a photo question joins the queue and answer even while a photo is being read.
- **Tools use pattern matching, not llama.rn tool calling.** On the CPU, a tool-calling round trip adds seconds to every question, and the model can still invent numbers. Matching takes a few milliseconds (`"ms":4`, `"llm_ran":false`).
- **The Flare tool can't fire.** It's built with `openFlareScreen()` only, never given `fireFlare`, and a test checks its source never references it (ADR 0004).
- **Small shell change:** about 4 lines in `SosControl.tsx`, so the focused tab's SOS can open on a tool's request. The shell still owns where SOS sits.
- **The dev duplicate-key warning from Wave 2 is fixed:** chat message ids are now time plus random (#19).
- **Routing changes:** "How do I use the Flare?" now opens the Flare instead of a RAG answer. "How many hours to the summit?" with no "from here" cue still goes to RAG, and "How far is Batulao from Manila?" is a reference question, not the tool.
- **New dev-only deep link:** `tahak://assistant/vision-bench?photo=<file>&q=<question>&ui=en|fil&tokens=<n>&mmproj=<file>&ahead=1&runs=<n>`, logged under `TAHAK_VISION_BENCH`. `photo` is a file in the app's `cache/vision-bench/` folder, or `bundled` (the Wave 0 photo). Any change to the photo prompt, the token cap or the vision file must be re-run with it (ADR 0006).

**Measured on the Flip 6, in airplane mode, on the CPU** (from #49):

| Setting | Time to first word | Peak PSS |
|---|---|---|
| Wave 0: F16, full photo (972 tokens) | 219 s | — |
| F16, 256 tokens | 34.3 s | 5.23 GB |
| Q8_0, 256 tokens | 23.7 s | 5.18 GB |
| **Q8_0, 256 tokens, read ahead** | **1.8 s after Send** (the read took 24.7 s) | 4.98 GB |

With the Hike map open and all three models loaded, peak memory was **5.01 GB**. Wave 0 saw the phone kill the app at about 6.2 GB, so there's about 1.2 GB of headroom.

**Known limits and shortcuts.**
- **The Hike tab always shows the most recently downloaded Destination, and has no switcher.** With Mt. Ulap and Mt. Pulag live next to Batulao, downloading either one moves the Hike tab to it, and Batulao's Trails can't be picked again without re-downloading Batulao. **This is a demo risk:** download the demo Destination last. There's no issue for it yet (PR #50 says it's "tracked separately").
- **Chip grouping bug:** one fee answer cited 3 sources but showed only 2 chips. The answer is right; one source is hidden.
- **The old 672 MB F16 vision file** is still on the demo phone. Nothing removes files that leave the manifest. Delete it by hand (item 0).
- **Species names are hit or miss,** so the prompt hedges. Never trust a plant ID for eating.
- **The photo guard only catches words the emergency router knows.** First-aid text that avoids every word in its lexicon could still reach the screen, so the prompt remains a real layer.
- **The Hike tool says "no position yet"** until the Hike tab has mounted once during the Hike.
- **The Forecast needs the network once.** If the first fetch after a download fails and the phone never comes back online, the Hike chip says "No Forecast saved". Online, the app calls `api.open-meteo.com` at most once per place per 30 s.
- **Dev-only:** the first theme switch during a Hike sometimes shows a MapLibre `reactTag … resolved to view null` toast (from #44).
- **Still open from earlier waves:** the Red Cross check on all 15 Guides ([#11](https://github.com/jomcas/jajj-app-builders-2k26/issues/11)), Assistant latency (6–37 s for the first token), and no background model download.
- **Out-of-date docs:** `README.md` still says the vision file is F16, and the Wave 2 report (PR #46) still lists the F16 file and "3.7 GB".

## 3. How to test it

> ⚠️ **Never uninstall Tahak or clear its data** (no `adb uninstall`, no `pm clear`, no "Clear storage" in Android Settings). That deletes the Assistant's model files and every downloaded Destination Pack, and there's no copy of the models on the Mac. The manifest is now **Qwen3.5-4B Q4_K_M + its Q8_0 vision file + embeddinggemma, 3.4 GB**, and the old 672 MB F16 vision file may still be on the phone too. Test "fresh install" with `tahak://setup/reset`, never an uninstall. Reinstall only with `adb install -r`. If an install fails with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, stop. Don't uninstall to get past it.

> **Airplane mode on this phone leaves Wi-Fi on.** For every offline test, turn Wi-Fi off separately and check that `wifi_on` is `0` (commands below).

Run everything from a Mac terminal with the phone (serial `R5CX728V0LN`) plugged in over USB. To mirror the phone on the Mac, run `scrcpy -s R5CX728V0LN`.

**Which code runs.** The installed APK was built from #12's branch at 05:12 on 2026-10-10. No Wave 3 PR changed native code, so it still has everything needed. The JavaScript comes from Metro, so run Metro in the main checkout on `main`, which now has every Wave 3 PR.

**Photosensitivity:** the Flare strobes the screen at 2 Hz. Look away from it if flashing light bothers you.

**Have ready on the Mac:** a photo of a plant, and a non-outdoor photo (a wall, a laptop). On the phone's gallery: a snake picture and a cut or wound picture (a picture of a picture on a screen is fine).

### Before you start: Metro, launch and the model folder

**Start:** online (Wi-Fi on), USB connected, Metro not running.

1. Check the installed build and the model files:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell dumpsys package com.tahak.app | grep lastUpdateTime
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell ls -l /sdcard/Android/data/com.tahak.app/files/assistant-models/
   ```
   Only if the app is missing, install it. `-r` keeps the app's data:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN install -r /Users/nariesss/Personal/jajj-app-builders-2k26/apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
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
- The model folder has these three files at these exact sizes: `Qwen3.5-4B-Q4_K_M.gguf` (2,740,937,888), `Qwen3.5-4B-mmproj-Q8_0.gguf` (366,894,656) and `embeddinggemma-300M-Q8_0.gguf` (333,590,944). It may also have the old `Qwen3.5-4B-mmproj-F16.gguf` (672,423,616); see item 0.
- **If the Q8_0 file is missing or smaller,** the Ask tab shows the download card instead of the chat. Let it download the 367 MB on Wi-Fi. Never delete the other two files.
- The branch is `main`.
- Terminal 1 logs `Android Bundled … index.ts`, and the app opens on Explore with no red error screen.

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

In terminal 3, keep the Assistant's log open for items 2 and 3:
```sh
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN logcat -c
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN logcat -v time -s TAHAK_ASSISTANT:I TAHAK_VISION_BENCH:I
```

### 0. Delete the old F16 vision file (one time)

**Start:** any state. Do this once, after checking the three manifest files above.

1. List the folder and confirm the Q8_0 file is there at 366,894,656 bytes:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell ls -l /sdcard/Android/data/com.tahak.app/files/assistant-models/
   ```
2. Only if `Qwen3.5-4B-mmproj-F16.gguf` is listed, delete **that one file**. Copy the command exactly; don't use a wildcard:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell rm /sdcard/Android/data/com.tahak.app/files/assistant-models/Qwen3.5-4B-mmproj-F16.gguf
   ```
3. Run step 1 again, then relaunch cold and open **Ask**.

**Expected:**
- **Step 3:** exactly three files remain, at the sizes in "Before you start". About 672 MB is freed.
- The Ask tab opens on the chat, not the download card. If it shows the download card, stop and report the `ls -l` output.

### 1. The Forecast: download, offline age, Hike chip, refresh by itself

**Start:** online (Wi-Fi on), Metro running, English, Day theme, no Hike running.

1. Relaunch cold. On **Explore**, open **Mt. Pulag**. If it's already downloaded, use **Mt. Ulap** instead. If both are, skip to step 3.
2. Tap **Download for offline use (…)** and wait for it to finish. Wait one more minute on the Destination screen.
3. Scroll to the **Forecast** card.
4. Go offline (airplane mode and Wi-Fi off, see "Going offline"). Relaunch cold. Open the same Destination in **Explore** and read the Forecast card.
5. Tap **Update now** on the card.
6. Open **Hike**. Choose the Trail, turn **Simulated walk** on, and tap **Start Hike**. Look at the panel.
7. Tap the cog: choose **Filipino** and **Night**, and look at the Hike chip. Switch back to **English** and **Day**.
8. Go back online (both commands). Stay on the Hike tab and watch the chip for a minute. Then open the Destination in **Explore**.
9. End the Hike:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am start -a android.intent.action.VIEW -d "tahak://hike/end" com.tahak.app
   ```

**Expected:**
- **Step 2:** the download finishes and the screen shows "On your phone since … · … MB".
- **Step 3:** "Forecast · As of just now" (or a few minutes ago). Today, Tomorrow and the next days, each with conditions, a high and low and the rain. Days 3 and later are dimmed and tagged **Less reliable**. Any warnings (Thunderstorms, Heavy rain, Strong wind, Extreme heat) are **amber** tags, never red.
- **Step 4:** the Destination still opens offline, and the card shows the same days with "As of N minutes ago". Nothing waits on the network.
- **Step 5:** "Couldn't update. It updates by itself once you're back online."
- **Step 6:** the Hike tab shows the Destination you just downloaded (the Hike tab always shows the latest download; see "Known limits"). Under the progress bar, a Forecast chip with today's conditions, high and low and "As of N minutes ago". **If today has a warning, the chip is amber** (for example "Thunderstorms · 25° / 20° · As of 2 minutes ago").
- **Step 7:** "Kulog at kidlat · … · Kuha … na ang nakalipas" (or the matching Filipino conditions), readable on the dark panel.
- **Step 8:** within about 30 s and **with no tap**, the chip changes to "As of just now". The Explore card says "As of just now" too.
- **The 12-hour tag:** a Forecast older than 12 hours shows its age as an amber tag. You can only see this after leaving the phone offline that long, so it's optional.

### 2. Vision: photo questions offline

**Start:** airplane mode with Wi-Fi off, Metro running, English, phone cool (`Thermal Status: 0`), no Hike running, terminal 3 showing the log.

**A. A plant, with the timing line.**
1. Relaunch cold. Open **Ask** and wait for the chat.
2. Tap the camera button. Read the sheet, then tap **Take a photo** and photograph a plant (or **Choose from gallery** and pick one).
3. Look at the preview, and **send immediately**: type `what is this?` and tap **Send** before "Reading the photo…" finishes.
4. Read the answer and the line under it.

**Expected:**
- **Step 2:** a sheet with **Take a photo**, **Choose from gallery** and **Cancel**, and "The photo goes with your next question. It stays on this phone."
- **Step 3:** the preview with a remove button, "Photo attached. Ask about it, or just send.", and "Reading the photo… n s" counting up. After Send, "Looking at the photo… n s".
- **Step 4:** a short answer naming or describing the plant, hedged ("This looks like…"). It never says it's safe to eat. Under it: **"From your photo · first words after N s"**, with N about 15–35 s (more on a warm phone). The log has a `photo-answer` line with `"verdict":"answer-photo"`, `"llm_ran":true` and `"read_ahead":false`.

**B. Read-ahead.**
1. Attach a second plant photo the same way, but **don't type yet.** Watch "Reading the photo… n s" count up until it disappears (about 15–25 s).
2. Now type `what is this?` and tap **Send**.
3. Repeat in **Filipino** with `ano ito?`, then switch back to **English**.

**Expected:**
- **Step 1:** the log has a `photo-read` line with `ms` around 15,000–25,000.
- **Step 2:** the first words appear in about 1–3 s. The timing line says **"first words after 2 s"** or so. The log has `"read_ahead":true` and a `ttft_ms` around 2,000.
- **Step 3:** an answer in Filipino or Taglish (may be awkward), and "Mula sa litrato mo · unang salita pagkatapos ng N s".
- **The vision file detaches** after 5 minutes without a photo. The next photo after that waits 0.3–0.9 s more (`attach_ms` in the log).

**C. An emergency with a photo.**
1. Attach a snake picture and, right away (while it's still reading), ask `nakagat ako ng ahas na ito`.
2. Attach a wound picture and ask `dumudugo ito, ano gagawin`.
3. Tap **Open Guide** on the second card, then go back to **Ask**.

**Expected:**
- **Step 1:** the **Snakebite** Emergency Guide card appears **at once** (about 0.1 s), with no "Looking at the photo…", even though the photo hadn't finished reading. The log has a `photo-answer` line with a `"verdict":"emergency-…"`, `"guide":"snakebite"` and `"llm_ran":false`.
- **Step 2:** the **Bleeding wounds** card, at once, with `"llm_ran":false`.
- **Step 3:** the Guides tab opens on Bleeding wounds.
- **The model never writes first-aid text.** If a plain "what is this?" on the snake picture turns into a Snakebite card after the model starts, that's the guard working (`"verdict":"emergency-answer"`).

**D. Off-topic photos.**
1. Attach the non-outdoor photo (a wall, a laptop) and ask `what is this?`
2. Attach any photo and ask `Write me a poem`.

**Expected:**
- **Step 1:** after the model runs, the fixed reply (the log verdict starts with `off-topic-`) "I can only help with photos from the trail or camp: plants, animals, terrain, sky and weather, water, gear or your campsite. For an injury or a bite, open the Guides." The model's own text isn't shown.
- **Step 2:** the general off-topic reply ("I can only help with hiking and camping, …") in about 1.5 s, without running the model (`"llm_ran":false`).

**E. The Vision bench.**
1. Copy a plant photo from the Mac into the app's bench folder (replace the Mac path with yours):
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN push ~/Desktop/plant.jpg /data/local/tmp/plant.jpg
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell run-as com.tahak.app mkdir -p cache/vision-bench
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell run-as com.tahak.app cp /data/local/tmp/plant.jpg cache/vision-bench/
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell run-as com.tahak.app ls -l cache/vision-bench
   ```
2. Let the phone cool, then run the bench with read-ahead (`&` needs the outer quotes):
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell 'am start -a android.intent.action.VIEW -d "tahak://assistant/vision-bench?photo=plant.jpg&q=what%20is%20this%3F&tokens=256&ahead=1" com.tahak.app'
   ```
3. Run it once more without read-ahead, and once on the bundled Wave 0 photo:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell 'am start -a android.intent.action.VIEW -d "tahak://assistant/vision-bench?photo=plant.jpg&q=what%20is%20this%3F&tokens=256" com.tahak.app'
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell 'am start -a android.intent.action.VIEW -d "tahak://assistant/vision-bench?photo=bundled&tokens=256" com.tahak.app'
   ```

**Expected:**
- **Step 1:** `plant.jpg` is listed in `cache/vision-bench`.
- **Step 2:** `TAHAK_VISION_BENCH` prints a `start` line with `"mmproj":"Qwen3.5-4B-mmproj-Q8_0.gguf"`, `"imageMaxTokens":256`, `"ahead":true` and `"airplane_mode":true`; a `result` line with `"verdict":"answer-photo"`, `ahead_ms` around 15,000–25,000, **`first_word_ms` around 2,000**, `gen_tps` around 7, and `peak_pss_kb` around 5,000,000; then `answer` lines (the PR's run named "Mimosa pudica, commonly called the sensitive plant"); then `done`.
- **Step 3:** without read-ahead, `first_word_ms` is around 24,000 (more when hot), and `ahead_ms` is `null`.
- **If `start` names an F16 file,** the deep link had an `mmproj=` option. Leave it out.

**F. Memory with the Hike map open.**
1. In terminal 4, sample the app's memory every 2 s:
   ```sh
   while true; do echo "$(date +%T) $(~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell dumpsys meminfo com.tahak.app | awk '/TOTAL PSS:/{print $3}')"; sleep 2; done
   ```
2. Start a simulated walk on the **Hike** tab. Open **Ask** and ask a text question (`Is there water on the trail?`) so the chat and embedding models load, then attach a photo and ask `what is this?`
3. While it answers, go back to **Hike** and pan the map. Wait for the answer, then stop the loop with Ctrl-C and end the Hike (`tahak://hike/end`).

**Expected:** the PSS (in KB) climbs to about **5,000,000 (5.0 GB)** and stays under 5,300,000. The app is never killed (it would reach about 6.2 GB first). The map keeps moving while the photo is read.

### 3. Assistant tools during a Hike

**Start:** airplane mode with Wi-Fi off, Metro running, English, no Hike running, terminal 3 showing the log. The Hike tab shows whichever Destination was downloaded last (after item 1, Mt. Pulag or Mt. Ulap).

1. Open **Ask** and ask `How far to the next campsite?`
2. Open **Hike**, choose the Trail, turn **Simulated walk** on, and tap **Start Hike**. Wait until the panel shows a campsite as the next Waypoint, and note its distance and ETA.
3. Open **Ask** and ask `How far to the next campsite?` Then go back to **Hike** and compare.
4. Tap the cog and choose **Filipino**. Ask `Gaano kalayo pa ang summit?`, then `Gaano kalayo pa ang susunod na campsite?`. Compare with the Hike panel. Switch back to **English**.
5. Clear logcat in terminal 2, then ask `Help me signal`.
6. On the Flare screen, **don't touch the hold button.** In terminal 2, check the log and the torch:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN logcat -d | grep '"fired":false'
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell dumpsys media.camera | grep -i torch
   ```
7. Press **Back** to leave the Flare screen. Ask `We are lost, help me signal`.
8. End the Hike (`tahak://hike/end`).

**Expected:**
- **Step 1:** a **"From your Hike"** card, at once: "Start a Hike first on the Hike tab (a simulated walk works too). Then I can tell you how far the next Waypoint is." The log has `"verdict":"tool"` and `"llm_ran":false`.
- **Step 3:** at once, "<campsite> (Campsite) is X km ahead along the Trail, about N min away." **The same X km and N min as the panel** (it may differ by one step if the walk moved between the two). For example, on Batulao's New Trail #47 got "Peak 8 campsite (Campsite) is 1.9 km ahead along the Trail, about 52 min away." against the panel's "1.9 km · about 52 min". The log has `"tool":{"id":"hike.distance-to-next-waypoint",…}`, `"llm_ran":false` and `ms` under 10.
- **Step 4:** "X km pa sa Trail ang <summit> (Tuktok), mga N oras M minuto pa." and the campsite in Filipino, matching the panel's "X km · mga N minuto".
- **Step 5:** the app switches to the **Flare screen, idle** ("Hold to fire the Flare"). No light, no sound, no strobe. The chat card says "I opened the Flare. To signal, press and hold the red button for 1.5 seconds…".
- **Step 6:** a line with `"tool":{"id":"flare.open","args":{},"data":{"opened":true,"fired":false}}` and `"llm_ran":false`. No new torch-on events.
- **Step 7:** the **Lost on the trail** Emergency Guide card, at once: an emergency beats a tool.
- **If step 3 says "Your Hike is on, but there is no position yet",** the Hike tab hadn't mounted. Open Hike once and ask again (known).

### 4. Regression pass: Waves 1 and 2

**Start:** airplane mode with Wi-Fi off, pack version 2 of Batulao downloaded, Metro running, English, Day theme, no Hike running, media volume about two-thirds, phone cool.

**A. The core loop offline (Wave 2 checkpoint).**
1. Relaunch cold. On **Explore**, open **Mt. Batulao**: "On your phone since …" and its Forecast card, with an age.
2. On **Hike**, start a simulated walk on the Trail shown. Tap **Go off the Trail**, or:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am start -a android.intent.action.VIEW -d "tahak://hike/simulate/off-trail" com.tahak.app
   ```
   Wait about 70 s for the Deviation.
3. While the banner is up, open **Ask** and ask `Is there water on the Batulao trail?` Tap its chip.
4. Ask `How much is the registration fee for Mt. Pulag?` and count the chips against the sources it mentions.
5. Ask `My friend got bitten by a snake what do we do`, then `help!`.
6. Tap **SOS**, tap the hold button once, then hold it to fire the Flare for a few seconds. Tap **Stop Flare**.
7. Go back to **Hike**. When the banner clears, end the Hike (`tahak://hike/end`).

**Expected:**
- **Step 1:** no download button; the Forecast card shows the saved days with "As of …".
- **Step 2:** the simulation bar shows the real distance ("… m off the Trail"), then the brick-red banner "Off the Trail · 60 m", the arrow, the dashed line, three vibrations, a beep and the "You're off the Trail" notification. The panel still has its Forecast chip.
- **Step 3:** the Hike keeps running. "Answering…", then an answer (no reliable water on the trail, two springs near Camp 1, filter and disinfect) with a peach **Mt. Batulao · Water** chip that opens a sheet with the passage.
- **Step 4:** an answer with peach Mt. Pulag chips (if Pulag is downloaded). **Known bug:** a fee answer once showed 2 chips for 3 sources. Note what you see.
- **Step 5:** the **Snakebite** card at once (no "Answering…"), then the **"Need help now?"** card. Both have `"llm_ran":false`.
- **Step 6:** the tap shows "Press and hold until the bar fills. A tap does nothing." The hold fires the flashlight SOS, the white and red strobe and the whistle, over the running Hike. Stop Flare ends everything, and the volume comes back.
- **Step 7:** the banner clears, the Hike ends and the Trail picker returns. No step needed the network.

**B. Download, offline map and Deviation (Wave 1 checkpoint).**
1. The download part was done online in item 1.
2. Offline, open **Hike** and wait for the map. Pinch and zoom over the Trail.
3. Start a simulated walk at 15×. Watch the first minute (the short excursion), then about 3 minutes in (the long one).
4. Tap **Switch to 60×** and let it reach the end and come back down. Tap **End Hike** on the "You're back near the jump-off" card.

**Expected:**
- **Step 2:** the Trail as a trail-orange line over a dark outline, Waypoint icons by type (blue drops for water), muted place names, and "© OpenStreetMap contributors · © Protomaps" at the bottom left. No MapLibre `http` lines in logcat.
- **Step 3:** the short excursion shows about "30 m off the Trail" with no banner, vibration, sound or notification. The long one shows "60 m off the Trail" and fires a Deviation once (brief at 15×). When it clears, the bar goes back to "Not your real position."
- **Step 4:** "You've reached the end of the Trail", then "Back to the jump-off · N%", then the end card. The Hike ends and the Trail picker returns.
- **The switcher gap:** the Hike tab shows the last Destination downloaded, not necessarily Batulao. Note which one it shows. To demo Batulao's New Trail, Batulao has to be the last download.

When you're done, go back online:
```sh
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell cmd connectivity airplane-mode disable
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell cmd wifi set-wifi-enabled enabled
```
