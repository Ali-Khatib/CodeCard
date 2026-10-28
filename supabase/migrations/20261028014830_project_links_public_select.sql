-- Restore public read for project outbound links on published public cards.
-- The bridge migration left only the owner ALL policy, so visitors never saw
-- Live / GitHub buttons even when project_links rows existed.

DROP POLICY IF EXISTS project_links_public_select ON public.project_links;
CREATE POLICY project_links_public_select ON public.project_links
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects pr
      JOIN public.profiles p ON p.id = pr.profile_id
      WHERE pr.id = project_links.project_id
        AND (
          (pr.is_published = true AND p.is_public = true)
          OR pr.owner_user_id = auth.uid()
          OR pr.user_id = auth.uid()
        )
    )
  );
