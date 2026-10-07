-- Expand analytics_event_type so owner analytics filters match the app.

DO $$ BEGIN ALTER TYPE public.analytics_event_type ADD VALUE IF NOT EXISTS 'link_click'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.analytics_event_type ADD VALUE IF NOT EXISTS 'profile_share'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.analytics_event_type ADD VALUE IF NOT EXISTS 'qr_download'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.analytics_event_type ADD VALUE IF NOT EXISTS 'research_view'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.analytics_event_type ADD VALUE IF NOT EXISTS 'paper_download'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.analytics_event_type ADD VALUE IF NOT EXISTS 'citation_copy'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.analytics_event_type ADD VALUE IF NOT EXISTS 'project_time_spent'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.analytics_event_type ADD VALUE IF NOT EXISTS 'time_spent_on_research'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.public_profile_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  source text,
  referrer text,
  session_id text
);

CREATE INDEX IF NOT EXISTS idx_public_profile_events_profile
  ON public.public_profile_events(profile_id, viewed_at DESC);

ALTER TABLE public.public_profile_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_profile_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_profile_events_owner_select ON public.public_profile_events;
CREATE POLICY public_profile_events_owner_select ON public.public_profile_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = profile_id AND p.owner_user_id = auth.uid()
    )
  );

GRANT SELECT ON public.public_profile_events TO authenticated;
GRANT ALL ON public.public_profile_events TO service_role;
REVOKE ALL ON public.public_profile_events FROM anon;

REVOKE ALL ON FUNCTION public.cleanup_circle_activity_on_project_delete() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_circle_activity_on_research_delete() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_current_account_suspended() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_current_account_suspended() TO authenticated;
REVOKE ALL ON FUNCTION public.ensure_owner_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_owner_profile(uuid) TO authenticated;
