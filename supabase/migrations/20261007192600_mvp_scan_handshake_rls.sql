-- MVP staging was missing the scan-handshake RLS that lets a card owner
-- read a private scanner profile while a pending offer exists (and after save).

DROP POLICY IF EXISTS connection_scan_offers_scanner_select ON public.connection_scan_offers;
CREATE POLICY connection_scan_offers_scanner_select
  ON public.connection_scan_offers
  FOR SELECT
  TO authenticated
  USING (scanner_user_id = auth.uid());

DROP POLICY IF EXISTS connection_scan_offers_scanner_reopen ON public.connection_scan_offers;
CREATE POLICY connection_scan_offers_scanner_reopen
  ON public.connection_scan_offers
  FOR UPDATE
  TO authenticated
  USING (scanner_user_id = auth.uid())
  WITH CHECK (scanner_user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS profiles_scan_handshake_select ON public.profiles;
CREATE POLICY profiles_scan_handshake_select
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.connection_scan_offers o
      WHERE o.scanner_profile_id = profiles.id
        AND o.scanned_user_id = auth.uid()
        AND o.status = 'pending'
    )
    OR EXISTS (
      SELECT 1
      FROM public.saved_connections sc
      WHERE sc.saved_profile_id = profiles.id
        AND sc.owner_user_id = auth.uid()
    )
  );
