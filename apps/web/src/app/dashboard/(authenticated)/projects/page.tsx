import { createClient } from '@/lib/supabase/server';
import {
  dbProjectToPortfolioProject,
  profileToPortfolioCreator,
} from '@/lib/dashboard/portfolio';
import { DashboardProjectsPortfolio } from '@/components/dashboard/dashboard-projects-portfolio';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, slug, display_name, headline, avatar_url, bio, is_public')
    .eq('owner_user_id', user!.id)
    .single();

  const { data: linkRows } = await supabase
    .from('profile_links')
    .select('type, label, url, sort_order')
    .eq('profile_id', profile?.id ?? '')
    .order('sort_order', { ascending: true });

  const links: ProfileLinkItem[] = (linkRows ?? []).map((l) => ({
    type: l.type,
    label: l.label,
    url: l.url,
  }));

  const { data: projects } = await supabase
    .from('projects')
    .select(
      `
      id, title, tagline, description, is_published, technologies, updated_at, sort_order, case_study_sections,
      project_media_assets(*),
      project_links(*)
    `,
    )
    .eq('profile_id', profile?.id ?? '')
    .order('sort_order', { ascending: true });

  const creator = profileToPortfolioCreator(
    {
      display_name: profile?.display_name ?? user!.email?.split('@')[0] ?? 'You',
      headline: profile?.headline ?? null,
      avatar_url: profile?.avatar_url ?? null,
      slug: profile?.slug,
    },
    links,
  );

  return (
    <DashboardProjectsPortfolio
      creator={creator}
      projects={(projects ?? []).map(dbProjectToPortfolioProject)}
      emptyState={(projects?.length ?? 0) === 0}
    />
  );
}
