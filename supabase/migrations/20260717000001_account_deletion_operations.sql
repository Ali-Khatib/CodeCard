-- WS10-T004: Durable account-deletion operation lock / idempotency.
-- Local forward-only migration. Do not apply remotely from this task.

CREATE TABLE IF NOT EXISTS account_deletion_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed', 'aborted')),
  correlation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  locked_at timestamptz NOT NULL DEFAULT now(),
  lock_expires_at timestamptz NOT NULL,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE account_deletion_operations IS
  'WS10-T004: account-scoped deletion locks and operation correlation (service-role only)';

CREATE UNIQUE INDEX IF NOT EXISTS account_deletion_one_in_progress
  ON account_deletion_operations (owner_user_id)
  WHERE status = 'in_progress';

CREATE INDEX IF NOT EXISTS idx_account_deletion_ops_owner_created
  ON account_deletion_operations (owner_user_id, created_at DESC);

CREATE TRIGGER account_deletion_operations_updated_at
  BEFORE UPDATE ON account_deletion_operations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE account_deletion_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_deletion_operations FORCE ROW LEVEL SECURITY;

-- No policies for anon/authenticated: only service_role (bypasses RLS) may manage locks.
REVOKE ALL ON TABLE account_deletion_operations FROM anon;
REVOKE ALL ON TABLE account_deletion_operations FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE account_deletion_operations TO service_role;
