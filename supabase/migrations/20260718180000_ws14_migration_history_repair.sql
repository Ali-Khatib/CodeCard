-- WS14 idempotent compatibility migration.
--
-- History:
--   * Commit 37b5f78 (WS14 E2E bootstrap) edited migrations 007 and 008 in place.
--   * A later remediation restored 007/008 to their original authored content and
--     carried the corrections here, but that left the chain un-replayable from a
--     fresh database: 007's original inline subquery CHECK aborts at SQLSTATE 0A000
--     before this migration is ever reached.
--   * Migrations 007 and 008 are now corrected in place (they were never deployed
--     to production and never successfully applied anywhere, so the forward-only
--     "never edit shipped migrations" rule does not apply to them). See:
--       - 20250627000007_profile_location_skills.sql (IMMUTABLE helper + CHECK)
--       - 20250627000008_storage_buckets_rls.sql (guarded, verified RLS enable)
--
-- Purpose now: a purely idempotent compatibility pass for any environment that
-- applied the intermediate (bootstrap-era) schema before 007/008 were corrected.
-- On a fresh replay it re-asserts the exact same helper, constraint, RLS state and
-- storage policies that corrected 007/008 already established, so it is a safe
-- no-op that never conflicts with them. It is retained (not deleted) so migration
-- history is not rewritten to hide the intermediate state.
--
-- Idempotent and safe for both fresh and already-provisioned databases. Depends on
-- the storage helper functions created in 20250627000008_storage_buckets_rls.sql.

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
