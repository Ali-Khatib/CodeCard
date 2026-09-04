-- Close PostgREST insert paths for legal/abuse intake.
-- App routes insert via the service role after validation and rate limits.
-- Do not apply remotely from this task unless the operator explicitly runs the migration.

DROP POLICY IF EXISTS dmca_notices_insert ON public.dmca_notices;

REVOKE INSERT ON TABLE public.dmca_notices FROM anon, authenticated;
REVOKE SELECT ON TABLE public.dmca_notices FROM anon, authenticated;

DROP POLICY IF EXISTS moderation_reports_insert ON public.moderation_reports;

REVOKE INSERT ON TABLE public.moderation_reports FROM anon, authenticated;
-- Reporter SELECT policy + column grants stay in place. Public UI inserts via
-- service-role RPC (`submit_public_moderation_report`), not PostgREST INSERT.

COMMENT ON TABLE public.dmca_notices IS
  'Copyright notices. Client roles cannot INSERT; /api/dmca uses the service role.';

COMMENT ON TABLE public.moderation_reports IS
  'Public reports. Client roles cannot INSERT; /api/moderation/report uses the service-role RPC.';
