-- WS10-T008: Immutable account-deletion audit support on audit_logs.
-- Local forward-only migration. Do not apply remotely from this task.

-- Correlation uniqueness prevents uncontrolled duplicate account.deleted rows on retry.
CREATE UNIQUE INDEX IF NOT EXISTS audit_logs_account_deleted_correlation_uidx
  ON public.audit_logs ((metadata ->> 'correlation_id'))
  WHERE action = 'account.deleted'
    AND (metadata ? 'correlation_id');

COMMENT ON INDEX audit_logs_account_deleted_correlation_uidx IS
  'WS10-T008: one account.deleted audit row per deletion correlation_id';

-- Ordinary clients: SELECT only via existing RLS policy. No INSERT/UPDATE/DELETE.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.audit_logs FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.audit_logs FROM authenticated;
GRANT SELECT ON TABLE public.audit_logs TO authenticated;
GRANT SELECT, INSERT ON TABLE public.audit_logs TO service_role;
-- service_role must not UPDATE/DELETE deletion audits via ordinary grants (immutability).
REVOKE UPDATE, DELETE ON TABLE public.audit_logs FROM service_role;
