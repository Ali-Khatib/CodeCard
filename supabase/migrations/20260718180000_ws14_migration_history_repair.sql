-- WS14 migration-history repair (forward-only).
--
-- Commit 37b5f78 (WS14 E2E bootstrap) edited two already-shipped migrations in
-- place, breaking forward-only discipline:
--   * 20250627000007_profile_location_skills.sql
--   * 20250627000008_storage_buckets_rls.sql
-- Those files have been restored to their original authored content. The required
-- corrections are carried here instead, as a new forward-only migration.
--
-- Root causes corrected:
--   1. profiles_skills_item_length_chk originally embedded a subquery directly in a
--      CHECK constraint, which PostgreSQL rejects (SQLSTATE 0A000: "cannot use
--      subquery in check constraint"). The per-item rule is re-expressed through an
--      IMMUTABLE helper that depends only on its argument array -- it reads no
--      tables and no mutable state, so IMMUTABLE is accurate.
--   2. storage.objects RLS was enabled with a bare ALTER that fails on hosted
--      Supabase, where the table is owned by supabase_storage_admin (SQLSTATE
--      42501: "must be owner of table objects") and RLS is already enabled by the
--      platform. Enablement is guarded so it only runs where RLS is genuinely off,
--      and the owner-scoped policies are re-asserted so a skipped ALTER can never
--      silently leave required policies absent.
--
-- This migration is idempotent and safe for both fresh and already-provisioned
-- databases. It depends on the storage helper functions created in
-- 20250627000008_storage_buckets_rls.sql.

-- 1. Skills per-item length rule -------------------------------------------------

-- IMMUTABLE: result depends only on the argument array. search_path is pinned to
-- pg_catalog so the built-in unnest()/char_length() calls cannot be shadowed.
CREATE OR REPLACE FUNCTION public.profile_skills_items_valid(skills text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM unnest(skills) AS skill(value)
    WHERE char_length(skill.value) < 1 OR char_length(skill.value) > 50
  );
$$;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_skills_item_length_chk;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_skills_item_length_chk
    CHECK (public.profile_skills_items_valid(skills));

-- 2. storage.objects RLS + owner-scoped policies (hosted-compatible) -------------

-- Only toggle RLS where it is actually disabled (bare local Postgres). On hosted
-- Supabase RLS is already on and the migration role is not the table owner, so an
-- unconditional ALTER would abort the migration. Semantics are unchanged.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class
    WHERE oid = 'storage.objects'::regclass AND relrowsecurity
  ) THEN
    EXECUTE 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- Re-assert every owner-scoped / public-read policy so the guarded ALTER above can
-- never leave enforcement partially applied. DROP ... IF EXISTS keeps this
-- idempotent on databases that already carry the policies.
DROP POLICY IF EXISTS storage_objects_owner_insert ON storage.objects;
DROP POLICY IF EXISTS storage_objects_owner_update ON storage.objects;
DROP POLICY IF EXISTS storage_objects_owner_delete ON storage.objects;
DROP POLICY IF EXISTS storage_avatars_public_select ON storage.objects;
DROP POLICY IF EXISTS storage_project_media_public_select ON storage.objects;
DROP POLICY IF EXISTS storage_private_docs_owner_select ON storage.objects;

CREATE POLICY storage_objects_owner_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (public.storage_object_owner_may_write(bucket_id, name));

CREATE POLICY storage_objects_owner_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (public.storage_object_owner_may_write(bucket_id, name))
  WITH CHECK (public.storage_object_owner_may_write(bucket_id, name));

CREATE POLICY storage_objects_owner_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (public.storage_object_owner_may_write(bucket_id, name));

-- Public read for published-facing media buckets (object paths are unguessable UUID keys).
CREATE POLICY storage_avatars_public_select ON storage.objects
  FOR SELECT TO public
  USING (
    bucket_id = 'avatars'
    AND public.storage_canonical_path_valid(name)
    AND public.storage_path_resource_type(name) = 'avatar'
  );

CREATE POLICY storage_project_media_public_select ON storage.objects
  FOR SELECT TO public
  USING (
    bucket_id = 'project-media'
    AND public.storage_canonical_path_valid(name)
    AND public.storage_path_resource_type(name) = 'project-media'
  );

CREATE POLICY storage_private_docs_owner_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'private-docs'
    AND public.storage_object_owner_may_write(bucket_id, name)
  );
