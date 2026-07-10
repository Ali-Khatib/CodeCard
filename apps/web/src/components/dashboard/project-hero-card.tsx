'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HiOutlineArrowTopRightOnSquare, HiOutlineEye, HiOutlinePencil } from 'react-icons/hi2';
import { RevealProjectImages } from '@/components/ui/reveal-images';
import type { PortfolioProject } from '@/lib/dashboard/portfolio';
import { projectColorAt } from '@/lib/design/project-card-colors';
import { ReactiveBorder } from './reactive-border';
import { AppButton } from './ui/dashboard-ui';

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
  const router = useRouter();
  const color = projectColorAt(colorIndex);
  const revealImages = [
    ...(project.screenshots ?? []),
    ...(project.posterUrl ? [project.posterUrl] : []),
  ].map((src, imageIndex) => ({
    src,
    alt: `${project.title} preview ${imageIndex + 1}`,
  }));

  return (
    <ReactiveBorder
      as="article"
      glowRgb={color.glow}
      className="cc-app-project-hero cursor-pointer overflow-hidden rounded-[24px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-iris)]"
      style={{ background: color.bg, borderColor: color.border } as React.CSSProperties}
      role="button"
      tabIndex={0}
      aria-label={`Open ${project.title}`}
      onClick={() => router.push(project.href)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          router.push(project.href);
        }
      }}
    >
      <div className="group/project grid gap-0 md:grid-cols-[1.15fr_1fr]">
        <div className="relative min-h-[280px] md:min-h-[360px]">
          <Image
            src={project.posterUrl ?? FALLBACK}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 60vw"
            priority
          />
          <RevealProjectImages images={revealImages} />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,18,20,0.72)_0%,rgba(18,18,20,0.5)_38%,rgba(18,18,20,0.2)_72%),linear-gradient(0deg,rgba(18,18,20,0.72)_0%,rgba(18,18,20,0.22)_58%,rgba(18,18,20,0.08)_100%)]" />
          <div className="absolute bottom-6 left-6 right-6 max-w-[520px] rounded-[22px] border border-white/15 bg-black/28 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-[2px]">
            <div className="inline-flex rounded-full border border-white/18 bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90">
              Featured hero
            </div>
            <h2 className="cc-fit-title mt-3 font-display text-[clamp(2rem,5vw,3.6rem)] font-semibold leading-[0.92] tracking-[-0.075em] text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)]">
              {project.title}
            </h2>
            {project.tagline && (
              <p className="mt-2 max-w-lg text-[16px] font-medium leading-relaxed text-white/95 drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">{project.tagline}</p>
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

          <div
            className="mt-8 flex flex-wrap gap-2"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
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
