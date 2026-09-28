'use client';

import { Component, type ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { EditorialProductFrame } from '@/components/landing/editorial/editorial-product-frame';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import {
  GUIDE_CLOSE,
  GUIDE_SECTIONS,
  type GuideSection,
  type GuideSectionId,
  type GuideShotId,
} from '@/lib/marketing/guide-content';
import '@/styles/guide-page.css';

const NAV_OFFSET = 132;

class GuideShotBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <p className="cc-guide-shot__fallback">Snapshot unavailable.</p>;
    }
    return this.props.children;
  }
}

function GuideLiveShot({
  shot,
  eager = false,
  size = 'lg',
}: {
  shot: GuideShotId;
  eager?: boolean;
  size?: 'default' | 'lg';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager);

  useEffect(() => {
    if (eager) return;
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '80px 0px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [eager]);

  return (
    <div ref={ref} className="cc-guide-shot-frame">
      {visible ? (
        <GuideShotBoundary>
          <EditorialProductFrame shot={shot} size={size} fit="content" />
        </GuideShotBoundary>
      ) : (
        <div className="cc-guide-shot__placeholder" aria-hidden />
      )}
    </div>
  );
}

function jumpToSection(id: GuideSectionId | 'close') {
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

function GuideWorkflow({
  workflow,
}: {
  workflow: NonNullable<GuideSection['workflow']>;
}) {
  return (
    <div className="cc-guide-flow">
      <h3 className="cc-guide-flow__title">{workflow.title}</h3>
      <ol className="cc-guide-flow__list">
        {workflow.steps.map((step) => (
          <li key={step.title} className="cc-guide-flow__step">
            <h4 className="cc-guide-flow__heading">{step.title}</h4>
            <p className="cc-guide-flow__caption">{step.caption}</p>
          </li>
        ))}
      </ol>
      <p className="cc-guide-flow__result">{workflow.result}</p>
    </div>
  );
}

function GuideChapter({
  section,
  eagerShot,
}: {
  section: GuideSection;
  eagerShot?: boolean;
}) {
  return (
    <section
      id={`guide-${section.id}`}
      className={`cc-guide-chapter${section.quiet ? ' cc-guide-chapter--quiet' : ''}`}
      aria-labelledby={`guide-${section.id}-heading`}
    >
      <header className="cc-guide-chapter__header">
        <p className="cc-guide-chapter__kicker">{section.kicker}</p>
        <h2 id={`guide-${section.id}-heading`} className="cc-guide-chapter__title">
          {section.title}
        </h2>
        <p className="cc-guide-chapter__lead">{section.lead}</p>
      </header>

      <GuideLiveShot shot={section.overviewShot} eager={eagerShot} size="lg" />

      {section.principle ? (
        <p className="cc-guide-principle">
          <strong>{section.principle.title}</strong> {section.principle.body}
        </p>
      ) : null}

      {section.workflow ? <GuideWorkflow workflow={section.workflow} /> : null}

      <div className="cc-guide-cando">
        <h3 className="cc-guide-cando__heading">{section.canDoHeading}</h3>
        <ul className="cc-guide-cando__list">
          {section.canDo.map((item) => (
            <li key={item.title} className="cc-guide-cando__item">
              <p className="cc-guide-cando__title">{item.title}</p>
              <p className="cc-guide-cando__body">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>

      {section.groups?.map((group) => (
        <div key={group.title} className="cc-guide-group">
          <h3 className="cc-guide-group__title">{group.title}</h3>
          <p className="cc-guide-group__body">{group.body}</p>
        </div>
      ))}

      {section.aside ? (
        <p className="cc-guide-aside">
          <strong>{section.aside.title}</strong> {section.aside.body}
        </p>
      ) : null}

      {section.gallery && section.gallery.length > 0 ? (
        <div className="cc-guide-gallery">
          {section.gallery.map((item) => (
            <figure key={item.shot} className="cc-guide-gallery__item">
              <figcaption className="cc-guide-gallery__caption">
                <h3 className="cc-guide-gallery__title">{item.title}</h3>
                <p className="cc-guide-gallery__body">{item.body}</p>
              </figcaption>
              <GuideLiveShot shot={item.shot} size="default" />
            </figure>
          ))}
        </div>
      ) : null}

      <Link href={section.demoHref} className="cc-guide-chapter__try">
        {section.demoLabel}
      </Link>
    </section>
  );
}

export function GuidePage() {
  const [active, setActive] = useState<GuideSectionId>('home');

  useEffect(() => {
    const html = document.documentElement;
    delete html.dataset.landingChapter;
    delete html.dataset.navTone;
    delete html.dataset.navCompact;
    delete html.dataset.logoTone;
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'story' || hash === 'close') {
      jumpToSection('close');
    } else if (GUIDE_SECTIONS.some((section) => section.id === hash)) {
      jumpToSection(hash as GuideSectionId);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, []);

  useEffect(() => {
    const nodes = GUIDE_SECTIONS.map((section) =>
      document.getElementById(`guide-${section.id}`),
    ).filter((node): node is HTMLElement => Boolean(node));
    if (nodes.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = visible?.target.id.replace('guide-', '') as GuideSectionId | undefined;
        if (id && GUIDE_SECTIONS.some((section) => section.id === id)) {
          setActive(id);
        }
      },
      { rootMargin: '-18% 0px -62% 0px', threshold: [0.1, 0.25, 0.5] },
    );
    for (const node of nodes) io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <div className="cc-guide-page" data-testid="guide-page">
      <header className="cc-guide-hero">
        <p className="cc-guide-hero__kicker">Guide</p>
        <h1 className="cc-guide-hero__title">Show me around CodeCard</h1>
        <p className="cc-guide-hero__lead">
          Six parts of the product. Skim the map, look at a screen, then try it
          on Alex Chen&apos;s card.
        </p>
        <LiveDemoLink className="cc-guide-hero__demo">Open the live demo</LiveDemoLink>
      </header>

      <section className="cc-guide-glance" aria-labelledby="guide-glance-heading">
        <h2 id="guide-glance-heading" className="cc-guide-glance__heading">
          CodeCard at a glance
        </h2>
        <ul className="cc-guide-glance__list">
          {GUIDE_SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="cc-guide-glance__card"
                onClick={(event) => {
                  event.preventDefault();
                  jumpToSection(section.id);
                }}
              >
                <p className="cc-guide-glance__kicker">{section.kicker}</p>
                <p className="cc-guide-glance__title">{section.glanceTitle}</p>
                <p className="cc-guide-glance__body">{section.glanceBody}</p>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <GuideJumpNav active={active} />

      {GUIDE_SECTIONS.map((section, index) => (
        <GuideChapter key={section.id} section={section} eagerShot={index === 0} />
      ))}

      <section
        id="guide-close"
        className="cc-guide-close"
        aria-labelledby="guide-close-heading"
      >
        <h2 id="guide-close-heading" className="cc-guide-close__title">
          {GUIDE_CLOSE.title}
        </h2>
        <p className="cc-guide-close__body">{GUIDE_CLOSE.body}</p>
        <LiveDemoLink className="cc-guide-hero__demo">Try it on the live demo</LiveDemoLink>
      </section>
    </div>
  );
}
