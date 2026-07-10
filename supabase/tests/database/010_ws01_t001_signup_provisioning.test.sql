-- WS01-T001: Verify sign-up provisioning via handle_new_user() trigger.
--
-- Run (requires Docker + local Supabase):
--   npx supabase start
--   npx supabase test db
--
-- Manual verification when Docker is unavailable:
--   1. Sign up at /sign-up with a fresh email.
--   2. In Supabase SQL editor (service role), run:
--        SELECT u.id, u.email,
--               t.id AS tenant_id, t.slug AS tenant_slug,
--               tm.role,
--               p.id AS profile_id, p.owner_user_id, p.slug AS profile_slug, p.is_public
--        FROM auth.users u
--        JOIN tenant_memberships tm ON tm.user_id = u.id
--        JOIN tenants t ON t.id = tm.tenant_id
--        JOIN profiles p ON p.tenant_id = t.id AND p.owner_user_id = u.id
--        WHERE u.email = '<your-test-email>';
--   3. Expect exactly one row; role = owner; is_public = false; matching tenant/profile slugs.

begin;

select plan(18);

-- ---------------------------------------------------------------------------
-- Trigger contract (static checks against applied migration)
-- ---------------------------------------------------------------------------

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'handle_new_user'
  ),
  'handle_new_user() exists in public schema'
);

select is(
  (
    select p.prosecdef
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'handle_new_user'
  ),
  true,
  'handle_new_user() is SECURITY DEFINER'
);

select ok(
  (
    select strpos(pg_get_functiondef(p.oid), 'search_path = public') > 0
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'handle_new_user'
  ),
  'handle_new_user() sets search_path = public'
);

select ok(
  exists (
    select 1
    from pg_trigger tg
    join pg_class c on c.oid = tg.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth'
      and c.relname = 'users'
      and tg.tgname = 'on_auth_user_created'
      and not tg.tgisinternal
  ),
  'on_auth_user_created trigger is attached to auth.users'
);

-- ---------------------------------------------------------------------------
-- Integration: inserting auth.users provisions tenant, membership, profile
-- ---------------------------------------------------------------------------

create temp table ws01_user_a on commit drop as
with new_user as (
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'ws01-t001-display-' || gen_random_uuid()::text || '@example.com',
    crypt('ws01-t001-password', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"WS01 Display Name"}'::jsonb
  )
  returning id, email, raw_user_meta_data
)
select id as user_id, email, raw_user_meta_data from new_user;

select ok(
  exists (select 1 from auth.users u join ws01_user_a a on a.user_id = u.id),
  'auth user row is created'
);

select is(
  (
    select count(*)::int
    from tenant_memberships tm
    join ws01_user_a a on a.user_id = tm.user_id
  ),
  1,
  'exactly one tenant membership is created per signup'
);

select is(
  (
    select tm.role::text
    from tenant_memberships tm
    join ws01_user_a a on a.user_id = tm.user_id
  ),
  'owner',
  'membership role is owner'
);

select is(
  (
    select count(*)::int
    from profiles p
    join ws01_user_a a on a.user_id = p.owner_user_id
  ),
  1,
  'exactly one profile is created per signup'
);

select is(
  (
    select count(*)::int
    from tenants t
    join tenant_memberships tm on tm.tenant_id = t.id
    join ws01_user_a a on a.user_id = tm.user_id
  ),
  1,
  'exactly one tenant is created per signup'
);

select is(
  (
    select p.owner_user_id
    from profiles p
    join ws01_user_a a on a.user_id = p.owner_user_id
  ),
  (select user_id from ws01_user_a),
  'profile.owner_user_id matches auth user id'
);

select is(
  (
    select p.tenant_id
    from profiles p
    join ws01_user_a a on a.user_id = p.owner_user_id
  ),
  (
    select tm.tenant_id
    from tenant_memberships tm
    join ws01_user_a a on a.user_id = tm.user_id
  ),
  'profile.tenant_id matches membership.tenant_id'
);

select is(
  (
    select p.is_public
    from profiles p
    join ws01_user_a a on a.user_id = p.owner_user_id
  ),
  false,
  'new profile defaults to private (is_public = false)'
);

select is(
  (
    select p.display_name
    from profiles p
    join ws01_user_a a on a.user_id = p.owner_user_id
  ),
  'WS01 Display Name',
  'display_name metadata is used for profile display_name'
);

select is(
  (
    select t.name
    from tenants t
    join tenant_memberships tm on tm.tenant_id = t.id
    join ws01_user_a a on a.user_id = tm.user_id
  ),
  'WS01 Display Name',
  'display_name metadata is used for tenant name'
);

-- Missing optional metadata: falls back to email local-part
create temp table ws01_user_b on commit drop as
with new_user as (
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'fallbackuser-' || gen_random_uuid()::text || '@example.com',
    crypt('ws01-t001-password', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb
  )
  returning id, email
)
select id as user_id, split_part(email, '@', 1) as email_local from new_user;

select is(
  (
    select p.display_name
    from profiles p
    join ws01_user_b b on b.user_id = p.owner_user_id
  ),
  (select email_local from ws01_user_b),
  'missing display_name metadata falls back to email local-part'
);

-- RLS: another authenticated user cannot read a private profile they do not own
create temp table ws01_user_c on commit drop as
with new_user as (
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'ws01-t001-other-' || gen_random_uuid()::text || '@example.com',
    crypt('ws01-t001-password', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb
  )
  returning id
)
select id as user_id from new_user;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', (select user_id::text from ws01_user_c), 'role', 'authenticated')::text,
  true
);

select is(
  (
    select count(*)::int
    from profiles p
    join ws01_user_a a on a.user_id = p.owner_user_id
  ),
  0,
  'another user cannot read a private profile they do not own'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', (select user_id::text from ws01_user_a), 'role', 'authenticated')::text,
  true
);

select is(
  (
    select count(*)::int
    from profiles p
    join ws01_user_a a on a.user_id = p.owner_user_id
  ),
  1,
  'profile owner can read their own private profile'
);

select * from finish();

rollback;
