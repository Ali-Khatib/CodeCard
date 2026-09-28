-- When A scans B's CodeCard QR and connects, B gets a pending offer to add A.
-- Connections stay directed (two private rows). This is not a saver-list on saved_connections.

CREATE TABLE IF NOT EXISTS public.connection_scan_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  scanner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scanner_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scanned_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scanned_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT connection_scan_offers_status_known CHECK (
    status IN ('pending', 'accepted', 'dismissed')
  ),
  CONSTRAINT connection_scan_offers_not_self CHECK (scanner_user_id <> scanned_user_id),
  CONSTRAINT connection_scan_offers_pair UNIQUE (scanned_user_id, scanner_user_id)
);

CREATE INDEX IF NOT EXISTS idx_connection_scan_offers_scanned_pending
  ON public.connection_scan_offers (scanned_user_id, created_at DESC)
  WHERE status = 'pending';

COMMENT ON TABLE public.connection_scan_offers IS
  'Inbound QR handshake: the card owner can accept the person who scanned them.';

ALTER TABLE public.connection_scan_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_scan_offers FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.connection_scan_offers FROM PUBLIC;
REVOKE ALL ON public.connection_scan_offers FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.connection_scan_offers TO authenticated;
GRANT ALL ON public.connection_scan_offers TO service_role;

CREATE POLICY connection_scan_offers_scanner_insert
  ON public.connection_scan_offers
  FOR INSERT
  TO authenticated
  WITH CHECK (scanner_user_id = auth.uid());

CREATE POLICY connection_scan_offers_scanned_select
  ON public.connection_scan_offers
  FOR SELECT
  TO authenticated
  USING (scanned_user_id = auth.uid());

CREATE POLICY connection_scan_offers_scanned_update
  ON public.connection_scan_offers
  FOR UPDATE
  TO authenticated
  USING (scanned_user_id = auth.uid())
  WITH CHECK (scanned_user_id = auth.uid());
