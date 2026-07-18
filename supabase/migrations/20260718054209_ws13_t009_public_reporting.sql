-- WS13-T009: validated, privacy-preserving public profile/project reports.
-- Forward-only local migration. Do not apply remotely from this task.

ALTER TABLE public.moderation_reports
  ADD COLUMN IF NOT EXISTS reason_category text,
  ADD COLUMN IF NOT EXISTS description text
    CHECK (description IS NULL OR char_length(description) <= 1500),
  ADD COLUMN IF NOT EXISTS source_fingerprint text,
  ADD COLUMN IF NOT EXISTS dedupe_bucket timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_moderation_reports_source_dedupe
  ON public.moderation_reports (
    source_fingerprint,
    target_type,
    target_id,
    reason_category,
    dedupe_bucket
  )
  WHERE source_fingerprint IS NOT NULL
    AND reason_category IS NOT NULL
    AND dedupe_bucket IS NOT NULL;

-- T007 column grants intentionally continue to exclude private source/dedupe data.
REVOKE ALL ON TABLE public.moderation_reports FROM PUBLIC;
GRANT SELECT (
  id,
  tenant_id,
  reporter_user_id,
  target_type,
  target_id,
  reason,
  status,
  created_at,
  updated_at
) ON TABLE public.moderation_reports TO authenticated;
GRANT ALL ON TABLE public.moderation_reports TO service_role;

CREATE OR REPLACE FUNCTION public.submit_public_moderation_report(
  p_reporter_user_id uuid,
  p_target_type text,
  p_target_id uuid,
  p_reason_category text,
  p_description text,
  p_source_fingerprint text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_description text;
  v_reason text;
  v_bucket timestamptz := date_trunc('hour', now());
  v_target_exists boolean := false;
BEGIN
  IF p_target_type IS NULL
     OR p_target_id IS NULL
     OR p_reason_category IS NULL
     OR p_source_fingerprint IS NULL
     OR p_target_type NOT IN ('profile', 'project')
     OR p_reason_category NOT IN (
       'spam',
       'harassment',
       'impersonation',
       'copyright',
       'other'
     )
     OR p_source_fingerprint !~ '^[0-9a-f]{64}$' THEN
    RETURN jsonb_build_object('outcome', 'invalid');
  END IF;

  v_description := NULLIF(btrim(COALESCE(p_description, '')), '');
  IF v_description IS NOT NULL AND char_length(v_description) > 1500 THEN
    RETURN jsonb_build_object('outcome', 'invalid');
  END IF;

  IF p_target_type = 'profile' THEN
    SELECT EXISTS (
      SELECT 1
        FROM public.profiles AS profile
        WHERE profile.id = p_target_id
          AND profile.is_public = true
    ) INTO v_target_exists;
  ELSE
    SELECT EXISTS (
      SELECT 1
        FROM public.projects AS project
        JOIN public.profiles AS profile ON profile.id = project.profile_id
        WHERE project.id = p_target_id
          AND project.is_published = true
          AND profile.is_public = true
    ) INTO v_target_exists;
  END IF;

  IF NOT v_target_exists THEN
    RETURN jsonb_build_object('outcome', 'target_unavailable');
  END IF;

  v_reason := p_reason_category ||
    CASE
      WHEN v_description IS NULL THEN ''
      ELSE ': ' || v_description
    END;

  BEGIN
    INSERT INTO public.moderation_reports (
      reporter_user_id,
      target_type,
      target_id,
      reason,
      reason_category,
      description,
      source_fingerprint,
      dedupe_bucket
    )
    VALUES (
      p_reporter_user_id,
      p_target_type,
      p_target_id,
      v_reason,
      p_reason_category,
      v_description,
      p_source_fingerprint,
      v_bucket
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- Return the same accepted response to avoid a report-existence oracle.
      RETURN jsonb_build_object('outcome', 'accepted');
  END;

  RETURN jsonb_build_object('outcome', 'accepted');
END;
$$;

REVOKE ALL ON FUNCTION public.submit_public_moderation_report(
  uuid,
  text,
  uuid,
  text,
  text,
  text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_moderation_report(
  uuid,
  text,
  uuid,
  text,
  text,
  text
) TO service_role;

COMMENT ON FUNCTION public.submit_public_moderation_report(
  uuid,
  text,
  uuid,
  text,
  text,
  text
) IS
  'WS13-T009 validates current public profile/project state and inserts or deduplicates a report without an existence oracle.';
