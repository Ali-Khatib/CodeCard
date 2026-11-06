'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { applyLandingChromeInk } from '@/components/landing/editorial/landing-chrome-tone';
import { StoryNav, StoryFooter } from './story-chrome';
import { VignetteConnections, VignetteProfile, VignetteShare } from './story-vignettes';
import { StoryHero } from './story-hero';
import { useChromeTone, useReveal } from './story-hooks';
import '@/styles/editorial-landing.css';
import '@/styles/story.css';

/* Real product surfaces, loaded after first paint so the hero never waits. */
const HERO_WORDS = ['Your', 'work', 'deserves', 'more', 'than', 'a', 'handshake.'] as const;

export function StoryLanding() {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  useChromeTone(root);

  useEffect(() => () => applyLandingChromeInk('dark'), []);

  return (
    <div ref={root} className="pl" data-testid="story-landing">
      <StoryNav />

      <StoryHero
        words={HERO_WORDS}
        sub="Show what you build. Share who you are. Keep the people you meet."
        actions={
          <>
            <Link href="/sign-up" className="pl-btn pl-btn--solid" data-testid="hero-primary-cta">
              Create your CodeCard
            </Link>
            <Link href="/how-it-works" className="pl-btn pl-btn--ghostLight">
              How it works
            </Link>
          </>
        }
      />

      {/* 02 — How CodeCard Works */}
      <section className="pl-band" data-band="light" aria-labelledby="pl-works-h">
        <div className="pl-wrap">
          <h2 id="pl-works-h" className="pl-display pl-center" data-reveal>
            How CodeCard Works
          </h2>

          <div className="pl-panels">
            <article className="pl-panel" data-reveal>
              <div className="pl-panel__art">
                <VignetteProfile />
              </div>
              <p className="pl-panel__n">
                01 <span className="pl-emb" aria-hidden />
              </p>
              <h3 className="pl-sub">Show your work.</h3>
              <p className="pl-panel__p">
                Bring your professional identity, projects and research together in one place. Give people a reason
                to discover what you do.
              </p>
              <Link href="/sign-up" className="pl-link">
                Create your profile <span aria-hidden>→</span>
              </Link>
            </article>

            <article className="pl-panel" data-reveal>
              <div className="pl-panel__art">
                <VignetteShare />
              </div>
              <p className="pl-panel__n">
                02 <span className="pl-emb" aria-hidden />
              </p>
              <h3 className="pl-sub">Share instantly.</h3>
              <p className="pl-panel__p">
                One CodeCard. One QR code. Share your professional identity whenever an introduction happens.
              </p>
              <a href="/demo/card" className="pl-link">
                Explore sharing <span aria-hidden>→</span>
              </a>
            </article>

            <article className="pl-panel" data-reveal>
              <div className="pl-panel__art">
                <VignetteConnections />
              </div>
              <p className="pl-panel__n">
                03 <span className="pl-emb" aria-hidden />
              </p>
              <h3 className="pl-sub">Keep the connection.</h3>
              <p className="pl-panel__p">
                Remember who you met, where you met and what you discussed. Keep the context that makes a connection
                worth following up on.
              </p>
              <a href="/demo/connections" className="pl-link">
                See connections <span aria-hidden>→</span>
              </a>
            </article>
          </div>
        </div>
      </section>

      {/* 03 — Editorial statement */}
      <section className="pl-band pl-say" data-band="light" aria-labelledby="pl-say-h">
        <div className="pl-wrap pl-say__grid">
          <h2 id="pl-say-h" className="pl-display" data-reveal>
            CodeCard is where introductions become connections
            <span className="pl-emb pl-emb--period" aria-hidden />
          </h2>

          <div className="pl-say__side" data-reveal>
            <p className="pl-p">The best opportunities often begin with a conversation.</p>
            <p className="pl-p">
              CodeCard brings your professional identity, your work and the people you meet into one place.
            </p>
            <p className="pl-p">Show what you do. Remember who you meet. Make the next conversation easier.</p>
            <Link href="/how-it-works" className="pl-btn pl-btn--solid">
              Discover CodeCard
            </Link>
          </div>
        </div>
      </section>

      {/* 04 — Final CTA */}
      <section className="pl-band pl-end" id="start" data-band="light" aria-labelledby="pl-end-h">
        <div className="pl-wrap pl-end__in">
          <h2 id="pl-end-h" className="pl-display pl-display--big pl-center" data-reveal>
            Make every introduction count.
          </h2>
          <p className="pl-subhead pl-center" data-reveal>
            Your work. Your people. Your next opportunity.
          </p>
          <div className="pl-end__cta" data-reveal>
            <Link href="/sign-up" className="pl-btn pl-btn--solid" data-testid="finale-primary-cta">
              Create your CodeCard
            </Link>
            <Link href="/how-it-works" className="pl-link">
              See how it works <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      <StoryFooter />
    </div>
  );
}
