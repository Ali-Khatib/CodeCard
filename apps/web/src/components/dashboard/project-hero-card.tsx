'use client';

import Image from 'next/image';
import Link from 'next/link';
import { HiOutlineArrowTopRightOnSquare, HiOutlineEye, HiOutlinePencil } from 'react-icons/hi2';
import type { PortfolioProject } from '@/lib/dashboard/portfolio';
import { projectColorAt } from '@/lib/design/project-card-colors';
import { ReactiveBorder } from './reactive-border';
import { AppButton, AppMono } from './ui/dashboard-ui';

const FALLBACK =
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80';

export function ProjectHeroCard({
  project,
  basePath = '/dashboard',
  colorIndex = 0,
}: {
  project: PortfolioProject;
  basePath?: string;
  colorIndex?: number;
}) {
  const color = projectColorAt(colorIndex);

  return (
    <ReactiveBorder
      as="article"
      glowRgb={color.glow}
      className="cc-app-project-hero overflow-hidden rounded-[24px]"
      style={{ background: color.bg, borderColor: color.border } as React.CSSProperties}
    >
      <div className="grid gap-0 md:grid-cols-[1.15fr_1fr]">
        <div className="relative min-h-[280px] md:min-h-[360px]">
          <Image
            src={project.posterUrl ?? FALLBACK}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 60vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(35,35,36,0.45)] via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <AppMono>Featured hero</AppMono>
            <h2 className="mt-2 text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-[-0.03em] text-white">
              {project.title}
            </h2>
            {project.tagline && (
              <p className="mt-2 max-w-lg text-[16px] leading-relaxed text-white/90">{project.tagline}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between p-7 md:p-8">
          <div>
            <p className="text-[14px] leading-relaxed text-[var(--app-ink)]">
              {project.description?.slice(0, 220) ??
                'Your strongest project — the first thing visitors see when they open your CodeCard.'}
              {project.description && project.description.length > 220 ? '…' : ''}
            </p>
            {project.technologies.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {project.technologies.slice(0, 5).map((tech) => (
                  <span key={tech} className="cc-app-tech-tag">
                    {tech}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-4 text-[14px] text-[var(--app-smoke)]">
              <strong className="font-medium text-[var(--app-ink)]">{project.views ?? 0}</strong> views ·{' '}
              <strong className="font-medium text-[var(--app-ink)]">{project.saves ?? 0}</strong> saves
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Link href={`${basePath}/projects/${project.id}`}>
              <AppButton variant="primary">
                <HiOutlinePencil className="h-4 w-4" aria-hidden />
                Edit
              </AppButton>
            </Link>
            <Link href={project.href}>
              <AppButton variant="ghost">
                <HiOutlineEye className="h-4 w-4" aria-hidden />
                Preview
              </AppButton>
            </Link>
            {project.liveUrl && (
              <a href={project.liveUrl} target="_blank" rel="noreferrer">
                <AppButton variant="ghost">
                  <HiOutlineArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
                  Live demo
                </AppButton>
              </a>
            )}
          </div>
        </div>
      </div>
    </ReactiveBorder>
  );
}
