# Airplane-mode run-through checklist (Wave 5 freeze, #26)

The full run-through for the freeze: every step of the core loop from [docs/plan.md](../plan.md), then every feature from Waves 2–4, all on the Samsung Galaxy Z Flip 6 in **airplane mode with Wi-Fi off**. Vocabulary follows [CONTEXT.md](../../CONTEXT.md). Each check has an expected result; tick it, or write down what happened and fix it before the demo.

The [demo script](demo-script.md) uses the same steps. The last section is the **"Before you go on stage"** list.

## Ground rules

> ⚠️ **Never uninstall Tahak and never clear its data** (no `adb uninstall`, no `pm clear`, no "Clear storage" in Android Settings). That deletes the 3.4 GB of model files (Qwen3.5-4B, its Q8_0 vision file and embeddinggemma) and every downloaded Destination Pack, and there's no copy of the models on the Mac. Reinstall only with `adb install -r`. If an install fails with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, **stop**: don't uninstall to get past it.

- **Which build.** Run this checklist on the **release APK**, the build that goes on stage. Building and installing it is a separate step done by the orchestrator. The release APK has no dev menu, no LogBox and doesn't need Metro.
- **Dev-only deep links don't work in the release APK:** `tahak://setup/reset`, the `tahak://setup/…` download links and `tahak://emergency/preview/…`. Check first launch (C1) on the dev build *before* the release APK goes on, or skip it. The Hike's deep links (`tahak://hike/simulate…`, `tahak://hike/end`) are not dev-only.
- **Airplane mode on this phone leaves Wi-Fi on.** Turn Wi-Fi off in quick settings every time, and check it.
- **Photosensitivity:** the Flare strobes the screen at 2 Hz.
- **adb** below means `~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN`. The phone is plugged in over USB for the checks; on stage it doesn't have to be.

### Going offline, and checking it

```sh
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell cmd connectivity airplane-mode enable
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell cmd wifi set-wifi-enabled disabled
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell settings get global airplane_mode_on   # 1
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell settings get global wifi_on            # 0
```

The status bar shows the plane and **no Wi-Fi icon**. Bluetooth may stay on (or be turned back on) for the watch: it isn't the internet.

### Is the phone cool?

```sh
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell dumpsys thermalservice | grep -m1 "Thermal Status"
```

Wait for `Thermal Status: 0` before any Assistant or photo check. A hot phone drops from about 7–10 to 2–3 tokens/s.

---

## A. Setup before the run-through (online)

| # | Check | Expected |
|---|---|---|
| A1 | The release APK is installed over the existing app with `adb install -r` (orchestrator). | `Success`. Tahak opens straight to the tabs, not the setup screen, and the Ask tab shows the chat, not a download bar: the model files survived. |
| A2 | Online, **Explore** lists the live Destinations. | Mt. Batulao, Mt. Ulap and Mt. Pulag. |
| A3 | Mt. Batulao is downloaded at pack version 2. Open it. | "On your phone since … · 1.5 MB" and no download button. Trails: New Trail 3.4 km, Old Trail 4.2 km. 14 reference passages. A Forecast card with "As of …". |
| A4 | Every Destination you might show is downloaded, and has a fresh Forecast (wait a minute on each Destination screen while online). | Each one has the cloud-off icon and "As of just now" (or a few minutes ago). |
| A5 | Put the demo photos in the phone's gallery: a plant, a non-outdoor photo (a wall, a laptop), a snake picture and a wound picture. | All four are in the gallery. |
| A6 | Pair the watch, and allow Tahak's notifications on it (Galaxy Wearable → Notifications). | Tahak is allowed on the watch. |

## B. The core loop in airplane mode

**Start:** go offline (above), phone cool, English, Day theme, no Hike running, media volume about two-thirds. Relaunch Tahak cold (swipe it away, then open it).

| # | Core loop step | Check | Expected |
|---|---|---|---|
| B1 | 1. Download the Mt. Batulao pack | **Explore** → **Mt. Batulao**. | "You're offline. Showing the Destinations on your phone." The Destination opens with no download button, "On your phone since … · 1.5 MB", both Trails, the Waypoints grouped by Trail, the 14 passages, and the Forecast card with its age. No endless spinner. |
| B2 | 2. Offline map | **Hike**. On the "Choose a Trail" card, pick **Mt. Batulao** in the Destination switcher (#52). Pinch and zoom over the Trails. Switch to **Night** and back. | The map fills the screen, fitted on Batulao's two Trails: orange lines over a dark outline, a boot at the jump-off, tents at Peak 8 campsite and Camp 1, blue drops at the two springs, a flag at the summit, muted place names, and "© OpenStreetMap contributors · © Protomaps". Night: dark basemap, lighter orange line, true black page. **Without #52:** the Hike tab shows the last Destination downloaded; write down which. |
| B3 | 2. Your GPS position | Tap **re-center**. | The blue GPS dot at your real position (outside the Batulao map, on a plain background), or "No GPS position yet. Stay where you can see the sky, then try again." Either is fine indoors. |
| B4 | 3. Start a Hike | **New Trail** → **Simulated walk** on → **Start Hike**. | The simulation bar: "Simulated walk · 15×", "Not your real position.", **Switch to 60×**, **Go off the Trail**. The map follows the dot. The panel: "Hike on New Trail", "Next Waypoint · Campsite", Peak 8 campsite with an orange ring, a peach chip with about 2.5 km and an ETA, an orange "Up the Trail · N%" bar, a Forecast chip, and End Hike. |
| B5 | 3. The short excursion does nothing | Watch about the first 70 s at 15×. | The bar briefly shows about "30 m off the Trail". No banner, vibration, sound or notification. |
| B6 | 3. Deviation alert | Tap **Go off the Trail**, eyes on the screen. | About 5 s later: the brick-red banner "Off the Trail · 60 m", "The Trail is to the <direction>. Head back the way the arrow points." with an arrow, the line turns dashed, three long vibrations, a short beep (check by ear), and a heads-up "You're off the Trail" notification. The watch buzzes with the same text. About 4 s later it all clears and the bar goes back to "Not your real position." |
| B7 | 4. Assistant, English | While the Hike runs, **Ask** → `Is there water on the Batulao trail?` | "Answering…", then up to three sentences: no reliable water on the trail, two springs near Camp 1, filter and disinfect. A peach **Mt. Batulao · Water** chip. First words within 6–37 s; **write down the time**. |
| B8 | 4. Source chip | Tap the chip. | A sheet with the passage, its "Source: …" line and its as-of date. |
| B9 | 4. Assistant, Filipino UI | Cog → **Filipino**. Ask `May tubig ba sa trail ng Batulao?`, then `Paano pumunta sa jump-off ng Batulao kung magko-commute?` | Taglish answers (they may sound stiff), with **Mt. Batulao · Tubig** and a getting-there chip. **Write down the first answer's time**: the first question in a language is the slow one. Switch back to **English**. |
| B10 | 4. Off-topic | `Write me a poem`. | Within about 1.5 s, the fixed reply "I can only help with hiking and camping, outdoor first aid, gear, …", with no chips. |
| B11 | 5. Emergency → Guide | `nakagat ng ahas yung kasama ko`. | At once, no "Answering…": the **Snakebite** Emergency Guide card, with the red icon on a blush tile, two lines of summary, **Open Guide** and **Call 911**. No red fill. |
| B12 | 5. The Guide | Tap **Open Guide**. | The Guides tab on Snakebite: summary, Call for help, What to do, Do not, Watch for, Sources, and the amber "Not yet checked against Red Cross material" (unless #11 is done). |
| B13 | 5. Distress | Back to **Ask**, `help!`. | The "Need help now?" card: Call 911, "No signal? Tap SOS at the top of the screen, then press and hold to fire the Flare.", and five Emergency Guide links. |
| B14 | 6. Flare: a tap does nothing | Tap **SOS** (top right), then tap the hold button once. | The Flare screen. The tap shows "Press and hold until the bar fills. A tap does nothing." No light, no strobe, no sound. |
| B15 | 6. Fire the Flare | Press and hold for 1.5 s. | The flashlight blinks SOS (··· ––– ···), the screen strobes white and red about twice a second at full brightness, a loud whistle plays even with the ringer muted, and the SOS control is solid red ("SOS, Flare on"). The Hike keeps running underneath. |
| B16 | 6. Stop the Flare | **Stop Flare**. | Everything stops. The SOS control is neutral again, and the brightness and media volume are back to what they were. |
| B17 | End the Hike | **Hike** → **End Hike** → **End Hike** in "End this Hike?". | The Hike ends and the Trail picker returns. **No step in section B needed the network.** |

## C. Waves 2–4 features

**Start:** offline, phone cool, English, Day theme, no Hike running.

### Wave 2: setup, Guides, Flare, Assistant, emergencies

| # | Check | Expected |
|---|---|---|
| C1 | First launch. **Dev build only**, before the release APK goes on: `adb shell am start -a android.intent.action.VIEW -d "tahak://setup/reset" com.tahak.app`. Switch the language, check Location and Notifications, and look at the Assistant card. | "Welcome to Tahak". The language switches the screen at once. Location and Notifications show "Allowed". The Assistant card says "The Assistant model is ready." because the files are on the phone at their exact size. Nothing downloads. Then the tabs. **Skip on the release APK.** |
| C2 | **Guides** tab. Scroll the whole list. Open one Emergency Guide and one camp-skill Guide. | 15 Guides in three groups: Injury and illness, Hazards, Camp skills. The 10 Emergency Guides have a red icon on a blush tile, the others an olive tile. Each Guide reads summary → Call for help → What to do → Do not → Watch for → Sources, with the amber note. |
| C3 | Guides in Filipino: cog → **Filipino**, open Kagat ng ahas. Back to **English**. | The Guide in Filipino. |
| C4 | The Flare from every tab: fire it from **Explore**, **Hike**, **Ask** and **Guides** in turn. On one of them, end it with the **Back** gesture. | Same as B14–B16 on every tab. Back stops it just like Stop Flare. |
| C5 | Open an Emergency Guide from the Flare screen while the Flare runs. | The Guide opens and the Flare keeps going (torch still blinking, SOS still red). |
| C6 | Emergency phrasings: `My friend got bitten by a snake what do we do`, `I'm lost and it's getting dark`, `tulong po` (in the Filipino UI). | Snakebite card; Lost on the trail card; "Kailangan ng tulong ngayon?" card. All at once, no "Answering…". |
| C7 | Not an emergency: `How do I use the Flare?` | It opens the Flare screen idle (the tool, since Wave 3), not an emergency card. Back out of it. |
| C8 | Night theme, all four tabs. | True black pages with light text. The only red: the SOS icon and Emergency Guide icons. |

### Wave 3: Forecast, Vision, tools

| # | Check | Expected |
|---|---|---|
| C9 | Forecast offline: **Explore** → **Mt. Batulao** → the Forecast card. Tap **Update now**. | The saved days with "As of …" (an amber age tag if older than 12 hours). Days 3 and later dimmed and "Less reliable". Warnings are amber tags, never red. Update now: "Couldn't update. It updates by itself once you're back online." |
| C10 | Forecast on the Hike panel: start a simulated walk. | A Forecast chip under the progress bar, amber if today has a warning. Leave the Hike running for C14–C16. |
| C11 | Photo, read-ahead: **Ask** → camera → **Choose from gallery** → the plant. Don't type until "Reading the photo… n s" disappears. Then `what is this?` | The read takes about 15–25 s on a cool phone. After Send, the first words come in about 1–3 s. A hedged answer ("This looks like…"), never "safe to eat", and "From your photo · first words after N s". |
| C12 | Photo emergency: attach the snake picture and, while it's still reading, ask `nakagat ako ng ahas na ito`. Then the wound picture with `dumudugo ito, ano gagawin`. | The Snakebite card, then the Bleeding wounds card, each at once (about 0.1 s). |
| C13 | Off-topic photo: attach the wall or laptop photo, ask `what is this?` | After the model runs, the fixed reply "I can only help with photos from the trail or camp: …". |
| C14 | Distance tool, during the Hike: `How far to the next campsite?`, then `How far to the summit?` | A "From your Hike" card at once, for example "Peak 8 campsite (Campsite) is 1.9 km ahead along the Trail, about 52 min away." **The same distance and ETA as the Hike panel** (one step apart at most). If the walk has passed Peak 8, the campsite question has nothing ahead; the summit question still works. |
| C15 | Distance tool in Filipino: `Gaano kalayo pa ang summit?` Back to **English**. | "X km pa sa Trail ang … (Tuktok), mga N oras M minuto pa.", matching the panel. |
| C16 | Flare tool: `Help me signal`. Don't touch the hold button. Press **Back**. Then `We are lost, help me signal`. | The Flare screen opens **idle**, nothing fires, and the chat says "I opened the Flare. To signal, press and hold the red button for 1.5 seconds…". The second question opens the **Lost on the trail** card instead: an emergency beats a tool. |
| C17 | No Hike: end the Hike, then ask `How far to the next campsite?` | "Start a Hike first on the Hike tab (a simulated walk works too). Then I can tell you how far the next Waypoint is." |

### Wave 4: Destinations, the switcher, Group Alerts, Admin Portal

| # | Check | Expected |
|---|---|---|
| C18 | **Explore** offline: open **Mt. Ulap** and **Mt. Pulag** (if downloaded). | Each opens offline with its Trail, Waypoints, passages and Forecast. Pulag: the Ambangeg Trail (7.4 km) and 6 Waypoints. |
| C19 | Destination switcher (#52, if merged): on **Hike**, switch between the downloaded Destinations, then leave it on **Mt. Batulao**. Relaunch cold. | Each Destination's map and Trails appear. Write down whether Batulao is still selected after the relaunch. |
| C20 | A Pulag question: `How much is the registration fee for Mt. Pulag?` | An answer with peach Mt. Pulag chips. (Known: one fee answer showed 2 chips for 3 sources; #53.) |
| C21 | Group Hike "coming soon" (#24, if merged): the Solo / Group choice on the Hike tab. | Solo is the default. Group is visibly "coming soon". |
| C22 | Group Alerts (#24, if merged): start a simulated walk, add the simulated group member, wait for its Deviation, then its Flare. | The member is clearly labelled as simulated and shows as an olive dot with initials. Its Deviation shows an Alert within a few seconds: a banner, a notification (also on the watch), and the dot turning red with an icon and text. Its Flare shows an Alert with its position on the map. The dot is olive again once it's back. |
| C23 | Admin Portal, on the laptop **online**: `cd apps/admin && npm run dev`, open http://localhost:5174, log in with a team account. | The Destination list, not "Not a team account". (Needs the #21 migration applied and the team's emails in `team_members`.) |
| C24 | Admin Portal: open a Destination → Trails → upload a GPX file. | A dashed preview of the track on the map. **Don't save it** unless it's meant for real. |
| C25 | Admin Portal: open **Publish**. | "What changed since the last publish". **Don't publish** during the run-through: it writes to the live project that phones download from. |

## D. Record the fallbacks

Do these once the checks pass, on a cool phone, and copy each recording to the laptop too.

| # | Record | Used in |
|---|---|---|
| D1 | A screen recording of `Is there water on the Batulao trail?` with its answer, then a tap on the **Mt. Batulao · Water** chip. | Demo beat 5, if the model is slow. |
| D2 | A screen recording of the plant photo answer with its "first words after N s" line. | Demo beat 7, if the photo is slow. |
| D3 | Write down the times from B7, B9 and C11. | To know what "slow" means on the day. |

---

## Before you go on stage

Do this in the last 15 minutes, in this order, and don't touch the phone for anything else afterwards.

1. **Charged and cool.** Battery above 80%, unplugged, out of the sun and off the laptop. `Thermal Status: 0` (command above). If it's warm, wait: don't start the demo hot.
2. **Airplane mode, and Wi-Fi off.** The status bar shows the plane and no Wi-Fi icon. `airplane_mode_on` is `1` and `wifi_on` is `0`.
3. **Bluetooth on, and the watch paired and connected.** Airplane mode may have turned Bluetooth off; turn it back on in quick settings.
4. **Notifications on** for Tahak (Settings → Apps → Tahak → Notifications), and allowed on the watch.
5. **Do Not Disturb off**, so the Deviation's sound and heads-up notification come through:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell settings get global zen_mode   # 0
   ```
6. **Media volume up** (the Deviation beep and the Flare whistle use the media stream):
   ```sh
   ~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell cmd media_session volume --stream 3 --set 13
   ```
7. **The release APK is the one running.** No dev menu, no LogBox, no "Connect to Metro". (The release build is a separate step done by the orchestrator.)
8. **The Batulao pack is downloaded and selected on the Hike tab.** Hike → "Choose a Trail" shows Mt. Batulao with New Trail and Old Trail.
9. **No Hike running,** and no Flare.
10. **English, Day theme,** on the **Explore** tab.
11. **Warm the model, in both languages.** In **Ask**, send `What should I bring on a day hike?` and wait for the answer. Switch to **Filipino**, send `Ano ang dapat dalhin sa day hike?`, wait, and switch back to **English**. The first answer in each language is the slow one (up to 37 s); after this, expect about 6–10 s. **Don't swipe Tahak away afterwards**: a relaunch unloads the model.
12. **Check the temperature again** after warming. If it's above 0, let it rest on a cool surface.
13. **The demo photos** are in the gallery, and the fallback recordings (D1, D2) are on the phone and the laptop.
14. **Screen timeout** set long enough (5 minutes or more) so the phone doesn't lock mid-beat, and the mirroring (`scrcpy -s R5CX728V0LN`) is working if you use it.
15. **The Admin Portal** (only for the optional live beat) is running on the laptop, online, logged in, on the Destination list.

**Never uninstall Tahak, and never clear its data**, not even to "start fresh" before the demo.
