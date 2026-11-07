'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { applyLandingChromeInk } from '@/components/landing/editorial/landing-chrome-tone';
import { StoryNav, StoryFooter } from './story-chrome';
import { StoryHero } from './story-hero';
import { ProductStage } from './story-stage';
import { useChromeTone, useReveal } from './story-hooks';
import type { GuideShotId } from '@/lib/marketing/guide-content';
import '@/styles/codecard-mark.css';
import '@/styles/editorial-landing.css';
import '@/styles/story.css';

const HERO_WORDS = ['Your', 'work.', 'Your', 'identity.', 'One', 'link.'] as const;

/**
 * One product area, three real surfaces. Each tab swaps what is shown; the
 * copy next to it changes with it, so the section demonstrates rather than
 * describes.
 */
const TABS = [
  {
    id: 'profile',
    label: 'Your profile',
    h: 'Everything that makes your work yours.',
    p: 'Your experience, your projects and the research behind them, gathered into one profile that stays current because you only keep it in one place.',
    shot: 'home-identity' as GuideShotId,
  },
  {
    id: 'sharing',
    label: 'Sharing',
    h: 'Ready whenever an introduction happens.',
    p: 'A link and a QR code that open your CodeCard on any phone. Nothing to install on their side, nothing to spell out, nothing lost after the conversation.',
    shot: 'home-share' as GuideShotId,
  },
  {
    id: 'connections',
    label: 'Connections',
    h: 'Keep the people behind the opportunities.',
    p: 'Save the people you meet with the detail around each introduction, so a name from months ago is still someone you can write to with something to say.',
    shot: 'connections-list' as GuideShotId,
  },
] as const;

export function StoryLanding() {
  const root = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('profile');
  useReveal(root);
  useChromeTone(root);

  useEffect(() => () => applyLandingChromeInk('dark'), []);

  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <div ref={root} className="pl" data-testid="story-landing">
      <StoryNav />

      <StoryHero
        words={HERO_WORDS}
        sub="Bring your professional profile, projects and research together. Share your work instantly and give every introduction somewhere to go."
        actions={
          <>
            <Link href="/sign-up" className="pl-btn pl-btn--solid" data-testid="hero-primary-cta">
              Create your CodeCard
            </Link>
            <Link href="/how-it-works" className="pl-btn pl-btn--ghostLight">
              See how it works
            </Link>
          </>
        }
      />

      {/* 02 — What CodeCard actually is, shown rather than claimed. */}
      <section className="pl-band" data-band="light" aria-labelledby="pl-is-h">
        <div className="pl-wrap">
          <div className="pl-lede" data-reveal>
            <h2 id="pl-is-h" className="pl-section-title">
              More than a digital business card
              <span className="pl-emb pl-emb--period" aria-hidden />
            </h2>
            <p className="pl-lede__p">
              CodeCard gives your professional identity a home. Bring your experience, projects,
              research and links together in one profile that is easy to share and simple to keep
              current.
            </p>
          </div>

          <div className="pl-showcase" data-reveal>
            <ProductStage shot="work-projects" />
          </div>
        </div>
      </section>

      {/* 03 — The product experience: one stage, three real surfaces. */}
      <section className="pl-band pl-live" data-band="dark" aria-labelledby="pl-live-h">
        <div className="pl-wrap">
          <div className="pl-live__head">
            <h2 id="pl-live-h" className="pl-section-title pl-section-title--inv">
              The product, not a picture of it
            </h2>
            <div className="pl-live__tabs" role="tablist" aria-label="Product views">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`pl-tab-${t.id}`}
                  aria-selected={tab === t.id}
                  aria-controls="pl-stage-pane"
                  className="pl-live__tab"
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className="pl-live__pane"
            role="tabpanel"
            id="pl-stage-pane"
            aria-labelledby={`pl-tab-${active.id}`}
          >
            <div className="pl-live__copy" key={`${active.id}-copy`}>
              <h3 className="pl-live__h">{active.h}</h3>
              <p className="pl-live__p">{active.p}</p>
            </div>
            <div className="pl-live__screen" key={active.id}>
              <ProductStage shot={active.shot} />
            </div>
          </div>
        </div>
      </section>

      {/* 04 — Editorial statement. */}
      <section className="pl-band pl-say" data-band="light" aria-labelledby="pl-say-h">
        <div className="pl-wrap pl-say__grid">
          <h2 id="pl-say-h" className="pl-statement" data-reveal>
            Your work should travel further than your{' '}
            <span className="pl-nowrap">
              introduction
              <span className="pl-emb pl-emb--period" aria-hidden />
            </span>
          </h2>

          <div className="pl-say__side" data-reveal>
            <p className="pl-p">
              Projects, research and experience deserve to be discovered beyond the moment you meet
              someone. CodeCard brings them together in one place, ready to share whenever the
              opportunity appears.
            </p>
            <Link href="/how-it-works" className="pl-btn pl-btn--solid">
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* 05 — Final CTA. */}
      <section className="pl-band pl-end" id="start" data-band="light" aria-labelledby="pl-end-h">
        <div className="pl-wrap pl-end__in">
          <h2 id="pl-end-h" className="pl-closer pl-center" data-reveal>
            Give your work a place to be discovered
            <span className="pl-emb pl-emb--period" aria-hidden />
          </h2>
          <p className="pl-subhead pl-center" data-reveal>
            Create your CodeCard and make your next introduction count.
          </p>
          <div className="pl-end__cta" data-reveal>
            <Link href="/sign-up" className="pl-btn pl-btn--solid" data-testid="finale-primary-cta">
              Create your CodeCard
            </Link>
          </div>
        </div>
      </section>

      <StoryFooter />
    </div>
  );
}
