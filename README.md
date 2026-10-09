# Tahak

Tahak is an offline-first hiking and camping companion for Filipino mountain trails and campsites. It is designed to work in airplane mode once a destination pack is downloaded, giving hikers live trail guidance, emergency help, and local AI assistance without relying on network connectivity.

## Why local AI matters

Tahak benefits from running AI locally because hikers often lose signal exactly when they need help most. Local inference keeps the assistant available in remote or offline environments, reduces latency, improves privacy, and ensures critical guidance remains accessible in the field.

Core benefits:
- Works without signal once a pack is downloaded
- Instant answers in emergencies and remote conditions
- Keeps photos, questions, and location data on-device
- Lower latency than cloud round-trips when every second matters
- Better resiliency in airplane mode and poor cellular coverage

## Product vision

Tahak combines:
- Offline destination packs
- Offline map rendering
- Trail and waypoint guidance
- Deviation alerts
- Local AI assistant with retrieval from pack content and guide library
- SOS / flare behavior for emergency situations
- Filipino and English user experience

The project is designed around the idea that a hiker should still be able to navigate, ask for help, and access safety guidance even when connectivity is unavailable.

## Key models and AI stack

### Models used
- Qwen3.5-4B Q4_K_M GGUF via `llama.rn`
- Qwen vision file in F16 format for image-based prompting
- Lightweight local embedding/search model for offline RAG-style retrieval

### Local AI behavior
- Model runs on-device on the phone CPU
- Binary and assets are downloaded and stored by the app itself
- Answers follow the UI language, with English default and Taglish support in Filipino mode
- Works independently of cloud connectivity after the destination pack is available

## Technologies and frameworks

### Mobile app
- Expo dev build
- React Native
- TypeScript
- React Navigation
- Expo libraries for notifications, location, file system, audio, and asset handling

### Mapping and data
- MapLibre React Native
- Protomaps PMTiles
- Local destination packs and trail content
- AsyncStorage for local persistence

### AI and local runtime
- `llama.rn`
- On-device model execution for assistant and retrieval workflows

### Quality and tooling
- ESLint
- TypeScript compiler
- Node test runner

## APIs and cloud services

- Supabase
  - Postgres
  - Storage
  - Authentication
- Open-Meteo
  - 7-day forecast data
- Google Nearby Connections
  - Used for group hike coordination via custom native module support

## Existing code and assets

### App modules
- `apps/mobile/src/modules/explore`
- `apps/mobile/src/modules/hike`
- `apps/mobile/src/modules/guides`
- `apps/mobile/src/modules/flare`
- `apps/mobile/src/modules/assistant-model`
- `apps/mobile/src/modules/destination-pack`

### Assets and content
- `apps/mobile/assets/`
- `content/batulao/`
- `content/ulap/`
- `apps/mobile/src/modules/guides/content/`

### Planning and design docs
- `docs/plan.md`
- `docs/adr/`
- `docs/waves/`
- `.lavish/tahak-prototype.html`

## AI development workflow

The project uses a hybrid AI-assisted engineering workflow with:
- Local model execution for on-device assistant functionality
- Claude-style agent workflows and project skill scaffolding under `.agents/`
- GitHub issue tracking and structured repository documentation
- Copilot/VS Code AI-assisted development support
- Skills registry and repo guidance in `AGENTS.md`, `CONTEXT.md`, and `skills-lock.json`

## Project structure

```text
.
├── apps/
│   └── mobile/
├── content/
├── docs/
├── .agents/
├── .lavish/
├── AGENTS.md
├── CONTEXT.md
├── README.md
├── skills-lock.json
└── supabase/
```

## Getting started

```bash
cd apps/mobile
npm install
npm start
```

For Android dev builds, use the Expo Android workflow and follow the project-specific offline and device instructions in the planning and wave reports.

## Validation

```bash
cd apps/mobile
npm test
npm run lint
npm run typecheck
```

## Summary

Tahak is designed for the real conditions hikers face: poor coverage, limited connectivity, and urgent decision-making in the field. Running AI locally is not just a technical preference—it is a safety and usability requirement for an offline-first hiking companion.
