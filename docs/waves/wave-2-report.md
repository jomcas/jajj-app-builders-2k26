# Wave 2 report: Assistant and safety

Checkpoint: **full core loop offline.** Result: **met on the Flip 6 in airplane mode, with two caveats.** A hiker can download Batulao, go offline, start a Hike, get a Deviation alert, ask the Assistant about water and get a grounded answer with sources, ask about a snakebite and get the Snakebite Guide, and fire the Flare from any screen. The caveats:
- **The Guides are unchecked.** All 15 have shipped, but none has had the human Red Cross check yet ([#11](https://github.com/jomcas/jajj-app-builders-2k26/issues/11) stays open).
- **The Assistant is slow.** The first token takes 6–37 s.

All five Wave 2 PRs are merged into `main`, and #10, #12, #13, #14 and #15 are closed.

## 1. What was built

**The Flare ([#12](https://github.com/jomcas/jajj-app-builders-2k26/issues/12), PR [#38](https://github.com/jomcas/jajj-app-builders-2k26/pull/38)).** The SOS control at the top right of every tab opens the Flare screen. A tap on the hold button only shows "Press and hold until the bar fills. A tap does nothing." Holding it for 1.5 s fires the Flare:
- **Flashlight:** blinks SOS in Morse code (250 ms units, ··· ––– ··· and a 7-unit gap).
- **Screen:** strobes between white and danger red at 2 Hz. The code refuses anything above 3 Hz, for photosensitivity.
- **Sound:** a looped whistle tone, with the media volume raised to maximum.
- **The screen** stays awake at full brightness.

While the Flare is on, the SOS control is solid red and reads "SOS, Flare on". The Flare screen also links to five Emergency Guides (Lost on the trail, Bleeding wounds, Snakebite, Sprains and fractures, Hypothermia), which open while the Flare keeps running, and has a 911 button that opens the dialer. **Stop Flare** or Back ends everything and restores the brightness and the media volume. The Flare works in airplane mode and needs no camera permission.

**First-launch setup and the model download ([#13](https://github.com/jomcas/jajj-app-builders-2k26/issues/13), PR [#39](https://github.com/jomcas/jajj-app-builders-2k26/pull/39)).** A fresh install opens on one setup screen, "Welcome to Tahak", before the tabs. It has:
- the language choice (English or Filipino), which switches the screen at once;
- Location and Notifications, each with a reason and an **Allow** button, or "Allowed";
- the Assistant card: "About 3.7 GB. Wi-Fi recommended.", a progress bar, and Download, Pause and Resume;
- **Browse Guides while you wait**, which opens the Guides tab while the download keeps going.

The download resumes after a dropped connection from the byte where it stopped, retrying every 15 s. It also resumes after a relaunch. A file already on the phone at its exact size counts as done and is never touched, so the phone's existing model went straight to "The Assistant model is ready." While the model isn't ready, the Ask tab shows the download progress instead of the chat. Setup shows only once.

**The Guide Library ([#10](https://github.com/jomcas/jajj-app-builders-2k26/issues/10), PR [#41](https://github.com/jomcas/jajj-app-builders-2k26/pull/41); content for [#11](https://github.com/jomcas/jajj-app-builders-2k26/issues/11)).** The Guides tab lists all 15 Guides in English and Filipino, in three groups:
- **Injury and illness (9):** snakebite, bleeding wounds, sprains and fractures, hypothermia, heat exhaustion and heatstroke, dehydration, altitude sickness, insect and bee stings, leech bites, and blisters.
- **Hazards (4):** lost on the trail, lightning, and flash floods and river crossings.
- **Camp skills (2):** pitching a tent and purifying water.

The 10 Emergency Guides ([CONTEXT.md](../../CONTEXT.md)) are marked only by a red icon on a blush tile. The others have an olive tile. A Guide reads top to bottom: summary, **Call for help**, **What to do** (numbered steps), **Do not**, **Watch for**, **Sources**, and the amber note "Not yet checked against Red Cross material". The Guides are bundled in the app, so they work offline with no Destination Pack. Any feature can open a Guide by its id, and so can the deep link `tahak://guides/<id>`, which brings the Guides tab forward from any tab.

**The Assistant ([#14](https://github.com/jomcas/jajj-app-builders-2k26/issues/14), PR [#42](https://github.com/jomcas/jajj-app-builders-2k26/pull/42)).** The Ask tab is now the on-device Assistant. It answers from the Destination Pack, the Guide Library and app help, with no network:
- **Answers follow the UI language:** English in the English UI, and Filipino with Taglish style in the Filipino UI. An answer is at most three sentences.
- **Every answer shows source chips:** peach for the Destination Pack (for example "Mt. Batulao · Water"), olive for a Guide or app help. A Guide chip opens the Guide. A pack or help chip opens a sheet with the passage and its source.
- **Off-topic questions** ("Write me a poem", "Sino ang presidente?") get a fixed, translated reply in about 1.5 s, without running the model ([ADR 0005](../adr/0005-assistant-stays-on-topic.md)).
- **With no pack downloaded,** it still answers from the Guides and app help ("What should I bring on a day hike?").
- **The camera button** is there but disabled until Vision ([#18](https://github.com/jomcas/jajj-app-builders-2k26/issues/18)).

**Emergency questions open a Guide ([#15](https://github.com/jomcas/jajj-app-builders-2k26/issues/15), PR [#45](https://github.com/jomcas/jajj-app-builders-2k26/pull/45)).** Before anything else runs, the Ask chat checks whether a question is an emergency ([ADR 0003](../adr/0003-emergencies-route-to-guides.md)):
- **An emergency** ("My friend got bitten by a snake what do we do", "nakagat ng ahas yung kasama ko") shows the matching Emergency Guide card. The card has the Guide's own summary, word for word, cut to two lines, plus **Open Guide** and **Call 911**. The model doesn't run, so the card appears in well under a second.
- **A bare distress message** ("help!", "tulong po") shows a fixed "Need help now?" card, with **Call 911**, a hint to fire the Flare from SOS, and links to five Emergency Guides.
- **Everything else** goes on to the Assistant as before. "How do I use the Flare?" and "I was bitten by a snake last year…" get ordinary answers.

The model never writes first-aid text.

**This report ([#16](https://github.com/jomcas/jajj-app-builders-2k26/issues/16)).**

**Also merged during this wave, outside Wave 2's tickets**
- **Forecast ([#17](https://github.com/jomcas/jajj-app-builders-2k26/issues/17), PR [#44](https://github.com/jomcas/jajj-app-builders-2k26/pull/44)), a Wave 3 ticket, merged and closed.** A saved 7-day Open-Meteo Forecast for each downloaded Destination. It shows as a card on the Destination screen in Explore and as a chip on the Hike panel, with butter warning tags and "As of …" ages. It refreshes by itself once the phone is back online.
- **Admin Portal ([#21](https://github.com/jomcas/jajj-app-builders-2k26/issues/21), PR [#43](https://github.com/jomcas/jajj-app-builders-2k26/pull/43)): code merged, migration not applied.** `apps/admin` runs locally. Its migration (`20261010061115_admin_portal_team_writes.sql`) hasn't been pushed to the hosted project, so no one can write through it yet. #21 stays open.
- **Mt. Ulap content (PR [#40](https://github.com/jomcas/jajj-app-builders-2k26/pull/40), part 1 of [#22](https://github.com/jomcas/jajj-app-builders-2k26/issues/22)).** The Trail, 3 Waypoints, 16 passage pairs and a map script, merged but not seeded, so Mt. Ulap isn't in Explore yet. Mt. Pulag isn't started.
- **The simulation bar fix (PR [#36](https://github.com/jomcas/jajj-app-builders-2k26/pull/36)).** The bar now shows the hiker's real distance from the Trail ("60 m off the Trail"), not the planned one. This fixes Wave 1's known issue.
- **ImgBot's image optimisation (PR [#34](https://github.com/jomcas/jajj-app-builders-2k26/pull/34)).** Lossless, 12% smaller across 10 images (app icons, map sprites and the old bench photo).

**Cut or deferred**
- **The Red Cross check on all 15 Guides** (#11, below).
- **Guides the emergency router doesn't cover:** chest pain, head injury without bleeding, fainting not caused by heat, and dog bites. These questions go to the Assistant, which answers from whatever Guide passages are closest.
- **Library search,** and tappable source URLs in a Guide (they show as text).
- **Downloading in the background.** The model download runs only while Tahak is open. There's no Android foreground download service.
- **Vision.** The camera button is disabled (#18, Wave 3).

## 2. How it was built

**Approach.** As in Waves 0 and 1, an orchestrator agent ran one sub-agent per ticket, but this time in parallel and not stacked. Each ticket had its own branch off `main`, and its own worktree except the Flare, which used the main checkout. One shared phone was passed between them through a lock. Each PR was verified on the Flip 6 in airplane mode, then merged into `main` in this order:

```text
main
├── #38  wave-2/12-flare        (#12)  21:19Z   native build
├── #39  wave-2/13-setup        (#13)  21:27Z
├── #41  wave-2/10-guides-ui    (#10)  21:35Z
├── #42  wave-2/14-assistant    (#14)  22:19Z
└── #45  wave-2/15-emergency    (#15)  22:42Z
```

The test count grew from 129 to 146, 184, 201, 226 and 262 (263 with the Forecast). Each PR passed typecheck, lint and tests. The Flare was the only native build. Everyone else stayed JavaScript-only on the APK already installed. The Guide content was written by a separate content agent and checked by `apps/mobile/src/modules/guides/content/validate.py`.

**Key libraries.**
- **llama.rn**, with two contexts on the CPU: **Qwen3.5-4B Q4_K_M** for answers (thinking off), and **embeddinggemma-300M Q8_0** (333,590,944 bytes) for search.
- **A brute-force vector index** in JavaScript: 32 app-help passages, 149 Guide passages and 28 Batulao passages. Passages are embedded at app start and when a pack downloads or updates, but only when their content hash changes, so question time embeds only the question.
- **`tahak-flare-native`**, a small local Kotlin module that calls `CameraManager.setTorchMode` (no camera permission) and sets window brightness and media volume.
- **`expo-audio`** (the looped whistle), **`expo-keep-awake`**, and **`expo-file-system`** (the model downloader writes `<name>.part` and resumes with HTTP Range).
- **Guide content** is one JSON file per Guide, bundled with `require.context`. A malformed file is skipped and logged instead of crashing the app, and missing Filipino text falls back to English.

**Decisions and departures.**
- **Answers follow the UI language.** English in the English UI. In the Filipino UI, a style block with three example answers asks for Taglish, as the Wave 0 checkpoint recommended.
- **The relevance gate threshold is 0.40** ([ADR 0005](../adr/0005-assistant-stays-on-topic.md)). Over the 32-question test set (22 in scope, 10 off-topic, in English, Filipino and Taglish), it refused 0 of 22 and let through 0 of 10, in both UIs. In-scope questions scored 0.44–0.79 and off-topic ones 0.06–0.37. A model answer that cites no passage is also treated as off-topic.
- **embeddinggemma-300M was added to the download,** which is now 3.7 GB (3,746,952,448 bytes) instead of 3.4 GB. It runs as a second llama.rn context, and the phone already has it.
- **Order of checks:** emergency routing, then the gate, then a grounded answer (ADR 0005). The router is a deterministic lexicon (Filipino affixes, reduplication, typos, negation and "last year"-style distant past) and takes about 0.35 ms. Its keywords come from each Guide's content file, so a Guide author can widen routing without code changes. Ties go to snakebite, and a Guide match beats distress.
- **Distress messages get a fixed card,** not a model answer.
- **Four Guide summaries were reordered action-first** (dehydration, flash floods, hypothermia and altitude sickness), in English and Filipino, so the two-line card starts with what to do. Sentences were only swapped, and no claim changed. Each change is noted in the Guide's `review.notes` for #11.
- **The cards use the settled colour system,** not U4's "blush card". They sit on the normal surface, and the only red is the icon on its blush tile ([ADR 0004](../adr/0004-red-means-danger-only.md)).
- **The Flare fires on a 1.5 s hold, never a tap** (ADR 0004). The shell gained an optional `sos` field on `FeatureModule`: the shell owns where the control is, and the Flare owns what it does ([ADR 0001](../adr/0001-feature-modules-and-assistant-tools.md)).
- **The model is judged complete by exact byte size,** with no sha256 check on the phone.
- **Small shell changes:** a `launchGate` slot for setup (#13), and `navigation.ts` so a module can bring its tab forward (#10).
- **`assistant-spike` was deleted.** Its benchmark moved into the Assistant and still answers to `tahak://spike/bench`.
- **Dev-only deep links**, for testing without uninstalling:
  - `tahak://setup/reset`, `tahak://setup/test-download[?fresh=1]` and `tahak://setup/real-download`;
  - `tahak://assistant/bench?mode=gate|full`, logged under `TAHAK_ASSISTANT_BENCH`;
  - `tahak://assistant/test?packs=none|all`, which hides the packs;
  - `tahak://emergency/preview/<id>`, `…/distress` and `…/ask?q=…`.

**#11: the Red Cross check is still open.** All 15 Guides have shipped, but **0 of 15 have had the human Red Cross check**, so each one shows the amber note. The PRC Standard First Aid manual isn't online, so the content follows the IFRC 2020 guidelines plus the PRC material that is public (the 2011 flipchart, the 2019 and 2025 advisories, and hotline 143). The checklist on #11 starts with:

> 1. ⚠ **dehydration.** The homemade ORS recipe follows IFRC/WHO: ½ tsp salt + 6 tsp sugar per litre. The **PRC 2011 flipchart says 1 tbsp salt + 4 tsp sugar**, about 6× the salt. Confirm against the current PRC manual, or delete the step and keep "ORS sachet" only.

It goes on to snakebite (no pressure-immobilisation bandage, washing the wound, Philippine cobra antivenom only), bleeding wounds (no pressure points or elevation), heat illness, several smaller checks, and a native speaker's read of the Filipino. To sign a Guide off, give the orchestrator the Guide id, any fixes and your name.

**Known limits and shortcuts.**
- **Assistant latency.** The first token takes about 6–10 s for repeated English questions, and 15–37 s for the first question in a language or on a warm phone. Generation runs at 7–10 tok/s and falls to 2–3 tok/s when the phone is hot. Peak memory is 5.0 GB PSS. Let the phone cool before a demo.
- **Filipino and Taglish answers are understandable but sometimes awkward.**
- **The router's honest held-out accuracy was about 71%.** On an untuned held-out round, it caught 71% of emergencies, with 1 false positive in 15. The misses were fixed with general rules and added to the test sets, which now pass (89 of 89 emergencies, 0 of 57 ordinary questions fire, 25 of 25 edge cases). Real phrasing will still miss sometimes. Texting spellings with dropped vowels ("nkagat") aren't handled.
- **False positives** are deliberate: "what if I see a snake on the trail?" opens the Snakebite card.
- **In two Guides, the two-line card ends mid-action,** because their action sentences are long.
- **No Android foreground download service.** Leaving Tahak pauses the model download.
- **The download bar is trail orange,** while the pack download (#4) uses olive. One of them should change.
- **Dev-only warning:** after a hot reload, the chat can log a duplicate React key. It comes from #14's message-id counter, and #45 says it's being fixed in #19.
- **Also dev-only (from the Forecast):** the first theme switch during a Hike sometimes shows a MapLibre `reactTag … resolved to view null` toast.
- **Not yet verified, and needing the human:**
  - the Pause and Resume buttons on a real download (unit tests only);
  - keep-awake during the Flare (the dev build always keeps the screen on);
  - the whistle by ear;
  - a full `mode=full` bench over all 32 questions in one run (the wave ran it on subsets of 3–12 questions).
- **New native code** (`tahak-flare-native`) means any later native change needs `npx expo prebuild` and a rebuild. The APK installed now has it.

## 3. How to test it

> ⚠️ **Never uninstall Tahak or clear its data** (no `adb uninstall`, no `pm clear`, no "Clear storage" in Android Settings). That deletes the 3.7 GB of model files (Qwen3.5-4B, its vision file and embeddinggemma) and the downloaded Destination Pack, and there's no copy of the model on the Mac. Test "fresh install" with `tahak://setup/reset`, never an uninstall. Reinstall only with `adb install -r`. If an install fails with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, stop. Don't uninstall to get past it.

Run everything from a Mac terminal with the phone (serial `R5CX728V0LN`) plugged in over USB. To mirror the phone on the Mac, run `scrcpy -s R5CX728V0LN`.

**Which code runs.** The installed APK was built from #12's branch at 05:12 on 2026-10-10. It has all the native code so far: MapLibre, `expo-location`, `expo-file-system`, `expo-notifications`, `expo-audio`, `expo-keep-awake`, llama.rn and `tahak-flare-native`. The JavaScript comes from Metro, so run Metro in the main checkout on `main`, which now has every Wave 2 PR.

**Photosensitivity:** the Flare strobes the screen at 2 Hz. Look away from it if flashing light bothers you.

### Before you start: Metro and launch

**Start:** online, USB connected, Metro not running.

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
- The model folder has three files: `Qwen3.5-4B-Q4_K_M.gguf` (2,740,937,888 bytes), `Qwen3.5-4B-mmproj-F16.gguf` (672,423,616 bytes) and `embeddinggemma-300M-Q8_0.gguf` (333,590,944 bytes).
- The branch is `main`.
- Terminal 1 logs `Android Bundled … index.ts`, and the app opens on Explore with no red error screen.

To relaunch cold later, use these commands (the "relaunch" in the items below):
```sh
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am force-stop com.tahak.app
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am start -a android.intent.action.VIEW -d "exp+tahak://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" com.tahak.app
```

To turn airplane mode on or off, and check it (`1` means on; Wi-Fi must be `0` for offline tests):
```sh
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell cmd connectivity airplane-mode enable
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell settings get global airplane_mode_on
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell settings get global wifi_on
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell cmd connectivity airplane-mode disable
```

### 1. First-launch setup, in English and Filipino

**Start:** online (Wi-Fi on), Metro running, app open, English.

1. Reset setup. This forgets only that setup was done. It deletes nothing:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am start -a android.intent.action.VIEW -d "tahak://setup/reset" com.tahak.app
   ```
2. Read the setup screen top to bottom. Don't tap **Done** yet.
3. Tap **Filipino** and read the screen again.
4. Tap **Tapos na**.
5. Relaunch cold.
6. Tap the cog and switch back to **English**.

**Expected:**
- **Step 1:** the app reloads into the setup screen instead of the tabs.
- **Step 2:**
  - "Welcome to Tahak" and "Set up once, while you have signal. After this, Tahak works on the trail with no signal."
  - **Language:** English selected.
  - **Permissions:** Location and Notifications each say "Allowed" (they were granted before).
  - **The Assistant:** "About 3.7 GB. Wi-Fi recommended." with a full bar and "The Assistant model is ready." Nothing downloads, because the files are already on the phone.
  - A large olive **Done** button.
- **Step 3:** the whole screen switches to Filipino at once: "Maligayang pagdating sa Tahak", "Wika", "Mga pahintulot", "Pinayagan", "Mga 3.7 GB. Mas mabuti kung naka-Wi-Fi.", "Handa na ang model ng Assistant." and **Tapos na**.
- **Step 4:** the tabs appear in Filipino (Tuklasin, Akyat, Magtanong, Mga gabay).
- **Step 5:** no setup screen. The app opens on the tabs, still in Filipino.
- **If the bar shows "About 3.7 GB" with a Download button instead,** a model file is missing or the wrong size. Don't tap Download on mobile data. Run the `ls -l` command from "Before you start" and report the sizes.
- **Not testable here:** a real 3.7 GB download from scratch. The resume logic was tested with a 165 MB test download (`tahak://setup/test-download?fresh=1`), which writes to a separate `assistant-models-test/` folder and never touches the real model.

### 2. The Guide Library offline, and a Guide by deep link

**Start:** airplane mode with Wi-Fi off, Metro running, English, Day theme.

1. Relaunch cold. Open the **Guides** tab and scroll the whole list.
2. Tap **Snakebite** and scroll to the bottom. Tap **All Guides**.
3. Open **Pitching a tent** (an ordinary Guide), then go back.
4. Go to the **Hike** tab, then open a Guide by deep link:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am start -a android.intent.action.VIEW -d "tahak://guides/dehydration" com.tahak.app
   ```
5. Tap the cog, choose **Filipino**, and open **Kagat ng ahas**. Then choose **Night** and look at the list. Switch back to **English** and **Day**.

**Expected:**
- **Step 1:** 15 Guides under three headings: **Injury and illness** (9), **Hazards** (4) and **Camp skills** (2). The 10 Emergency Guides have a red icon on a blush tile. The 5 ordinary ones (insect stings, leech bites, blisters, pitching a tent, purifying water) have an olive tile. There are no red fills, rows or text. Nothing waits on the network.
- **Step 2:** the Snakebite Guide shows its summary, **Call for help** (911 and Red Cross 143), numbered **What to do** steps, **Do not**, **Watch for**, **Sources**, and the amber note "Not yet checked against Red Cross material". The body text is large and easy to read.
- **Step 3:** the same layout, with an olive icon instead of the red one.
- **Step 4:** the app switches from Hike to the Guides tab and opens **Dehydration**. Its summary starts with the action (one of the four reordered summaries). Read the ORS step and compare it with the #11 checklist: this is the top item for the Red Cross check.
- **Step 5:** "Kagat ng ahas" is in Filipino throughout. At night the page is true black, with light text, and the blush tiles turn dark (`#3B2220`).

### 3. The Flare from every tab

**Start:** airplane mode, Metro running, English, Day theme, no Hike running. Media volume at a known level.

1. Note the media volume, and clear logcat:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell cmd media_session volume --stream 3 --get
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN logcat -c
   ```
2. On **Explore**, tap **SOS** at the top right. On the Flare screen, **tap** the hold button once, quickly.
3. Now **press and hold** the button until the bar fills (1.5 s), then let go.
4. While it runs, check the torch and the volume:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell dumpsys media.camera | grep -i torch
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell cmd media_session volume --stream 3 --get
   ```
5. Tap **Snakebite** under Emergency Guides. Look at the header, then go back to the Flare screen through **SOS**.
6. Tap **Stop Flare**. Run the step 1 volume command again.
7. Repeat steps 2, 3 and 6 from **Hike**, **Ask** and **Guides**. On one of them, end the Flare with the phone's **Back** gesture instead of Stop Flare.

**Expected:**
- **Step 2:** the Flare screen opens, with the intro text, the hold button, five Emergency Guide links and the 911 button. The tap shows "Press and hold until the bar fills. A tap does nothing." No light, no sound, no strobe.
- **Step 3:** the Flare fires:
  - **Flashlight:** blinks short-short-short, long-long-long, short-short-short, then a pause, over and over.
  - **Screen:** strobes white and red, about twice a second, at full brightness, and the **Stop Flare** panel stays readable.
  - **Sound:** a loud whistle, even with the ringer muted. **Check by ear.** This hasn't been verified by a person.
  - **SOS control:** solid red with white text.
- **Step 4:** the torch lines show it switching on and off, and the volume is `15`.
- **Step 5:** the Guide opens while the Flare keeps going (the torch still blinks), and the SOS control is still red.
- **Step 6:** everything stops. The SOS control is neutral again (red icon on a neutral pill), and the volume is back to the step 1 value. This prints `torch pattern start: 250,250,…`, `torch pattern stop` and `media volume restored to <step 1 value>`:
  ```sh
  ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN logcat -d | grep -E "torch pattern|media volume"
  ```
- **Step 7:** the same on every tab. Back stops the Flare just like Stop Flare.
- **911:** don't tap it during testing. It opens the dialer with 911 ready.

### 4. The Assistant offline

**Start:** airplane mode with Wi-Fi off, Batulao pack version 2 downloaded, Metro running, English, no Hike running, phone cool. Check the temperature first and wait for `Thermal Status: 0`:
```sh
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell dumpsys thermalservice | grep -m1 "Thermal Status"
```

1. In terminal 3, watch the Assistant's log:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN logcat -c
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN logcat -v time -s TAHAK_ASSISTANT:I TAHAK_ASSISTANT_BENCH:I
   ```
2. Relaunch cold. Open **Ask** and ask `Is there water on the Batulao trail?`
3. Tap the **Mt. Batulao · Water** chip, read the sheet, and close it.
4. Ask `Write me a poem`.
5. Tap the cog and choose **Filipino**. Ask `May tubig ba sa trail ng Batulao?` and tap its chip.
6. Still in Filipino, ask a Taglish question: `Paano pumunta sa jump-off ng Batulao kung magko-commute?`
7. **The benchmark.** Let the phone cool again. Then run all 32 test questions through the full pipeline:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am start -a android.intent.action.VIEW -d "tahak://assistant/bench?mode=full" com.tahak.app
   ```
   It takes about 10–15 minutes, because 22 questions run the model. For a quick run, pick questions by id (`&` needs the outer quotes):
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell 'am start -a android.intent.action.VIEW -d "tahak://assistant/bench?mode=full&ids=bat-water-en,bat-water-tl,off-poem-en" com.tahak.app'
   ```
8. Switch back to **English**.

**Expected:**
- **Step 2:** "Answering…", then an answer of up to three sentences saying there's no reliable water on the trail, that OpenStreetMap marks two springs near Camp 1, and to filter and disinfect. Under it, **Sources** with a peach **Mt. Batulao · Water** chip. The first token can take 6–37 s. The log line has `"verdict":"answer"`, `"llm_ran":true` and `"sources":["pack:batulao-water-…"]`.
- **Step 3:** a sheet with the passage, its "Source: …" line and its as-of date.
- **Step 4:** within about 1.5 s, the fixed reply "I can only help with hiking and camping, outdoor first aid, gear, …". No chips. The log has `"verdict":"off-topic-gate"` and `"llm_ran":false`.
- **Step 5:** an answer in Filipino with some English words, for example "Walang reliable na tubig sa Batulao trail, kaya siguraduhin mong may 3 liters per person ka…", with a **Mt. Batulao · Tubig** chip. It may sound awkward (known).
- **Step 6:** a Taglish answer about getting to the jump-off, with a Mt. Batulao chip for getting there.
- **Step 7:** `TAHAK_ASSISTANT_BENCH` prints, in order:
  - a `start` line with `"mode":"full"`, `"threshold":0.4`, `"questions":32` and `"airplane_mode":true`;
  - an `index` line with `"parts":{"help":32,"guides":149,"pack-batulao":28}`;
  - a `q` line per question, with `verdict`, `correct`, `best` (the gate score), `llm_ran`, `ttft_ms` and `gen_tps`, and `a` lines with the answer text;
  - a final `summary` line. **The result to check:** `"in_scope_refused":0` and `"off_topic_passed":0`. `refused_ids` and `passed_ids` name any failures. Also note `mean_ttft_ms` (expect 10,000–25,000) and `peak_pss_kb` (about 5,000,000).
  - A full 32-question run hasn't been done in one go yet, so record the summary line.
- **If an answer takes over a minute or speed falls to 2–3 tok/s,** the phone is hot. Let it cool and retry.

### 5. Emergency routing in the chat

**Start:** airplane mode, pack downloaded, Metro running, English, Ask tab open, terminal 3 still showing the `TAHAK_ASSISTANT` log.

1. Ask `My friend got bitten by a snake what do we do`.
2. Tap **Open Guide** on the card.
3. Go back to **Ask** and type `help!`.
4. Ask an ordinary question: `Is there water on Batulao?`
5. Ask an edge case: `How do I use the Flare?`
6. Switch to **Filipino**. Ask `nakagat ng ahas yung kasama ko`, then `tulong po`. Switch back to **English**.

**Expected:**
- **Step 1:** at once, with no "Answering…": the **Snakebite** card. It has a red snake icon on a blush tile, "Emergency Guide", the title, two lines of the Guide's own summary ("Keep the person calm and still, keep the bitten limb still, and get them to a hospital fast…"), **Open Guide** and **Call 911**. The card is on the normal white surface, with no red fill. The log has `"verdict":"emergency","guide":"snakebite","llm_ran":false`.
- **Step 2:** the Guides tab opens on Snakebite.
- **Step 3:** the **"Need help now?"** card: "If anyone is in danger, call 911 as soon as you have signal.", **Call 911**, "No signal? Tap SOS at the top of the screen, then press and hold to fire the Flare.", and five Emergency Guide links. The log has `"verdict":"distress","llm_ran":false`.
- **Step 4:** a normal answer, with "Answering…" first and a **Mt. Batulao · Water** chip.
- **Step 5:** a normal answer from app help (an olive chip), not an emergency card.
- **Step 6:** the **Kagat ng ahas** card in Filipino ("Pang-emergency na Guide", **Buksan ang Guide**, **Tumawag sa 911**), then **"Kailangan ng tulong ngayon?"**.
- **Known gaps:** chest pain, head injuries without bleeding and dog bites don't open a card. "What if I see a snake on the trail?" opens the Snakebite card on purpose.

### 6. Full core loop in airplane mode

This is the Wave 2 checkpoint in one run.

**Start:** airplane mode with Wi-Fi off, pack version 2 downloaded, Metro running, English, Day theme, no Hike running, media volume about two-thirds, phone cool.

1. Relaunch cold. On **Explore**, open **Mt. Batulao**. Check that it opens with "On your phone since …" and its Forecast card.
2. On **Hike**, choose **New Trail**, turn **Simulated walk** on, and tap **Start Hike**.
3. Tap **Go off the Trail** and wait about 70 s for the Deviation.
4. While the banner is up, open **Ask** and ask `Is there water on the Batulao trail?`
5. Ask `I'm lost and it's getting dark`.
6. Tap **SOS**, hold to fire the Flare for a few seconds, then tap **Stop Flare**.
7. Go back to **Hike**. When the banner clears, end the Hike:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am start -a android.intent.action.VIEW -d "tahak://hike/end" com.tahak.app
   ```

**Expected:**
- **Step 1:** the Destination with no download button. The Forecast card shows the saved days with "As of …".
- **Step 2:** the simulation bar, the map following the dot, and the bottom panel with the next Waypoint, the peach chip, the orange bar, and a Forecast chip.
- **Step 3:** the bar shows the real distance ("… m off the Trail"). Then the brick-red banner "Off the Trail · 60 m", the arrow, the dashed line, three vibrations, a beep and the "You're off the Trail" notification.
- **Step 4:** the Hike keeps running in the background, and the answer arrives with its chip.
- **Step 5:** the **Lost on the trail** Emergency Guide card, at once, with no model answer.
- **Step 6:** the Flare fires over the running Hike and stops cleanly.
- **Step 7:** the banner clears, the Hike ends and the Trail picker returns. No step needed the network.

### 7. Regression pass: Waves 0 and 1

**Start:** airplane mode, no Hike running, Metro running, Day theme, English, phone cool.

**A. App shell (Wave 0).**
1. Tap Explore, Hike, Ask and Guides.
2. Tap the cog. Choose **Night** and go through all four tabs. Then choose **Day**.
3. Choose **Filipino**, relaunch cold, and check the tabs. Switch back to English.

**Expected:**
- **Step 1:** only the tapped tab has the olive-tint pill with an orange icon. The SOS control (neutral, red icon) is at the top right on every tab. Guides shows the library, and Ask shows the chat (no more "Assistant spike").
- **Step 2:** true black pages with light text on all four tabs.
- **Step 3:** Tuklasin, Akyat, Magtanong, Mga gabay, still Filipino after the relaunch.
- **Red is for danger only:** the only red is the SOS icon, Emergency Guide icons and, when active, the Flare and the Deviation banner.

**B. The offline map (Wave 1).**
1. Open **Hike** and wait for the map. Pinch and zoom over the Trails.

**Expected:** both Trails as trail-orange lines over a dark outline, Waypoint icons by type (blue drops for water), muted place names, and "© OpenStreetMap contributors · © Protomaps" at the bottom left. No MapLibre `http` lines in logcat.

**C. Hike and Deviation by simulated walk (Wave 1 checkpoint).**
1. Start a simulated Hike on **New Trail** at 15×. Watch the first minute (the short excursion), then about 3 minutes in (the long one).
2. Tap **Switch to 60×** and let it reach the top and come back down. Tap **End Hike** on the "You're back near the jump-off" card.

**Expected:**
- **The short excursion:** the bar briefly shows about "30 m off the Trail" (the real distance, rounded to 10 m), and no banner, vibration, sound or notification.
- **The long excursion:** "60 m off the Trail", and a Deviation fires once (brief at 15×). When it clears, the bar goes back to "Not your real position." This replaces Wave 1's known "Scripted: 47 m" issue.
- **The walk:** "You've reached the end of the Trail", then "Back to the jump-off · N%", then the end card. The Hike ends and the Trail picker returns.

When you're done, turn airplane mode off:
```sh
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell cmd connectivity airplane-mode disable
```
