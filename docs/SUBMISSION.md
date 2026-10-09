# Submission draft (AppBuildersPH Hackathon 2026)

Submit once on [the Cerebral Valley event page](https://cerebralvalley.ai/e/appbuildersph-hackathon-2026) before **10:00 AM, Oct 10**. You can't edit or resubmit, and the repo freezes at 10:00.

Search this file for `TODO` before submitting. Every `TODO` is a fact only the team can confirm or a number that must be measured. Never estimate a number: the rules disqualify fake benchmarks.

---

## 1. The project

**Project name:** Tahak

**Short description (one line):**
An offline hiking companion for Filipino mountains: an on-device AI guide, offline trail maps, off-trail alerts, first-aid Guides and an SOS Flare that all work with zero signal.

**Longer description:**
Hikers on Philippine mountains lose signal exactly when they need help most. Tahak packs everything about one mountain into a Destination Pack you download at home: the offline map, the Trails and Waypoints, and reference notes for the Assistant. On the trail, the phone works fully in airplane mode. It shows your position on the Trail, alerts you when you stray more than 40 m from it for 30 seconds, and answers questions in English, Filipino or Taglish using an LLM running on the phone. Emergency questions never get improvised advice. The Assistant opens a reviewed first-aid Guide instead. A Flare uses the flashlight, screen and sound to signal for help.

**Team members:** TODO: names exactly as listed on appbuildersph.com/hackathon. Team name: TODO.

**Public GitHub repository:** https://github.com/jomcas/jajj-app-builders-2k26 (already public)

---

## 2. Why does this product benefit from running AI locally?

Mountains in the Philippines have little or no mobile signal, so a cloud AI assistant fails at the exact moment a hiker needs it: lost on a ridge, caught in weather, or treating an injury hours from the jump-off. Running the model on the phone makes the Assistant available everywhere the hiker is, with no signal, no data cost and no waiting on a slow connection. It also keeps the hiker's location and questions on their own device. Cloud inference can't offer any of this. On the trail, local inference is the only way the product works at all.

---

## 3. What runs locally vs. what needs internet

**Runs on the phone, fully offline (airplane mode):**
- The Assistant: an LLM running on the device through `llama.rn`. TODO: exact model file and quantization.
- RAG: a small on-device embedding model plus a brute-force search over the pack's passages and the Guide Library. TODO: embedding model name.
- The offline map: MapLibre rendering a local PMTiles file for the Destination.
- GPS tracking during a Hike, and Deviation alerts (vibration, sound, notification).
- The Guide Library and the emergency routing to Guides.
- The Flare: flashlight SOS, screen strobe and whistle tone.
- TODO, keep only if built: Group Hike over Google Nearby Connections (phone to phone, no internet), image questions through the model's vision file.

**Needs internet (setup only, never during a Hike):**
- The first-launch download of the model.
- Downloading a Destination Pack (map tiles, Trails, Waypoints, reference passages).
- TODO, keep only if built: refreshing the 7-day Forecast from Open-Meteo, and the Admin Portal, which publishes Destination Packs through Supabase.

No core feature calls a server while it is being used ([ADR 0002](adr/0002-offline-only-core.md)).

---

## 4. Disclosures

**Models**
- Qwen3.5-4B, GGUF format, run with llama.cpp through `llama.rn`. TODO: quantization, source URL, and whether the vision projector is used.
- TODO: the embedding model name and source.
- TODO: Bonsai 27B, only if it was tried during the spike (the plan allowed 15 minutes).

**Technologies and frameworks**
- Expo (dev build), React Native, TypeScript
- `llama.rn` (llama.cpp bindings for React Native)
- MapLibre React Native with Protomaps PMTiles
- TODO, keep only if used: a custom Expo module in Kotlin using Google Nearby Connections, and a Vite + React Admin Portal

**APIs and cloud services**
- Supabase (Postgres, Storage, Auth) for hosting and publishing Destination Packs. It is never used during a Hike.
- TODO, keep only if built: Open-Meteo for the 7-day Forecast.
- Protomaps builds were used before the event to cut the map tiles. TODO: confirm.

**Existing code and assets**
- Agent skills by Matt Pocock (`mattpocock/skills`, listed in `skills-lock.json`), installed at the start of Build Day as development workflow tools. They aren't part of the app.
- The Lavish review skill (`kunchenguid/lavish-axi`), used to review the UI prototype.
- Map data © OpenStreetMap contributors (ODbL), served through Protomaps.
- Barlow and Barlow Condensed fonts (SIL Open Font License), Tabler Icons (MIT).
- First-aid Guide content written by the team and checked against Philippine Red Cross first-aid material. TODO: name the exact source.
- The Tahak logo: TODO, say how it was made. If an AI image tool made it, name the tool.
- All app code was written during the hackathon, starting Oct 9, 2026. The first commit is at 14:41.

**AI development tools**
- Claude Code (Claude Opus 5.5) for planning, design and coding.
- The Mobbin MCP for UI references.
- TODO: Devin, if used. Using it may matter for the Cognition / Devin Award.

---

## 5. README for judges (move into `README.md` before 10:00)

TODO: fill in the real commands once the app builds. Judges need to be able to recreate it without a live deployment.

1. **Requirements:** an Android phone with arm64 and about 8 GB of RAM or more (tested on a Samsung Galaxy Z Flip 6), plus Node TODO-version and the Android SDK if building from source.
2. **Install:** download the APK from TODO (GitHub Release) or build it with `TODO`.
3. **First launch:** choose a language, allow location and notifications, and download the model. Wi-Fi is recommended. TODO: model size.
4. **Get a pack:** in Explore, download the Mt. Batulao Destination Pack.
5. **Go offline:** turn on airplane mode, then start a Hike, ask the Assistant a question, open a Guide and test the Flare.
6. **Simulating a Deviation without hiking:** TODO, describe the debug toggle or mock-location steps.

---

## 6. Demo video (about 1 minute) and social post

Record on the Flip 6 with **airplane mode on and the airplane icon visible on screen**. Use screen recording plus one shot of the phone in hand.

| Time | Shot | Voice-over / caption |
|---|---|---|
| 0:00–0:05 | Phone in hand on a trail or a plain background, then swipe down to show airplane mode on | "No signal. Halfway up the mountain." |
| 0:05–0:12 | Tahak splash, then Explore with the Mt. Batulao pack marked "Pack downloaded" | "Tahak packs a whole mountain into your phone before you leave home." |
| 0:12–0:22 | Hike screen: Start Hike, the map follows the GPS dot along the orange Trail | "Offline map, your position, the next Waypoint." |
| 0:22–0:30 | Walk or simulate going off-trail: the red banner appears and the phone vibrates | "Step off the Trail and it warns you right away." |
| 0:30–0:42 | Ask, in Taglish: "Malayo pa ba yung summit? May tubig ba sa taas?" The answer appears with source chips | "Ask it anything, in Taglish. The AI runs on the phone itself." |
| 0:42–0:52 | Ask: "My friend got bitten by a snake." The Emergency Guide card appears, then open the Guide | "For emergencies it never improvises. It opens a reviewed first-aid Guide." |
| 0:52–0:58 | Slide to fire the Flare: strobe and flashlight | "And if you need to be found, fire the Flare." |
| 0:58–1:00 | Logo end card | "Tahak. When the signal drops, your guide doesn't." |

Only use real, unedited answer speeds. Don't speed up the AI response in the edit without saying so on screen. That would count as a fake benchmark.

**Post (X or LinkedIn, required):**
> Built Tahak at the #AppBuildersPH Hackathon 2026: an offline hiking companion for Filipino mountains. The AI runs on the phone itself, so it can guide you, warn you when you leave the trail, and walk you through first aid with zero signal. @cognition @DevinAI TODO-check-handles
> 🎥 [video] · Repo: https://github.com/jomcas/jajj-app-builders-2k26

TODO: confirm the correct Devin / Cognition handles on the platform you post to.

---

## 7. Final checklist (aim to submit by 9:30 AM)

- [ ] Every `TODO` in this file is resolved or removed
- [ ] Features that weren't built are removed from sections 3 and 4
- [ ] README updated from section 5, and the APK uploaded to a GitHub Release
- [ ] Measured numbers (if quoted anywhere) come from the Flip 6, with notes on how they were measured
- [ ] Demo video recorded, posted on X or LinkedIn with the tags, and the URL copied
- [ ] Team name and members match the official list
- [ ] Final commit pushed before 10:00 AM
- [ ] Submitted once on Cerebral Valley
