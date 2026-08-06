import Image from 'next/image';
import { DEMO_FEATURED_PROJECTS, DEMO_PROFILE } from '@/lib/projects/demo-data';
import { DEMO_RESEARCH_PAPERS } from '@/lib/research/demo-data';

const DEMO_PROJECT = DEMO_FEATURED_PROJECTS[0]!;
const DEMO_PAPER = DEMO_RESEARCH_PAPERS[0]!;

export type IdentityProductState = 'profile' | 'projects' | 'research' | 'analytics';

const TABS: { id: IdentityProductState; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'projects', label: 'Projects' },
  { id: 'research', label: 'Research' },
  { id: 'analytics', label: 'Impact' },
];

/**
 * Large product frame for the marketing landing — mirrors the live demo persona
 * (Alex Chen), not a miniature floating “business card” toy.
 */
export function IdentityProductCard({
  state = 'profile',
  className = '',
}: {
  state?: IdentityProductState;
  className?: string;
}) {
  const projectImage =
    DEMO_PROJECT.screenshots?.[0] ?? DEMO_PROJECT.posterUrl ?? '';

  return (
    <div
      className={`cc-id-card ${className}`.trim()}
      data-testid="identity-product-card"
      data-state={state}
    >
      <div className="cc-id-card__glow" aria-hidden />
      <div className="cc-id-card__inner">
        <header className="cc-id-card__header">
          <div className="cc-id-card__avatar">
            <Image
              src={DEMO_PROFILE.avatar_url}
              alt=""
              width={56}
              height={56}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="cc-id-card__name">{DEMO_PROFILE.display_name}</p>
            <p className="cc-id-card__role">{DEMO_PROFILE.headline}</p>
          </div>
        </header>

        <nav className="cc-id-card__tabs" aria-label="CodeCard sections">
          {TABS.map((tab) => (
            <span
              key={tab.id}
              className="cc-id-card__tab"
              data-active={tab.id === state ? 'true' : undefined}
            >
              {tab.label}
            </span>
          ))}
        </nav>

        <div className="cc-id-card__panel">
          {state === 'profile' ? (
            <>
              <p className="cc-id-card__kicker">Public profile</p>
              <p className="cc-id-card__title">{DEMO_PROFILE.display_name}</p>
              <p className="cc-id-card__text">{DEMO_PROFILE.bio}</p>
              <p className="cc-id-card__text mt-3">
                {DEMO_PROFILE.headline} · {DEMO_PROFILE.location}
              </p>
            </>
          ) : null}

          {state === 'projects' ? (
            <>
              <p className="cc-id-card__kicker">Featured project</p>
              <p className="cc-id-card__title">{DEMO_PROJECT.title}</p>
              <p className="cc-id-card__text">{DEMO_PROJECT.tagline}</p>
              {projectImage ? (
                <div className="cc-id-card__media">
                  <Image
                    src={projectImage}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 520px"
                    className="object-cover object-top"
                  />
                </div>
              ) : null}
            </>
          ) : null}

          {state === 'research' ? (
            <>
              <p className="cc-id-card__kicker">Research</p>
              <p className="cc-id-card__title">{DEMO_PAPER.title}</p>
              <p className="cc-id-card__text line-clamp-4">{DEMO_PAPER.abstract}</p>
            </>
          ) : null}

          {state === 'analytics' ? (
            <>
              <p className="cc-id-card__kicker">Impact</p>
              <p className="cc-id-card__title">What people opened</p>
              <div className="cc-id-card__metrics">
                <div className="cc-id-card__metric">
                  <strong>1.2k</strong>
                  <span>Profile views</span>
                </div>
                <div className="cc-id-card__metric">
                  <strong>86</strong>
                  <span>Saves</span>
                </div>
                <div className="cc-id-card__metric">
                  <strong>3×</strong>
                  <span>Faster intros</span>
                </div>
              </div>
              <svg className="cc-id-card__chart" viewBox="0 0 160 64" aria-hidden>
                <path
                  d="M4 52 C 28 48, 36 20, 56 28 S 96 8, 120 18 S 148 40, 156 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
              </svg>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
