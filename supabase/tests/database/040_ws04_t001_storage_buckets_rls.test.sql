-- WS04-T001: Storage buckets and RLS migration contract.
--
-- Run (requires Docker + local Supabase):
--   npx supabase start
--   npx supabase test db
--
-- Docker is unavailable in CI for this workspace; tests are added but not executed here.

begin;

select plan(18);

select ok(
  exists (
    select 1
    from storage.buckets
    where id = 'avatars'
      and public = true
      and file_size_limit = 5242880
  ),
  'avatars bucket exists with public visibility and 5 MB limit'
);

select ok(
  exists (
    select 1
    from storage.buckets
    where id = 'project-media'
      and public = true
      and file_size_limit = 52428800
  ),
  'project-media bucket exists with public visibility and 50 MB limit'
);

select ok(
  exists (
    select 1
    from storage.buckets
    where id = 'private-docs'
      and public = false
      and file_size_limit = 10485760
  ),
  'private-docs bucket exists as private with 10 MB limit'
);

select ok(
  (select allowed_mime_types from storage.buckets where id = 'avatars')
    @> ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[],
  'avatars bucket restricts image MIME types'
);

select ok(
  (select allowed_mime_types from storage.buckets where id = 'private-docs')
    = ARRAY['application/pdf']::text[],
  'private-docs bucket restricts PDF MIME type'
);

select has_function('public', 'storage_canonical_path_valid', ARRAY['text'], 'storage_canonical_path_valid exists');

select has_function('public', 'storage_object_owner_may_write', ARRAY['text', 'text'], 'storage_object_owner_may_write exists');

select ok(
  public.storage_canonical_path_valid(
    '11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/avatar/33333333-3333-4333-8333-333333333333/44444444-4444-4444-8444-444444444444.webp'
  ),
  'valid canonical owner path is accepted'
);

select ok(
  NOT public.storage_canonical_path_valid(
    '11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/avatar/33333333-3333-4333-8333-333333333333/../44444444-4444-4444-8444-444444444444.webp'
  ),
  'traversal path is rejected'
);

select ok(
  NOT public.storage_canonical_path_valid('only/three/segments'),
  'malformed path segment count is rejected'
);

select ok(
  public.storage_bucket_allows_resource_type('avatars', 'avatar'),
  'avatars bucket allows avatar resource type'
);

select ok(
  NOT public.storage_bucket_allows_resource_type('private-docs', 'avatar'),
  'private-docs bucket rejects avatar resource type'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'storage_objects_owner_insert'
  ),
  'owner insert policy exists'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'storage_private_docs_owner_select'
  ),
  'private-docs owner select policy exists'
);

select ok(
  NOT exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'storage_private_docs_public_select'
  ),
  'private-docs are not publicly readable'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'storage_avatars_public_select'
  ),
  'avatars public read policy exists'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'storage_objects_owner_delete'
  ),
  'owner delete policy exists'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'storage_objects_owner_update'
  ),
  'owner update policy exists'
);

select finish();

rollback;
