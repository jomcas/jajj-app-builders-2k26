# TAHAK

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
- Qwen vision file (`Qwen3.5-4B-mmproj-Q8_0.gguf`, Q8_0) for photo questions; all model files total about 3.4 GB (3,441,423,488 bytes)
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

## AI development workflow

The project uses a hybrid AI-assisted engineering workflow with:
- Local model execution for on-device assistant functionality
- Claude-style agent workflows and project skills (kept local, not committed)
- GitHub issue tracking and structured repository documentation
- Copilot/VS Code AI-assisted development support
- Repo guidance in `AGENTS.md` and `CONTEXT.md`

## Project structure

```text
.
├── apps/
│   ├── admin/          # Admin Portal (Vite + React)
│   └── mobile/         # Android app (Expo)
├── content/
├── docs/
├── scripts/            # dev-setup.sh: local backend in Docker
├── AGENTS.md
├── CONTEXT.md
├── README.md
└── supabase/
```

## Run it locally

You don't need access to the team's Supabase project or its keys. The script below runs the
whole backend on your machine in Docker, seeds it with Mt. Batulao, Mt. Ulap and Mt. Pulag, and writes the
apps' env files for you.

### 1. Install

- [Docker Desktop](https://www.docker.com/products/docker-desktop/), running
- [Node.js](https://nodejs.org/) 20 or newer
- Optional: the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).
  Without it, the script uses `npx supabase`.
- Optional: the [`pmtiles` CLI](https://docs.protomaps.com/pmtiles/cli) (`brew install pmtiles`)
  for the offline Hike maps. Without it, everything else still works, but the map won't download
  in the app.
- For the mobile app: Android Studio with an emulator, or an Android phone with USB debugging.

### 2. Start the backend

```bash
scripts/dev-setup.sh
```

The first run downloads a few GB of Docker images and takes several minutes. Later runs take
seconds. The script:

1. Starts local Supabase (Postgres, Auth, Storage, API, Studio) and applies every migration in
   `supabase/migrations/`.
2. Loads the Batulao, Ulap and Pulag Destination Packs from `supabase/seed/`.
3. Creates a local Admin Portal account: **`team@tahak.local` / `tahak-local`**.
4. Cuts each offline map and uploads it to local Storage.
5. Writes `apps/admin/.env.local` and `apps/mobile/.env.local` with the local URL and anon key.

When it finishes, the database UI (Supabase Studio) is at <http://127.0.0.1:54323>.

### 3. Run the Admin Portal

```bash
cd apps/admin && npm install && npm run dev
```

Open <http://localhost:5174> and sign in with the account above.

### 4. Run the mobile app

```bash
cd apps/mobile && npm install && npx expo run:android
```

The app reaches the backend at your computer's LAN IP, which the script put in
`apps/mobile/.env.local`. The phone or emulator has to be on the same network. If your IP
changes (new Wi-Fi), rerun the script, or set it yourself:

```bash
MOBILE_HOST=192.168.1.20 scripts/dev-setup.sh
```

### Stopping and resetting

```bash
npx supabase stop
```

Stops the containers. Your data is kept for next time.

```bash
npx supabase db reset && scripts/dev-setup.sh
```

Wipes the local database, rebuilds it from the migrations and seeds, and re-adds the account
and maps.

### Troubleshooting

- **"Docker is not running"**: open Docker Desktop and wait until it says it's running.
- **Port already in use (54321–54324)**: another Supabase project is running. Stop it with
  `npx supabase stop --project-id <its id>`, or stop all with `npx supabase stop --all`.
- **App shows no Destinations**: check `EXPO_PUBLIC_SUPABASE_URL` in `apps/mobile/.env.local`
  opens in the phone's browser (it should return JSON, not time out). If it times out, the IP is
  wrong or a firewall is blocking port 54321.
- **`supabase` crashes with "killed" on macOS**: a broken global install. Remove it and use
  `npx supabase`, or reinstall with `brew install supabase/tap/supabase`.

## Using the cloud project instead

Team members with access to the hosted Supabase project copy `.env.example` to `.env.local` in
each app and fill in the project URL and anon key. Content is published with the scripts in
`supabase/seed/` (see their headers) and the Admin Portal; see
[`apps/admin/README.md`](apps/admin/README.md).

## Validation

```bash
cd apps/mobile
npm test
npm run lint
npm run typecheck
```

## Summary

Tahak is designed for the real conditions hikers face: poor coverage, limited connectivity, and urgent decision-making in the field. Running AI locally is not just a technical preference—it is a safety and usability requirement for an offline-first hiking companion.
