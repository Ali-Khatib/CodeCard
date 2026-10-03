'use client';

import { Component, type ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { EditorialProductFrame } from '@/components/landing/editorial/editorial-product-frame';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import {
  GUIDE_CLOSE,
  GUIDE_FLOW,
  GUIDE_SECTIONS,
  type GuideSection,
  type GuideSectionId,
  type GuideScreen,
  type GuideShotId,
} from '@/lib/marketing/guide-content';
import '@/styles/guide-page.css';

const NAV_OFFSET = 176;

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
}: {
  shot: GuideShotId;
  eager?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(eager);

  useEffect(() => {
    if (eager || show) return;
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShow(true);
          observer.disconnect();
        }
      },
      { rootMargin: '240px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [eager, show]);

  return (
    <div ref={rootRef} className="cc-guide-shot">
      {show ? (
        <GuideShotBoundary>
          <EditorialProductFrame shot={shot} fit="content" size="lg" />
        </GuideShotBoundary>
      ) : (
        <div className="cc-guide-shot__placeholder" aria-hidden />
      )}
    </div>
  );
}

function useEntered() {
  const ref = useRef<HTMLElement>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setEntered(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.22 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, entered };
}

function GuideScreenView({ screen, eager }: { screen: GuideScreen; eager?: boolean }) {
  const { ref, entered } = useEntered();
  const [line, setLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(
    null,
  );

  useEffect(() => {
    const fig = ref.current;
    if (!fig) return;
    const measure = () => {
      const spot = fig.querySelector('.cc-guide-screen__spot');
      const callout = fig.querySelector('.cc-guide-screen__callout');
      if (!spot || !callout) return false;
      const fr = fig.getBoundingClientRect();
      const sr = spot.getBoundingClientRect();
      const cr = callout.getBoundingClientRect();
      if (fr.width < 2 || sr.width < 2) return false;
      const wide = window.matchMedia('(min-width: 900px)').matches;
      const aligned = wide ? Math.abs(cr.top - sr.top) < 48 : cr.top > sr.bottom - 8;
      if (!aligned) return false;
      if (wide) {
        setLine({
          x1: cr.right - fr.left + 6,
          y1: cr.top + Math.min(22, cr.height / 2) - fr.top,
          x2: sr.left - fr.left - 2,
          y2: sr.top + sr.height * 0.42 - fr.top,
        });
      } else {
        const x = sr.left + sr.width / 2 - fr.left;
        setLine({
          x1: x,
          y1: sr.bottom - fr.top + 4,
          x2: x,
          y2: cr.top - fr.top - 4,
        });
      }
      return true;
    };
    let frames = 0;
    const tick = () => {
      if (measure() || frames > 24) return;
      frames += 1;
      requestAnimationFrame(tick);
    };
    tick();
    const later = window.setTimeout(tick, 120);
    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(fig);
    const stage = fig.querySelector('.cc-guide-screen__stage');
    if (stage) observer.observe(stage);
    window.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(later);
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [entered, ref, screen.shot, screen.spot.x, screen.spot.y, screen.spot.w, screen.spot.h]);

  const markerId = `cc-guide-arrow-${screen.shot}`;

  return (
    <figure
      ref={ref}
      className="cc-guide-screen"
      data-entered={entered ? 'true' : 'false'}
      style={{ ['--spot-y' as string]: `${screen.spot.y}%` }}
    >
      <figcaption className="cc-guide-screen__callout">
        <p className="cc-guide-screen__callout-title">{screen.callout}</p>
        <p className="cc-guide-screen__callout-body">{screen.body}</p>
      </figcaption>
      <div className="cc-guide-screen__stage">
        <p className="cc-guide-screen__badge">
          <span className="cc-guide-screen__badge-dot" aria-hidden />
          Real product screen · {screen.tab}
        </p>
        <div className="cc-guide-shot-frame">
          <GuideLiveShot shot={screen.shot} eager={eager} />
        </div>
        <div
          className="cc-guide-screen__spot"
          style={{
            left: `${screen.spot.x}%`,
            top: `${screen.spot.y}%`,
            width: `${screen.spot.w}%`,
            height: `${screen.spot.h}%`,
          }}
        />
      </div>
      {line ? (
        <svg className="cc-guide-screen__arrow" aria-hidden>
          <defs>
            <marker
              id={markerId}
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <path d="M1 1 L7 4 L1 7" fill="none" stroke="#e95a0b" strokeWidth="1.4" />
            </marker>
          </defs>
          <line
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            markerEnd={`url(#${markerId})`}
          />
        </svg>
      ) : null}
    </figure>
  );
}

function GuideJumpNav({
  active,
  onJump,
}: {
  active: GuideSectionId | 'overview';
  onJump: (id: GuideSectionId | 'overview') => void;
}) {
  const items: { id: GuideSectionId | 'overview'; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    ...GUIDE_SECTIONS.map((section) => ({ id: section.id, label: section.nav })),
  ];
  return (
    <nav className="cc-guide-jump" aria-label="Guide sections">
      <div className="cc-guide-jump__track">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="cc-guide-jump__link"
            data-active={active === item.id ? 'true' : undefined}
            onClick={() => onJump(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function jumpToSection(id: string) {
  const node = document.getElementById(id);
  if (!node) return;
  const top = node.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
  window.scrollTo({ top, behavior: 'smooth' });
}

export function GuidePage() {
  const [active, setActive] = useState<GuideSectionId | 'overview'>('overview');

  useEffect(() => {
    const nodes = ['overview', ...GUIDE_SECTIONS.map((section) => section.id)]
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (nodes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = visible?.target.id;
        if (id === 'overview' || GUIDE_SECTIONS.some((section) => section.id === id)) {
          setActive(id as GuideSectionId | 'overview');
        }
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.15, 0.4] },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="cc-guide-page" data-testid="guide-page">
      <header className="cc-guide-hero" id="overview">
        <p className="cc-guide-hero__kicker">CodeCard</p>
        <h1 className="cc-guide-hero__title">
          Meet people. Show your work. Remember the connection.
        </h1>
        <p className="cc-guide-hero__lead">
          CodeCard is your professional card for real-world conversations. Build your profile,
          showcase your projects and research, exchange your card with a scan, and remember the
          people you meet.
        </p>
        <div className="cc-guide-hero__actions">
          <Link href="/sign-up" className="cc-guide-btn cc-guide-btn--solid">
            Start with your Card
            <span aria-hidden> →</span>
          </Link>
          <button type="button" className="cc-guide-btn" onClick={() => jumpToSection('flow')}>
            See how it works
            <span aria-hidden> ↓</span>
          </button>
        </div>
      </header>

      <section className="cc-guide-flow" id="flow" aria-labelledby="guide-flow-title">
        <h2 id="guide-flow-title" className="cc-guide-flow__title">
          From meeting someone to staying connected
        </h2>
        <ol className="cc-guide-flow__steps">
          {GUIDE_FLOW.map((step) => (
            <li key={step.n}>
              <span className="cc-guide-flow__n">{step.n}</span>
              <strong>{step.title}</strong>
              <span>{step.body}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="cc-guide-intro" aria-labelledby="guide-intro-title">
        <h2 id="guide-intro-title" className="cc-guide-intro__title">
          Now, here&apos;s what each part does
        </h2>
        <p className="cc-guide-intro__lead">
          These are real screens from CodeCard. We&apos;ve highlighted the part being explained so
          you always know where to look.
        </p>
      </section>

      <GuideJumpNav
        active={active}
        onJump={(id) => {
          setActive(id);
          jumpToSection(id === 'overview' ? 'overview' : id);
        }}
      />

      {GUIDE_SECTIONS.map((section, index) => (
        <GuideChapter key={section.id} section={section} eager={index === 0} />
      ))}

      <section className="cc-guide-scene" aria-labelledby="guide-scene-title">
        <p className="cc-guide-hero__kicker">See it in action</p>
        <h2 id="guide-scene-title" className="cc-guide-scene__title">
          You&apos;re at a conference.
        </h2>
        <ol className="cc-guide-scene__steps">
          <li>You meet another researcher.</li>
          <li>
            Instead of “here’s my LinkedIn,” you say <strong>scan my CodeCard</strong>.
          </li>
          <li>They scan. Your profile opens. They see your work.</li>
          <li>You save the connection and add the meeting point ASYU 2026.</li>
          <li>Note: talked about small-object detection and computer vision.</li>
          <li>You set a follow-up. Later, you can find that person again.</li>
        </ol>
      </section>

      <section className="cc-guide-fit" aria-labelledby="guide-fit-title">
        <h2 id="guide-fit-title" className="cc-guide-fit__title">
          How it all fits together
        </h2>
        <ol className="cc-guide-fit__rail">
          <li>
            <strong>Your card</strong>
            <span>Share it in person</span>
          </li>
          <li>
            <strong>Connections</strong>
            <span>Remember who you met</span>
          </li>
          <li>
            <strong>Notes</strong>
            <span>Remember the conversation</span>
          </li>
          <li>
            <strong>Follow-up</strong>
            <span>Reconnect later</span>
          </li>
          <li>
            <strong>Circle</strong>
            <span>Keep up with their work</span>
          </li>
          <li>
            <strong>Analytics</strong>
            <span>See what people look at</span>
          </li>
        </ol>
      </section>

      <section className="cc-guide-glance" aria-labelledby="guide-glance-title">
        <h2 id="guide-glance-title" className="cc-guide-glance__heading">
          CodeCard at a glance
        </h2>
        <dl className="cc-guide-glance__grid">
          {GUIDE_SECTIONS.map((section) => (
            <div key={section.id}>
              <dt>{section.glanceTitle}</dt>
              <dd>{section.glance}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="cc-guide-close">
        <h2 className="cc-guide-close__title">{GUIDE_CLOSE.title}</h2>
        <p className="cc-guide-close__body">{GUIDE_CLOSE.body}</p>
        <ul className="cc-guide-close__points">
          {GUIDE_CLOSE.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <div className="cc-guide-hero__actions">
          <Link href="/sign-up" className="cc-guide-btn cc-guide-btn--solid">
            Create your CodeCard
            <span aria-hidden> →</span>
          </Link>
          <LiveDemoLink className="cc-guide-btn">Open the live demo</LiveDemoLink>
        </div>
      </section>
    </div>
  );
}

function GuideChapter({ section, eager }: { section: GuideSection; eager?: boolean }) {
  return (
    <section className="cc-guide-chapter" id={section.id} aria-labelledby={`${section.id}-title`}>
      <header className="cc-guide-chapter__header">
        <p className="cc-guide-chapter__kicker">{section.kicker}</p>
        <h2 id={`${section.id}-title`} className="cc-guide-chapter__title">
          {section.title}
        </h2>
        <p className="cc-guide-chapter__lead">{section.lead}</p>
        <p className="cc-guide-cando__heading">{section.canDoHeading}</p>
        <ul className="cc-guide-cando">
          {section.canDo.map((item) => (
            <li key={item.title}>{item.title}</li>
          ))}
        </ul>
      </header>
      <div className="cc-guide-chapter__screens">
        {section.screens.map((screen, index) => (
          <GuideScreenView key={screen.shot} screen={screen} eager={eager && index === 0} />
        ))}
      </div>
      <p className="cc-guide-chapter__demo">
        <LiveDemoLink className="cc-guide-text-link">Open {section.nav} in the demo</LiveDemoLink>
      </p>
    </section>
  );
}
