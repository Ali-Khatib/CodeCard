import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { parseHeadline } from '@/lib/profile/parse-headline';
import type { FeaturedProject } from '@/lib/projects/featured';
import type { ResearchPaper } from '@/lib/research/research';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import { toSafeProfileLinkItems } from '@/lib/profile/safe-profile-link-url';
import { profileAvatarAltText } from '@/lib/profile/avatar-url';
import { MAIN_CONTENT_ID } from '@/lib/a11y/main-content';
import { PublicProfileHeroActions } from './public-profile-hero-actions';
import { PublicProfileSocialLinks } from './public-profile-social-links';

/** Below-fold client islands — keep ATF bio free of their hydration cost. */
const PublicProjectStack = dynamic(
  () => import('./public-project-stack').then((m) => m.PublicProjectStack),
  { ssr: true },
);
const PublicResearchSection = dynamic(
  () => import('./public-research-section').then((m) => m.PublicResearchSection),
  { ssr: true },
);
const PublicProfileSaveCard = dynamic(
  () => import('./public-profile-save-card').then((m) => m.PublicProfileSaveCard),
  { ssr: true },
);
/**
 * Public profile view — Server Component shell so the above-fold bio (LCP)
 * is in the initial HTML without waiting on the motion/client chunk.
 */
export function PublicProfileFocused({
  profileSlug,
  displayName,
  headline,
  avatarUrl,
  bio,
  links,
  projects,
  researchPapers = [],
  profileId,
  location,
  connectionControl,
}: {
  profileSlug: string;
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
  bio: string | null;
  links: ProfileLinkItem[];
  projects: FeaturedProject[];
  researchPapers?: ResearchPaper[];
  profileId?: string;
  location?: string | null;
  connectionControl?: {
    isOwnProfile: boolean;
    isAuthenticated: boolean;
    initiallyConnected: boolean;
    initialConnectionId: string | null;
  } | null;
}) {
  const { role, company } = parseHeadline(headline);
  const safeLinks = toSafeProfileLinkItems(links);
  const intro =
    bio ??
    'I build developer tools that make complex workflows feel simple.';
  const firstName = displayName.split(' ')[0];

  return (
    <div className="cc-public-profile">
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="cc-app-page cc-app-page--920 px-5 py-12 md:px-8 md:py-16"
      >
        <header className="cc-app-profile-preview cc-app-profile-preview--hero pb-[min(36vh,18rem)]">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="relative h-[96px] w-[96px] shrink-0 overflow-hidden rounded-full border border-[var(--app-border)] bg-[var(--app-bone)]">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={profileAvatarAltText(displayName)}
                    fill
                    priority
                    fetchPriority="high"
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <span
                    className="flex h-full w-full items-center justify-center text-3xl font-medium"
                    aria-hidden
                  >
                    {displayName[0]}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="break-words text-[clamp(1.75rem,7vw,2.25rem)] font-medium tracking-[-0.03em] text-[var(--app-ink)] md:text-[36px]">
                  {displayName}
                </h1>
                {role ? (
                  <p className="mt-1 break-words text-[16px] text-[var(--app-smoke)]">{role}</p>
                ) : null}
                {company ? (
                  <p className="mt-0.5 break-words text-[16px] text-[var(--app-smoke)]">{company}</p>
                ) : null}
                {location ? (
                  <p className="mt-1 break-words text-[15px] text-[var(--app-smoke)]">{location}</p>
                ) : null}
                <p className="mt-4 max-w-lg break-words text-[16px] leading-relaxed text-[var(--app-ink)]">
                  {intro}
                </p>
                <PublicProfileSocialLinks links={safeLinks} profileId={profileId} />
              </div>
            </div>

            <PublicProfileHeroActions
              profileId={profileId}
              profileSlug={profileSlug}
              displayName={displayName}
              connectionControl={connectionControl}
            />
          </div>
        </header>

        <section className="mt-16">
          <p className="cc-app-mono">Featured work</p>
          <h2 className="mt-3 break-words text-[24px] font-medium tracking-[-0.025em] text-[var(--app-ink)]">
            What {firstName} built
          </h2>
          <p className="mt-2 max-w-lg text-[15px] text-[var(--app-smoke)]">
            Projects, demos, research, and outcomes — shown before credentials.
          </p>

          <div className="mt-8">
            {projects.length > 0 ? (
              <PublicProjectStack
                projects={projects}
                displayName={displayName}
                profileId={profileId}
              />
            ) : (
              <div className="cc-app-card text-center">
                <p className="text-[15px] text-[var(--app-smoke)]">No published projects yet.</p>
              </div>
            )}
          </div>
        </section>

        {researchPapers.length > 0 ? (
          <PublicResearchSection
            profileSlug={profileSlug}
            profileId={profileId}
            researchPapers={researchPapers}
          />
        ) : null}

        <div className="mt-16">
          <PublicProfileSaveCard profileSlug={profileSlug} displayName={displayName} />
        </div>
        <footer className="mt-16 border-t border-[var(--app-border)] pt-8 text-center">
          <Link
            href="/"
            className="text-[14px] text-[var(--app-smoke)] hover:text-[var(--app-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-iris)]"
          >
            CodeCard home
          </Link>
        </footer>
      </main>
    </div>
  );
}
