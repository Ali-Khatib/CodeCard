import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Briefcase, Code2, FlaskConical, MapPin, type LucideIcon } from 'lucide-react';
import { parseHeadline } from '@/lib/profile/parse-headline';
import type { FeaturedProject } from '@/lib/projects/featured';
import type { ResearchPaper } from '@/lib/research/research';
import type { ProfileLinkItem } from '@/lib/icons/profile-links';
import { toSafeProfileLinkItems } from '@/lib/profile/safe-profile-link-url';
import { profileAvatarAltText } from '@/lib/profile/avatar-url';
import { MAIN_CONTENT_ID } from '@/lib/a11y/main-content';
import { profileQuickHistory } from '@/lib/profile/quick-history';
import { PublicProfileBackLink } from './public-profile-back-link';
import { PublicProfileHeroActions } from './public-profile-hero-actions';
import { PublicProfileSocialLinks } from './public-profile-social-links';
import { PublicHeroFlipPanel } from './public-hero-flip-panel';
import { ProfileSectionHashScroll } from './profile-section-hash-scroll';
import { FounderGreeting } from './founder-greeting';
import { isFounderProfile } from '@/lib/profile/founder';

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
const PublicProfileAtmosphere = dynamic(
  () => import('./public-profile-atmosphere').then((m) => m.PublicProfileAtmosphere),
  { ssr: true },
);
const PublicProfileDock = dynamic(
  () => import('./public-profile-dock').then((m) => m.PublicProfileDock),
  { ssr: true },
);

const FOUNDER_ROLE_ICONS: LucideIcon[] = [Briefcase, Code2, FlaskConical];

function LineIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className="cc-public-hero__line-icon" aria-hidden />;
}

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
  const founder = isFounderProfile({ profileId, profileSlug });
  const founderRoles = founder
    ? (headline ?? '')
        .split('·')
        .map((part) => part.trim())
        .filter(Boolean)
    : [];
  const history = profileQuickHistory({
    profileSlug,
    headline,
    location,
    bio,
  });
  const safeLinks = toSafeProfileLinkItems(links);
  const intro =
    bio ??
    'I build developer tools that make complex workflows feel simple.';
  const firstName = displayName.split(' ')[0];
  const backHref =
    profileSlug === 'demo' ? '/demo' : connectionControl?.isOwnProfile ? '/dashboard' : '/';
  const backLabel =
    profileSlug === 'demo' || connectionControl?.isOwnProfile
      ? 'Back to workspace'
      : 'Back to CodeCard';

  return (
    <div className={`cc-public-profile${founder ? ' cc-public-profile--founder' : ''}`}>
      <PublicProfileAtmosphere />
      {founder ? <FounderGreeting displayName={displayName} /> : null}
      <ProfileSectionHashScroll />
      <PublicProfileDock
        backHref={backHref}
        backLabel={backLabel}
        hasResearch={researchPapers.length > 0}
      />
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="cc-app-page cc-app-page--920 relative z-[1] px-5 pb-12 pt-24 md:px-8 md:pb-16 md:pt-28"
      >
        <header
          id="profile-hero"
          className="cc-public-hero cc-app-profile-preview cc-app-profile-preview--hero cc-demo-hero-enter cc-public-hero--fade"
        >
          <div className="cc-public-hero__stage">
            <div className="cc-public-hero__portrait">
              <div className="cc-public-hero__portrait-frame">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={profileAvatarAltText(displayName)}
                    fill
                    // LCP on `/demo` is the bio text, not the avatar — avoid high-priority
                    // image decode competing with text paint (Phase 0C).
                    className="object-cover object-center"
                    sizes="(max-width: 640px) 92vw, 440px"
                    quality={90}
                  />
                ) : (
                  <span
                    className="flex h-full w-full items-center justify-center bg-[var(--app-bone)] text-5xl font-medium text-[var(--app-ink)]"
                    aria-hidden
                  >
                    {displayName[0]}
                  </span>
                )}
              </div>
            </div>

            <PublicHeroFlipPanel
              className="min-w-0"
              displayName={displayName}
              history={history}
              footer={
                <PublicProfileHeroActions
                  profileId={profileId}
                  profileSlug={profileSlug}
                  displayName={displayName}
                  connectionControl={connectionControl}
                />
              }
            >
              <p className="cc-app-mono cc-public-hero__eyebrow">CodeCard</p>
              <h1 className="cc-public-hero__title mt-2 break-words text-[clamp(1.85rem,6vw,2.65rem)] font-medium tracking-[-0.035em]">
                {displayName}
              </h1>
              {founder && founderRoles.length > 0 ? (
                <p className="cc-founder-roles">
                  {founderRoles.map((part, index) => {
                    const Icon = FOUNDER_ROLE_ICONS[index] ?? Briefcase;
                    return (
                      <span key={part}>
                        <LineIcon icon={Icon} />
                        <span className={index === 0 ? 'cc-founder-roles__lead' : undefined}>{part}</span>
                        {index < founderRoles.length - 1 ? (
                          <span className="cc-founder-roles__sep" aria-hidden>
                            ·
                          </span>
                        ) : null}
                      </span>
                    );
                  })}
                </p>
              ) : role ? (
                <p className="cc-public-hero__headline">
                  <LineIcon icon={Briefcase} />
                  <span>
                    {role}
                    {company ? (
                      <>
                        <span aria-hidden> · </span>
                        {company}
                      </>
                    ) : null}
                  </span>
                </p>
              ) : null}
              {location ? (
                <p className="cc-public-hero__place">
                  <LineIcon icon={MapPin} />
                  <span className="break-words">{location}</span>
                </p>
              ) : null}
              <p className="cc-public-hero__bio mt-4 max-w-md break-words text-[15px] leading-relaxed md:text-[16px]">
                {intro}
              </p>
              <div className="cc-public-hero__social mt-5 [&>nav]:mt-0">
                <PublicProfileSocialLinks links={safeLinks} profileId={profileId} />
              </div>
            </PublicHeroFlipPanel>
          </div>
        </header>

        <section id="projects" className="mt-10 scroll-mt-28 md:mt-14">
          <p className="cc-app-mono">{founder ? 'Founder builds' : 'Featured work'}</p>
          <h2 className="cc-public-display mt-3 break-words text-[28px] text-[var(--app-ink)] md:text-[34px]">
            {founder ? 'The work behind CodeCard' : `What ${firstName} built`}
          </h2>
          <p className="mt-2 max-w-lg text-[15px] text-[var(--app-smoke)]">
            {founder
              ? 'Product, research, and systems — the stack that made this card possible.'
              : 'Scroll to stack projects — the quickest way to see the work.'}
          </p>

          <div className="mt-6 md:mt-8">
            {projects.length > 0 ? (
              <PublicProjectStack
                projects={projects}
                displayName={displayName}
                profileId={profileId}
                profileSlug={profileSlug}
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
          <PublicProfileBackLink
            href="/"
            className="text-[14px] text-[var(--app-smoke)] hover:text-[var(--app-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-iris)]"
          >
            CodeCard home
          </PublicProfileBackLink>
        </footer>
      </main>
    </div>
  );
}
