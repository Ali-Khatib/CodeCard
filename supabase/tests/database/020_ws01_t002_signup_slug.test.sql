-- WS01-T002: Signup slug normalization, collision handling, and provisioning.
--
-- Run (requires Docker + local Supabase):
--   npx supabase start
--   npx supabase test db

begin;

select plan(16);

-- ---------------------------------------------------------------------------
-- normalize_signup_slug() unit tests
-- ---------------------------------------------------------------------------

select is(
  public.normalize_signup_slug('My-Cool-Slug', null, 'x@y.com', gen_random_uuid()),
  'my-cool-slug',
  'requested valid slug is lowercased and normalized'
);

select is(
  public.normalize_signup_slug('  UPPER SPACE  ', null, 'x@y.com', gen_random_uuid()),
  'upper-space',
  'uppercase and spaces normalize to hyphenated slug'
);

select is(
  public.normalize_signup_slug('ab', 'Jane Doe', 'fallback@y.com', gen_random_uuid()),
  'jane-doe',
  'invalid metadata slug falls back to display name'
);

select is(
  public.normalize_signup_slug('---', null, 'john.doe@y.com', gen_random_uuid()),
  'john-doe',
  'empty-after-normalize slug falls back to email local-part'
);

-- ---------------------------------------------------------------------------
-- Integration: metadata slug is used on signup
-- ---------------------------------------------------------------------------

create temp table ws02_user_requested on commit drop as
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
    'ws02-requested-' || gen_random_uuid()::text || '@example.com',
    crypt('ws02-password', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Requested User","slug":"requested-slug"}'::jsonb
  )
  returning id
)
select id as user_id from new_user;

select is(
  (
    select p.slug
    from profiles p
    join ws02_user_requested u on u.user_id = p.owner_user_id
  ),
  'requested-slug',
  'signup uses requested slug metadata on profile'
);

select is(
  (
    select t.slug
    from tenants t
    join tenant_memberships tm on tm.tenant_id = t.id
    join ws02_user_requested u on u.user_id = tm.user_id
  ),
  'requested-slug',
  'signup uses requested slug metadata on tenant'
);

-- ---------------------------------------------------------------------------
-- Collision: existing tenant slug receives numeric suffix
-- ---------------------------------------------------------------------------

insert into tenants (name, slug)
values ('Pre-existing Tenant', 'taken-slug-ws02');

create temp table ws02_user_collision on commit drop as
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
    'ws02-collision-' || gen_random_uuid()::text || '@example.com',
    crypt('ws02-password', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Collision User","slug":"taken-slug-ws02"}'::jsonb
  )
  returning id
)
select id as user_id from new_user;

select is(
  (
    select p.slug
    from profiles p
    join ws02_user_collision u on u.user_id = p.owner_user_id
  ),
  'taken-slug-ws02-2',
  'duplicate slug receives a unique numeric suffix'
);

select is(
  (select slug from tenants where name = 'Pre-existing Tenant'),
  'taken-slug-ws02',
  'existing tenant slug is not modified'
);

-- ---------------------------------------------------------------------------
-- Duplicate email-prefix signups both succeed with unique tenant slugs
-- ---------------------------------------------------------------------------

create temp table ws02_user_prefix_a on commit drop as
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
    'john.doe@example.com',
    crypt('ws02-password', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"John Doe"}'::jsonb
  )
  returning id
)
select id as user_id from new_user;

create temp table ws02_user_prefix_b on commit drop as
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
    'john.doe@other.com',
    crypt('ws02-password', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"John Doe"}'::jsonb
  )
  returning id
)
select id as user_id from new_user;

select is(
  (
    select t.slug
    from tenants t
    join tenant_memberships tm on tm.tenant_id = t.id
    join ws02_user_prefix_a u on u.user_id = tm.user_id
  ),
  'john-doe',
  'first email-prefix signup keeps base slug'
);

select is(
  (
    select t.slug
    from tenants t
    join tenant_memberships tm on tm.tenant_id = t.id
    join ws02_user_prefix_b u on u.user_id = tm.user_id
  ),
  'john-doe-2',
  'second email-prefix signup receives unique suffix instead of failing'
);

-- ---------------------------------------------------------------------------
-- Provisioning and ownership remain correct
-- ---------------------------------------------------------------------------

select is(
  (
    select count(*)::int
    from tenant_memberships tm
    join ws02_user_collision u on u.user_id = tm.user_id
  ),
  1,
  'collision signup still creates exactly one membership'
);

select is(
  (
    select count(*)::int
    from profiles p
    join ws02_user_collision u on u.user_id = p.owner_user_id
  ),
  1,
  'collision signup still creates exactly one profile'
);

select is(
  (
    select tm.role::text
    from tenant_memberships tm
    join ws02_user_collision u on u.user_id = tm.user_id
  ),
  'owner',
  'collision signup membership role remains owner'
);

select is(
  (
    select p.tenant_id
    from profiles p
    join ws02_user_collision u on u.user_id = p.owner_user_id
  ),
  (
    select tm.tenant_id
    from tenant_memberships tm
    join ws02_user_collision u on u.user_id = tm.user_id
  ),
  'collision signup profile tenant matches membership tenant'
);

select * from finish();

rollback;
