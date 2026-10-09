# Build plan (20-hour tournament, solo builder)

Vocabulary follows [CONTEXT.md](../CONTEXT.md). Decisions with lasting weight live in [docs/adr/](adr/).

## Constraints

- One builder, 20 hours, assisted by Claude agents. Within a wave, the tracks are independent and can run in parallel.
- Android only. Demo device: Samsung Galaxy Z Flip 6 (12 GB RAM, Snapdragon 8 Gen 3). A second Android phone is needed for Group Hike.
- Everything works offline on the trail ([ADR 0002](adr/0002-offline-only-core.md)).
- Languages: English and Filipino in the UI and content. Other dialects get best-effort answers from the Assistant only.
- Assistant answer language follows the UI language: English UI gives English answers (the default), Filipino UI gives Taglish answers. Hikers can ask in English, Filipino or Taglish either way. Decided at the Wave 0 go/no-go because the 4B model answers better in English.
- Watch support means only that Deviation alerts mirror to a paired watch as phone notifications.

## Core loop (must work in airplane mode)

1. Download the Mt. Batulao Destination Pack.
2. See the offline map with the Trail, Waypoints and your GPS position.
3. Start a Hike. Being more than 40 m off the Trail for more than 30 s triggers a Deviation alert (vibration, sound, notification).
4. Ask the Assistant in English, Filipino or Taglish. It answers from the pack and the Guide Library through RAG, in English by default or in Taglish when the UI is in Filipino.
5. Emergency questions open the matching Guide ([ADR 0003](adr/0003-emergencies-route-to-guides.md)).
6. Fire the Flare: SOS on the flashlight, screen strobe and a whistle tone.

## Tech

| Concern | Choice |
|---|---|
| App | Expo dev build (not Expo Go), TypeScript, Feature Modules ([ADR 0001](adr/0001-feature-modules-and-assistant-tools.md)) |
| LLM | `llama.rn` 0.13.0-rc.7 running Qwen3.5-4B Q4_K_M (`unsloth/Qwen3.5-4B-GGUF`) with its F16 vision file, **on the CPU** (6 threads, no mmap, n_ctx 4096). The OpenCL GPU path is out: it was killed for memory every time. Bonsai 27B was dropped without a try (Mac disk space). The model is downloaded on first launch and written by the app itself. See the Wave 0 checkpoint. |
| RAG | Small embedding model run through `llama.rn`. Passages are converted when a pack downloads and searched by brute force; no vector database. |
| Maps | MapLibre RN rendering a local PMTiles file per Destination, cut from Protomaps before the event |
| Weather | Open-Meteo 7-day Forecast for each downloaded Destination and the current location, refreshed whenever online and shown with its age |
| Backend | Supabase: Postgres, Storage, Auth |
| Admin Portal | Supabase dashboard until Wave 4a, then a thin Vite React app |
| Group Hike | Google Nearby Connections through a small custom Expo module in Kotlin. Members join by scanning the leader's QR code; works only while the app is open. |

## Waves

Every wave ends with a checkpoint that can be demoed in airplane mode.

| Wave | Hours | Tracks | Checkpoint |
|---|---|---|---|
| −1 UI/UX | 0–1.5 | Screen inventory and navigation · clickable low-fidelity prototype · outdoor design rules · English and Filipino copy rules | Prototype approved |
| 0 Spike and skeleton | 1.5–3.5 | Model running on the Flip 6 (Taglish answer plus image description) · Supabase schema · module registry · shared types | **Go/no-go on the model** |
| 1 Offline core | 3.5–8 | Pack download · offline map · Hike · Deviation · Batulao content · first Guides | Download, go offline, walk off the Trail, get an alert |
| 2 Assistant and safety | 8–12 | Chat · RAG · routing emergencies to Guides · all 15 Guides · Flare | Full core loop offline |
| 3 Stretch | 12–15 | Forecast · Vision · Assistant tools (distance to the next Waypoint, fire the Flare) | Assistant uses tools and images |
| 4 Ordered | 15–17 | **4a** custom Admin Portal (guaranteed) → **4b** Destinations 2–3 → **4c** Group Hike | Cut from the bottom |
| 5 Freeze | 17–20 | No new features · full airplane-mode run-through · bug fixes · release APK · demo script | Ready to demo |

Hard rules: if Wave 0 fails, fix the model before anything else. No new features after hour 17.

### Wave 0 checkpoint: model go/no-go

**Decision (2026-10-10): go with Qwen3.5-4B on the CPU.** Answers follow the UI language: English by default, Taglish when the UI is in Filipino (see Constraints). Measured on the Flip 6 in airplane mode ([#2](https://github.com/jomcas/jajj-app-builders-2k26/issues/2)):

| Qwen3.5-4B Q4_K_M, CPU, 6 threads | Result |
|---|---|
| Load | model 5.7 s, vision file 0.7 s |
| Taglish question (245 prompt tokens) | first token 5.0 s, then 11.2 tok/s; prompt 49 tok/s |
| Bundled photo, 574×768 (683 prompt tokens) | first token 92 s, then 6.6 tok/s; 53 s when capped at 256 image tokens |
| Camera photo, full size (972 image tokens, warm phone) | first token 219 s, then 3.9 tok/s |
| Peak memory | 4.7 GB PSS with mmap off (6.3 GB with mmap on) |
| GPU (OpenCL, Adreno 750) | killed for memory at 6.2–6.5 GB PSS in all three tries |
| Bonsai 27B | not tried: dropped by the human for disk space |

Known limits carried forward:
- Photos are too slow as they stand. Before Vision ([#18](https://github.com/jomcas/jajj-app-builders-2k26/issues/18)), downscale photos or cap image tokens, and try a Q8_0 vision file.
- Speed drops from about 11 to about 7 tok/s once the phone is warm.
- Taglish answers were stiff, formal Filipino with some wrong phrasing. A style prompt with examples is needed for the Filipino-UI mode.

### Wave reports

Every wave closes with a report in `docs/waves/wave-<N>-report.md`, written before the next wave starts. It has three parts:

1. **What was built.** Each finished feature described from the hiker's point of view, with the tickets it closed. Also list what was cut or deferred.
2. **How it was built.** The approach, the key libraries, the decisions made along the way (and any departure from this plan or the ADRs), and known limitations or shortcuts.
3. **How to test it.** Numbered action items to run on the Flip 6. Each gives the starting state (online or airplane mode, pack downloaded or not), the exact steps, and the expected result. End with a short regression pass over earlier waves' checkpoints.

## Wave −1 (UI/UX): decisions

All Wave −1 questions are settled. Next step: build the prototype (U7).

- **U1 App name:** Tahak (tentative), Filipino for treading a path. The logo is the all-caps wordmark TAHAK in olive, with a mountain in place of the second A (tentative). In all other text it's written "Tahak".
- **U2 Navigation:** four bottom tabs (Explore, Hike, Ask, Guides). The active tab gets an olive-tint pill with an orange icon. The SOS control is fixed at the top right of the header on every screen, never floating, so it can't collide with the Ask input or the map's re-center button. Modules plug into tabs ([ADR 0001](adr/0001-feature-modules-and-assistant-tools.md)).
- **U3 Hike screen:** before a Hike, a full-screen map with a Trail picker card and a large olive "Start Hike" button. During a Hike, the map follows the hiker, and a bottom panel shows the next Waypoint with a peach distance and ETA chip, an orange progress bar, Forecast and water chips, and End Hike. A Deviation shows a brick-red banner at the top with a back-to-trail arrow, and the trail line turns dashed until the hiker is back on the Trail.
- **U4 Assistant:** text input at the bottom plus a camera button, no voice. Every answer shows source chips for the pack passages and Guides it used; tapping one opens that Guide or Waypoint. Emergency questions lead with a blush Emergency Guide card and an "Open Guide" button, then at most two lines of summary ([ADR 0003](adr/0003-emergencies-route-to-guides.md)).
- **Typography:** Barlow Condensed for headings and large numbers, Barlow for body. Sentence case, not all caps. Tabular figures for live numbers.
- **Topographic texture:** faint olive-tint contour lines only on the splash, Destination headers and empty states. Never behind text, never on the Hike screen.
- **U5 Visual direction:** "field guide" style (topographic textures, bold condensed headings). Color decisions below are **settled**.

### Settled: color system

- **One meaning per color.** Olive = brand and actions. Trail orange = the Trail and progress on it (route line, next Waypoint, active tab, progress). Blue = the hiker's own GPS position. Amber = caution (Forecast warnings, form errors). Red = danger only. Everything else is warm neutrals.
- **Pastel interface, strong signals.** Surfaces, chips, tags and secondary buttons are pastel, each pastel paired with a deep text color of the same hue. Only the trail line, the GPS dot and danger red stay saturated.
- **Buttons are olive, not orange.** Orange is for the Trail and highlights. On the Hike screen, buttons sit on an opaque panel, never directly on the map.
- **Starting tokens** (tune on the Flip 6 during the prototype; every text pair is at least 7:1):

  | Role | Day fill / text | Night |
  |---|---|---|
  | Page / surface | `#F7F4EC` / `#FFFDF8` | `#000000` / `#141414` (true black, not dark green) |
  | Ink / muted text | `#1B1F1A` / `#434A41` | `#EDEBE3` / `#A9AFA5` |
  | Primary button | `#353F2A` with cream text | `#C9D4B0` with dark text |
  | Olive tint (secondary, tags, selected) | `#DCE4C8` / `#353F2A` | `#2A3122` / `#C9D4B0` |
  | Peach (Trail info) | `#F9D3B4` / `#6A2C0C` | text `#FFC9A3` |
  | Sky (water, info) | `#CFE3F7` / `#0E3F7A` | text `#A9CDF5` |
  | Butter (caution) | `#FBE7A1` / `#5C4300` | text `#F5DC8A` |
  | Danger icon and SOS text | `#A8201A` on white | `#FF8A80` |
  | Trail line (with dark outline) | `#D9661F`, outline `#3B1F0E` | `#FF8A3D`, outline `#2A1406` |
  | GPS dot | `#1A6FD6` | `#5AA9FF` |
  | Danger (banner, Flare) | `#A8201A` with white text | same |

- **SOS control** floats on every screen as a neutral button with a red icon, and turns fully red only while the Flare is active.
- **Emergency Guides** (see [CONTEXT.md](../CONTEXT.md)) sit on the normal white surface with default text; only their icon is red, on a blush tile (`#F6D0CC` day, `#3B2220` night) that mirrors the olive-tint tiles of other Guides. No blush or red fills. Red stays minimal: the Deviation banner, the Flare knob and strobe, the SOS control, and Emergency Guide icons.
- **"Works offline"** is shown as a small grey cloud-off icon next to the screen title, not a chip.
- **Waypoints.** Icons carry the type (water drop, tent, flag for the summit, boot for the jump-off). Pins are olive, the next Waypoint gets an orange ring, and water pins are blue.
- **Group Hike members** are olive dots with initials and turn red only when in Deviation.
- **Theme follows the time of day**, not the Hike: light from sunrise to sunset, dark otherwise (computed offline from GPS and date), with a manual toggle. Replaces "dark during a Hike".
- **Red means danger only** ([ADR 0004](adr/0004-red-means-danger-only.md)). The Flare fires by slide or long-press, not a tap.
- **Sun and colorblind rules.** The Trail line has a dark outline so it stands out by lightness. A Deviation turns the line dashed and shows an icon and text, never color alone. Text during a Hike is at least 7:1 contrast.
- **Map style.** Muted, earth-toned Protomaps light style by day (greens toned down) and the dark style at night, so the Trail and Waypoints are the only strong colors on the map.
- **U6 First launch:** one setup screen with language (English or Filipino), permissions (location, notifications) and the model download. It shows the download size, says Wi-Fi is recommended, resumes after a dropped connection, and offers "Browse Guides while you wait".
- **U7 Prototype:** a throwaway clickable HTML prototype in a Galaxy Z Flip 6 frame (22:9), published as a private link and reviewed with Lavish.

## Guide Library (15)

All 15 are checked against Philippine Red Cross first-aid material before shipping.

- **Injury and illness:** snakebite · insect and bee stings · leech bites · sprains and fractures (splinting) · bleeding wounds · blisters · hypothermia · heat exhaustion and heatstroke · dehydration
- **Hazards:** lost on the trail (Stop, Think, Observe, Plan) · lightning · flash floods and river crossings · altitude sickness
- **Camp skills:** pitching a tent · purifying water
