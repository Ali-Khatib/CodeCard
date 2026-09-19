-- Owner-private calendar events (Home schedule) and Connection follow-up dates.
-- Events are never public. Follow-ups live on saved_connections, still owner-only.

ALTER TABLE public.saved_connections
  ADD COLUMN IF NOT EXISTS follow_up_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_saved_connections_owner_follow_up
  ON public.saved_connections (owner_user_id, follow_up_at)
  WHERE follow_up_at IS NOT NULL;

COMMENT ON COLUMN public.saved_connections.follow_up_at IS
  'Owner-private follow-up reminder. Visible on Home and Connections. Never public.';

CREATE TABLE public.owner_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT owner_events_title_length CHECK (char_length(title) BETWEEN 1 AND 120),
  CONSTRAINT owner_events_location_length CHECK (location IS NULL OR char_length(location) <= 200),
  CONSTRAINT owner_events_notes_length CHECK (notes IS NULL OR char_length(notes) <= 2000),
  CONSTRAINT owner_events_ends_after_start CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

CREATE INDEX idx_owner_events_owner_starts
  ON public.owner_events (owner_user_id, starts_at);

CREATE TRIGGER owner_events_updated_at
  BEFORE UPDATE ON public.owner_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.owner_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_events FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.owner_events FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.owner_events TO authenticated;

CREATE POLICY owner_events_owner ON public.owner_events FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

COMMENT ON TABLE public.owner_events IS
  'Owner-private places and times (conferences, meetups, follow-up coffees). Home calendar only; not shown on the public CodeCard.';
