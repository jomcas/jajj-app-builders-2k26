-- The 'maps' Storage bucket: one PMTiles map file per Destination, at the path stored in
-- destinations.map_path (e.g. 'batulao.pmtiles').
--
-- Public, so the app downloads with a plain GET on
--   <SUPABASE_URL>/storage/v1/object/public/maps/<map_path>
-- and no key. There are no policies on storage.objects for this bucket, so anon and
-- authenticated users cannot upload, change or delete files. Uploads go through the service
-- role (supabase/seed/seed-batulao.sh uses the CLI, which does).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('maps', 'maps', true, 52428800, array['application/vnd.pmtiles', 'application/octet-stream'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
