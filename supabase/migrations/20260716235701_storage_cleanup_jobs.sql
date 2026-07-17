-- WS04-T010: Orphan storage cleanup job support
-- Narrow forward-only migration: attempts, scheduling, atomic claim RPC.
-- Do not apply remotely from this task; local file only until ops deploy.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS available_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

COMMENT ON COLUMN jobs.attempts IS 'WS04-T010: processing attempt count for retryable jobs';
COMMENT ON COLUMN jobs.available_at IS 'WS04-T010: earliest time a pending job may be claimed';
COMMENT ON COLUMN jobs.claimed_at IS 'WS04-T010: when a processor claimed the job (processing)';

CREATE INDEX IF NOT EXISTS idx_jobs_storage_cleanup_claim
  ON jobs (status, available_at, created_at)
  WHERE type = 'storage_cleanup' AND status = 'pending';

-- Atomic claim with SKIP LOCKED — service_role only.
CREATE OR REPLACE FUNCTION claim_storage_cleanup_jobs(
  p_limit integer DEFAULT 1,
  p_max_attempts integer DEFAULT 5
)
RETURNS SETOF jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claim_limit integer := GREATEST(1, LEAST(COALESCE(p_limit, 1), 20));
  max_attempts integer := GREATEST(1, LEAST(COALESCE(p_max_attempts, 5), 20));
BEGIN
  RETURN QUERY
  WITH candidate AS (
    SELECT j.id
    FROM jobs j
    WHERE j.type = 'storage_cleanup'
      AND j.status = 'pending'
      AND j.available_at <= now()
      AND j.attempts < max_attempts
    ORDER BY j.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT claim_limit
  ),
  updated AS (
    UPDATE jobs j
    SET
      status = 'processing',
      claimed_at = now(),
      attempts = j.attempts + 1,
      updated_at = now()
    FROM candidate c
    WHERE j.id = c.id
    RETURNING j.*
  )
  SELECT * FROM updated;
END;
$$;

REVOKE ALL ON FUNCTION claim_storage_cleanup_jobs(integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION claim_storage_cleanup_jobs(integer, integer) FROM anon;
REVOKE ALL ON FUNCTION claim_storage_cleanup_jobs(integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION claim_storage_cleanup_jobs(integer, integer) TO service_role;

COMMENT ON FUNCTION claim_storage_cleanup_jobs(integer, integer) IS
  'WS04-T010: atomically claim pending storage_cleanup jobs for the service-role worker';

CREATE OR REPLACE FUNCTION claim_storage_cleanup_job_by_id(
  p_job_id uuid,
  p_max_attempts integer DEFAULT 5
)
RETURNS SETOF jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_attempts integer := GREATEST(1, LEAST(COALESCE(p_max_attempts, 5), 20));
BEGIN
  RETURN QUERY
  WITH candidate AS (
    SELECT j.id
    FROM jobs j
    WHERE j.id = p_job_id
      AND j.type = 'storage_cleanup'
      AND j.status = 'pending'
      AND j.available_at <= now()
      AND j.attempts < max_attempts
    FOR UPDATE SKIP LOCKED
  ),
  updated AS (
    UPDATE jobs j
    SET
      status = 'processing',
      claimed_at = now(),
      attempts = j.attempts + 1,
      updated_at = now()
    FROM candidate c
    WHERE j.id = c.id
    RETURNING j.*
  )
  SELECT * FROM updated;
END;
$$;

REVOKE ALL ON FUNCTION claim_storage_cleanup_job_by_id(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION claim_storage_cleanup_job_by_id(uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION claim_storage_cleanup_job_by_id(uuid, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION claim_storage_cleanup_job_by_id(uuid, integer) TO service_role;

COMMENT ON FUNCTION claim_storage_cleanup_job_by_id(uuid, integer) IS
  'WS04-T010: atomically claim one storage_cleanup job by id for immediate drain after content delete';
