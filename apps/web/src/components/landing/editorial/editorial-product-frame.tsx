import Image from 'next/image';
import { DEMO_FEATURED_PROJECTS, DEMO_PROFILE } from '@/lib/projects/demo-data';
import { DEMO_RESEARCH_PAPERS } from '@/lib/research/demo-data';
import {
  DEMO_CONNECTIONS,
  DEMO_OVERVIEW_ACTIVITY,
} from '@/lib/dashboard/workspace-demo';
import { DEMO_CIRCLE_FEED } from '@/lib/dashboard/circle-demo';

const DEMO_PROJECT = DEMO_FEATURED_PROJECTS[0]!;
const DEMO_PAPER = DEMO_RESEARCH_PAPERS[0]!;
const DEMO_PEOPLE = DEMO_CONNECTIONS.slice(0, 4);

export type EditorialProductState =
  | 'profile'
  | 'projects'
  | 'research'
  | 'circle'
  | 'connections'
  | 'analysis';

const TABS: { id: EditorialProductState; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'projects', label: 'Projects' },
  { id: 'research', label: 'Research' },
  { id: 'circle', label: 'Circle' },
  { id: 'connections', label: 'Connections' },
  { id: 'analysis', label: 'Analysis' },
];

/** Large CodeCard product preview for editorial landing. */
export function EditorialProductFrame({
  state = 'profile',
  className = '',
  size = 'default',
}: {
  state?: EditorialProductState;
  className?: string;
  size?: 'default' | 'lg';
}) {
  const projectImage =
    DEMO_PROJECT.screenshots?.[0] ?? DEMO_PROJECT.posterUrl ?? '';

  return (
    <article
      className={`cc-ed__frame ${size === 'lg' ? 'cc-ed__frame--lg' : ''} ${className}`.trim()}
      data-testid="editorial-product-frame"
      data-state={state}
    >
      <header className="cc-ed__frame-head">
        <div className="cc-ed__frame-avatar">
          <Image
            src={DEMO_PROFILE.avatar_url}
            alt=""
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="cc-ed__frame-name">{DEMO_PROFILE.display_name}</p>
          <p className="cc-ed__frame-role">{DEMO_PROFILE.headline}</p>
        </div>
      </header>

      <nav className="cc-ed__frame-tabs" aria-label="CodeCard sections">
        {TABS.map((tab) => (
          <span
            key={tab.id}
            className="cc-ed__frame-tab"
            data-active={tab.id === state ? 'true' : undefined}
          >
            {tab.label}
          </span>
        ))}
      </nav>

      <div className="cc-ed__frame-body">
        {state === 'profile' ? (
          <>
            <p className="cc-ed__frame-kicker">Identity</p>
            <p className="cc-ed__frame-title">{DEMO_PROFILE.display_name}</p>
            <p className="cc-ed__frame-text">{DEMO_PROFILE.bio}</p>
            <p className="cc-ed__frame-text">
              {DEMO_PROFILE.headline} · {DEMO_PROFILE.location}
            </p>
          </>
        ) : null}

        {state === 'projects' ? (
          <>
            <p className="cc-ed__frame-kicker">Featured project</p>
            <p className="cc-ed__frame-title">{DEMO_PROJECT.title}</p>
            <p className="cc-ed__frame-text">{DEMO_PROJECT.tagline}</p>
            {projectImage ? (
              <div className="cc-ed__frame-media">
                <Image
                  src={projectImage}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 640px"
                  className="object-cover object-top"
                />
              </div>
            ) : null}
          </>
        ) : null}

        {state === 'research' ? (
          <>
            <p className="cc-ed__frame-kicker">Research paper</p>
            <p className="cc-ed__frame-title">{DEMO_PAPER.title}</p>
            <p className="cc-ed__frame-text">
              {DEMO_PAPER.authors.join(', ')}
            </p>
            {DEMO_PAPER.coverImageUrl ? (
              <div className="cc-ed__frame-media cc-ed__frame-media--research">
                <Image
                  src={DEMO_PAPER.coverImageUrl}
                  alt=""
                  fill
                  unoptimized={DEMO_PAPER.coverImageUrl.startsWith('data:')}
                  sizes="(max-width: 768px) 100vw, 720px"
                  className="object-cover object-top"
                />
              </div>
            ) : null}
            <p className="cc-ed__frame-text line-clamp-2">{DEMO_PAPER.abstract}</p>
            <ul className="cc-ed__frame-tags" aria-label="Paper topics">
              {DEMO_PAPER.tags.slice(0, 4).map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
            <p className="cc-ed__frame-text mt-3">
              {DEMO_PAPER.venue} · {DEMO_PAPER.publicationStatus} · {DEMO_PAPER.year}
            </p>
          </>
        ) : null}

        {state === 'circle' ? (
          <>
            <div className="cc-ed__circle-byline">
              <div className="cc-ed__frame-avatar cc-ed__frame-avatar--sm">
                {DEMO_CIRCLE_FEED[0]?.avatarUrl ? (
                  <Image
                    src={DEMO_CIRCLE_FEED[0].avatarUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="cc-ed__person-name">
                  {DEMO_CIRCLE_FEED[0]?.connectionName}
                </p>
                <p className="cc-ed__person-meta">
                  {DEMO_CIRCLE_FEED[0]?.connectionRole}
                </p>
              </div>
            </div>
            <p className="cc-ed__frame-kicker mt-4">Shared in Circle</p>
            <p className="cc-ed__frame-title">
              {DEMO_CIRCLE_FEED[0]?.projectTitle}
            </p>
            <p className="cc-ed__frame-text">
              {DEMO_CIRCLE_FEED[0]?.projectTagline}
            </p>
            {DEMO_CIRCLE_FEED[0]?.posterUrl ? (
              <div className="cc-ed__frame-media">
                <Image
                  src={DEMO_CIRCLE_FEED[0].posterUrl}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 640px"
                  className="object-cover object-top"
                />
              </div>
            ) : null}
            <p className="cc-ed__frame-text mt-3">
              {DEMO_CIRCLE_FEED[0]?.updatedAt}
            </p>
          </>
        ) : null}

        {state === 'connections' ? (
          <>
            <p className="cc-ed__frame-kicker">Connections</p>
            <p className="cc-ed__frame-title">People you actually met</p>
            <ul className="cc-ed__people cc-ed__people--rich">
              {DEMO_PEOPLE.map((person) => (
                <li key={person.id} className="cc-ed__person cc-ed__person--card">
                  <div className="cc-ed__frame-avatar cc-ed__frame-avatar--sm">
                    {person.avatarUrl ? (
                      <Image
                        src={person.avatarUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="cc-ed__person-name">{person.name}</p>
                    <p className="cc-ed__person-meta">
                      {person.role} · {person.company}
                    </p>
                    <p className="cc-ed__person-detail">
                      Met at {person.metAt} · {person.source}
                      {person.note ? ` · ${person.note}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {state === 'analysis' ? (
          <>
            <p className="cc-ed__frame-kicker">Analysis</p>
            <p className="cc-ed__frame-title">How your work travels</p>
            <div className="cc-ed__metric-grid" aria-label="Analysis metrics">
              <div className="cc-ed__metric-box">
                <strong>1.2k</strong>
                <span>Profile views</span>
              </div>
              <div className="cc-ed__metric-box">
                <strong>86</strong>
                <span>Project opens</span>
              </div>
              <div className="cc-ed__metric-box">
                <strong>24</strong>
                <span>Research reads</span>
              </div>
            </div>
            <div className="cc-ed__metric-grid cc-ed__metric-grid--row2">
              <div className="cc-ed__metric-box">
                <strong>41</strong>
                <span>QR scans</span>
              </div>
              <div className="cc-ed__metric-box">
                <strong>18</strong>
                <span>Circle shares</span>
              </div>
              <div className="cc-ed__metric-box">
                <strong>9</strong>
                <span>Follow ups</span>
              </div>
            </div>
            <div className="cc-ed__analysis-split">
              <div className="cc-ed__analysis-panel">
                <p className="cc-ed__analysis-label">Reach over time</p>
                <svg className="cc-ed__chart" viewBox="0 0 220 72" aria-hidden>
                  <path
                    className="cc-ed__chart-line"
                    d="M0 52 C 28 48, 42 30, 66 36 S 112 10, 142 20 S 182 46, 220 22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="cc-ed__analysis-panel">
                <p className="cc-ed__analysis-label">Recent activity</p>
                <ul className="cc-ed__activity">
                  {DEMO_OVERVIEW_ACTIVITY.slice(0, 4).map((item) => (
                    <li key={item.id}>
                      <span>{item.text}</span>
                      <em>{item.time}</em>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </article>
  );
}
