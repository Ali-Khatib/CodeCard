-- MVP-safe account suspension markers + subject probe.
-- Omits moderation_reports-dependent admin_prepare helpers until that schema exists.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

CREATE TABLE IF NOT EXISTS public.account_suspensions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  suspended_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  report_id uuid,
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

REVOKE ALL ON FUNCTION public.is_current_account_suspended() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_account_suspended() TO authenticated;

COMMENT ON TABLE public.account_suspensions IS
  'Durable active suspensions used to block publish paths.';
COMMENT ON FUNCTION public.is_current_account_suspended() IS
  'Lets the authenticated subject check only their own durable suspension marker.';
