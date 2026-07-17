-- WS16-T002: circle_activity schema, constraints, and RLS
-- Manual deploy only — do not apply via `supabase db push` from agents.
-- Persisted Circle events; feed visibility is still enforced at query time
-- (Connections + public actor + published target).

CREATE TABLE IF NOT EXISTS public.circle_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  dedupe_key text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT circle_activity_event_type_known CHECK (
    event_type IN (
      'project_published',
      'project_updated',
      'research_published',
      'research_updated'
    )
  ),
  CONSTRAINT circle_activity_target_type_known CHECK (
    target_type IN ('project', 'research')
  ),
  CONSTRAINT circle_activity_event_target_pair CHECK (
    (event_type IN ('project_published', 'project_updated') AND target_type = 'project')
    OR (event_type IN ('research_published', 'research_updated') AND target_type = 'research')
  ),
  CONSTRAINT circle_activity_dedupe_key_not_blank CHECK (length(btrim(dedupe_key)) >= 1),
  CONSTRAINT circle_activity_dedupe_key_length CHECK (length(dedupe_key) <= 200),
  CONSTRAINT circle_activity_metadata_object CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_circle_activity_dedupe_key
  ON public.circle_activity (dedupe_key);

CREATE INDEX IF NOT EXISTS idx_circle_activity_actor_created
  ON public.circle_activity (actor_profile_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_circle_activity_target
  ON public.circle_activity (target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_circle_activity_feed_chronology
  ON public.circle_activity (created_at DESC, id DESC);

COMMENT ON TABLE public.circle_activity IS
  'WS16 Circle activity events. Private feed projection via Connections; not a global social feed.';

COMMENT ON COLUMN public.circle_activity.dedupe_key IS
  'Server-generated idempotency key (e.g. project_published:<id>).';

COMMENT ON COLUMN public.circle_activity.metadata IS
  'Optional safe public snapshot only. Never private notes, email, billing, or storage paths.';

-- Cleanup when target content is deleted (polymorphic target_id has no single FK).
CREATE OR REPLACE FUNCTION public.cleanup_circle_activity_on_project_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.circle_activity
  WHERE target_type = 'project'
    AND target_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS projects_cleanup_circle_activity ON public.projects;
CREATE TRIGGER projects_cleanup_circle_activity
  AFTER DELETE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_circle_activity_on_project_delete();

CREATE OR REPLACE FUNCTION public.cleanup_circle_activity_on_research_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.circle_activity
  WHERE target_type = 'research'
    AND target_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS research_papers_cleanup_circle_activity ON public.research_papers;
CREATE TRIGGER research_papers_cleanup_circle_activity
  AFTER DELETE ON public.research_papers
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_circle_activity_on_research_delete();

ALTER TABLE public.circle_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_activity FORCE ROW LEVEL SECURITY;

-- Viewers may read events only for actors they have saved as Connections.
CREATE POLICY circle_activity_select_via_connection ON public.circle_activity
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.saved_connections sc
      WHERE sc.owner_user_id = auth.uid()
        AND sc.saved_profile_id = circle_activity.actor_profile_id
    )
  );

-- Actors may read their own events (account export / cleanup).
CREATE POLICY circle_activity_select_own_actor ON public.circle_activity
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = actor_profile_id
        AND p.owner_user_id = auth.uid()
    )
  );

-- Actors may insert only their own public-work events (trusted server still validates).
CREATE POLICY circle_activity_insert_own_actor ON public.circle_activity
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = actor_profile_id
        AND p.owner_user_id = auth.uid()
        AND p.tenant_id = circle_activity.tenant_id
    )
    AND (
      (
        target_type = 'project'
        AND EXISTS (
          SELECT 1
          FROM public.projects pr
          WHERE pr.id = target_id
            AND pr.profile_id = actor_profile_id
            AND pr.owner_user_id = auth.uid()
            AND pr.is_published = true
        )
      )
      OR (
        target_type = 'research'
        AND EXISTS (
          SELECT 1
          FROM public.research_papers rp
          WHERE rp.id = target_id
            AND rp.profile_id = actor_profile_id
            AND rp.owner_user_id = auth.uid()
            AND rp.is_published = true
        )
      )
    )
  );

-- Actors may delete their own events (account/content cleanup paths).
CREATE POLICY circle_activity_delete_own_actor ON public.circle_activity
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = actor_profile_id
        AND p.owner_user_id = auth.uid()
    )
  );

-- No UPDATE policy: events are append-only from the client/API perspective.

GRANT SELECT, INSERT, DELETE ON public.circle_activity TO authenticated;
GRANT ALL ON public.circle_activity TO service_role;
-- Anonymous: no grants beyond schema defaults revoked historically.
REVOKE ALL ON public.circle_activity FROM anon;
