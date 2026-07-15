-- WS04-T008: Research figure uploads — storage_path + research-figure resource type.
-- Forward-only. Do not edit historical migrations.
-- Buckets stay unchanged: research-figure objects live in project-media (public object reads; UUID paths).
-- Ownership always resolves research_figures → research_papers → authenticated owner (app layer + path owner segment).

ALTER TABLE research_figures
  ADD COLUMN IF NOT EXISTS storage_path text;

COMMENT ON COLUMN research_figures.storage_path IS
  'Canonical owner-scoped storage object key for CodeCard-hosted research figures. Authoritative reference. Never store signed URLs, Blob URLs, or generated public URLs here.';

COMMENT ON COLUMN research_figures.image_url IS
  'Legacy or external display reference. Uploaded figures keep storage_path authoritative; image_url may mirror the path for NOT NULL compatibility or hold an external HTTPS URL for legacy rows.';

CREATE INDEX IF NOT EXISTS idx_research_figures_storage_path
  ON research_figures (storage_path)
  WHERE storage_path IS NOT NULL;

CREATE OR REPLACE FUNCTION public.storage_resource_type_valid(resource_type text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT resource_type IN ('avatar', 'project-media', 'private-doc', 'research-figure');
$$;

CREATE OR REPLACE FUNCTION public.storage_bucket_allows_resource_type(bucket_id text, resource_type text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE bucket_id
    WHEN 'avatars' THEN resource_type = 'avatar'
    WHEN 'project-media' THEN resource_type IN ('project-media', 'research-figure')
    WHEN 'private-docs' THEN resource_type = 'private-doc'
    ELSE false
  END;
$$;
