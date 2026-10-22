-- Owner-private saved AI results.
-- One table covers both kinds: an AI-built project draft, and a saved Analysis review.
-- Pro is not a column on this table. The server reads it from subscriptions.
-- Authenticated clients may read and delete their own rows. They cannot insert or update.
-- The server writes with the service role only after resolveTenantPlanId returns pro.
-- Do not apply this migration to the remote project from an agent. Manual deploy only.

CREATE TABLE public.ai_owner_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_owner_results_kind CHECK (kind IN ('project_draft', 'analytics_review')),
  CONSTRAINT ai_owner_results_title_length CHECK (char_length(btrim(title)) BETWEEN 1 AND 160),
  CONSTRAINT ai_owner_results_body_object CHECK (jsonb_typeof(body) = 'object'),
  CONSTRAINT ai_owner_results_body_size CHECK (octet_length(body::text) <= 32000)
);

CREATE INDEX idx_ai_owner_results_owner_kind_created
  ON public.ai_owner_results (owner_user_id, kind, created_at DESC);

CREATE TRIGGER ai_owner_results_updated_at
  BEFORE UPDATE ON public.ai_owner_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.ai_owner_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_owner_results FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ai_owner_results FROM anon, authenticated;
GRANT SELECT, DELETE ON TABLE public.ai_owner_results TO authenticated;

DROP POLICY IF EXISTS ai_owner_results_owner_select ON public.ai_owner_results;
CREATE POLICY ai_owner_results_owner_select ON public.ai_owner_results
  FOR SELECT
  USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS ai_owner_results_owner_delete ON public.ai_owner_results;
CREATE POLICY ai_owner_results_owner_delete ON public.ai_owner_results
  FOR DELETE
  USING (owner_user_id = auth.uid());

COMMENT ON TABLE public.ai_owner_results IS
  'Owner-private saved AI project drafts and Analysis reviews. No client INSERT or UPDATE. Pro is checked by the server before a service-role write.';
