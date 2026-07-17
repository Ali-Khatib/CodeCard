-- WS15-T002: harden saved_connections with self-connection prevention
-- and an explicit owner lookup index. Existing UNIQUE(owner_user_id, saved_profile_id),
-- owner-only RLS, and FORCE RLS remain the canonical access model.

CREATE OR REPLACE FUNCTION public.prevent_self_saved_connection()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  target_owner uuid;
BEGIN
  SELECT p.owner_user_id
  INTO target_owner
  FROM public.profiles p
  WHERE p.id = NEW.saved_profile_id;

  IF target_owner IS NULL THEN
    RAISE EXCEPTION 'saved connection target profile not found'
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF target_owner = NEW.owner_user_id THEN
    RAISE EXCEPTION 'self connections are not allowed'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS saved_connections_prevent_self ON public.saved_connections;

CREATE TRIGGER saved_connections_prevent_self
  BEFORE INSERT OR UPDATE OF owner_user_id, saved_profile_id
  ON public.saved_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_saved_connection();

-- Owner list queries already use idx_saved_connections_owner.
-- Add a dedicated target index for cascade/privacy lookups.
CREATE INDEX IF NOT EXISTS idx_saved_connections_target
  ON public.saved_connections (saved_profile_id);

COMMENT ON TABLE public.saved_connections IS
  'Private directed Connections: owner_user_id saves saved_profile_id. Not mutual.';
