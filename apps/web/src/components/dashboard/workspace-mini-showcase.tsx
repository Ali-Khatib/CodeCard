'use client';

import Image from 'next/image';
import Link from 'next/link';
import { DEMO_FEATURED_PROJECTS, DEMO_PROFILE } from '@/lib/projects/demo-data';
import { DEMO_CONNECTIONS } from '@/lib/dashboard/workspace-demo';
import { Sparkline } from './sparkline';

export type WorkspaceShowcaseTab =
  | 'projects'
  | 'analytics'
  | 'profile'
  | 'connections'
  | 'settings';

type WorkspaceMiniShowcaseProps = {
  basePath?: string;
  /** Landing mock: switch tabs instead of navigating */
  onOpenTab?: (tab: WorkspaceShowcaseTab) => void;
  compact?: boolean;
};

const SECTIONS: {
  id: WorkspaceShowcaseTab;
  label: string;
  detail: string;
}[] = [
  { id: 'projects', label: 'Projects', detail: 'Featured work & demos' },
  { id: 'analytics', label: 'Analytics', detail: 'Reach, traffic & insights' },
  { id: 'profile', label: 'Profile', detail: 'Public card & QR' },
  { id: 'connections', label: 'Connections', detail: 'People you meet' },
  { id: 'settings', label: 'Settings', detail: 'Workspace & billing' },
];

export function WorkspaceMiniShowcase({
  basePath = '/dashboard',
  onOpenTab,
  compact = false,
}: WorkspaceMiniShowcaseProps) {
  return (
    <section>
      <h3 className="font-eyebrow text-[11px] uppercase tracking-[0.1em] text-reactor/90">
        Your workspace
      </h3>
      <p className="mt-1 text-[13px] text-graphite">
        Jump to projects, analytics, profile, and more.
      </p>
      <div
        className={`mt-3 grid gap-2.5 sm:grid-cols-2 ${compact ? 'lg:grid-cols-3' : 'xl:grid-cols-5'}`}
      >
        {SECTIONS.map((section) => {
          const href = `${basePath}/${section.id}`;
          const inner = (
            <>
              <MiniPreview id={section.id} compact={compact} />
              <div className="border-t border-reactor/10 px-3 py-2.5">
                <p className="text-[13px] font-medium text-vellum">{section.label}</p>
                <p className="text-[10px] text-graphite">{section.detail}</p>
              </div>
            </>
          );

          const className =
            'cc-workspace-mini-showcase__card group overflow-hidden text-left transition-colors hover:border-reactor/30';

          if (onOpenTab) {
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onOpenTab(section.id)}
                className={className}
              >
                {inner}
              </button>
            );
          }

          return (
            <Link key={section.id} href={href} className={className}>
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function MiniPreview({ id, compact }: { id: WorkspaceShowcaseTab; compact?: boolean }) {
  const h = compact ? 'h-[72px]' : 'h-[88px]';

  if (id === 'projects') {
    const project = DEMO_FEATURED_PROJECTS[0];
    return (
      <div className={`relative ${h} overflow-hidden bg-midnight`}>
        {project.posterUrl && (
          <Image src={project.posterUrl} alt="" fill className="object-cover opacity-90" sizes="200px" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-void-canvas via-void-canvas/40 to-transparent" />
        <div className="absolute bottom-2 left-2.5 right-2.5">
          <p className="truncate font-display text-[13px] text-vellum">{project.title}</p>
          <p className="truncate text-[9px] text-lichen">{project.tagline}</p>
        </div>
      </div>
    );
  }

  if (id === 'analytics') {
    return (
      <div className={`${h} space-y-1.5 bg-gradient-to-b from-reactor/10 to-midnight p-2.5`}>
        <p className="text-[9px] text-graphite">Profile reached</p>
        <p className="font-display text-[18px] leading-none text-vellum">1,284</p>
        <div className="grid grid-cols-3 gap-1 pt-0.5">
          {[
            { label: 'Views', spark: [4, 6, 5, 8, 7] },
            { label: 'Opens', spark: [2, 3, 4, 3, 5] },
            { label: 'Saves', spark: [1, 1, 2, 2, 3] },
          ].map((s) => (
            <div key={s.label} className="rounded-[6px] border border-reactor/10 bg-void-canvas/60 px-1 py-1">
              <p className="text-[7px] text-graphite">{s.label}</p>
              <Sparkline points={s.spark} className="h-3 w-full opacity-60" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === 'profile') {
    return (
      <div className={`${h} grid grid-cols-[1fr_0.9fr] gap-1.5 bg-midnight/80 p-2`}>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <div className="relative h-5 w-5 overflow-hidden rounded-full">
              <Image src={DEMO_PROFILE.avatar_url!} alt="" fill className="object-cover" sizes="20px" />
            </div>
            <p className="truncate text-[9px] text-vellum">{DEMO_PROFILE.display_name}</p>
          </div>
          {['Role', 'Bio'].map((f) => (
            <div key={f} className="h-3 rounded-[4px] border border-reactor/10 bg-void-canvas/50" />
          ))}
        </div>
        <div className="rounded-[6px] border border-reactor/10 bg-void-canvas/40 p-1.5 text-center">
          <div className="mx-auto grid h-8 w-8 grid-cols-3 grid-rows-3 gap-px bg-midnight p-0.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className={i % 2 === 0 ? 'bg-void-canvas' : 'bg-midnight'} />
            ))}
          </div>
          <p className="mt-1 text-[7px] text-graphite">QR</p>
        </div>
      </div>
    );
  }

  if (id === 'connections') {
    const [first, second] = DEMO_CONNECTIONS;
    return (
      <div className={`${h} space-y-1 bg-midnight/80 p-2`}>
        {[first, second].map((c) => (
          <div key={c.id} className="flex items-center gap-1.5 rounded-[6px] border border-reactor/10 bg-void-canvas/30 px-1.5 py-1">
            <div className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full">
              {c.avatarUrl && (
                <Image src={c.avatarUrl} alt="" fill className="object-cover" sizes="16px" />
              )}
            </div>
            <p className="min-w-0 flex-1 truncate text-[8px] text-lichen">{c.name}</p>
            <span className="shrink-0 text-[7px] text-graphite">{c.source}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`${h} space-y-1 bg-midnight/80 p-2`}>
      {['Account', 'Sharing', 'Billing'].map((s, i) => (
        <div
          key={s}
          className={`flex items-center justify-between rounded-[6px] border px-2 py-1 text-[8px] ${
            i === 0 ? 'border-reactor/25 bg-reactor/10 text-vellum' : 'border-reactor/10 text-graphite'
          }`}
        >
          <span>{s}</span>
          <span>{i === 0 ? '▴' : '▾'}</span>
        </div>
      ))}
    </div>
  );
}
