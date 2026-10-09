# Wave 0 report: spike and skeleton

Checkpoint: **go/no-go on the model.** Result: **go with Qwen3.5-4B on the CPU** (decided 2026-10-10, see [plan.md, Wave 0 checkpoint](../plan.md#wave-0-checkpoint-model-gono-go)).

## 1. What was built

**App shell ([#1](https://github.com/jomcas/jajj-app-builders-2k26/issues/1), closed).** The hiker opens Tahak and sees four bottom tabs: Explore, Hike, Ask and Guides. The active tab has an olive-tint pill with an orange icon. The SOS control sits at the top right of the header on every tab, as a neutral button with a red icon. It does nothing yet. A settings sheet (the cog next to SOS) switches between the Day and Night themes and between English and Filipino. Both choices apply at once and are still set after a relaunch. Explore, Hike and Guides show the "Nothing here yet" empty state. Behind the shell is the Feature Module registry: a module is one folder plus one line in `registry.ts`, and a module with no tab (the future Flare) can also register. Testing on the Flip 6 found a bug where the pill had square corners on Android, and `4f25f63` fixes it.

**Model spike ([#2](https://github.com/jomcas/jajj-app-builders-2k26/issues/2), closed).** The Ask tab holds a test screen called "Assistant spike". It is not the real chat. With the phone in airplane mode, the hiker loads the model, types a question and gets an answer that streams in, generated on the phone. They can also take a photo and ask about it. A benchmark started over adb runs the same steps and logs the numbers. The human decided at the gate:

- **Go with Qwen3.5-4B Q4_K_M on the CPU** (6 threads, mmap off, n_ctx 4096).
- **Assistant answers follow the UI language:** English by default, Taglish when the UI is in Filipino. Hikers can ask in English, Filipino or Taglish either way.

| Qwen3.5-4B Q4_K_M, CPU, 6 threads | Result (from the plan's checkpoint table) |
|---|---|
| Load | model 5.7 s, vision file 0.7 s |
| Taglish question (245 prompt tokens) | first token 5.0 s, then 11.2 tok/s; prompt 49 tok/s |
| Bundled photo, 574×768 (683 prompt tokens) | first token 92 s, then 6.6 tok/s; 53 s when capped at 256 image tokens |
| Camera photo, full size (972 image tokens, warm phone) | first token 219 s, then 3.9 tok/s |
| Peak memory | 4.7 GB PSS with mmap off (6.3 GB with mmap on) |
| GPU (OpenCL, Adreno 750) | killed for memory at 6.2–6.5 GB PSS in all three tries |
| Bonsai 27B | not tried: dropped by the human for disk space |

**This report ([#3](https://github.com/jomcas/jajj-app-builders-2k26/issues/3)).**

**Cut or deferred**

- **Supabase schema** and **shared types** were in the Wave 0 row of the plan but had no tickets, so they weren't built. They're needed before pack download in Wave 1.
- **[#13](https://github.com/jomcas/jajj-app-builders-2k26/issues/13) (first launch and model download):** the app must write the model files itself, because files from `adb push` can't be read by the app. The download is 2,740,937,888 + 672,423,616 bytes. Load the model with mmap off.
- **[#14](https://github.com/jomcas/jajj-app-builders-2k26/issues/14) (Assistant answers):** make the answer language follow the UI, add a Taglish style prompt with example answers, and render or strip markdown.
- **[#18](https://github.com/jomcas/jajj-app-builders-2k26/issues/18) (Vision):** photos are too slow. Downscale them or cap image tokens, try a Q8_0 vision file, and try putting only the vision file on the GPU.
- **GPU retry** on a later llama.rn. This has no ticket.
- **Bonsai 27B** was never tried.
- **#1 follow-ups:**
  - a home-tile field on `FeatureModule`;
  - a design for several modules sharing one tab;
  - the theme following sunrise and sunset (manual toggle only for now);
  - the first-launch screen (U6);
  - the Flare supplying the SOS action;
  - the app icon and splash screen.

## 2. How it was built

**Approach.** An orchestrator agent ran one sub-agent per ticket, each on its own branch (`wave-0/1-app-shell`, `wave-0/2-model-spike`). The human verified on the Flip 6 at the gates, and the branches were merged into `main` locally. `main` is 28 commits ahead of `origin/main` and isn't pushed yet. Each ticket passed lint, typecheck and tests (13 tests), plus a two-axis code review on #1.

**Key libraries.**
- Expo SDK 57 dev build, with React Native 0.86 and TypeScript.
- React Navigation bottom tabs.
- AsyncStorage for the theme and language settings.
- `expo-font` with Barlow and Barlow Condensed.
- `expo-image-picker` for the camera.
- `llama.rn` 0.13.0-rc.7.
- `tahak-diagnostics`, a small local Expo module in Kotlin. It writes logcat lines, reads process memory (PSS, VmHWM), reports airplane mode, and gives the external files folder.

**Decisions and departures.**
- **React Navigation, not Expo Router.** In Expo Router the file system decides the screens, but Tahak's Feature Module registry ([ADR 0001](../adr/0001-feature-modules-and-assistant-tools.md)) has to decide what fills each tab. The shell in `src/shell/` owns the tabs, and modules plug in.
- **`android/` is generated by `npx expo prebuild` and isn't committed.** Native settings live in `app.config.js` and `plugins/`.
- **arm64-v8a only** (`plugins/withArm64Only.js`).
- **`llama.rn` 0.13.0-rc.7, a release candidate.** The latest stable release, 0.12.9, bundles a llama.cpp too old for `qwen35`. rc.7 builds llama.cpp from source, by default once for each of 8 CPU variants. `plugins/withLlamaRnVariants.js` limits it to the 2 variants the Flip 6 loads.
- **mmap off.** It saves about 1.65 GB at the same speed (4.7 GB instead of 6.3 GB).
- **The CPU device is named explicitly.** Otherwise llama.rn picks OpenCL even with 0 layers offloaded.
- **The model files were copied onto the phone as the app user** (`adb shell run-as com.tahak.app cp …`) into `files/assistant-models/`. Files from `adb push` are owned by the shell user, and the app gets "Permission denied" when it opens them. The real fix is in #13.
- **The Mac's low disk space shaped decisions.** It had 11 GB free at the end of the wave. A guard script stopped Gradle below 2 GB free. That pressure is why the build is arm64 only with 2 llama.rn variants, why Bonsai 27B was dropped, and why no copy of the model is kept on the Mac.
- **A departure from the plan's wording:** the Wave 0 row asked for a "Taglish answer". The gate changed the target to English by default, with Taglish only for the Filipino UI (plan → Constraints).

**Known limits and shortcuts.**
- **Dev build only.** The JS bundle comes from Metro over USB (`adb reverse`), so with no Metro the app opens on the dev launcher. There's no standalone APK until Wave 5.
- **Photos are slow.** Expect minutes per photo.
- **Heat throttling.** Speed drops from about 11 to about 7 tok/s once the phone is warm.
- **Taglish is stiff:** formal Filipino with some wrong phrasing.
- **Answers contain raw `**markdown**`.**
- **The spike's prompt still mirrors the hiker's language.** The UI-language rule isn't built yet (#14).
- **The trail notes are SAMPLE data, not real Batulao facts.**
- **"Load on GPU" gets the app killed.**
- **The phone holds a second, leftover 3.4 GB copy of the model** in `files/models/`. The app reads only `files/assistant-models/`.

## 3. How to test it

> ⚠️ **Never uninstall Tahak or clear its data** (no `adb uninstall`, no `pm clear`, no "Clear storage" in Android Settings). That deletes the 3.4 GB model files from the phone, and there's no copy on the Mac. Reinstall only with `adb install -r`. If an install fails with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, stop. Don't uninstall to get past it.

Run everything from a Mac terminal with the phone (serial `R5CX728V0LN`) plugged in over USB. To mirror the phone on the Mac, run `scrcpy -s R5CX728V0LN`.

### 1. Confirm the build is installed, start Metro and launch

**Start:** online or airplane mode (either works), USB connected, Metro not running, model not loaded.

1. Check that the app is installed:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell pm list packages com.tahak.app
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell dumpsys package com.tahak.app | grep lastUpdateTime
   ```
   Only if it's missing, install the APK. `-r` keeps the app's data:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN install -r /Users/nariesss/Personal/jajj-app-builders-2k26/apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
   ```
2. In terminal 1, start Metro and leave it running:
   ```sh
   cd /Users/nariesss/Personal/jajj-app-builders-2k26/apps/mobile && npx expo start --dev-client
   ```
3. In terminal 2, forward the port and open the dev build on Metro:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN reverse tcp:8081 tcp:8081
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am start -a android.intent.action.VIEW -d "exp+tahak://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" com.tahak.app
   ```

**Expected:**
- Step 1 prints `package:com.tahak.app` and `lastUpdateTime=2026-10-10 00:34:36`. That APK has all the native code: every commit after it changed only JS, which Metro serves, so there's no need to rebuild.
- Terminal 1 logs `Android Bundled … index.ts`.
- The app opens on Explore, with no red error screen.

### 2. Four tabs, the active pill and the SOS control

**Start:** state after item 1 (Metro running, app on Explore, Day theme, English).

1. Tap Explore, Hike, Ask and Guides, in that order.
2. On each tab, look at the tab bar and the header.

**Expected:**
- **Tab bar:** only the tapped tab has the olive-tint pill with an orange icon, and the pill has rounded corners on all four tabs, not only the first.
- **Header:** the tab name is the title, in Barlow Condensed. A cog and the SOS control sit at the top right: a neutral, outlined pill with a red icon and red "SOS". Tapping SOS does nothing.
- **Content:** Explore, Hike and Guides show "Nothing here yet". Ask shows "Assistant spike".

### 3. Day and night

**Start:** any tab, Day theme.

1. Tap the cog. Under Theme, tap **Night**, then tap **Close**.
2. Switch through all four tabs.
3. Open the cog again, tap **Day**, then tap **Close**.

**Expected:**
- **Night:** the page is true black (not dark green), the text is light, the SOS icon is a lighter red (`#FF8A80`) and the active tab pill is dark olive. All four tabs and the settings sheet follow the theme.
- **Day:** everything returns to the cream page.

### 4. Language, and that it survives a relaunch

**Start:** any tab, English.

1. Tap the cog. Under Language, tap **Filipino**, then tap **Isara**.
2. Check every screen:
   - **Tabs:** Tuklasin, Akyat, Magtanong, Mga gabay.
   - **Header titles:** the same as the tabs.
   - **Empty state:** "Wala pang laman dito".
   - **Settings sheet:** Mga setting, Tema, Araw/Gabi, Wika, Ingles/Filipino, Isara.
   - **Ask tab:** "Spike ng Assistant", I-load sa CPU, I-load sa GPU, Kumuha ng litrato, Ipadala.
3. Relaunch the app cold:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am force-stop com.tahak.app
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am start -a android.intent.action.VIEW -d "exp+tahak://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081" com.tahak.app
   ```
4. Switch back to English, and set the theme to Night. Relaunch again with the step 3 commands.

**Expected:**
- No English string is left in Filipino mode. "SOS" stays "SOS" in both languages.
- After step 3 the app is still in Filipino.
- After step 4 the app is in English with the Night theme.
- Set it back to Day and English before item 5.

### 5. Reproduce the model spike numbers (benchmark)

**Start:** **airplane mode**, USB connected, Metro running, model not loaded (a fresh launch), phone cool (off the charger for a while and not just after a run).

1. Turn on airplane mode, and check that Wi-Fi is off too:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell cmd connectivity airplane-mode enable
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell settings get global airplane_mode_on
   ```
   This should print `1`, and the status bar should show the plane with no Wi-Fi icon. If Wi-Fi came back on, turn it off in quick settings. adb and Metro keep working over USB.
2. Check that the phone is cool:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell dumpsys thermalservice | grep -m1 "Thermal Status"
   ```
   Wait until it prints `Thermal Status: 0`.
3. Relaunch the app on Metro with the item 4 step 3 commands, and wait for Explore to appear.
4. In terminal 3, clear logcat and watch the benchmark tag:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN logcat -c
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN logcat -v time -s TAHAK_BENCH:I
   ```
5. In terminal 2, start the benchmark. It defaults to the CPU and 6 threads:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell am start -a android.intent.action.VIEW -d "tahak://spike/bench?backend=cpu" com.tahak.app
   ```
6. Wait about 2–3 minutes for the `"type":"done"` line. On the Ask tab you can follow "Benchmark running: step n of 3".
7. Optional: test the 256-token photo cap. Let the phone cool, relaunch (step 3), then run:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell 'am start -a android.intent.action.VIEW -d "tahak://spike/bench?backend=cpu&image_tokens=256" com.tahak.app'
   ```

**Expected:** a `start` line with `"airplane_mode":true`, then one `result` line, two or more `answer` lines and a `done` line. In the `result` line, `"backend":"cpu"`, `"n_gpu_layers":0` and `"gpu_in_use":false`. The other fields should be close to the checkpoint table:

| Field in the `result` line | Checkpoint value |
|---|---|
| `model_load_ms` / `mmproj_load_ms` | model 5.7 s / vision file 0.7 s |
| `taglish.prompt_tokens`, `taglish.ttft_ms` | 245 tokens, first token 5.0 s |
| `taglish.gen_tps` / `taglish.prompt_tps` | 11.2 tok/s / 49 tok/s |
| `photo.prompt_tokens`, `photo.ttft_ms` | 683 tokens, first token 92 s |
| `photo.gen_tps` | 6.6 tok/s |
| `peak_pss_kb` | about 4.7 GB (≈ 4,700,000 kB) |
| step 7 only: `"image_max_tokens":256`, `photo.ttft_ms` | about 53 s |

- **If `taglish.gen_tps` is near 7:** the phone was warm (plan: about 11 drops to about 7). Let it cool and rerun.
- **The `answer` lines:** the Taglish answer says there is water at Camp 2 (a spring about 50 m below, boil or filter it) and the summit is about 1.2 km away. The photo answer describes a mountain trail.
- **Never run `backend=gpu`.** It gets the app killed for memory.

### 6. Ask interactively: Load on CPU, a typed question, a photo question

**Start:** **airplane mode**, USB connected, Metro running, model not loaded (relaunch with the item 4 step 3 commands), English UI.

1. Open the **Ask** tab and tap **Load on CPU**. Don't tap "Load on GPU".
2. Type `May tubig ba sa Camp 2? Gaano kalayo pa ang summit?` and tap **Send**.
3. Tap **Take photo**. Allow the camera, take a photo of anything, and confirm it.
4. Type `Describe this photo for a hiker` and tap **Send**. Leave the phone alone.

**Expected:**
- **Step 1:** the status goes through "Loading the model… n%" and "Loading the vision file…" to "Model ready on the CPU (6 threads)", with load times near model 5.7 s and vision file 0.7 s.
- **Step 2:** the answer streams in, with the right Camp 2 facts. The speed line shows about 11 tokens/s and a first token after about 5 s.
  - It answers in Taglish because the question is Taglish: the spike mirrors the question's language, not the UI.
  - The Taglish is stiff, and raw `**` markdown is visible. Both are known.
- **Step 3:** a thumbnail and "Photo attached to your next question" appear.
- **Step 4:** "Answering…" shows for **minutes**. The checkpoint was 219 s to the first token for a full-size camera photo on a warm phone, then 3.9 tok/s. Then a description of the photo appears. A wait of several minutes is expected, not a hang.

### 7. Regression pass: Wave −1 ("Prototype approved")

**Start:** any state from item 2, in Day and in Night.

Check that the app still matches the settled Wave −1 decisions:
1. **Tab pill:** olive-tint pill with an orange icon on the active tab only (U2).
2. **SOS placement:** fixed at the top right of the header on every tab, never floating over content, and clear of the Ask input (U2).
3. **Red is for danger only:** the SOS icon and text are the only red on screen in both themes ([ADR 0004](../adr/0004-red-means-danger-only.md)). Buttons are olive, not orange or red.
4. **Fonts:** headings and titles in Barlow Condensed, body text in Barlow, in sentence case.

**Expected:** all four hold on all four tabs, in both themes.

When you're done, turn airplane mode off:
```sh
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell cmd connectivity airplane-mode disable
```
