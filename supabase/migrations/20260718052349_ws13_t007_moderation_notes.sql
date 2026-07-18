-- WS13-T007: private internal moderation notes on reports.
-- Forward-only local migration. Do not apply remotely from this task.

ALTER TABLE public.moderation_reports
  ADD COLUMN IF NOT EXISTS moderation_notes text
    CHECK (
      moderation_notes IS NULL
      OR char_length(moderation_notes) <= 4000
    );

COMMENT ON COLUMN public.moderation_reports.moderation_notes IS
  'WS13-T007 private admin-only internal note. Never expose publicly or to reporters.';

-- Ordinary clients must not SELECT the private notes column even when reporter RLS matches.
REVOKE ALL ON TABLE public.moderation_reports FROM PUBLIC;
GRANT INSERT (
  id,
  tenant_id,
  reporter_user_id,
  target_type,
  target_id,
  reason,
  status,
  created_at,
  updated_at
) ON TABLE public.moderation_reports TO anon, authenticated;

GRANT SELECT (
  id,
  tenant_id,
  reporter_user_id,
  target_type,
  target_id,
  reason,
  status,
  created_at,
  updated_at
) ON TABLE public.moderation_reports TO authenticated;

GRANT ALL ON TABLE public.moderation_reports TO service_role;

CREATE OR REPLACE FUNCTION public.admin_update_moderation_note(
  p_actor_user_id uuid,
  p_report_id uuid,
  p_note text,
  p_expected_updated_at timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing text;
  v_updated_at timestamptz;
  v_note text;
  v_audit jsonb;
  v_inserted boolean := false;
BEGIN
  IF p_actor_user_id IS NULL OR p_report_id IS NULL THEN
    RAISE EXCEPTION 'invalid_note_input';
  END IF;

  IF p_note IS NULL THEN
    v_note := NULL;
  ELSE
    v_note := btrim(p_note);
    IF v_note = '' THEN
      v_note := NULL;
    END IF;
    IF v_note IS NOT NULL AND char_length(v_note) > 4000 THEN
      RETURN jsonb_build_object('outcome', 'too_large');
    END IF;
  END IF;

  SELECT report.moderation_notes, report.updated_at
    INTO v_existing, v_updated_at
    FROM public.moderation_reports AS report
    WHERE report.id = p_report_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('outcome', 'not_found');
  END IF;

  IF p_expected_updated_at IS NOT NULL
     AND v_updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RETURN jsonb_build_object(
      'outcome', 'conflict',
      'updated_at', v_updated_at
    );
  END IF;

  IF v_existing IS NOT DISTINCT FROM v_note THEN
    RETURN jsonb_build_object(
      'outcome', 'idempotent',
      'note_present', v_note IS NOT NULL,
      'note_length', COALESCE(char_length(v_note), 0),
      'updated_at', v_updated_at,
      'audit_inserted', false
    );
  END IF;

  UPDATE public.moderation_reports
    SET moderation_notes = v_note
    WHERE id = p_report_id
    RETURNING updated_at INTO v_updated_at;

  v_audit := public.insert_admin_audit_event(
    p_actor_user_id,
    'moderation_note.updated',
    'moderation_report',
    p_report_id,
    'succeeded',
    format('moderation-note:%s:%s', p_report_id, v_updated_at),
    jsonb_build_object(
      'outcome', 'updated',
      'note_present', v_note IS NOT NULL,
      'note_length', COALESCE(char_length(v_note), 0),
      'previous_present', v_existing IS NOT NULL
    )
  );
  v_inserted := COALESCE((v_audit ->> 'inserted')::boolean, false);

  RETURN jsonb_build_object(
    'outcome', 'updated',
    'note_present', v_note IS NOT NULL,
    'note_length', COALESCE(char_length(v_note), 0),
    'updated_at', v_updated_at,
    'audit_inserted', v_inserted
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_moderation_note(uuid, uuid, text, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_moderation_note(uuid, uuid, text, timestamptz)
  TO service_role;

COMMENT ON FUNCTION public.admin_update_moderation_note(uuid, uuid, text, timestamptz) IS
  'WS13-T007 updates a private moderation note and audits without storing note content.';
