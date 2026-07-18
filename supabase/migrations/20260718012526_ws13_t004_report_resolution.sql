-- WS13-T004: atomic moderation-report status transition with narrow audit evidence.
-- Forward-only local migration. Do not apply remotely from this task.

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
  v_audit_inserted boolean := false;
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

  IF NOT EXISTS (
    SELECT 1
      FROM public.audit_logs AS audit
      WHERE audit.action = v_audit_action
        AND audit.resource_type = 'moderation_report'
        AND audit.resource_id = p_report_id
  ) THEN
    INSERT INTO public.audit_logs (
      tenant_id,
      actor_user_id,
      action,
      resource_type,
      resource_id,
      metadata
    )
    VALUES (
      NULL,
      p_actor_user_id,
      v_audit_action,
      'moderation_report',
      p_report_id,
      jsonb_build_object(
        'previous_status', v_previous_status,
        'resulting_status', v_resulting_status,
        'schema_version', 'ws13-t004-v1'
      )
    );
    v_audit_inserted := true;
  END IF;

  RETURN jsonb_build_object(
    'outcome', CASE
      WHEN v_previous_status = v_resulting_status THEN 'idempotent'
      ELSE 'updated'
    END,
    'previous_status', v_previous_status,
    'resulting_status', v_resulting_status,
    'audit_inserted', v_audit_inserted
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_transition_moderation_report(uuid, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_transition_moderation_report(uuid, text, uuid)
  TO service_role;

COMMENT ON FUNCTION public.admin_transition_moderation_report(uuid, text, uuid) IS
  'WS13-T004: service-role-only atomic pending-to-resolved/dismissed transition with bounded audit evidence.';
