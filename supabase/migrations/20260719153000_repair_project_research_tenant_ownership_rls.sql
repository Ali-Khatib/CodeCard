-- WS14 remediation: close cross-tenant project/research ownership RLS gap.
--
-- projects_owner_all and research_papers_owner_all previously only required
-- owner_user_id = auth.uid(). An authenticated user could therefore INSERT a
-- published row with their own owner_user_id but another profile's
-- profile_id/tenant_id, causing the content to appear on that public profile.
--
-- This migration:
-- 1. Fails loudly if any existing row already violates ownership consistency
--    (no silent rewrite/delete of inconsistent data).
-- 2. Replaces both owner ALL policies so USING and WITH CHECK require
--    owner_user_id, profile ownership, and matching tenant_id.
--
-- Direct EXISTS against public.profiles is used (no SECURITY DEFINER helper):
-- profiles_public_select already allows a caller to read their own profile
-- (owner_user_id = auth.uid()), and the EXISTS additionally requires
-- p.owner_user_id = auth.uid(), so foreign-profile lookups fail closed without
-- policy recursion into projects/research_papers.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Migration-time integrity assertion (counts only; no PII)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  projects_missing_profile bigint;
  projects_owner_mismatch bigint;
  projects_tenant_mismatch bigint;
  research_missing_profile bigint;
  research_owner_mismatch bigint;
  research_tenant_mismatch bigint;
BEGIN
  SELECT count(*) INTO projects_missing_profile
  FROM public.projects pr
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = pr.profile_id);

  SELECT count(*) INTO projects_owner_mismatch
  FROM public.projects pr
  JOIN public.profiles p ON p.id = pr.profile_id
  WHERE pr.owner_user_id IS DISTINCT FROM p.owner_user_id;

  SELECT count(*) INTO projects_tenant_mismatch
  FROM public.projects pr
  JOIN public.profiles p ON p.id = pr.profile_id
  WHERE pr.tenant_id IS DISTINCT FROM p.tenant_id;

  SELECT count(*) INTO research_missing_profile
  FROM public.research_papers rp
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = rp.profile_id);

  SELECT count(*) INTO research_owner_mismatch
  FROM public.research_papers rp
  JOIN public.profiles p ON p.id = rp.profile_id
  WHERE rp.owner_user_id IS DISTINCT FROM p.owner_user_id;

  SELECT count(*) INTO research_tenant_mismatch
  FROM public.research_papers rp
  JOIN public.profiles p ON p.id = rp.profile_id
  WHERE rp.tenant_id IS DISTINCT FROM p.tenant_id;

  IF projects_missing_profile > 0
     OR projects_owner_mismatch > 0
     OR projects_tenant_mismatch > 0
     OR research_missing_profile > 0
     OR research_owner_mismatch > 0
     OR research_tenant_mismatch > 0
  THEN
    RAISE EXCEPTION
      'WS14 tenant-ownership integrity failed before RLS repair. '
      'projects: missing_profile=%, owner_mismatch=%, tenant_mismatch=%. '
      'research_papers: missing_profile=%, owner_mismatch=%, tenant_mismatch=%. '
      'Refuse to silently rewrite or delete inconsistent rows.',
      projects_missing_profile,
      projects_owner_mismatch,
      projects_tenant_mismatch,
      research_missing_profile,
      research_owner_mismatch,
      research_tenant_mismatch;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Replace projects_owner_all
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS projects_owner_all ON public.projects;

CREATE POLICY projects_owner_all ON public.projects
  FOR ALL
  USING (
    owner_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = projects.profile_id
        AND p.owner_user_id = auth.uid()
        AND p.tenant_id = projects.tenant_id
    )
  )
  WITH CHECK (
    owner_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = projects.profile_id
        AND p.owner_user_id = auth.uid()
        AND p.tenant_id = projects.tenant_id
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Replace research_papers_owner_all
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS research_papers_owner_all ON public.research_papers;

CREATE POLICY research_papers_owner_all ON public.research_papers
  FOR ALL
  USING (
    owner_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = research_papers.profile_id
        AND p.owner_user_id = auth.uid()
        AND p.tenant_id = research_papers.tenant_id
    )
  )
  WITH CHECK (
    owner_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = research_papers.profile_id
        AND p.owner_user_id = auth.uid()
        AND p.tenant_id = research_papers.tenant_id
    )
  );

COMMIT;
