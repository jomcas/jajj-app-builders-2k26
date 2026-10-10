# Tahak promo v2: "When the cloud disappears"

High-energy, no-dead-air version. One idea, start to finish: **cloud AI quits when the signal does; Tahak's AI runs on the phone and stays useful in the moments that matter on a mountain.**

**Length:** 66.3 s. The finished mix is `audio/TAHAK-v2-MIX.wav` (or `.m4a`). Drop it on the timeline at 0:00 and cut picture to it. Every timecode below comes from the word-level transcript (`vo-words.json`).

## Audio (already mixed for you)

| File | What |
|---|---|
| `audio/TAHAK-v2-MIX.wav` / `.m4a` | **The finished soundtrack.** Voice + music (ducked under the voice) + SFX. No gaps: the only quiet moment is the final 0.2 s fade. |
| `audio/vo-hype-MASTER-take2-tight-65s.wav` | Voice only, pauses tightened to 0.14 s. Use it if you remix. |
| `audio/vo-hype-alt-take1-tight-68s.wav` | The other take, 68 s. |
| `audio/vo-hype-take*-raw.mp3` | The untouched ElevenLabs takes (85 s, long dramatic pauses). |
| `audio/music-extreme-take1-60s.mp3` | The music in the mix: electro-rock, 4 s riser, drop at 4.25 s, breakdown 32–42 s, final hit at 58.3 s. |
| `audio/music-extreme-take2-60s.mp3` | An alternative take of the same brief. |
| `audio/sfx-signal-lost-glitch.mp3`, `sfx-whoosh-impact.mp3` | The stingers used in the mix. |
| `tools/mix_v2.py` | Rebuilds the mix if you swap a stem or move a hit. |

Voice: **James** (young, Filipino-American accent), ElevenLabs v3, hype read. Music: ElevenLabs Music v2.5.

## Cut list

The music drops on "This is Tahak" (8.16 s), the breakdown sits under the AI question (36–46 s), and the final hit lands on the last "Tahak" (62.2 s). Cut on the whooshes; they're at the scene changes.

| Time | VO | Picture | Overlay / SFX in the mix |
|---|---|---|---|
| 0.00–3.46 | "Ridge line. Zero bars. The cloud? GONE." | Camera: phone in hand on a ridge or against sky; swipe down: airplane mode, no bars. Hard cuts on each phrase. | `badge-airplane-mode`. Glitch at 0.0 and 3.0, static bed. |
| 3.46–8.10 | "And just like that, your cloud AI goes dark. But not this one!" | Screen: a browser or a generic chat page failing with "No internet" in airplane mode. Glitch-zoom out. Don't show a competitor's name or logo. | Riser builds, reversed whoosh into the drop. |
| 8.16–13.30 | "This is Tahak — an AI hiking guide that runs ENTIRELY on your phone." | **DROP.** `title-card` slam, then the phone hero shot (`01-offline-map` card). | `badge-on-device-ai` |
| 13.56–16.20 | "No signal. No server. No problem!" | Kinetic type, one phrase per beat, full screen, Barlow Condensed on black. Trail-orange on "No problem!" | — |
| 16.40–22.82 | "At home, you download the whole mountain: the map, every Trail, every Waypoint, every trail note." | Explore → Mt. Batulao ("1.5 MB"), then quick cuts on each "every": Trails list, Waypoints, reference notes. | Whoosh at 16.25 |
| 22.92–25.46 | "Then airplane mode on. Let's go!" | Close-up: thumb taps airplane mode, then taps **Start Hike**. | — |
| 25.68–30.94 | "On the Trail, it tracks you live: where you are, the next Waypoint, how far to the top." | Hike map, simulated walk at 15×, dot moving, orange ring, "40 m · about 2 min" chip. | Whoosh at 25.55. `badge-simulated-walk` |
| 31.06–35.76 | "Drift off the Trail? It catches you! It buzzes and points you straight back." | Red Deviation banner + arrow + dashed line; camera close-up of the phone buzzing on a rock. | Whoosh at 30.95; **the app's real alert tone** at 32.25. `lower-third-deviation` |
| 35.92–40.30 | "Got a question? Just ask. English, Filipino or Taglish." | Ask tab, thumb typing. Music drops to the breakdown here. | Whoosh at 35.80 |
| 40.50–43.66 | "Malayo pa ba yung summit? May tubig ba sa taas?" | The Taglish question typed on screen and sent. Big caption. | — |
| 43.94–49.66 | "A real AI model, right on the phone, answering from THIS mountain's own notes." | The answer streaming with source chips; tap a chip → the water note. | `badge-on-device-ai` + see **Honesty** below |
| 49.94–54.72 | "Snakebite? It doesn't guess. It opens the first-aid Guide, step by step." | Ask "My friend got bitten by a snake" → Emergency Guide card → Snakebite steps. Fallback: Guides tab → Snakebite. | Whoosh at 49.80 |
| 54.80–58.60 | "Need to be found? Fire the Flare! Light, strobe, whistle!" | Hold the Flare button → **camera** on the strobing phone in a dark room; cut on "Light", "strobe", "whistle". | Whoosh at 54.70; **the app's real whistle** at 57.0 |
| 58.80–61.78 | "When the cloud disappears, Tahak keeps going." | Rapid montage, 0.3 s per shot: map, Deviation, answer, Guide, Flare, all with the airplane icon visible. Music at its peak. | Whoosh at 58.70 |
| 61.98–65.24 | "Tahak. When the signal drops, your guide doesn't!" | **Final hit at 62.2 s:** slam to `end-card`. | Whoosh at 63.55, boom at 65.05 |
| 65.24–66.30 | — | Hold the end card, cut to black on the boom. | — |

Burn in `captions-v2.srt` (36 cues, timed to the words, no blank gaps between them). Style: Barlow Condensed Bold, white with a 70% black box, lower third.

## Honesty (the rules disqualify fake benchmarks)

- **The answer shot (43.9–49.7 s) is 6 s; a real answer takes longer** (first token about 5 s on the Flip 6, then 7–11 tokens per second). Either show the real wait in a picture-in-picture timer, or put `badge-real-speed` only on clips that are not trimmed and add a small "Edited for time" label on the trimmed one. Never speed up the text.
- Keep the "Simulated walk" banner visible in Hike shots and use `badge-simulated-walk`.
- The Assistant and Emergency Guide card must be the real app. If they aren't on the build in time, swap 35.9–54.7 s for Explore notes and the Guides tab, and re-record the lines that mention AI answers (see `../01-script/SCRIPT.md` fallback).
- "Runs entirely on your phone" is true for using it; the model and the Destination Pack are downloaded while online, which the script already says ("At home, you download…").

## Vertical (9:16) version

The same mix works for Reels and TikTok. Use the 9:16 promo cards for the title, montage and end card, and crop screen recordings to fill the frame.
