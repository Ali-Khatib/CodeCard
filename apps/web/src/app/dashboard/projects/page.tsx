import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { DEMO_FEATURED_PROJECTS } from '@/lib/projects/demo-data';

const DEMO_NAMES = ['DevFlow', 'SchemaSync', 'Pulse'] as const;

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('owner_user_id', user!.id)
    .single();

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, tagline, is_published, sort_order')
    .eq('profile_id', profile?.id ?? '')
    .order('sort_order', { ascending: true });

  const hasProjects = (projects?.length ?? 0) > 0;

  const cards = hasProjects
    ? projects!.map((project) => ({
        key: project.id,
        title: project.title,
        subtitle: project.is_published ? 'Published · featured' : 'Draft',
        href: `/dashboard/projects/${project.id}`,
      }))
    : DEMO_FEATURED_PROJECTS.filter((p) => DEMO_NAMES.includes(p.title as (typeof DEMO_NAMES)[number])).map(
        (project) => ({
          key: project.id,
          title: project.title,
          subtitle: 'Published · featured',
          href: '/dashboard/projects/new',
        }),
      );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-eyebrow text-[12px] uppercase tracking-[0.08em] text-graphite">Projects</p>
          <h1 className="mt-2 font-display text-[28px] font-medium text-phosphor">Featured work</h1>
          <p className="mt-2 max-w-lg text-[15px] text-lichen">
            {hasProjects
              ? 'Reorder and publish the projects visitors see first.'
              : 'Preview of your project grid — create your first project to go live.'}
          </p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="cc-btn-pill-primary inline-flex h-10 items-center px-5 text-[14px]"
        >
          New project
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <Link
            key={card.key}
            href={card.href}
            className="cc-workspace-tile group rounded-[10px] border border-border/40 p-4 transition-colors hover:border-reactor/30"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <p className="font-display text-[18px] text-phosphor group-hover:text-vellum">{card.title}</p>
            <p className="mt-1 text-[13px] text-lichen">{card.subtitle}</p>
            <div className="mt-3 h-16 rounded-[8px] bg-gradient-to-br from-reactor/20 to-transparent" />
          </Link>
        ))}
      </div>
    </div>
  );
}
