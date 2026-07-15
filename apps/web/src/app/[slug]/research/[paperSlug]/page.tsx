import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { normalizeResearchPaper } from '@/lib/research/research';
import { ResearchPaperDetail } from '@/components/research/research-paper-detail';
import { ProfileAnalytics } from '@/components/profile-analytics';

interface PageProps {
  params: Promise<{ slug: string; paperSlug: string }>;
}

export const revalidate = 60;

export default async function ResearchDetailPage({ params }: PageProps) {
  const { slug, paperSlug } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, slug')
    .eq('slug', slug)
    .eq('is_public', true)
    .single();

  if (!profile) notFound();

  const { data: paper } = await supabase
    .from('research_papers')
    .select('*, research_figures(*), related_project:related_project_id(id, title, is_published)')
    .eq('profile_id', profile.id)
    .eq('slug', paperSlug)
    .eq('is_published', true)
    .single();

  if (!paper) notFound();

  return (
    <>
      <ProfileAnalytics profileId={profile.id} />
      <ResearchPaperDetail
        paper={normalizeResearchPaper(paper, slug)}
        profileSlug={slug}
        profileId={profile.id}
        displayName={profile.display_name}
      />
    </>
  );
}
