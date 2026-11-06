'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { StoryNav, StoryFooter } from './story-chrome';
import { StoryHero } from './story-hero';
import { useChromeTone, useReveal } from './story-hooks';
import '@/styles/editorial-landing.css';
import '@/styles/story.css';

const EditorialProductFrame = dynamic(
  () =>
    import('@/components/landing/editorial/editorial-product-frame').then(
      (m) => m.EditorialProductFrame,
    ),
  { ssr: false, loading: () => <div className="pl-hold" /> },
);

const PublicCodeCardQr = dynamic(
  () => import('@/components/profile/public-code-card-qr').then((m) => m.PublicCodeCardQr),
  { ssr: false, loading: () => <div className="pl-hold" /> },
);

const HERO_WORDS = ['One', 'introduction.', 'Everything', 'connected.'] as const;

export function StoryHow() {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  useChromeTone(root);

  return (
    <div ref={root} className="pl" data-testid="story-how">
      <StoryNav />

      <StoryHero
        expand={false}
        words={HERO_WORDS}
        sub="Build your professional identity, share your work and keep the people you meet."
        actions={
          <Link href="/sign-up" className="pl-btn pl-btn--accent">
            Create your CodeCard
          </Link>
        }
      />

      <section className="pl-band" data-band="light" aria-label="How CodeCard works, step by step">
        <div className="pl-wrap pl-steps">
          <article className="pl-stepRow" data-reveal>
            <div className="pl-stepRow__text">
              <p className="pl-kicker">Step 01 — Show</p>
              <h2 className="pl-display pl-display--section">Your work, all in one place.</h2>
              <p className="pl-p">
                Build a professional profile that brings together your experience, projects, research and links.
              </p>
              <p className="pl-p">Give people a clear picture of who you are and what you do.</p>
            </div>
            <div className="pl-stepRow__art">
              <EditorialProductFrame state="profile" size="lg" />
            </div>
          </article>

          <article className="pl-stepRow pl-stepRow--flip" data-reveal>
            <div className="pl-stepRow__text">
              <p className="pl-kicker">Step 02 — Share</p>
              <h2 className="pl-display pl-display--section">A better way to introduce yourself.</h2>
              <p className="pl-p">Share your CodeCard instantly with a QR code.</p>
              <p className="pl-p">
                Your profile and work are ready to explore whenever you meet someone.
              </p>
            </div>
            <div className="pl-stepRow__art pl-stepRow__art--qr">
              <div className="pl-qr pl-qr--lg">
                <PublicCodeCardQr profileSlug="demo" showLink={false} />
                <p className="pl-qr__cap">Scan to open the card</p>
              </div>
            </div>
          </article>

          <article className="pl-stepRow" data-reveal>
            <div className="pl-stepRow__text">
              <p className="pl-kicker">Step 03 — Keep</p>
              <h2 className="pl-display pl-display--section">Remember more than a name.</h2>
              <p className="pl-p">Save the people you meet and the details behind each introduction.</p>
              <p className="pl-p">Remember where you met, what you discussed and what comes next.</p>
            </div>
            <div className="pl-stepRow__art">
              <EditorialProductFrame state="connections" size="lg" />
            </div>
          </article>
        </div>
      </section>

      <section className="pl-band pl-end" data-band="light" aria-labelledby="pl-how-end">
        <div className="pl-wrap pl-end__in">
          <h2 id="pl-how-end" className="pl-display pl-display--big pl-center" data-reveal>
            Your next opportunity starts with an introduction.
          </h2>
          <div className="pl-end__cta" data-reveal>
            <Link href="/sign-up" className="pl-btn pl-btn--accent">
              Create your CodeCard
            </Link>
          </div>
        </div>
      </section>

      <StoryFooter />
    </div>
  );
}
