import { notFound } from 'next/navigation';
import { DEMO_FEATURED_PROJECTS, DEMO_PROFILE } from '@/lib/projects/demo-data';
import { ProjectDetailView } from '@/components/featured-work/project-detail-view';
import { VisitorConversionMarker } from '@/components/visitor-conversion/visitor-conversion-marker';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DemoProjectPage({ params }: PageProps) {
  const { id } = await params;
  const project = DEMO_FEATURED_PROJECTS.find((p) => p.id === id);
  if (!project) notFound();

  return (
    <>
      <VisitorConversionMarker context="live_demo" referrer={`demo/projects/${id}`} />
      <ProjectDetailView
        project={project}
        profileSlug="demo"
        displayName={DEMO_PROFILE.display_name}
        accentColor={DEMO_PROFILE.accentColor}
        projects={DEMO_FEATURED_PROJECTS}
      />
    </>
  );
}
