-- LOCAL DEVELOPMENT ONLY. Never run this against the cloud project.
--
-- Creates one Admin Portal account on the local Supabase stack so a fresh clone can sign in:
--   email:    team@tahak.local
--   password: tahak-local
-- and lists it in team_members, which ships empty (see the admin_portal_team_writes migration).
--
-- Applied by scripts/dev-setup.sh with `supabase db query --local`. It is deliberately not in
-- config.toml's [db.seed] sql_paths, so `db push --include-seed` can never send it to the cloud.
-- Safe to run again.

begin;

insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   confirmation_token, recovery_token, email_change_token_new, email_change)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-00000000a11c',
   'authenticated', 'authenticated', 'team@tahak.local',
   extensions.crypt('tahak-local', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into auth.identities
  (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
values
  ('00000000-0000-4000-8000-00000000a11c', '00000000-0000-4000-8000-00000000a11c',
   '00000000-0000-4000-8000-00000000a11c', 'email',
   '{"sub":"00000000-0000-4000-8000-00000000a11c","email":"team@tahak.local","email_verified":true}',
   now(), now(), now())
on conflict do nothing;

insert into public.team_members (email) values ('team@tahak.local') on conflict do nothing;

commit;
