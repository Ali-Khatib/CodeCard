-- WS11-T011: Stripe webhook processing state for durable idempotency + retry safety.
-- Local forward-only migration. Do not apply remotely from this task.
-- Reuses billing_events (unique stripe_event_id already exists).

ALTER TABLE billing_events
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed'
    CHECK (status IN ('processing', 'completed', 'failed'));

ALTER TABLE billing_events
  ADD COLUMN IF NOT EXISTS failure_code text;

ALTER TABLE billing_events
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 1;

-- In-flight / failed rows must not look "processed". Historical rows remain completed.
ALTER TABLE billing_events
  ALTER COLUMN processed_at DROP NOT NULL;

ALTER TABLE billing_events
  ALTER COLUMN processed_at SET DEFAULT NULL;

COMMENT ON COLUMN billing_events.status IS
  'WS11-T011: processing | completed | failed. Mark completed only after side effects succeed.';

COMMENT ON COLUMN billing_events.failure_code IS
  'WS11-T011: bounded safe failure code for retries (never raw provider payloads).';

COMMENT ON COLUMN billing_events.attempt_count IS
  'WS11-T011: claim / retry attempts for the trusted Stripe event id.';

CREATE INDEX IF NOT EXISTS idx_billing_events_status_created
  ON billing_events (status, created_at DESC);

-- Least privilege: ordinary clients have no policies; reinforce grants.
REVOKE ALL ON TABLE billing_events FROM anon;
REVOKE ALL ON TABLE billing_events FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE billing_events TO service_role;
