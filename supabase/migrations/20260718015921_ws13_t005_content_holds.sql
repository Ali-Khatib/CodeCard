-- WS13-T005: durable moderation holds and atomic reported-content hiding.
-- Forward-only local migration. Do not apply remotely from this task.

CREATE TABLE public.moderation_content_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('profile', 'project')),
  target_id uuid NOT NULL,
  report_id uuid NOT NULL REFERENCES public.moderation_reports(id) ON DELETE RESTRICT,
  hidden_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  reason_code text NOT NULL DEFAULT 'reported_content'
    CHECK (reason_code = 'reported_content'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_type, target_id),
  UNIQUE (report_id)
);

ALTER TABLE public.moderation_content_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_content_holds FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.moderation_content_holds FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.moderation_content_holds TO service_role;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.prevent_held_profile_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_public = true AND EXISTS (
    SELECT 1
      FROM public.moderation_content_holds AS hold
      WHERE hold.target_type = 'profile'
        AND hold.target_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'content_under_moderation_hold';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.prevent_held_project_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_published = true AND EXISTS (
    SELECT 1
      FROM public.moderation_content_holds AS hold
      WHERE hold.target_type = 'project'
        AND hold.target_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'content_under_moderation_hold';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_moderation_hold_publish_block ON public.profiles;
CREATE TRIGGER profiles_moderation_hold_publish_block
  BEFORE INSERT OR UPDATE OF is_public ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_held_profile_publish();

DROP TRIGGER IF EXISTS projects_moderation_hold_publish_block ON public.projects;
CREATE TRIGGER projects_moderation_hold_publish_block
  BEFORE INSERT OR UPDATE OF is_published ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_held_project_publish();

REVOKE ALL ON FUNCTION private.prevent_held_profile_publish() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.prevent_held_project_publish() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_hide_reported_content(
  p_actor_user_id uuid,
  p_report_id uuid,
  p_target_type text,
  p_target_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_report_target_type text;
  v_report_target_id uuid;
  v_report_status public.moderation_status;
  v_previous_public boolean;
  v_profile_slug text;
  v_hold_id uuid;
  v_audit_result jsonb;
BEGIN
  IF p_actor_user_id IS NULL
    OR p_report_id IS NULL
    OR p_target_id IS NULL
    OR p_target_type NOT IN ('profile', 'project') THEN
    RAISE EXCEPTION 'invalid_hide_input';
  END IF;

  SELECT report.target_type, report.target_id, report.status
    INTO v_report_target_type, v_report_target_id, v_report_status
    FROM public.moderation_reports AS report
    WHERE report.id = p_report_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('outcome', 'report_not_found');
  END IF;

  IF v_report_target_type <> p_target_type OR v_report_target_id <> p_target_id THEN
    RETURN jsonb_build_object('outcome', 'target_mismatch');
  END IF;

  IF v_report_status = 'dismissed' THEN
    RETURN jsonb_build_object('outcome', 'conflict');
  END IF;

  IF p_target_type = 'profile' THEN
    SELECT profile.is_public, profile.slug
      INTO v_previous_public, v_profile_slug
      FROM public.profiles AS profile
      WHERE profile.id = p_target_id
      FOR UPDATE;
  ELSE
    SELECT project.is_published, profile.slug
      INTO v_previous_public, v_profile_slug
      FROM public.projects AS project
      JOIN public.profiles AS profile ON profile.id = project.profile_id
      WHERE project.id = p_target_id
      FOR UPDATE;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('outcome', 'target_not_found');
  END IF;

  INSERT INTO public.moderation_content_holds (
    target_type,
    target_id,
    report_id,
    hidden_by,
    reason_code
  )
  VALUES (
    p_target_type,
    p_target_id,
    p_report_id,
    p_actor_user_id,
    'reported_content'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_hold_id;

  IF p_target_type = 'profile' THEN
    UPDATE public.profiles
      SET is_public = false
      WHERE id = p_target_id
        AND is_public = true;
  ELSE
    UPDATE public.projects
      SET is_published = false
      WHERE id = p_target_id
        AND is_published = true;
  END IF;

  IF v_report_status IN ('pending', 'reviewing') THEN
    UPDATE public.moderation_reports
      SET status = 'resolved'
      WHERE id = p_report_id;
  END IF;

  SELECT public.insert_admin_audit_event(
    p_actor_user_id,
    'content.hidden',
    p_target_type,
    p_target_id,
    'succeeded',
    format('content-hidden:%s:%s', p_target_type, p_target_id),
    jsonb_build_object(
      'report_id', p_report_id,
      'target_type', p_target_type,
      'previous_public', v_previous_public,
      'resulting_public', false,
      'report_previous_status', v_report_status,
      'report_resulting_status', 'resolved',
      'schema_version', 'ws13-t005-v1'
    )
  ) INTO v_audit_result;

  RETURN jsonb_build_object(
    'outcome', CASE WHEN v_hold_id IS NULL THEN 'idempotent' ELSE 'updated' END,
    'target_type', p_target_type,
    'target_id', p_target_id,
    'profile_slug', v_profile_slug,
    'is_public', false,
    'audit_inserted', COALESCE((v_audit_result ->> 'inserted')::boolean, false)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_hide_reported_content(uuid, uuid, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_hide_reported_content(uuid, uuid, text, uuid)
  TO service_role;

COMMENT ON TABLE public.moderation_content_holds IS
  'WS13-T005 private durable holds preventing owners from republishing moderated content.';
COMMENT ON FUNCTION public.admin_hide_reported_content(uuid, uuid, text, uuid) IS
  'WS13-T005 atomically validates report target, hides content, creates hold, resolves report, and audits.';
