import type { ReactNode } from 'react';
import Link from 'next/link';

type ProductStoryProps = {
  id: string;
  chapter: 'projects' | 'research' | 'circle' | 'connections';
  eyebrow: string;
  title: ReactNode;
  body: string;
  flip?: boolean;
  linkHref?: string;
  linkLabel?: string;
  /** Scheduling-style research numerals. */
  researchBoard?: boolean;
};

/**
 * Editorial product chapter — copy-led. No right-side white product mock.
 */
export function ProductStory({
  id,
  chapter,
  eyebrow,
  title,
  body,
  flip = false,
  linkHref,
  linkLabel,
  researchBoard = false,
}: ProductStoryProps) {
  return (
    <section
      id={id}
      className={`cc-ed__section cc-ed-story cc-ed-story--copy${
        flip ? ' cc-ed-story--flip' : ''
      }${researchBoard ? ' cc-ed-story--research' : ''}`}
      data-chapter-section={chapter}
      data-testid={`editorial-story-${chapter}`}
      aria-labelledby={`editorial-story-${chapter}-heading`}
    >
      <div className="cc-ed-story__copy cc-ed-story__copy--solo">
        <p className="cc-ed__eyebrow">{eyebrow}</p>
        <h2
          id={`editorial-story-${chapter}-heading`}
          className="cc-ed__display mt-4"
        >
          {title}
        </h2>
        <p className="cc-ed__lede mt-5">{body}</p>
        {researchBoard ? (
          <div className="cc-ed__stat-board" aria-label="Research signals">
            <div className="cc-ed__stat">
              <span className="cc-ed__stat-num">12</span>
              <span className="cc-ed__stat-label">Papers</span>
            </div>
            <div className="cc-ed__stat">
              <span className="cc-ed__stat-num">38</span>
              <span className="cc-ed__stat-label">Figures</span>
            </div>
            <div className="cc-ed__stat">
              <span className="cc-ed__stat-num">9</span>
              <span className="cc-ed__stat-label">Methods</span>
            </div>
          </div>
        ) : null}
        {linkHref && linkLabel ? (
          <p className="mt-6">
            <Link href={linkHref} className="cc-ed__link">
              {linkLabel}
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}
