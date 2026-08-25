-- Align the project-media public SELECT policy with the resource types the
-- bucket actually accepts.
--
-- Forward-only. Do not edit historical migrations.
-- MANUAL DEPLOY ONLY — see docs/RUNBOOK.md. Do not apply remotely from an agent task.
--
-- Background:
--   20250715000001_research_figure_storage.sql made `project-media` accept both
--   'project-media' and 'research-figure' resource types
--   (storage_bucket_allows_resource_type), and owner writes were extended to
--   match. The public read policy was never widened, so it still matches only
--   `storage_path_resource_type(name) = 'project-media'`.
--
--   Research figures are readable today purely because the `project-media`
--   bucket is public and Supabase's public object endpoint does not evaluate
--   RLS. Any read that does go through RLS (authenticated client reads, or the
--   bucket ever being flipped to private) is denied, and figures would break
--   with no policy explaining why.
--
-- This does not widen exposure: the bucket is already public, and the policy
-- keeps requiring a canonical owner-scoped path. It only makes the RLS grant
-- state the intent that 20250715000001 documented.

DROP POLICY IF EXISTS storage_project_media_public_select ON storage.objects;

CREATE POLICY storage_project_media_public_select ON storage.objects
  FOR SELECT TO public
  USING (
    bucket_id = 'project-media'
    AND public.storage_canonical_path_valid(name)
    AND public.storage_bucket_allows_resource_type(
      bucket_id,
      public.storage_path_resource_type(name)
    )
  );

COMMENT ON FUNCTION public.storage_bucket_allows_resource_type(text, text) IS
  'Single source of truth for which canonical resource types a bucket may hold. Used by both owner-write authorization and the project-media public read policy so the two cannot drift.';
