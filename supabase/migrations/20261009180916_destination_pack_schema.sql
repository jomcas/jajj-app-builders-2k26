-- Destination Pack content (issue #4). Vocabulary follows CONTEXT.md.
--
-- The app reads these tables anonymously while online, then keeps a copy on the phone so the
-- Destination works in airplane mode (ADR 0002). The app never writes: every table has RLS on,
-- one read-only policy for anon and authenticated, and no write grants. Content is authored in
-- the Supabase dashboard (later the Admin Portal) with the service role, which bypasses RLS.
--
-- Ids are readable text slugs (e.g. 'batulao', 'batulao-old-trail') so seeds are idempotent and
-- the phone's folder names match the database.

-- A mountain or campsite that hikers travel to. One row per Destination Pack.
create table public.destinations (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  name text not null,
  region text not null,
  summary_en text not null,
  summary_fil text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  elevation_m integer,
  -- Bumped whenever any of the Destination's content or its map changes, so a phone can tell
  -- that its downloaded pack is out of date.
  pack_version integer not null default 1 check (pack_version > 0),
  -- The PMTiles map file in the public 'maps' Storage bucket, and its size in bytes. The size
  -- lets the app show download progress before the first byte arrives.
  map_path text not null,
  map_bytes bigint not null check (map_bytes > 0),
  -- True for seed rows that stand in for real content (real Batulao content is issue #5).
  is_placeholder boolean not null default false,
  updated_at timestamptz not null default now()
);

-- A named route on a Destination, from jump-off to summit or campsite.
create table public.trails (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  destination_id text not null references public.destinations (id) on delete cascade,
  name text not null,
  distance_m integer not null check (distance_m > 0),
  -- A GeoJSON LineString in WGS 84, coordinates as [longitude, latitude], jump-off first.
  -- Plain JSON rather than PostGIS: the phone stores and draws it as is.
  geometry jsonb not null check (
    geometry ->> 'type' = 'LineString'
    and jsonb_typeof(geometry -> 'coordinates') = 'array'
    and jsonb_array_length(geometry -> 'coordinates') >= 2
  ),
  updated_at timestamptz not null default now()
);

create index trails_destination_id_idx on public.trails (destination_id);

create type public.waypoint_type as enum ('jump_off', 'campsite', 'water', 'summit');

-- A named point of interest on a Trail.
create table public.waypoints (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  trail_id text not null references public.trails (id) on delete cascade,
  type public.waypoint_type not null,
  name text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  elevation_m integer,
  -- Order along the Trail, starting at 1 from the jump-off.
  position integer not null check (position > 0),
  -- Distance along the Trail from the jump-off, in metres.
  distance_m integer not null check (distance_m >= 0),
  updated_at timestamptz not null default now(),
  unique (trail_id, position)
);

create index waypoints_trail_id_idx on public.waypoints (trail_id);

-- Reference info about a Destination that the Assistant answers from (RAG).
create table public.reference_passages (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  destination_id text not null references public.destinations (id) on delete cascade,
  topic text not null,
  language text not null check (language in ('en', 'fil')),
  text text not null,
  -- Where the passage comes from: a URL, a book, or a note such as 'placeholder'.
  source text not null,
  updated_at timestamptz not null default now()
);

create index reference_passages_destination_id_idx on public.reference_passages (destination_id);

-- Read-only for the app.
alter table public.destinations enable row level security;
alter table public.trails enable row level security;
alter table public.waypoints enable row level security;
alter table public.reference_passages enable row level security;

create policy "Anyone can read Destinations" on public.destinations
  for select to anon, authenticated using (true);
create policy "Anyone can read Trails" on public.trails
  for select to anon, authenticated using (true);
create policy "Anyone can read Waypoints" on public.waypoints
  for select to anon, authenticated using (true);
create policy "Anyone can read reference passages" on public.reference_passages
  for select to anon, authenticated using (true);

-- Belt and braces: with no write policies RLS already refuses writes, and without the grants
-- they are refused before RLS is even consulted.
revoke insert, update, delete, truncate on
  public.destinations, public.trails, public.waypoints, public.reference_passages
  from anon, authenticated;
grant select on
  public.destinations, public.trails, public.waypoints, public.reference_passages
  to anon, authenticated;
