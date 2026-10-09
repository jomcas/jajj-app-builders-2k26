# Tahak Admin Portal

The team-only web tool for authoring Destinations, Trails, Waypoints and reference passages, and
publishing Destination Packs (see `CONTEXT.md`). A thin Vite + React app that runs on a team
member's laptop; nothing is hosted. Guides are not managed here: they ship inside the app.

## Run it

```sh
cd apps/admin
npm install
cp .env.example .env.local   # then fill in the two values
npm run dev                  # http://localhost:5174
```

`.env.local` (git-ignored) holds `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`: the same
project URL and anon/publishable key as `apps/mobile/.env.local`. **Never put the service_role or
secret key here.** The portal acts as the logged-in team member, and the database decides what
they may do.

Other scripts: `npm test` (Vitest), `npm run typecheck`, `npm run build`.

## Who can log in

Email and password through Supabase Auth. Only team accounts can change anything:

- `public.team_members` lists the team's emails. It ships empty and its rows are added by hand
  (see below), because the repo is public.
- `public.is_team_member()` is true for a logged-in user whose JWT email is in `team_members` and
  whose email is confirmed.
- RLS write policies on `destinations`, `trails`, `waypoints`, `reference_passages`,
  `pack_publishes` and the `maps` Storage bucket require `is_team_member()`. Anyone else who logs
  in sees "Not a team account", and the database refuses their writes even if the UI were
  bypassed.
- Reading is unchanged: the app still reads every table anonymously.

Public sign-ups are off in the Supabase project; team accounts are added under
Authentication → Users.

### Setting up the team (once)

```sh
supabase db push --linked                                        # the migration
supabase db query --linked -f apps/admin/local/team-members.sql  # the team's emails
```

`apps/admin/local/` is git-ignored. `team-members.sql` is just:

```sql
insert into public.team_members (email) values ('someone@example.com'), …
on conflict (email) do nothing;
```

## How a change reaches the phone

1. Edit a Destination, upload a Trail as GPX (previewed on the map before saving), and edit its
   Waypoints and reference passages. Each save writes straight to the tables.
2. **Publish** raises `pack_version` (and `updated_at`), optionally uploading a new PMTiles map
   as `<destination>-v<version>.pmtiles` and pointing `map_path`/`map_bytes` at it. It also
   records what was published in `pack_publishes`, which is how the Publish tab shows what
   changed since the last publish.
3. A phone that already has the Destination Pack sees the higher version in Explore and
   downloads the pack again. A phone downloading it for the first time gets whatever is saved.

A new Destination needs its PMTiles map file when it is added, because `map_path` and
`map_bytes` are required. It shows in the phone's Explore list as soon as it is added.

## Files

```
src/
  App.tsx                    login, the team check, the Destination list
  components/
    DestinationEditor.tsx    tabs for one Destination Pack
    DestinationDetails.tsx   add or edit a Destination
    TrailsPanel.tsx          GPX upload, map preview, save
    WaypointsPanel.tsx       add/edit/remove/reorder Waypoints, click the map to place them
    PassagesPanel.tsx        reference passages
    PublishPanel.tsx         changes since the last publish, optional new map, publish
    TrailMap.tsx             MapLibre GL map on OpenStreetMap tiles
  lib/
    api.ts                   Supabase reads and writes (anon key + session; RLS decides)
    gpx.ts                   GPX → GeoJSON LineString + distance
    geo.ts                   distances, distance along a Trail
    validate.ts              form validation
    waypoints.ts             ordering and the two-step position save
    publish.ts               the publish payload, snapshots, what changed
test/                        Vitest tests for lib/
```
