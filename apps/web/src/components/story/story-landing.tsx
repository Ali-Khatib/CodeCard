'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { applyLandingChromeInk } from '@/components/landing/editorial/landing-chrome-tone';
import { StoryNav, StoryFooter } from './story-chrome';
import { ArtExchange, ArtKept, ArtScattered } from './story-art';
import { StoryHero } from './story-hero';
import { useChromeTone, useReveal } from './story-hooks';
import '@/styles/codecard-mark.css';
import '@/styles/editorial-landing.css';
import '@/styles/story.css';

const HERO_WORDS = ['Your', 'work', 'deserves', 'more', 'than', 'a', 'handshake'] as const;

/**
 * Each panel names the problem first and answers it second, because the
 * problem is the part a reader recognises as their own.
 */
const PANELS = [
  {
    n: '01',
    art: ArtScattered,
    problem: 'Your work lives in ten places.',
    title: 'Show it in one.',
    body: 'A repository here, a paper there, a demo nobody can find. CodeCard brings your profile, projects and research together so one link says everything you do.',
    href: '/sign-up',
    cta: 'Create your profile',
  },
  {
    n: '02',
    art: ArtExchange,
    problem: 'An introduction ends at a name.',
    title: 'Hand over the work.',
    body: 'Typing a name into a phone loses everything behind it. One scan opens your CodeCard — who you are and what you have built, on their screen before the conversation is over.',
    href: '/demo/card',
    cta: 'See a card',
  },
  {
    n: '03',
    art: ArtKept,
    problem: 'A week later you forget where you met.',
    title: 'Keep the context.',
    body: 'Every connection you save keeps the detail around it: the event, the conversation, what came next. The follow-up writes itself because you still remember why it mattered.',
    href: '/demo/connections',
    cta: 'See connections',
  },
] as const;

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

      {/* 02 — How CodeCard works: problem, then answer, three times. */}
      <section className="pl-band" data-band="light" aria-labelledby="pl-works-h">
        <div className="pl-wrap">
          <h2 id="pl-works-h" className="pl-section-title" data-reveal>
            How CodeCard works
          </h2>

          <div className="pl-panels">
            {PANELS.map(({ n, art: Art, problem, title, body, href, cta }) => (
              <article key={n} className="pl-panel" data-reveal>
                <div className="pl-art">
                  <Art />
                </div>
                <p className="pl-panel__n">
                  {n} <span className="pl-emb" aria-hidden />
                </p>
                <h3 className="pl-panel__h">
                  <span className="pl-panel__problem">{problem}</span>
                  {title}
                </h3>
                <p className="pl-panel__p">{body}</p>
                <Link href={href} className="pl-link">
                  {cta} <span aria-hidden>→</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 03 — Editorial statement: a narrow column of display type, nothing else. */}
      <section className="pl-band pl-say" data-band="light" aria-labelledby="pl-say-h">
        <div className="pl-wrap pl-say__grid">
          <h2 id="pl-say-h" className="pl-statement" data-reveal>
            CodeCard is a company about the work behind a{' '}
            <span className="pl-nowrap">
              name
              <span className="pl-emb pl-emb--period" aria-hidden />
            </span>
          </h2>

          <div className="pl-say__side" data-reveal>
            <p className="pl-p">
              A name and a title are the least interesting things about a person. The work is the rest of it — and the
              work is what gets left out of every introduction.
            </p>
            <p className="pl-p">
              CodeCard exists so the thing you have actually built travels with you: into the room, onto their phone,
              into the week after.
            </p>
            <Link href="/how-it-works" className="pl-btn pl-btn--solid">
              Read more
            </Link>
          </div>
        </div>
      </section>

      {/* 04 — Final CTA */}
      <section className="pl-band pl-end" id="start" data-band="light" aria-labelledby="pl-end-h">
        <div className="pl-wrap pl-end__in">
          <h2 id="pl-end-h" className="pl-closer pl-center" data-reveal>
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
