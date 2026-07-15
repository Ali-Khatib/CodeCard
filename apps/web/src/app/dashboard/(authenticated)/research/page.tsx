import { createClient } from '@/lib/supabase/server';
import { DashboardResearchView } from '@/components/dashboard/dashboard-research-view';
import { normalizeResearchPaper } from '@/lib/research/research';
import { createResearchFigureUrlResolver } from '@/lib/research/research-figure-url';

export default async function ResearchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, slug')
    .eq('owner_user_id', user!.id)
    .single();

  const { data: papers } = await supabase
    .from('research_papers')
    .select('*, research_figures(*), related_project:related_project_id(id, title, is_published)')
    .eq('profile_id', profile?.id ?? '')
    .order('sort_order', { ascending: true });

  const resolveFigureUrl = createResearchFigureUrlResolver(supabase);

  return (
    <DashboardResearchView
      papers={(papers ?? []).map((paper) =>
        normalizeResearchPaper(paper, profile?.slug ?? undefined, { resolveFigureUrl }),
      )}
      profileSlug={profile?.slug}
      profileId={profile?.id}
    />
  );
}
