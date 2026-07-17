-- WS11-T001: Executable RLS integration suite (complete application matrix).
--
-- Run (requires Docker + local Supabase — do NOT use production):
--   npx supabase start
--   npx supabase test db
--
-- When Docker is unavailable, contract tests in
-- apps/web/src/lib/security/rls-access-matrix.contract.test.ts still run.
--
-- Fixtures use disposable UUIDs only. Never seeds live-demo profile data.

begin;

select plan(42);

-- ---------------------------------------------------------------------------
-- Catalog: every application table has FORCE RLS
-- ---------------------------------------------------------------------------

select ok(
  (
    select bool_and(c.relrowsecurity and c.relforcerowsecurity)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname in (
        'tenants','tenant_memberships','profiles','profile_links','projects',
        'project_domains','project_focus_areas','project_media_assets','project_links',
        'project_orderings','research_papers','research_figures','saved_connections',
        'connection_notes','collections','collection_items','circle_activity',
        'circle_viewer_state','public_profile_events','project_view_events',
        'analytics_events','subscription_customers','subscriptions','billing_events',
        'moderation_reports','dmca_notices','audit_logs','jobs',
        'account_deletion_operations'
      )
  ),
  'all application tables have ENABLE + FORCE RLS'
);

select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename in (
        'saved_connections','connection_notes','collections','collection_items',
        'circle_viewer_state','subscriptions','subscription_customers'
      )
      and cmd in ('SELECT','ALL')
      and qual = 'true'
  ),
  'owner-private tables have no USING (true) SELECT/ALL policies'
);

select ok(
  not exists (
    select 1 from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'account_deletion_operations'
      and grantee in ('anon','authenticated')
  ),
  'account_deletion_operations grants revoked from anon/authenticated'
);

-- ---------------------------------------------------------------------------
-- Disposable users A (owner) and B (non-owner)
-- ---------------------------------------------------------------------------

create temporary table ws11_users on commit drop as
select
  gen_random_uuid() as user_a,
  gen_random_uuid() as user_b;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
)
select
  '00000000-0000-0000-0000-000000000000',
  u.id,
  'authenticated',
  'authenticated',
  'ws11-t001-' || u.label || '-' || u.id::text || '@example.com',
  crypt('ws11-t001-password', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb
from (
  select user_a as id, 'a' as label from ws11_users
  union all
  select user_b, 'b' from ws11_users
) u;

-- handle_new_user should have provisioned tenant + profile; capture them
create temporary table ws11_ctx on commit drop as
select
  a.id as user_a,
  b.id as user_b,
  pa.id as profile_a,
  pb.id as profile_b,
  pa.tenant_id as tenant_a,
  pb.tenant_id as tenant_b
from ws11_users w
join auth.users a on a.id = w.user_a
join auth.users b on b.id = w.user_b
join public.profiles pa on pa.owner_user_id = a.id
join public.profiles pb on pb.owner_user_id = b.id;

select ok((select count(*) = 2 from ws11_ctx), 'provisioned two isolated profiles');

-- Make A public with published project + research for visibility cases
update public.profiles
set is_public = true, display_name = 'WS11 Owner A'
where id = (select profile_a from ws11_ctx);

update public.profiles
set is_public = true, display_name = 'WS11 User B'
where id = (select profile_b from ws11_ctx);

insert into public.projects (
  id, tenant_id, profile_id, owner_user_id, title, slug, is_published, status
)
select
  gen_random_uuid(), tenant_a, profile_a, user_a,
  'WS11 Draft Project', 'ws11-draft-project', false, 'draft'
from ws11_ctx;

insert into public.projects (
  id, tenant_id, profile_id, owner_user_id, title, slug, is_published, status
)
select
  gen_random_uuid(), tenant_a, profile_a, user_a,
  'WS11 Public Project', 'ws11-public-project', true, 'published'
from ws11_ctx;

insert into public.research_papers (
  id, tenant_id, profile_id, owner_user_id, title, slug, is_published, publication_status
)
select
  gen_random_uuid(), tenant_a, profile_a, user_a,
  'WS11 Draft Paper', 'ws11-draft-paper', false, 'draft'
from ws11_ctx;

insert into public.research_papers (
  id, tenant_id, profile_id, owner_user_id, title, slug, is_published, publication_status
)
select
  gen_random_uuid(), tenant_a, profile_a, user_a,
  'WS11 Public Paper', 'ws11-public-paper', true, 'published'
from ws11_ctx;

insert into public.saved_connections (
  id, tenant_id, owner_user_id, saved_profile_id
)
select gen_random_uuid(), tenant_a, user_a, profile_b
from ws11_ctx;

insert into public.connection_notes (
  id, tenant_id, owner_user_id, saved_connection_id, body
)
select gen_random_uuid(), sc.tenant_id, sc.owner_user_id, sc.id, 'private note for B'
from public.saved_connections sc
join ws11_ctx c on c.user_a = sc.owner_user_id and c.profile_b = sc.saved_profile_id;

insert into public.circle_activity (
  id, tenant_id, actor_profile_id, event_type, target_type, target_id, dedupe_key
)
select
  gen_random_uuid(), tenant_b, profile_b, 'project_published', 'project',
  (select id from public.projects where owner_user_id = (select user_b from ws11_ctx) limit 1),
  'ws11-test-dedupe-' || gen_random_uuid()::text
from ws11_ctx
where exists (
  select 1 from public.projects where owner_user_id = (select user_b from ws11_ctx)
);

-- Ensure B has a published project for circle activity target check
insert into public.projects (
  id, tenant_id, profile_id, owner_user_id, title, slug, is_published, status
)
select
  gen_random_uuid(), tenant_b, profile_b, user_b,
  'WS11 B Public Project', 'ws11-b-public-project', true, 'published'
from ws11_ctx
on conflict do nothing;

delete from public.circle_activity
where dedupe_key like 'ws11-test-dedupe-%';

insert into public.circle_activity (
  id, tenant_id, actor_profile_id, event_type, target_type, target_id, dedupe_key, created_at
)
select
  gen_random_uuid(), c.tenant_b, c.profile_b, 'project_published', 'project',
  p.id, 'ws11-test-dedupe-' || p.id::text, now()
from ws11_ctx c
join public.projects p on p.owner_user_id = c.user_b and p.slug = 'ws11-b-public-project';

insert into public.circle_viewer_state (viewer_user_id, last_seen_at)
select user_a, now() - interval '1 day' from ws11_ctx;

-- ---------------------------------------------------------------------------
-- Helper: set JWT role for auth.uid()
-- ---------------------------------------------------------------------------

create or replace function pg_temp.set_auth(uid uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', uid::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('role', 'authenticated', true);
end;
$$;

create or replace function pg_temp.clear_auth()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('role', 'anon', true);
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles / projects / research visibility
-- ---------------------------------------------------------------------------

select lives_ok(
  $$select pg_temp.clear_auth()$$,
  'switch to anon'
);

select is(
  (select count(*)::int from public.profiles where display_name = 'WS11 Owner A'),
  1,
  'anon can read public profile A'
);

select is(
  (select count(*)::int from public.projects where slug = 'ws11-public-project'),
  1,
  'anon can read published project'
);

select is(
  (select count(*)::int from public.projects where slug = 'ws11-draft-project'),
  0,
  'anon cannot read draft project'
);

select is(
  (select count(*)::int from public.research_papers where slug = 'ws11-public-paper'),
  1,
  'anon can read published research'
);

select is(
  (select count(*)::int from public.research_papers where slug = 'ws11-draft-paper'),
  0,
  'anon cannot read draft research'
);

-- ---------------------------------------------------------------------------
-- Cross-user project mutation denied
-- ---------------------------------------------------------------------------

select lives_ok(
  format(
    $$select pg_temp.set_auth(%L::uuid)$$,
    (select user_b from ws11_ctx)
  ),
  'authenticate as user B'
);

select lives_ok(
  format(
    $$update public.projects set title = 'hacked' where slug = 'ws11-public-project' and owner_user_id = %L::uuid$$,
    (select user_a from ws11_ctx)
  ),
  'user B update attempt against A project completes without privilege escalation'
);

select is(
  (select title from public.projects where slug = 'ws11-public-project'),
  'WS11 Public Project',
  'A project title unchanged after B update attempt'
);

select lives_ok(
  format(
    $$delete from public.projects where slug = 'ws11-public-project' and owner_user_id = %L::uuid$$,
    (select user_a from ws11_ctx)
  ),
  'user B delete attempt against A project completes without deleting'
);

select is(
  (select count(*)::int from public.projects where slug = 'ws11-public-project'),
  1,
  'A project still exists after B delete attempt'
);

-- ---------------------------------------------------------------------------
-- Connections privacy: target B cannot see A saved them / notes
-- ---------------------------------------------------------------------------

select is(
  (select count(*)::int from public.saved_connections where owner_user_id = (select user_a from ws11_ctx)),
  0,
  'target B cannot read A saved_connections'
);

select is(
  (select count(*)::int from public.connection_notes where body = 'private note for B'),
  0,
  'target B cannot read A private notes'
);

select lives_ok(
  format(
    $$select pg_temp.set_auth(%L::uuid)$$,
    (select user_a from ws11_ctx)
  ),
  'authenticate as owner A'
);

select is(
  (select count(*)::int from public.saved_connections where owner_user_id = (select user_a from ws11_ctx)),
  1,
  'owner A can read own Connections'
);

select is(
  (select count(*)::int from public.connection_notes where body = 'private note for B'),
  1,
  'owner A can read own private notes'
);

-- ---------------------------------------------------------------------------
-- Circle: connection-scoped select; viewer state owner-only
-- ---------------------------------------------------------------------------

select is(
  (select count(*)::int from public.circle_activity where actor_profile_id = (select profile_b from ws11_ctx)),
  1,
  'owner A sees B circle activity via Connection'
);

select is(
  (select count(*)::int from public.circle_viewer_state where viewer_user_id = (select user_a from ws11_ctx)),
  1,
  'owner A can read own circle_viewer_state'
);

select lives_ok(
  format(
    $$select pg_temp.set_auth(%L::uuid)$$,
    (select user_b from ws11_ctx)
  ),
  'authenticate as user B for circle isolation'
);

select is(
  (select count(*)::int from public.circle_viewer_state where viewer_user_id = (select user_a from ws11_ctx)),
  0,
  'actor B cannot read A circle_viewer_state'
);

select lives_ok(
  $$select pg_temp.clear_auth()$$,
  'clear auth for anon circle checks'
);

select is(
  (select count(*)::int from public.circle_activity),
  0,
  'anon cannot read circle_activity'
);

select is(
  (select count(*)::int from public.circle_viewer_state),
  0,
  'anon cannot read circle_viewer_state'
);

-- ---------------------------------------------------------------------------
-- Owner can manage own content
-- ---------------------------------------------------------------------------

select lives_ok(
  format(
    $$select pg_temp.set_auth(%L::uuid)$$,
    (select user_a from ws11_ctx)
  ),
  'authenticate as A for owner writes'
);

select lives_ok(
  $$update public.projects set title = 'WS11 Public Project Renamed' where slug = 'ws11-public-project'$$,
  'owner A can update own published project'
);

select is(
  (select title from public.projects where slug = 'ws11-public-project'),
  'WS11 Public Project Renamed',
  'owner update persisted'
);

-- ---------------------------------------------------------------------------
-- Jobs / deletion ops inaccessible to authenticated
-- ---------------------------------------------------------------------------

select is(
  (select count(*)::int from public.jobs),
  0,
  'authenticated client sees zero jobs rows'
);

select throws_ok(
  $$insert into public.account_deletion_operations (id, user_id, status) values (gen_random_uuid(), gen_random_uuid(), 'pending')$$,
  null,
  null,
  'authenticated cannot insert account_deletion_operations'
);

-- ---------------------------------------------------------------------------
-- Storage policy catalog presence
-- ---------------------------------------------------------------------------

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'storage' and policyname = 'storage_objects_owner_insert'
  ),
  'storage owner insert policy exists'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'storage' and policyname = 'storage_private_docs_owner_select'
  ),
  'private-docs owner select policy exists'
);

select ok(
  not exists (
    select 1 from storage.buckets where id = 'private-docs' and public = true
  ),
  'private-docs bucket is not public'
);

select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'user_tenant_ids' and p.prosecdef
  ),
  'user_tenant_ids is SECURITY DEFINER'
);

select ok(
  not has_function_privilege('authenticated', 'claim_storage_cleanup_jobs(integer, integer)', 'execute'),
  'authenticated cannot execute claim_storage_cleanup_jobs'
);

select ok(
  not has_function_privilege('anon', 'claim_storage_cleanup_jobs(integer, integer)', 'execute'),
  'anon cannot execute claim_storage_cleanup_jobs'
);

-- ---------------------------------------------------------------------------
-- Cleanup disposable rows (best-effort; transaction rolls back at end)
-- ---------------------------------------------------------------------------

select lives_ok(
  format(
    $$select pg_temp.set_auth(%L::uuid)$$,
    (select user_a from ws11_ctx)
  ),
  're-auth A for cleanup'
);

select diag('WS11-T001 RLS integration checks completed (disposable fixtures)');

select * from finish();

rollback;
