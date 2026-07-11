-- WS02-T002: Profile location and skills migration contract.
--
-- Run (requires Docker + local Supabase):
--   npx supabase start
--   npx supabase test db
--
-- Docker is unavailable in CI for this workspace; tests are added but not executed here.

begin;

select plan(13);

select has_column('public', 'profiles', 'location', 'profiles.location column exists');

select col_type_is('public', 'profiles', 'location', 'text', 'profiles.location is text');

select col_not_null('public', 'profiles', 'skills', 'profiles.skills is NOT NULL');

select col_has_default('public', 'profiles', 'skills', 'profiles.skills has a default');

select is(
  (
    select column_default
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'skills'
  ),
  '''{}''::text[]',
  'profiles.skills default is empty text array'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'profiles_location_length_chk'
  ),
  'profiles_location_length_chk exists'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'profiles_skills_count_chk'
  ),
  'profiles_skills_count_chk exists'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'profiles_skills_item_length_chk'
  ),
  'profiles_skills_item_length_chk exists'
);

select col_is_null('public', 'profiles', 'location', 'profiles.location allows NULL');

select ok(
  (
    select coalesce(bool_and(location is null), true)
    from profiles
  ),
  'existing profile rows keep NULL location after migration'
);

select is(
  (select skills from profiles limit 1),
  '{}'::text[],
  'existing profile rows default skills to empty array'
);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'handle_new_user'
  ),
  'signup provisioning trigger function still exists after migration'
);

select * from finish();

rollback;
