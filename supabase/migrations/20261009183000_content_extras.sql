-- Optional content columns for real Destination content (issue #5). Additive only: every column
-- is nullable, so the app's pack store, which reads the original columns, is unaffected (it
-- selects * and ignores fields it does not know).
--
--   trails.name_fil              Filipino name of the Trail, for the Filipino UI.
--   waypoints.name_fil           Filipino name of the Waypoint.
--   waypoints.note               Short caution or context shown with the Waypoint
--                                (e.g. "treat the water before drinking").
--   reference_passages.sources   Every source of the passage, as a JSON array of
--                                {title, url, published, accessed}. `source` keeps a short,
--                                readable summary for display.
--   reference_passages.as_of     When the passage's newest dated fact was reported
--                                ('YYYY-MM' or 'YYYY-MM-DD'). Fees and rules change.
--
-- The tables' existing select grants and read-only RLS policies cover the new columns.

alter table public.trails add column name_fil text;

alter table public.waypoints add column name_fil text;
alter table public.waypoints add column note text;

alter table public.reference_passages add column sources jsonb
  check (sources is null or jsonb_typeof(sources) = 'array');
alter table public.reference_passages add column as_of text;
