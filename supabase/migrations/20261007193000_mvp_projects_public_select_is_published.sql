-- Public card uses is_published; legacy MVP RLS only allowed visibility='public'.
-- That left published projects invisible on /[slug] while the dashboard showed Published.

UPDATE public.projects
SET visibility = 'public'
WHERE is_published = true
  AND visibility IS DISTINCT FROM 'public';

UPDATE public.projects
SET visibility = 'private'
WHERE is_published = false
  AND visibility = 'public';

DROP POLICY IF EXISTS "Public projects are viewable" ON public.projects;
DROP POLICY IF EXISTS projects_public_select ON public.projects;

CREATE POLICY projects_public_select ON public.projects
  FOR SELECT
  USING (
    (
      is_published = true
      AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = projects.profile_id
          AND p.is_public = true
      )
    )
    OR owner_user_id = auth.uid()
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
DROP POLICY IF EXISTS projects_owner_update ON public.projects;
DROP POLICY IF EXISTS projects_owner_delete ON public.projects;

CREATE POLICY projects_owner_update ON public.projects
  FOR UPDATE
  USING (owner_user_id = auth.uid() OR user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY projects_owner_delete ON public.projects
  FOR DELETE
  USING (owner_user_id = auth.uid() OR user_id = auth.uid());
