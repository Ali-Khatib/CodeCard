-- WS15-T006: private note uniqueness + connection context metadata

-- One private note row per Connection (owner-authored)
CREATE UNIQUE INDEX IF NOT EXISTS idx_connection_notes_one_per_connection
  ON public.connection_notes (saved_connection_id);

ALTER TABLE public.connection_notes
  DROP CONSTRAINT IF EXISTS connection_notes_body_length;

ALTER TABLE public.connection_notes
  ADD CONSTRAINT connection_notes_body_length
  CHECK (length(body) >= 1 AND length(body) <= 5000);

-- Free-text "how you know them" on the Connection row (owner-only via RLS)
ALTER TABLE public.saved_connections
  ADD COLUMN IF NOT EXISTS context text;

ALTER TABLE public.saved_connections
  DROP CONSTRAINT IF EXISTS saved_connections_context_length;

ALTER TABLE public.saved_connections
  ADD CONSTRAINT saved_connections_context_length
  CHECK (context IS NULL OR length(context) <= 500);

COMMENT ON COLUMN public.saved_connections.context IS
  'Owner-private relationship context (WS15-T006). Never public.';

COMMENT ON TABLE public.connection_notes IS
  'Owner-private free-text notes about a saved Connection. One note per connection.';
