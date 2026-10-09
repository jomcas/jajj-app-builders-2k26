# Build plan (20-hour tournament, solo builder)

Vocabulary follows [CONTEXT.md](../CONTEXT.md). Decisions with lasting weight live in [docs/adr/](adr/).

## Constraints

- One builder, 20 hours, assisted by Claude agents. Within a wave, the tracks are independent and can run in parallel.
- Android only. Demo device: Samsung Galaxy Z Flip 6 (12 GB RAM, Snapdragon 8 Gen 3). A second Android phone is needed for Group Hike.
- Everything works offline on the trail ([ADR 0002](adr/0002-offline-only-core.md)).
- Languages: English and Filipino in the UI and content. Other dialects get best-effort answers from the Assistant only.
- Watch support means only that Deviation alerts mirror to a paired watch as phone notifications.

## Core loop (must work in airplane mode)

1. Download the Mt. Batulao Destination Pack.
2. See the offline map with the Trail, Waypoints and your GPS position.
3. Start a Hike. Being more than 40 m off the Trail for more than 30 s triggers a Deviation alert (vibration, sound, notification).
4. Ask the Assistant in English, Filipino or Taglish. It answers from the pack and the Guide Library through RAG.
5. Emergency questions open the matching Guide ([ADR 0003](adr/0003-emergencies-route-to-guides.md)).
6. Fire the Flare: SOS on the flashlight, screen strobe and a whistle tone.

## Tech

| Concern | Choice |
|---|---|
| App | Expo dev build (not Expo Go), TypeScript, Feature Modules ([ADR 0001](adr/0001-feature-modules-and-assistant-tools.md)) |
| LLM | `llama.rn` running Qwen3.5-4B GGUF with its vision file. Spend at most 15 min trying Bonsai 27B during the spike. The model is downloaded on first launch. |
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

## Next session: resume Wave −1 (UI/UX)

Planning is done. Wave −1 has started, but none of its questions are answered yet. Each line below gives the proposal; the user still has to accept or override it.

- **U1 App name:** "Gabay" (Filipino for "guide"). Alternatives: Akyat, Bantay.
- **U2 Navigation:** four bottom tabs (Explore, Hike, Ask, Guides) plus an SOS button that floats on every screen. Modules plug into tabs, which needs a small update to ADR 0001.
- **U3 Hike screen:** full-screen map that follows the user. Bottom panel shows the next Waypoint (distance and ETA), elapsed time and a Forecast chip. A Deviation shows a red banner with a back-to-trail arrow until the hiker is back on the Trail.
- **U4 Assistant:** text input plus a camera button, no voice. Every answer shows source chips for the passages it used.
- **U5 Visual direction:** "field guide" style (topographic textures, forest green and sunrise orange, bold condensed headings). Light theme by default and a dark trail theme during a Hike. Red is used only for danger.
- **U6 First launch:** one setup screen for language, permissions and the model download. Guides work before the model finishes downloading.
- **U7 Prototype:** a throwaway clickable HTML prototype in a phone frame, published as a private link.

Mobbin MCP is wanted for inspiration but is not connected yet. Connect it before the prototype step.

## Guide Library (15)

All 15 are checked against Philippine Red Cross first-aid material before shipping.

- **Injury and illness:** snakebite · insect and bee stings · leech bites · sprains and fractures (splinting) · bleeding wounds · blisters · hypothermia · heat exhaustion and heatstroke · dehydration
- **Hazards:** lost on the trail (Stop, Think, Observe, Plan) · lightning · flash floods and river crossings · altitude sickness
- **Camp skills:** pitching a tent · purifying water
