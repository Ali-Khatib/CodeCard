-- WS16-T006: private Circle viewer read state (last-seen only)
-- Manual deploy only — do not apply via `supabase db push` from agents.
-- Actors never see who viewed their work through Circle.

CREATE TABLE IF NOT EXISTS public.circle_viewer_state (
  viewer_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT 'epoch'::timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_circle_viewer_state_last_seen
  ON public.circle_viewer_state (viewer_user_id, last_seen_at);

COMMENT ON TABLE public.circle_viewer_state IS
  'WS16 private Circle last-seen state per authenticated viewer. Not visible to actors.';

ALTER TABLE public.circle_viewer_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_viewer_state FORCE ROW LEVEL SECURITY;

CREATE POLICY circle_viewer_state_owner_select ON public.circle_viewer_state
  FOR SELECT
  USING (viewer_user_id = auth.uid());

CREATE POLICY circle_viewer_state_owner_insert ON public.circle_viewer_state
  FOR INSERT
  WITH CHECK (viewer_user_id = auth.uid());

CREATE POLICY circle_viewer_state_owner_update ON public.circle_viewer_state
  FOR UPDATE
  USING (viewer_user_id = auth.uid())
  WITH CHECK (viewer_user_id = auth.uid());

CREATE POLICY circle_viewer_state_owner_delete ON public.circle_viewer_state
  FOR DELETE
  USING (viewer_user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.circle_viewer_state TO authenticated;
GRANT ALL ON public.circle_viewer_state TO service_role;
REVOKE ALL ON public.circle_viewer_state FROM anon;
