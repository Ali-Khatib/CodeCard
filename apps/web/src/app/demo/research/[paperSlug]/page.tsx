import { notFound } from 'next/navigation';
import { DEMO_PROFILE } from '@/lib/projects/demo-data';
import { DEMO_RESEARCH_PAPERS } from '@/lib/research/demo-data';
import { ResearchPaperDetail } from '@/components/research/research-paper-detail';
import { VisitorConversionMarker } from '@/components/visitor-conversion/visitor-conversion-marker';

interface PageProps {
  params: Promise<{ paperSlug: string }>;
}

export default async function DemoResearchDetailPage({ params }: PageProps) {
  const { paperSlug } = await params;
  const paper = DEMO_RESEARCH_PAPERS.find((p) => p.slug === paperSlug);
  if (!paper) notFound();

  return (
    <>
      <VisitorConversionMarker
        context="live_demo"
        referrer={`demo/research/${paperSlug}`}
      />
      <ResearchPaperDetail
        paper={paper}
        profileSlug="demo"
        displayName={DEMO_PROFILE.display_name}
      />
    </>
  );
}
