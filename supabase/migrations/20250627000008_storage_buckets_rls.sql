-- WS04-T001: Storage buckets and owner-scoped RLS for canonical object paths.
-- Path shape: {tenant_id}/{owner_user_id}/{resource_type}/{resource_id}/{generated_filename}

-- Buckets (public avatars/project-media for existing public URL rendering; private-docs remain private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'avatars',
    'avatars',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
  ),
  (
    'project-media',
    'project-media',
    true,
    52428800,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm']::text[]
  ),
  (
    'private-docs',
    'private-docs',
    false,
    10485760,
    ARRAY['application/pdf']::text[]
  )
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.storage_canonical_segment_valid(segment text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT segment IS NOT NULL
    AND btrim(segment) = segment
    AND segment <> ''
    AND segment !~ '[/\\]'
    AND segment !~ '\.\.'
    AND segment !~ '[[:cntrl:]]'
    AND char_length(segment) BETWEEN 1 AND 128;
$$;

CREATE OR REPLACE FUNCTION public.storage_resource_type_valid(resource_type text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT resource_type IN ('avatar', 'project-media', 'private-doc');
$$;

CREATE OR REPLACE FUNCTION public.storage_bucket_allows_resource_type(bucket_id text, resource_type text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE bucket_id
    WHEN 'avatars' THEN resource_type = 'avatar'
    WHEN 'project-media' THEN resource_type = 'project-media'
    WHEN 'private-docs' THEN resource_type = 'private-doc'
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION public.storage_generated_filename_valid(filename text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT filename ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[a-z0-9]{2,5}$';
$$;

CREATE OR REPLACE FUNCTION public.storage_canonical_path_valid(path text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  parts text[];
BEGIN
  IF path IS NULL OR path = '' OR path LIKE '/%' OR path LIKE '%/' THEN
    RETURN false;
  END IF;

  IF position(E'\\' IN path) > 0
    OR position('%' IN path) > 0
    OR position('#' IN path) > 0
    OR position('?' IN path) > 0 THEN
    RETURN false;
  END IF;

  parts := string_to_array(path, '/');
  IF array_length(parts, 1) IS DISTINCT FROM 5 THEN
    RETURN false;
  END IF;

  IF NOT public.storage_canonical_segment_valid(parts[1])
    OR NOT public.storage_canonical_segment_valid(parts[2])
    OR NOT public.storage_canonical_segment_valid(parts[3])
    OR NOT public.storage_canonical_segment_valid(parts[4])
    OR NOT public.storage_generated_filename_valid(parts[5]) THEN
    RETURN false;
  END IF;

  BEGIN
    PERFORM parts[1]::uuid;
    PERFORM parts[2]::uuid;
    PERFORM parts[4]::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN false;
  END;

  RETURN public.storage_resource_type_valid(parts[3]);
END;
$$;

CREATE OR REPLACE FUNCTION public.storage_path_tenant_id(path text)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN public.storage_canonical_path_valid(path) THEN (string_to_array(path, '/'))[1]::uuid
    ELSE NULL::uuid
  END;
$$;

CREATE OR REPLACE FUNCTION public.storage_path_owner_user_id(path text)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN public.storage_canonical_path_valid(path) THEN (string_to_array(path, '/'))[2]::uuid
    ELSE NULL::uuid
  END;
$$;

CREATE OR REPLACE FUNCTION public.storage_path_resource_type(path text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN public.storage_canonical_path_valid(path) THEN (string_to_array(path, '/'))[3]
    ELSE NULL::text
  END;
$$;

CREATE OR REPLACE FUNCTION public.storage_object_owner_may_write(bucket_id text, object_path text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT bucket_id IN ('avatars', 'project-media', 'private-docs')
    AND public.storage_canonical_path_valid(object_path)
    AND public.storage_bucket_allows_resource_type(bucket_id, public.storage_path_resource_type(object_path))
    AND public.storage_path_owner_user_id(object_path) = auth.uid()
    AND public.storage_path_tenant_id(object_path) IN (SELECT public.user_tenant_ids());
$$;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

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
