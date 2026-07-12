-- WS03-T002: Project foundation fields migration contract.
--
-- Run (requires Docker + local Supabase):
--   npx supabase start
--   npx supabase test db
--
-- Docker is unavailable in CI for this workspace; tests are added but not executed here.

begin;

select plan(16);

select has_column('public', 'projects', 'slug', 'projects.slug column exists');
select has_column('public', 'projects', 'user_role', 'projects.user_role column exists');
select has_column('public', 'projects', 'started_at', 'projects.started_at column exists');
select has_column('public', 'projects', 'ended_at', 'projects.ended_at column exists');
select has_column('public', 'projects', 'status', 'projects.status column exists');

select col_type_is('public', 'projects', 'slug', 'text', 'projects.slug is text');
select col_type_is('public', 'projects', 'user_role', 'text', 'projects.user_role is text');
select col_type_is('public', 'projects', 'started_at', 'date', 'projects.started_at is date');
select col_type_is('public', 'projects', 'ended_at', 'date', 'projects.ended_at is date');
select col_type_is('public', 'projects', 'status', 'text', 'projects.status is text');

select col_not_null('public', 'projects', 'slug', 'projects.slug is NOT NULL after backfill');

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'projects_profile_slug_unique'
  ),
  'projects_profile_slug_unique exists'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'projects_date_range_chk'
  ),
  'projects_date_range_chk exists'
);

select col_is_null('public', 'projects', 'user_role', 'projects.user_role allows NULL');
select col_is_null('public', 'projects', 'started_at', 'projects.started_at allows NULL');
select col_is_null('public', 'projects', 'ended_at', 'projects.ended_at allows NULL');
select col_is_null('public', 'projects', 'status', 'projects.status allows NULL');

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'projects_assign_slug_before_insert'
  ),
  'projects_assign_slug_before_insert trigger exists'
);

select * from finish();

rollback;
