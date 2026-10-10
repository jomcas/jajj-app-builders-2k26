# Tahak infomercial script

Three cuts from one shoot: **60 s hero** (the hackathon demo video), **30 s** and **15 s** for social. Record everything on the Flip 6 in **airplane mode**, with the airplane icon visible in the status bar. The rules disqualify fake benchmarks, so never speed up an Assistant answer. If a clip is trimmed, put `badge-real-speed.png` over every shot where an answer appears.

Status key: ✅ the app has it today and there's a still in `02-screenshots/` · 🎥 built, but needs live video (sound, light or motion) · ⏳ not on `main` yet; film only if it lands before the freeze, otherwise use the fallback.

---

## 60 s hero cut

| # | Time | Picture | Voice-over | On-screen text / overlay | Status |
|---|---|---|---|---|---|
| 1 | 0:00–0:05 | Phone in hand on a trail (or a plain wall). Swipe down to show airplane mode and no bars. | "No signal. Halfway up the mountain. Now what?" | `badge-airplane-mode` | 🎥 |
| 2 | 0:05–0:08 | `title-card_1920x1080` (or the 9:16 one) | "Meet Tahak." | — | ✅ |
| 3 | 0:08–0:14 | Explore → Mt. Batulao: "On your phone since … · 1.5 MB", Trails 3.4 km and 4.2 km | "It packs a whole mountain into your phone before you leave home." | "A whole mountain in 1.5 MB" | ✅ still · 🎥 scroll |
| 4 | 0:14–0:22 | Hike: choose New Trail, Start Hike. Map follows the blue dot, orange ring on Peak 8, "40 m · about 2 min". | "An offline map with the Trail, where you are and the next Waypoint." | `badge-simulated-walk` (required whenever the sim banner shows) | ✅ still · 🎥 walk |
| 5 | 0:22–0:30 | Tap "Go off the Trail". After 30 s the red banner, arrow and dashed line appear and the phone buzzes. Cut the wait. | "Wander off the Trail and it tells you which way to go back." | `lower-third-deviation` | 🎥 (sound + vibration) |
| 6 | 0:30–0:42 | Ask tab: type "Malayo pa ba yung summit? May tubig ba sa taas?" Answer with source chips. | "Ask in English, Filipino or Taglish. The AI runs on the phone itself." | `badge-on-device-ai` + `badge-real-speed` | ⏳ |
| 7 | 0:42–0:52 | Ask: "My friend got bitten by a snake." Emergency Guide card → Open Guide → Snakebite steps. | "In an emergency it never guesses. It opens a first-aid Guide." | — | ⏳ (Guides list ✅) |
| 8 | 0:52–0:57 | SOS → Flare → hold the red button: strobe, flashlight, whistle. Film the phone from outside so the torch shows. | "And if you need to be found, fire the Flare." | — | ✅ still · 🎥 firing |
| 9 | 0:57–1:00 | `end-card_1920x1080` | "Tahak. When the signal drops, your guide doesn't." | — | ✅ |

**Fallback for shots 6–7 if the Assistant isn't on `main` in time.** Swap in about 20 s of what exists:
- 6′ (0:30–0:40): Mt. Batulao reference notes scroll (water, fees, campsites, each with sources). VO: "Real trail notes for water, fees and campsites, each with its source." Card: `04-trail-notes`.
- 7′ (0:40–0:52): Guides tab → open Snakebite. VO: "Step-by-step first aid that works with zero signal." Card: `05-guides`.

Then don't say "AI" anywhere in the cut, and drop `badge-on-device-ai`.

Word count for the VO is about 95 words, which leaves room to breathe at a relaxed 2.3 words per second.

---

## 30 s cut

| Time | Picture | Voice-over |
|---|---|---|
| 0:00–0:04 | Airplane mode swipe | "No signal on the mountain?" |
| 0:04–0:10 | Hike map following the dot | "Tahak keeps the Trail, your position and the next Waypoint offline." |
| 0:10–0:16 | Deviation banner + buzz | "Step off the Trail and it tells you." |
| 0:16–0:24 | Assistant answer (fallback: Snakebite Guide) | "Ask the on-phone AI, or open a first-aid Guide." |
| 0:24–0:27 | Flare strobe | "Fire the Flare to be found." |
| 0:27–0:30 | End card | "Tahak. When the signal drops, your guide doesn't." |

## 15 s cut (Reels / TikTok, 9:16)

Use the 9:16 promo cards as full frames, 2 s each, with a hard cut on each beat of the music: `01-offline-map` → `02-destination-pack` → `05-guides` → `06-flare`, then 3 s of the Deviation clip with its real tone, then `end-card_1080x1920` for 4 s. No VO; the cards carry the words.

---

## Social post (from docs/SUBMISSION.md, required for the hackathon)

> Built Tahak at the #AppBuildersPH Hackathon 2026: an offline hiking companion for Filipino mountains. The AI runs on the phone itself, so it can guide you, warn you when you leave the trail, and walk you through first aid with zero signal. @cognition @DevinAI
> 🎥 [video] · Repo: https://github.com/jomcas/jajj-app-builders-2k26

Check the Cognition/Devin handles before posting. If the Assistant didn't make the freeze, drop the "AI runs on the phone" sentence.

## Claims you can make (all measured or in the app)

- Works in airplane mode: the map, the Hike, Deviation alerts, Guides and the Flare.
- Mt. Batulao pack: 1.5 MB, two Trails (New 3.4 km, Old 4.2 km), Waypoints, sourced reference notes in English and Filipino.
- Deviation: more than 40 m off the Trail for more than 30 s → vibration, sound, notification. (Don't claim watch support on camera: it hasn't been tested with a real watch yet.)
- Model: Qwen3.5-4B Q4_K_M on the phone's CPU. Measured first token 5.0 s, then 11.2 tok/s on a cool phone, about 7 tok/s when warm (docs/plan.md). Quote these only with that context.

## Claims to avoid

- Any speed you didn't measure, or "instant" answers.
- "Rescue", "tracks you for rescuers" or "sends SOS": the Flare is local light and sound only.
- Background tracking: Deviation only works while Tahak is open.
- Group Hike, Forecast or photo questions, unless they're built by the freeze.
