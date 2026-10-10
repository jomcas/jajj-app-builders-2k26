# Demo script: Tahak on stage (5–7 minutes)

One hiker's morning on Mt. Batulao, told live on the Samsung Galaxy Z Flip 6 in **airplane mode with Wi-Fi off**. Vocabulary follows [CONTEXT.md](../../CONTEXT.md). Run the [airplane-mode run-through checklist](runthrough-checklist.md) first, and do its "Before you go on stage" list in the last 15 minutes.

**Run it on the release APK.** It has no dev menu, no LogBox and no Metro, so the phone can leave the Mac. Building and installing it is a separate step done by the orchestrator. Never uninstall Tahak and never clear its data: that deletes the 3.4 GB of model files.

## At a glance

| # | Beat | Time | Optional? |
|---|---|---|---|
| 0 | Opening | 0:20 | |
| 1 | A downloaded Destination | 0:25 | |
| 2 | The offline map | 0:20 | |
| 3 | Start a Hike (simulated walk) | 0:30 | |
| 4 | A Deviation alert | 0:35 | |
| 5 | Ask the Assistant: English, then Taglish | 1:10 | The off-topic line is optional |
| 6 | An emergency question opens a Guide | 0:35 | "help!" is optional |
| 7 | A photo question | 0:45 | **Optional** |
| 8 | Tools: the distance, and "Help me signal" | 0:35 | |
| 9 | Fire the Flare | 0:30 | |
| 10 | A group member's Alert | 0:40 | **Optional**, and only if #24 has landed |
| 11 | What's next: Group Hike and the Admin Portal | 0:30 | The live Admin Portal is optional |

**Core path: about 5:30. With every optional beat: about 7:00.** If time runs short, cut in this order: 10, 7, the off-topic line in 5, "help!" in 6, the live Admin Portal in 11.

**Who holds what.** The presenter holds the phone, mirrored to the screen (`scrcpy` on the Mac, or the venue's camera). A second person, if there is one, watches the clock and holds the fallback recordings on the laptop.

**Photosensitivity.** Beat 9 strobes the screen white and red at 2 Hz. Say so before it fires.

---

## 0. Opening (0:20)

**Starting screen:** Explore, English, Day theme. The status bar shows the plane and no Wi-Fi icon.

**Say:**
> "Most Philippine trails have no signal, and that's exactly where a hiker needs help. This phone is in airplane mode, and Wi-Fi is off. Everything you'll see for the next six minutes runs on the phone itself: the map, the alerts, the first-aid Guides, and an AI model that answers in English or Taglish. This is Tahak."

**Tap:** pull down the quick settings for two seconds to show airplane mode on and Wi-Fi off, then close them.

## 1. A downloaded Destination (0:25)

**Tap:** **Explore** → **Mt. Batulao**. Scroll a little to the Forecast card.

**Point at:**
- "You're offline. Showing the Destinations on your phone." on the list;
- the grey cloud-off icon next to the title, and "On your phone since … · 1.5 MB";
- the Trails (New Trail 3.4 km, Old Trail 4.2 km) and the Forecast card with its "As of …" age.

**Say:**
> "At home, on Wi-Fi, I downloaded the Mt. Batulao Destination Pack: one and a half megabytes with the map, two Trails, the Waypoints, cited notes about water, fees and getting there, and a saved 7-day Forecast. Mt. Ulap and Mt. Pulag are live too."

## 2. The offline map (0:20)

**Tap:** the **Hike** tab. Check that the "Choose a Trail" card shows **Mt. Batulao** (with the Destination switcher, #52, choose it there). Pinch in once on the Trails.

**Point at:** the orange Trail line over its dark outline, the Waypoint icons (a boot at the jump-off, tents at the campsites, blue drops at the springs, a flag at the summit), and "© OpenStreetMap contributors · © Protomaps".

**Say:**
> "This map is a file on the phone, not tiles from the internet. Orange is always the Trail, blue is always water and the hiker's own position, and red means danger, nothing else."

## 3. Start a Hike, with the simulated walk (0:30)

**Tap:** **New Trail** → turn **Simulated walk** on → **Start Hike**.

**Point at:** the simulation bar ("Simulated walk · 15×", "Not your real position."), the map following the dot, and the panel: "Next Waypoint · Campsite", Peak 8 campsite with an orange ring, the peach distance and ETA chip, the orange progress bar and the Forecast chip.

**Say:**
> "We're indoors and a long way from Batulao, so a simulated walk drives the same screen that GPS does, fifteen times faster than walking. It's labelled, so nobody mistakes it for a real position."

**Fallback:** if Start Hike ever shows "Waiting for your GPS position…", Simulated walk wasn't on. Tap **End Hike** → **End Hike**, turn the switch on and start again. Never demo with real GPS indoors: the Hike would go straight into a Deviation kilometres from the Trail.

## 4. A Deviation alert (0:35)

**Know the timing first.** At 15×, the Deviation fires about **5 seconds** after the tap and the banner stays only about **4 seconds**. Have the audience looking at the phone *before* you tap.

**Say first:**
> "Now I'll wander off the Trail. Tahak warns you when you're more than 40 metres off it for more than 30 seconds. Watch the top of the screen."

**Tap:** **Go off the Trail** in the simulation bar.

**Point at:** the bar counting up ("… m off the Trail"), then the brick-red banner "Off the Trail · 60 m" with the arrow back to the Trail, the line turning dashed, three long vibrations, a beep, and the "You're off the Trail" notification. Raise the wrist: the paired watch buzzes with the same notification.

**Say:**
> "Vibration, a sound, a notification that reaches the watch, and an arrow pointing back. Red is never the only signal: the line also turns dashed and there's text, for colour-blind hikers and for glare."

**Fallbacks:**
- **You missed it:** tap **Go off the Trail** again and keep your eyes on the bar.
- **No beep:** the media volume is down. Carry on; the vibration and the banner are enough.
- **The watch stays quiet:** don't wait for it. Say "it mirrors to a paired watch" and move on.

**A slower option, if the Mac stays plugged in over USB.** Start the walk at real speed instead of beat 3's switch, so the Deviation lasts about a minute and can be narrated:
```sh
~/Library/Android/sdk/platform-tools/adb -s R5CX728V0LN shell 'am start -a android.intent.action.VIEW -d "tahak://hike/simulate?trail=batulao-new-trail&speed=1" com.tahak.app'
```
Then tap **Go off the Trail** at the start of beat 3's talk. The Deviation fires about 70 s later and clears about 65 s after that. At 1×, nothing else in the walk fires during the demo.

**Heads-up for the rest of the demo at 15×.** The walk keeps going while you're in the Ask tab:
- about **3 minutes** after Start Hike, the walk's own scripted long excursion fires a second Deviation (a beep and a vibration). If it happens mid-sentence, say "and there's the alert again" and carry on;
- about **3½ minutes** after Start Hike, the walk passes Peak 8 campsite, and the summit becomes the next Waypoint (beat 8 covers this).

## 5. Ask the Assistant: English, then Taglish (1:10)

The model was warmed before going on stage, in both languages (see the checklist), so the first answers take about 6–10 s instead of up to 37 s. Talk while it answers.

**Tap:** the **Ask** tab. Type `Is there water on the Batulao trail?` → **Send**.

**Say while "Answering…" shows:**
> "This is Qwen 3.5, a 4-billion-parameter model, running on the phone's CPU with no network. It first searches the Destination Pack and the Guide Library on the phone, then answers only from what it found."

**Point at:** the answer (no reliable water on the trail, two springs near Camp 1, filter and disinfect) and the peach **Mt. Batulao · Water** source chip. **Tap the chip:** the sheet shows the passage, its source and its as-of date. Close it.

> "Every answer shows where it came from. Tap the chip and you see the source."

**Tap:** the cog → **Filipino** → close. The tabs turn into Tuklasin, Akyat, Magtanong, Mga gabay. Type `May tubig ba sa trail ng Batulao?` → **Send**.

**Say:**
> "Hikers here don't all speak English. In the Filipino interface the same Assistant answers in Taglish."

**Point at:** the Taglish answer and the **Mt. Batulao · Tubig** chip.

**Tap:** the cog → **English** → close, ready for the next beat.

**Optional (0:10):** type `Write me a poem` → **Send**. The fixed reply "I can only help with hiking and camping, outdoor first aid, gear, …" appears in about 1.5 s.
> "It stays on topic, and that check runs in code before the model, so a small model can't be talked into wandering."

**Fallbacks:**
- **No first words after 20 s:** say "a cold phone answers in about ten seconds; under stage lights it slows down", and keep talking for 15 more seconds. If there's still nothing, show the **recorded source-chip answer** (a screen recording made during the run-through, kept in the phone's gallery and on the laptop) and move on to beat 6. Beat 6 doesn't need the model.
- **The Taglish answer sounds stiff:** that's known. Don't read it aloud word for word; point at the chip.
- **The chip count looks short** (one answer showed 2 chips for 3 sources): ignore it on stage.

## 6. An emergency question opens a Guide (0:35)

**Tap:** type `nakagat ng ahas yung kasama ko` → **Send**.

**Point at:** the **Snakebite** Emergency Guide card, at once with no "Answering…": the red snake icon on a blush tile, two lines of the Guide's own summary, **Open Guide** and **Call 911**.

**Say:**
> "'My friend got bitten by a snake', in Taglish. For an emergency, the AI doesn't write first aid at all. A small model can invent treatment steps, and that's the worst mistake this app could make. So code catches the emergency before the model runs and opens a written Guide instead. That's why it was instant."

**Tap:** **Open Guide**. Scroll once through What to do, Do not and Sources, and stop on the amber note.

**Say, honestly:**
> "All 15 Guides ship inside the app, in English and Filipino, drafted from the Red Cross's international first-aid guidelines. This amber note says they haven't been checked against Philippine Red Cross material by a person yet, and the app tells the hiker that instead of hiding it. That review is the first job after today."

(If #11 is done by demo time, drop the last two sentences and say "every Guide has been checked by a person against Philippine Red Cross material".)

**Optional (0:10):** back to **Ask**, type `help!` → **Send**. The "Need help now?" card: Call 911, how to fire the Flare from SOS, and five Emergency Guides.

**Fallback:** if the card doesn't appear, the router missed the phrasing (it's a word list, not the model). Type exactly `My friend got bitten by a snake what do we do`. Never improvise a new emergency phrasing on stage.

## 7. A photo question (0:45, optional)

**Before the demo:** a plant photo is in the phone's gallery (see the checklist).

**Tap:** the camera button → **Choose from gallery** → the plant photo. **Don't type yet.** "Reading the photo… n s" counts up.

**Say while it reads (about 24 s):**
> "The model can also see. While you're typing, it's already reading the photo, so the answer starts about two seconds after you send. Like everything else, the photo never leaves the phone. And the same safety rules hold: it never gives first aid from a photo, and it never tells you a wild plant is safe to eat."

**When the counter disappears, tap:** type `what is this?` → **Send**.

**Point at:** the hedged answer ("This looks like…") and the line under it, "From your photo · first words after 2 s" or so.

**Fallbacks:**
- **Running long:** skip the beat. Tap the photo's remove button and go on to beat 8.
- **The counter is still going after 40 s** (the phone is hot): send anyway and talk through the wait, or show the **recorded photo answer**.
- **A species name sounds wrong:** that's expected from a 4B model. Say "it hedges on purpose; never eat anything because an app said so."

## 8. Tools: the distance, and "Help me signal" (0:35)

**Glance at the Hike panel first** (or remember it from beat 4): if Peak 8 campsite is still the next Waypoint, ask about the campsite; if the walk has passed it, ask about the summit.

**Tap:** type `How far to the next campsite?` (or `How far to the summit?`) → **Send**.

**Point at:** the instant **"From your Hike"** card: "Peak 8 campsite (Campsite) is 1.9 km ahead along the Trail, about 52 min away" (your numbers will differ). Open **Hike** for one second to show the same numbers on the panel, then come back to **Ask**.

**Say:**
> "Features give the Assistant tools. This answer came from the Hike itself, not from the model, so it can't make up a number, and it matches the map exactly."

**Tap:** type `Help me signal` → **Send**.

**Point at:** the app switching to the Flare screen, **idle**, and the chat card saying how to fire it.

> "It opens the Flare, but it can never fire it. Only a person can, with a deliberate hold."

**Fallbacks:**
- **"Start a Hike first…":** the Hike ended. Skip the distance and go straight to `Help me signal`.
- **"Your Hike is on, but there is no position yet":** open **Hike** once, come back and ask again.

## 9. Fire the Flare (0:30)

**Say first:**
> "The screen is about to flash. Look away if flashing light bothers you."

**Tap:** on the Flare screen, tap the hold button once (it says "Press and hold until the bar fills. A tap does nothing."), then **press and hold for 1.5 s** until the bar fills.

**Point at:** the flashlight blinking SOS in Morse, the screen strobing white and red, the whistle at full volume, and the SOS control solid red.

**Say:**
> "No signal needed: light, strobe and a whistle so people nearby can find you. A tap does nothing, so it can't go off in a pocket."

**Tap:** **Stop Flare** after about five seconds. Everything stops, and the brightness and volume come back.

**Fallback:** if the Flare screen isn't open (beat 8 was skipped), tap **SOS** at the top right of any screen, then hold.

## 10. A group member's Alert (0:40, optional, only if #24 has landed)

Skip this beat entirely if #24 isn't merged and checked on the phone. Confirm the button labels against the merged UI before the demo; the ones below are from #24's acceptance criteria.

**Tap:** **Hike** → add the **simulated group member** (it's clearly labelled as simulated). Its olive dot with initials appears on the map. Wait for its Deviation.

**Point at:** the Alert on this phone within a few seconds: a banner, the notification (and the watch), and the member's dot turning red with an icon and text. Then its Flare Alert, with the member's position on the map.

**Say:**
> "On a group hike, if anyone strays or fires a Flare, everyone else gets an Alert. Today the second hiker is simulated on this phone. Linking real phones without internet is the next step, and these Alerts already go through the piece that will carry them."

## 11. What's next: Group Hike and the Admin Portal (0:30)

**Tap:** end the Hike (**End Hike** → **End Hike**) so the stage phone stops beeping.

**Say:**
> "Two things are next. **Group Hike** is coming soon: phones join by scanning the leader's QR code and share positions and Alerts phone-to-phone over Google Nearby Connections, still with no internet. And new mountains come from our **Admin Portal**, where the team uploads a GPX track, checks it on a map, and publishes. Phones see 'Download the update' the next time they're online. Tahak: everything a hiker needs, even with zero bars."

**Optional, live on the laptop (online, not the phone):** before the demo, run `cd apps/admin && npm run dev` and log in with a team account. On stage, open a Destination, upload a GPX file to show the dashed preview on the map, and open **Publish** to show "what changed". **Don't press Publish on stage** unless you mean it: it writes to the live project the phones read, and the next online phone would download it.

---

## Fallback summary

| What goes wrong | What to do |
|---|---|
| The model is slow (no words after ~35 s) | Keep talking, then show the recorded source-chip answer and move on. Beats 6, 8 and 9 don't use the model. |
| The photo read is slow | Skip beat 7, or show the recorded photo answer. |
| GPS | Never used on stage: the simulated walk drives the Hike. |
| The Deviation came and went too fast | Tap **Go off the Trail** again. |
| The Hike tab shows Mt. Ulap or Mt. Pulag | Pick Batulao in the Destination switcher (#52). Without #52, demo the Destination shown and swap "Batulao" out of the questions. |
| The emergency card doesn't show | Type the exact phrasing from beat 6. Never improvise. |
| The app crashes or closes | Relaunch. The model reloads in about 6 s, but the first answer will be slow (up to 37 s), so use the recorded answer for beat 5. |
| The phone gets hot (slow answers, dim screen) | Skip beat 7. Keep the Flare short. |
| The watch doesn't buzz | Don't wait. Say it mirrors to a paired watch. |
