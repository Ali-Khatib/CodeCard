'use client';

import { Component, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { EditorialProductFrame } from '@/components/landing/editorial/editorial-product-frame';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import {
  GUIDE_SECTIONS,
  GUIDE_STORY,
  type GuideCallout,
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

function GuideLiveShot({ shot }: { shot: GuideShotId }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '320px 0px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="cc-guide-section__frame">
      {visible ? (
        <GuideShotBoundary>
          <EditorialProductFrame shot={shot} size="lg" fit="content" />
        </GuideShotBoundary>
      ) : (
        <div className="cc-guide-shot__placeholder" aria-hidden />
      )}
    </div>
  );
}

function jumpToSection(id: GuideSectionId | 'story') {
  const el = document.getElementById(`guide-${id}`);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
  window.scrollTo({ top: Math.max(0, top), left: 0, behavior: 'auto' });
  window.history.replaceState(null, '', `/guide#${id}`);
}

function GuideJumpNav({ active }: { active: GuideSectionId }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [thumb, setThumb] = useState({ left: 0, top: 0, width: 0, height: 0, ready: false });

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const measure = () => {
      const link = list.querySelector<HTMLElement>(`[data-guide-nav="${active}"]`);
      if (!link) return;
      const listBox = list.getBoundingClientRect();
      const box = link.getBoundingClientRect();
      setThumb({
        left: box.left - listBox.left + list.scrollLeft,
        top: box.top - listBox.top + list.scrollTop,
        width: box.width,
        height: box.height,
        ready: true,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [active]);

  return (
    <nav className="cc-guide-jump" aria-label="Guide sections">
      <p className="cc-guide-jump__label">Jump to</p>
      <ul ref={listRef} className="cc-guide-jump__list">
        <li
          className="cc-guide-jump__thumb"
          aria-hidden
          style={{
            opacity: thumb.ready ? 1 : 0,
            transform: `translate(${thumb.left}px, ${thumb.top}px)`,
            width: thumb.width,
            height: thumb.height,
          }}
        />
        {GUIDE_SECTIONS.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              data-guide-nav={section.id}
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

function GuideOverview({
  shot,
  callouts,
}: {
  shot: GuideShotId;
  callouts: GuideCallout[];
}) {
  return (
    <figure className="cc-guide-overview">
      <div className="cc-guide-overview__stage">
        <GuideLiveShot shot={shot} />
        <ol className="cc-guide-overview__pins" aria-hidden>
          {callouts.map((item) => (
            <li
              key={item.n}
              className="cc-guide-overview__pin"
              style={{ left: item.x, top: item.y }}
            >
              {item.n}
            </li>
          ))}
        </ol>
      </div>
      <ol className="cc-guide-overview__legend">
        {callouts.map((item) => (
          <li key={item.n} className="cc-guide-overview__legend-item">
            <span className="cc-guide-overview__n" aria-hidden>
              {item.n}
            </span>
            <div>
              <p className="cc-guide-overview__legend-title">{item.title}</p>
              <p className="cc-guide-overview__legend-body">{item.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </figure>
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
        {workflow.steps.map((step, index) => (
          <li key={step.title} className="cc-guide-flow__step">
            <p className="cc-guide-flow__kicker">
              {String(index + 1).padStart(2, '0')}
            </p>
            <h4 className="cc-guide-flow__heading">{step.title}</h4>
            <p className="cc-guide-flow__caption">{step.caption}</p>
            {step.shot ? <GuideLiveShot shot={step.shot} /> : null}
          </li>
        ))}
      </ol>
      <p className="cc-guide-flow__result">{workflow.result}</p>
    </div>
  );
}

function GuideSectionBlock({ section }: { section: GuideSection }) {
  return (
    <section
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
      </div>

      <div className="cc-guide-cando">
        <h3 className="cc-guide-cando__heading">What you can do here</h3>
        <ul className="cc-guide-cando__list">
          {section.canDo.map((item) => (
            <li key={item.title} className="cc-guide-cando__item">
              <p className="cc-guide-cando__title">{item.title}</p>
              <p className="cc-guide-cando__body">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>

      <GuideOverview shot={section.overviewShot} callouts={section.callouts} />

      {section.workflow ? <GuideWorkflow workflow={section.workflow} /> : null}

      {section.details.length > 0 ? (
        <details className="cc-guide-more">
          <summary className="cc-guide-more__summary">Show more of this page</summary>
          <div className="cc-guide-more__body">
            {section.details.map((item) => (
              <figure key={item.shot} className="cc-guide-shot">
                <figcaption className="cc-guide-shot__caption">
                  <h3 className="cc-guide-shot__title">{item.title}</h3>
                  <p className="cc-guide-shot__body">{item.body}</p>
                </figcaption>
                <GuideLiveShot shot={item.shot} />
              </figure>
            ))}
          </div>
        </details>
      ) : null}

      <Link href={section.demoHref} className="cc-guide-section__try">
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
    if (hash === 'story') {
      jumpToSection('story');
    } else if (GUIDE_SECTIONS.some((section) => section.id === hash)) {
      jumpToSection(hash as GuideSectionId);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, []);

  useEffect(() => {
    const updateActive = () => {
      const marker = NAV_OFFSET + 8;
      let current: GuideSectionId = 'home';
      for (const section of GUIDE_SECTIONS) {
        const el = document.getElementById(`guide-${section.id}`);
        if (el && el.getBoundingClientRect().top <= marker) {
          current = section.id;
        }
      }
      setActive(current);
    };

    updateActive();
    window.addEventListener('scroll', updateActive, { passive: true });
    window.addEventListener('resize', updateActive);
    return () => {
      window.removeEventListener('scroll', updateActive);
      window.removeEventListener('resize', updateActive);
    };
  }, []);

  return (
    <div className="cc-guide-page" data-testid="guide-page">
      <header className="cc-guide-hero">
        <p className="cc-guide-hero__kicker">Guide</p>
        <h1 className="cc-guide-hero__title">Show me around CodeCard</h1>
        <p className="cc-guide-hero__lead">
          Skim the map. Stop where you want to look closer. Then try it on Alex
          Chen&apos;s card.
        </p>
        <LiveDemoLink className="cc-guide-hero__demo">Open the live demo</LiveDemoLink>
      </header>

      <section className="cc-guide-glance" aria-labelledby="guide-glance-heading">
        <h2 id="guide-glance-heading" className="cc-guide-glance__heading">
          CodeCard, at a glance
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
                <p className="cc-guide-glance__title">{section.glanceTitle}</p>
                <p className="cc-guide-glance__body">{section.glanceBody}</p>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <GuideJumpNav active={active} />

      {GUIDE_SECTIONS.map((section) => (
        <GuideSectionBlock key={section.id} section={section} />
      ))}

      <section
        id="guide-story"
        className="cc-guide-story"
        aria-labelledby="guide-story-heading"
      >
        <p className="cc-guide-section__kicker">The loop</p>
        <h2 id="guide-story-heading" className="cc-guide-section__title">
          {GUIDE_STORY.title}
        </h2>
        <ol className="cc-guide-story__list">
          {GUIDE_STORY.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="cc-guide-story__close">{GUIDE_STORY.close}</p>
        <LiveDemoLink className="cc-guide-hero__demo">Try it on the live demo</LiveDemoLink>
      </section>
    </div>
  );
}
