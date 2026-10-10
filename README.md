# Tahak

An offline-first hiking and camping companion for Filipino mountain trails and campsites. Once a
Destination Pack is downloaded, everything needed on the trail works without signal. See
[`CONTEXT.md`](CONTEXT.md) for the domain language.

| Folder | What it is |
| --- | --- |
| [`apps/mobile`](apps/mobile) | The Android app (Expo / React Native) |
| [`apps/admin`](apps/admin) | The team's Admin Portal for authoring Destination Packs (Vite + React) |
| [`supabase`](supabase) | Database migrations, storage bucket, and seed data for the backend |
| [`content`](content) | Source data for each Destination: Trails, Waypoints, reference passages |

## Run it locally

You don't need access to the team's Supabase project or its keys. The script below runs the
whole backend on your machine in Docker, seeds it with Mt. Batulao and Mt. Ulap, and writes the
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
2. Loads the Batulao and Ulap Destination Packs from `supabase/seed/`.
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
