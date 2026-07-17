-- WS11-T010: Storage resource ownership + upload intent ledger for orphan reconciliation.
-- Local forward-only migration. Do not apply remotely from this task.

-- Path segment 4 = resource UUID
CREATE OR REPLACE FUNCTION public.storage_path_resource_id(path text)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN public.storage_canonical_path_valid(path) THEN (string_to_array(path, '/'))[4]::uuid
    ELSE NULL::uuid
  END;
$$;

COMMENT ON FUNCTION public.storage_path_resource_id(text) IS
  'WS11-T010: extract resource UUID from canonical storage path';

-- Require the path resource_id to belong to the authenticated owner.
CREATE OR REPLACE FUNCTION public.storage_object_resource_owned(object_path text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  rtype text;
  rid uuid;
  tid uuid;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN false;
  END IF;
  IF NOT public.storage_canonical_path_valid(object_path) THEN
    RETURN false;
  END IF;

  rtype := public.storage_path_resource_type(object_path);
  rid := public.storage_path_resource_id(object_path);
  tid := public.storage_path_tenant_id(object_path);
  IF rid IS NULL OR tid IS NULL OR rtype IS NULL THEN
    RETURN false;
  END IF;

  IF rtype = 'avatar' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = rid AND p.owner_user_id = uid AND p.tenant_id = tid
    );
  END IF;

  IF rtype = 'project-media' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = rid AND p.owner_user_id = uid AND p.tenant_id = tid
    );
  END IF;

  IF rtype = 'research-figure' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.research_papers rp
      WHERE rp.id = rid AND rp.owner_user_id = uid AND rp.tenant_id = tid
    );
  END IF;

  -- private-doc remains product-disabled for client writes.
  RETURN false;
END;
$$;

COMMENT ON FUNCTION public.storage_object_resource_owned(text) IS
  'WS11-T010: path resource_id must reference an owned profile/project/research row';

CREATE OR REPLACE FUNCTION public.storage_object_owner_may_write(bucket_id text, object_path text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT bucket_id IN ('avatars', 'project-media', 'private-docs')
    AND public.storage_canonical_path_valid(object_path)
    AND public.storage_bucket_allows_resource_type(bucket_id, public.storage_path_resource_type(object_path))
    AND public.storage_path_owner_user_id(object_path) = auth.uid()
    AND public.storage_path_tenant_id(object_path) IN (SELECT public.user_tenant_ids())
    AND public.storage_object_resource_owned(object_path);
$$;

-- Intent ledger: signed upload issued but not yet finalized.
CREATE TABLE IF NOT EXISTS storage_upload_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  bucket text NOT NULL,
  object_path text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  mime_type text NOT NULL,
  max_bytes integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  finalized_at timestamptz,
  abandoned_at timestamptz,
  CONSTRAINT storage_upload_intents_path_unique UNIQUE (object_path)
);

COMMENT ON TABLE storage_upload_intents IS
  'WS11-T010: signed-upload ledger for completion tracking and orphan reconciliation';

CREATE INDEX IF NOT EXISTS idx_storage_upload_intents_open
  ON storage_upload_intents (created_at)
  WHERE finalized_at IS NULL AND abandoned_at IS NULL;

ALTER TABLE storage_upload_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_upload_intents FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE storage_upload_intents FROM anon;
REVOKE ALL ON TABLE storage_upload_intents FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE storage_upload_intents TO service_role;

-- Owners may insert/select/update their own open intents (finalize / abandon via app).
CREATE POLICY storage_upload_intents_owner_insert ON storage_upload_intents
  FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY storage_upload_intents_owner_select ON storage_upload_intents
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

CREATE POLICY storage_upload_intents_owner_update ON storage_upload_intents
  FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());
