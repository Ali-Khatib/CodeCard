'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { EditorialProductFrame } from '@/components/landing/editorial/editorial-product-frame';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { GUIDE_SECTIONS, type GuideSectionId } from '@/lib/marketing/guide-content';
import '@/styles/editorial-landing.css';
import '@/styles/guide-page.css';

const NAV_OFFSET = 132;

function jumpToSection(id: GuideSectionId) {
  const el = document.getElementById(`guide-${id}`);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
  window.scrollTo({ top: Math.max(0, top), left: 0, behavior: 'auto' });
  window.history.replaceState(null, '', `/guide#${id}`);
}

function GuideJumpNav({ active }: { active: GuideSectionId }) {
  return (
    <nav className="cc-guide-jump" aria-label="Guide sections">
      <p className="cc-guide-jump__label">Jump to</p>
      <ul className="cc-guide-jump__list">
        {GUIDE_SECTIONS.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={`cc-guide-jump__link${
                active === section.id ? ' cc-guide-jump__link--active' : ''
              }`}
              aria-current={active === section.id ? 'location' : undefined}
              onClick={(event) => {
                event.preventDefault();
                jumpToSection(section.id);
              }}
            >
              {section.nav}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function GuidePage() {
  const [active, setActive] = useState<GuideSectionId>('home');

  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as GuideSectionId;
    if (GUIDE_SECTIONS.some((section) => section.id === hash)) {
      jumpToSection(hash);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, []);

  useEffect(() => {
    const nodes = GUIDE_SECTIONS.map((section) =>
      document.getElementById(`guide-${section.id}`),
    ).filter((node): node is HTMLElement => node != null);

    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = visible?.target.id.replace('guide-', '') as GuideSectionId | undefined;
        if (id && GUIDE_SECTIONS.some((section) => section.id === id)) {
          setActive(id);
        }
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.15, 0.35, 0.6] },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="cc-ed cc-guide-page" data-chapter="guide" data-testid="guide-page">
      <header className="cc-guide-hero">
        <p className="cc-guide-hero__kicker">Guide</p>
        <h1 className="cc-guide-hero__title">How the workspace works</h1>
        <p className="cc-guide-hero__lead">
          Same tabs as the live demo. Jump to the one you want, or read the whole page.
          Then try it on Alex Chen&apos;s card.
        </p>
        <LiveDemoLink className="cc-guide-hero__demo">Open the live demo</LiveDemoLink>
      </header>

      <GuideJumpNav active={active} />

      {GUIDE_SECTIONS.map((section) => (
        <section
          key={section.id}
          id={`guide-${section.id}`}
          className="cc-guide-section"
          aria-labelledby={`guide-${section.id}-heading`}
        >
          <div className="cc-guide-section__copy">
            <p className="cc-guide-section__kicker">{section.kicker}</p>
            <h2 id={`guide-${section.id}-heading`} className="cc-guide-section__title">
              {section.title}
            </h2>
            <p className="cc-guide-section__lead">{section.lead}</p>
            <ul className="cc-guide-section__points">
              {section.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <Link href={section.demoHref} className="cc-guide-section__try">
              {section.demoLabel}
            </Link>
          </div>

          {section.frame ? (
            <div className="cc-guide-section__frame">
              <EditorialProductFrame state={section.frame} size="lg" />
            </div>
          ) : null}

          {section.extra ? (
            <aside className="cc-guide-extra">
              <h3 className="cc-guide-extra__title">{section.extra.title}</h3>
              <p className="cc-guide-extra__body">{section.extra.body}</p>
              <Link href={section.extra.href} className="cc-guide-section__try">
                {section.extra.hrefLabel}
              </Link>
            </aside>
          ) : null}
        </section>
      ))}
    </div>
  );
}
