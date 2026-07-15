import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ResearchPaperDetail } from '@/components/research/research-paper-detail';
import { ProfileAnalytics } from '@/components/profile-analytics';
import {
  buildPublicResearchMetadata,
  PUBLIC_RESEARCH_PAPER_SELECT,
  toPublicResearchPaper,
} from '@/lib/research/research-public';
import { createResearchFigureUrlResolver } from '@/lib/research/research-figure-url';

interface PageProps {
  params: Promise<{ slug: string; paperSlug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, paperSlug } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle();

  if (!profile) {
    return { title: 'Research not found', robots: { index: false, follow: false } };
  }

  const { data: paper } = await supabase
    .from('research_papers')
    .select('title, abstract, slug')
    .eq('profile_id', profile.id)
    .eq('slug', paperSlug)
    .eq('is_published', true)
    .maybeSingle();

  if (!paper) {
    return { title: 'Research not found', robots: { index: false, follow: false } };
  }

  return buildPublicResearchMetadata({
    profileDisplayName: profile.display_name,
    paperTitle: paper.title,
    abstract: paper.abstract,
    profileSlug: slug,
    paperSlug: paper.slug,
  });
}

export default async function ResearchDetailPage({ params }: PageProps) {
  const { slug, paperSlug } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, slug')
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle();

  if (!profile) notFound();

  const { data: paper } = await supabase
    .from('research_papers')
    .select(PUBLIC_RESEARCH_PAPER_SELECT)
    .eq('profile_id', profile.id)
    .eq('slug', paperSlug)
    .eq('is_published', true)
    .maybeSingle();

  if (!paper) notFound();

  const resolveFigureUrl = createResearchFigureUrlResolver(supabase);
  const publicPaper = toPublicResearchPaper(
    paper as unknown as Parameters<typeof toPublicResearchPaper>[0],
    slug,
    resolveFigureUrl,
  );

  return (
    <>
      <ProfileAnalytics profileId={profile.id} />
      <ResearchPaperDetail
        paper={publicPaper}
        profileSlug={slug}
        profileId={profile.id}
        displayName={profile.display_name}
      />
    </>
  );
}
