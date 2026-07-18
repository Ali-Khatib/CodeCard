-- WS13-T008: canonical immutable administrative audit events.
-- Forward-only local migration. Do not apply remotely from this task.

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS result text NOT NULL DEFAULT 'succeeded',
  ADD COLUMN IF NOT EXISTS idempotency_key text;

ALTER TABLE public.audit_logs
  DROP CONSTRAINT IF EXISTS audit_logs_result_check,
  ADD CONSTRAINT audit_logs_result_check
    CHECK (result IN ('succeeded', 'failed', 'partial')),
  DROP CONSTRAINT IF EXISTS audit_logs_idempotency_key_length_check,
  ADD CONSTRAINT audit_logs_idempotency_key_length_check
    CHECK (idempotency_key IS NULL OR char_length(idempotency_key) BETWEEN 1 AND 200);

CREATE UNIQUE INDEX IF NOT EXISTS audit_logs_admin_idempotency_uidx
  ON public.audit_logs (action, resource_type, resource_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs_are_immutable';
END;
$$;

DROP TRIGGER IF EXISTS audit_logs_immutable ON public.audit_logs;
CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_mutation();

REVOKE ALL ON FUNCTION public.prevent_audit_log_mutation() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.insert_admin_audit_event(
  p_actor_user_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id uuid,
  p_result text,
  p_idempotency_key text,
  p_metadata jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_audit_id uuid;
  v_inserted boolean := false;
  v_forbidden_key text;
BEGIN
  IF p_actor_user_id IS NULL OR p_resource_id IS NULL THEN
    RAISE EXCEPTION 'audit_identity_required';
  END IF;

  IF p_result NOT IN ('succeeded', 'failed', 'partial') THEN
    RAISE EXCEPTION 'invalid_audit_result';
  END IF;

  IF p_idempotency_key IS NULL
    OR char_length(p_idempotency_key) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'invalid_idempotency_key';
  END IF;

  IF p_metadata IS NULL
    OR jsonb_typeof(p_metadata) <> 'object'
    OR octet_length(p_metadata::text) > 4096 THEN
    RAISE EXCEPTION 'invalid_audit_metadata';
  END IF;

  SELECT key
    INTO v_forbidden_key
    FROM jsonb_object_keys(p_metadata) AS key
    WHERE lower(key) = ANY (ARRAY[
      'authorization',
      'cookie',
      'email',
      'error',
      'headers',
      'note',
      'password',
      'reason',
      'report',
      'service_role',
      'session',
      'signature',
      'statement',
      'token'
    ])
    LIMIT 1;

  IF v_forbidden_key IS NOT NULL THEN
    RAISE EXCEPTION 'unsafe_audit_metadata';
  END IF;

  IF NOT (
    (p_action IN (
      'moderation_report.resolved',
      'moderation_report.dismissed',
      'moderation_note.updated'
    ) AND p_resource_type = 'moderation_report')
    OR (p_action = 'content.hidden' AND p_resource_type IN ('profile', 'project', 'research'))
    OR (p_action IN (
      'user.suspended',
      'user.suspension_failed',
      'user.suspension_partial'
    ) AND p_resource_type = 'auth_user')
  ) THEN
    RAISE EXCEPTION 'invalid_admin_audit_action';
  END IF;

  INSERT INTO public.audit_logs (
    tenant_id,
    actor_user_id,
    action,
    resource_type,
    resource_id,
    result,
    idempotency_key,
    metadata
  )
  VALUES (
    NULL,
    p_actor_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_result,
    p_idempotency_key,
    p_metadata
  )
  ON CONFLICT (action, resource_type, resource_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL
    DO NOTHING
  RETURNING id INTO v_audit_id;

  IF v_audit_id IS NOT NULL THEN
    v_inserted := true;
  ELSE
    SELECT audit.id
      INTO v_audit_id
      FROM public.audit_logs AS audit
      WHERE audit.action = p_action
        AND audit.resource_type = p_resource_type
        AND audit.resource_id = p_resource_id
        AND audit.idempotency_key = p_idempotency_key;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'audit_id', v_audit_id,
    'inserted', v_inserted
  );
END;
$$;

REVOKE ALL ON FUNCTION public.insert_admin_audit_event(
  uuid, text, text, uuid, text, text, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.insert_admin_audit_event(
  uuid, text, text, uuid, text, text, jsonb
) TO service_role;

-- Reassert the product boundary even if earlier broad grants are replayed.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.audit_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.audit_logs TO service_role;
REVOKE UPDATE, DELETE ON TABLE public.audit_logs FROM service_role;

-- Retrofit WS13-T004 to use the canonical writer while preserving the atomic row lock.
CREATE OR REPLACE FUNCTION public.admin_transition_moderation_report(
  p_report_id uuid,
  p_action text,
  p_actor_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_previous_status public.moderation_status;
  v_resulting_status public.moderation_status;
  v_audit_action text;
  v_audit_result jsonb;
BEGIN
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'actor_required';
  END IF;

  IF p_action = 'resolve' THEN
    v_resulting_status := 'resolved';
    v_audit_action := 'moderation_report.resolved';
  ELSIF p_action = 'dismiss' THEN
    v_resulting_status := 'dismissed';
    v_audit_action := 'moderation_report.dismissed';
  ELSE
    RAISE EXCEPTION 'invalid_action';
  END IF;

  SELECT report.status
    INTO v_previous_status
    FROM public.moderation_reports AS report
    WHERE report.id = p_report_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('outcome', 'not_found');
  END IF;

  IF v_previous_status <> 'pending' AND v_previous_status <> v_resulting_status THEN
    RETURN jsonb_build_object(
      'outcome', 'conflict',
      'previous_status', v_previous_status,
      'resulting_status', v_previous_status,
      'audit_inserted', false
    );
  END IF;

  IF v_previous_status = 'pending' THEN
    UPDATE public.moderation_reports
      SET status = v_resulting_status
      WHERE id = p_report_id;
  END IF;

  SELECT public.insert_admin_audit_event(
    p_actor_user_id,
    v_audit_action,
    'moderation_report',
    p_report_id,
    'succeeded',
    format('moderation-report:%s:%s', p_report_id, p_action),
    jsonb_build_object(
      'previous_status', v_previous_status,
      'resulting_status', v_resulting_status,
      'schema_version', 'ws13-t008-v1'
    )
  ) INTO v_audit_result;

  RETURN jsonb_build_object(
    'outcome', CASE
      WHEN v_previous_status = v_resulting_status THEN 'idempotent'
      ELSE 'updated'
    END,
    'previous_status', v_previous_status,
    'resulting_status', v_resulting_status,
    'audit_inserted', COALESCE((v_audit_result ->> 'inserted')::boolean, false)
  );
END;
$$;

COMMENT ON FUNCTION public.insert_admin_audit_event(
  uuid, text, text, uuid, text, text, jsonb
) IS 'WS13-T008 canonical allowlisted, bounded, idempotent administrative audit writer.';

COMMENT ON TRIGGER audit_logs_immutable ON public.audit_logs IS
  'WS13-T008: audit events cannot be updated or deleted through product/database roles.';
