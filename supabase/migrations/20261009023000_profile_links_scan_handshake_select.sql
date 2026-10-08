-- Let the person who received a scan read the scanner's public links
-- while the offer is pending, and after they save the Connection.
-- Mirrors profiles_scan_handshake_select. Public profiles already match
-- profile_links_public_select; this covers a private card during the handshake.

DROP POLICY IF EXISTS profile_links_scan_handshake_select ON public.profile_links;
CREATE POLICY profile_links_scan_handshake_select
  ON public.profile_links
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.connection_scan_offers o
      WHERE o.scanner_profile_id = profile_links.profile_id
        AND o.scanned_user_id = auth.uid()
        AND o.status = 'pending'
    )
    OR EXISTS (
      SELECT 1
      FROM public.saved_connections sc
      WHERE sc.saved_profile_id = profile_links.profile_id
        AND sc.owner_user_id = auth.uid()
    )
  );
