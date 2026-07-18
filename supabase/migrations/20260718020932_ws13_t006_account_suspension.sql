-- WS13-T006: durable account suspensions with publish blocking.
-- Forward-only local migration. Do not apply remotely from this task.

CREATE TABLE public.account_suspensions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  suspended_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  report_id uuid REFERENCES public.moderation_reports(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status = 'active'),
  reason_code text NOT NULL DEFAULT 'moderation_suspension'
    CHECK (reason_code = 'moderation_suspension'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.account_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_suspensions FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.account_suspensions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.account_suspensions TO service_role;

CREATE OR REPLACE FUNCTION private.prevent_suspended_profile_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_public = true AND EXISTS (
    SELECT 1
      FROM public.account_suspensions AS suspension
      WHERE suspension.user_id = NEW.owner_user_id
        AND suspension.status = 'active'
  ) THEN
    RAISE EXCEPTION 'account_suspended';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.prevent_suspended_project_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_published = true AND EXISTS (
    SELECT 1
      FROM public.account_suspensions AS suspension
      WHERE suspension.user_id = NEW.owner_user_id
        AND suspension.status = 'active'
  ) THEN
    RAISE EXCEPTION 'account_suspended';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.prevent_suspended_research_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_published = true AND EXISTS (
    SELECT 1
      FROM public.account_suspensions AS suspension
      WHERE suspension.user_id = NEW.owner_user_id
        AND suspension.status = 'active'
  ) THEN
    RAISE EXCEPTION 'account_suspended';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_suspension_publish_block ON public.profiles;
CREATE TRIGGER profiles_suspension_publish_block
  BEFORE INSERT OR UPDATE OF is_public ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_suspended_profile_publish();

DROP TRIGGER IF EXISTS projects_suspension_publish_block ON public.projects;
CREATE TRIGGER projects_suspension_publish_block
  BEFORE INSERT OR UPDATE OF is_published ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_suspended_project_publish();

DROP TRIGGER IF EXISTS research_suspension_publish_block ON public.research_papers;
CREATE TRIGGER research_suspension_publish_block
  BEFORE INSERT OR UPDATE OF is_published ON public.research_papers
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_suspended_research_publish();

REVOKE ALL ON FUNCTION private.prevent_suspended_profile_publish() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.prevent_suspended_project_publish() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.prevent_suspended_research_publish() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_prepare_account_suspension(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_report_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_report_target_type text;
  v_report_target_id uuid;
  v_report_owner uuid;
  v_existing boolean := false;
BEGIN
  IF p_actor_user_id IS NULL OR p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid_suspension_input';
  END IF;

  IF p_actor_user_id = p_target_user_id THEN
    RETURN jsonb_build_object('outcome', 'self_suspension');
  END IF;

  IF p_report_id IS NOT NULL THEN
    SELECT report.target_type, report.target_id
      INTO v_report_target_type, v_report_target_id
      FROM public.moderation_reports AS report
      WHERE report.id = p_report_id
      FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('outcome', 'report_not_found');
    END IF;

    IF v_report_target_type = 'profile' THEN
      SELECT profile.owner_user_id
        INTO v_report_owner
        FROM public.profiles AS profile
        WHERE profile.id = v_report_target_id;
    ELSIF v_report_target_type = 'project' THEN
      SELECT project.owner_user_id
        INTO v_report_owner
        FROM public.projects AS project
        WHERE project.id = v_report_target_id;
    ELSIF v_report_target_type = 'media' THEN
      SELECT project.owner_user_id
        INTO v_report_owner
        FROM public.project_media_assets AS media
        JOIN public.projects AS project ON project.id = media.project_id
        WHERE media.id = v_report_target_id;
    ELSE
      RETURN jsonb_build_object('outcome', 'target_mismatch');
    END IF;

    IF v_report_owner IS DISTINCT FROM p_target_user_id THEN
      RETURN jsonb_build_object('outcome', 'target_mismatch');
    END IF;
  END IF;

  SELECT EXISTS (
    SELECT 1
      FROM public.account_suspensions AS suspension
      WHERE suspension.user_id = p_target_user_id
        AND suspension.status = 'active'
  )
  INTO v_existing;

  INSERT INTO public.account_suspensions (
    user_id,
    suspended_by,
    report_id,
    status,
    reason_code
  )
  VALUES (
    p_target_user_id,
    p_actor_user_id,
    p_report_id,
    'active',
    'moderation_suspension'
  )
  ON CONFLICT (user_id) DO UPDATE
    SET updated_at = now(),
        report_id = COALESCE(EXCLUDED.report_id, public.account_suspensions.report_id);

  UPDATE public.profiles
    SET is_public = false
    WHERE owner_user_id = p_target_user_id
      AND is_public = true;

  UPDATE public.projects
    SET is_published = false
    WHERE owner_user_id = p_target_user_id
      AND is_published = true;

  UPDATE public.research_papers
    SET is_published = false
    WHERE owner_user_id = p_target_user_id
      AND is_published = true;

  IF p_report_id IS NOT NULL THEN
    UPDATE public.moderation_reports
      SET status = 'resolved'
      WHERE id = p_report_id
        AND status IN ('pending', 'reviewing');
  END IF;

  RETURN jsonb_build_object(
    'outcome', CASE WHEN v_existing THEN 'idempotent' ELSE 'updated' END,
    'target_user_id', p_target_user_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_current_account_suspended()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.account_suspensions AS suspension
      WHERE suspension.user_id = auth.uid()
        AND suspension.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_count_other_active_global_admins(
  p_target_user_id uuid
)
RETURNS integer
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT COUNT(*)::integer
    FROM auth.users AS auth_user
    WHERE (auth_user.raw_app_meta_data ->> 'role') = 'admin'
      AND auth_user.id <> p_target_user_id
      AND (
        auth_user.banned_until IS NULL
        OR auth_user.banned_until <= now()
      );
$$;

REVOKE ALL ON FUNCTION public.admin_prepare_account_suspension(uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_prepare_account_suspension(uuid, uuid, uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.is_current_account_suspended() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_account_suspended() TO authenticated;

REVOKE ALL ON FUNCTION public.admin_count_other_active_global_admins(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_count_other_active_global_admins(uuid)
  TO service_role;

COMMENT ON TABLE public.account_suspensions IS
  'WS13-T006 durable active suspensions used to block publish paths and reconcile Auth bans.';
COMMENT ON FUNCTION public.admin_prepare_account_suspension(uuid, uuid, uuid) IS
  'WS13-T006 prepares durable suspension state and unpublishes owned public content before Auth ban.';
COMMENT ON FUNCTION public.is_current_account_suspended() IS
  'WS13-T006 lets the authenticated subject check only their own durable suspension marker.';
COMMENT ON FUNCTION public.admin_count_other_active_global_admins(uuid) IS
  'WS13-T006 counts other non-banned global admins before suspending an administrator.';
