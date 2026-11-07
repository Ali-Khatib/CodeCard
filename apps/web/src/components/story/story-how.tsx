'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { StoryNav, StoryFooter } from './story-chrome';
import { StoryHero } from './story-hero';
import { ProductStage } from './story-stage';
import { useChromeTone, useReveal } from './story-hooks';
import type { GuideShotId } from '@/lib/marketing/guide-content';
import { LIVE_DEMO_HREF } from '@/lib/marketing/demo-url';
import '@/styles/codecard-mark.css';
import '@/styles/editorial-landing.css';
import '@/styles/story.css';

const HERO_WORDS = ['From', 'what', 'you', 'do', 'to', 'who', 'you', 'meet.'] as const;

/**
 * The journey, in the order a person actually goes through it. Each step
 * shows the surface where that step happens, and says something the home
 * page does not.
 */
const STEPS = [
  {
    n: '01',
    k: 'Build',
    h: 'Give your work a home.',
    body: [
      'You start with a profile: a name, a headline, where you are and what you do. From there you add the work itself — projects with their write-ups, media and links, and the research behind them.',
      'Each project is a page of its own rather than a line on a list, so someone reading it understands what you built and why. Nothing has to be rewritten for a CV, because this is the thing you keep current.',
    ],
    shot: 'home-identity' as GuideShotId,
  },
  {
    n: '02',
    k: 'Share',
    h: 'One scan. Your entire profile.',
    body: [
      'Your CodeCard has a public address and a QR code that points at it. Show the code, they scan it, and your profile opens in their browser — no app on their side and no account needed to read it.',
      'The same link works in an email, on a slide or in a message, so the way you share is the same whether you are in the room or not.',
    ],
    shot: 'home-share' as GuideShotId,
  },
  {
    n: '03',
    k: 'Connect',
    h: 'Make introductions last.',
    body: [
      'When someone opens your card you can save them as a connection, and they can save you. Each one keeps where you met and what you talked about, alongside the work they showed you.',
      'That turns a list of names into something you can act on later: you still know who they were, what the conversation was, and what you said you would do next.',
    ],
    shot: 'connections-list' as GuideShotId,
  },
] as const;

export function StoryHow() {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  useChromeTone(root);

  return (
    <div ref={root} className="pl" data-testid="story-how">
      <StoryNav />

      <StoryHero
        words={HERO_WORDS}
        sub="Build your professional identity, share it in seconds and keep your connections together."
        actions={
          <>
            <Link href="/sign-up" className="pl-btn pl-btn--solid">
              Create your CodeCard
            </Link>
            <a href={LIVE_DEMO_HREF} className="pl-btn pl-btn--ghostLight">
              Open the live demo
            </a>
          </>
        }
      />

      {STEPS.map((s, i) => (
        <section
          key={s.n}
          className="pl-band pl-step"
          data-band="light"
          data-alt={i % 2 === 1 ? 'true' : 'false'}
          aria-labelledby={`pl-step-${s.n}`}
        >
          <div className="pl-wrap pl-step__grid">
            <div className="pl-step__copy" data-reveal>
              <p className="pl-panel__n">
                {s.n} <span className="pl-emb" aria-hidden /> {s.k}
              </p>
              <h2 id={`pl-step-${s.n}`} className="pl-section-title">
                {s.h}
              </h2>
              {s.body.map((para) => (
                <p key={para.slice(0, 24)} className="pl-p">
                  {para}
                </p>
              ))}
            </div>
            <div className="pl-step__shot" data-reveal>
              <ProductStage shot={s.shot} />
            </div>
          </div>
        </section>
      ))}

      <section className="pl-band pl-end" data-band="light" aria-labelledby="pl-how-end">
        <div className="pl-wrap pl-end__in">
          <h2 id="pl-how-end" className="pl-closer pl-center" data-reveal>
            Your next introduction starts{' '}
            <span className="pl-nowrap">
              here
              <span className="pl-emb pl-emb--period" aria-hidden />
            </span>
          </h2>
          <div className="pl-end__cta" data-reveal>
            <Link href="/sign-up" className="pl-btn pl-btn--solid">
              Create your CodeCard
            </Link>
          </div>
        </div>
      </section>

      <StoryFooter />
    </div>
  );
}
