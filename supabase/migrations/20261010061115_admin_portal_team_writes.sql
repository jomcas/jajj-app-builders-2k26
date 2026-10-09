-- Admin Portal (issue #21): team members write Destination Pack content; everyone else still
-- only reads.
--
-- Additive only. The anon and authenticated read policies and select grants from
-- 20261009180916_destination_pack_schema.sql are untouched, so the app keeps reading
-- anonymously exactly as before.
--
-- Who counts as a team member: a logged-in user whose JWT email is listed in team_members
-- and whose email address is confirmed. The table ships empty. Its rows (the team's emails)
-- are inserted by hand and never committed, because the repo is public.
--
-- Writes are checked by RLS in the database, not only hidden in the portal's UI: a logged-in
-- user who is not a team member gets 42501 (or zero rows) on every write.

-- The team. Emails are stored lower-case.
create table public.team_members (
  email text primary key check (email = lower(email))
);

-- Nobody reads or writes it over the API. Only is_team_member() below (security definer) and
-- the service role see it. RLS with no policies, plus no grants, refuses everything.
alter table public.team_members enable row level security;
revoke all on public.team_members from anon, authenticated;

-- True when the caller is a logged-in team member with a confirmed email address.
create function public.is_team_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.team_members t
    join auth.users u on lower(u.email) = t.email
    where u.id = auth.uid()
      and t.email = lower(auth.jwt() ->> 'email')
      and u.email_confirmed_at is not null
  );
$$;

revoke execute on function public.is_team_member() from public, anon;
grant execute on function public.is_team_member() to authenticated;

-- Writes on the four content tables: granted to authenticated, then limited to team members
-- by the policies below. anon gets no write grant.
grant insert, update, delete on
  public.destinations, public.trails, public.waypoints, public.reference_passages
  to authenticated;

create policy "Team members can add Destinations" on public.destinations
  for insert to authenticated with check ((select public.is_team_member()));
create policy "Team members can edit Destinations" on public.destinations
  for update to authenticated
  using ((select public.is_team_member())) with check ((select public.is_team_member()));
create policy "Team members can delete Destinations" on public.destinations
  for delete to authenticated using ((select public.is_team_member()));

create policy "Team members can add Trails" on public.trails
  for insert to authenticated with check ((select public.is_team_member()));
create policy "Team members can edit Trails" on public.trails
  for update to authenticated
  using ((select public.is_team_member())) with check ((select public.is_team_member()));
create policy "Team members can delete Trails" on public.trails
  for delete to authenticated using ((select public.is_team_member()));

create policy "Team members can add Waypoints" on public.waypoints
  for insert to authenticated with check ((select public.is_team_member()));
create policy "Team members can edit Waypoints" on public.waypoints
  for update to authenticated
  using ((select public.is_team_member())) with check ((select public.is_team_member()));
create policy "Team members can delete Waypoints" on public.waypoints
  for delete to authenticated using ((select public.is_team_member()));

create policy "Team members can add reference passages" on public.reference_passages
  for insert to authenticated with check ((select public.is_team_member()));
create policy "Team members can edit reference passages" on public.reference_passages
  for update to authenticated
  using ((select public.is_team_member())) with check ((select public.is_team_member()));
create policy "Team members can delete reference passages" on public.reference_passages
  for delete to authenticated using ((select public.is_team_member()));

-- Map files in the public 'maps' bucket. Downloads stay a plain public GET for everyone.
-- Team members can upload a new map file and replace one; select is needed by Storage to
-- check for an existing file. There is no delete policy: old map files are removed by hand.
create policy "Team members can upload map files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'maps' and (select public.is_team_member()));
create policy "Team members can replace map files" on storage.objects
  for update to authenticated
  using (bucket_id = 'maps' and (select public.is_team_member()))
  with check (bucket_id = 'maps' and (select public.is_team_member()));
create policy "Team members can list map files" on storage.objects
  for select to authenticated
  using (bucket_id = 'maps' and (select public.is_team_member()));

-- One row per publish from the Admin Portal: the Destination Pack's content as it was
-- published, so the portal can show what changed since the last publish, and who published.
-- Team-only; the app never reads it.
create table public.pack_publishes (
  destination_id text not null references public.destinations (id) on delete cascade,
  pack_version integer not null check (pack_version > 0),
  published_at timestamptz not null default now(),
  published_by text not null default (auth.jwt() ->> 'email'),
  -- {destination, trails, waypoints, passages} rows as published, without updated_at.
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  primary key (destination_id, pack_version)
);

alter table public.pack_publishes enable row level security;
revoke all on public.pack_publishes from anon, authenticated;
grant select, insert on public.pack_publishes to authenticated;

create policy "Team members can read publishes" on public.pack_publishes
  for select to authenticated using ((select public.is_team_member()));
create policy "Team members can record publishes" on public.pack_publishes
  for insert to authenticated with check ((select public.is_team_member()));
