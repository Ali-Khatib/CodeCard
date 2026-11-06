'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { StoryNav, StoryFooter } from './story-chrome';
import { ArtExchange, ArtKept, ArtScattered } from './story-art';
import { StoryHero } from './story-hero';
import { useChromeTone, useReveal } from './story-hooks';
import { LIVE_DEMO_HREF, LIVE_DEMO_PROFILE_HREF } from '@/lib/marketing/demo-url';
import '@/styles/codecard-mark.css';
import '@/styles/editorial-landing.css';
import '@/styles/story.css';

const HERO_WORDS = ['One', 'introduction.', 'Everything', 'connected'] as const;

const STEPS = [
  {
    n: '01',
    k: 'Show',
    h: 'Your work, all in one place.',
    p: 'A professional profile that brings together your experience, projects, research and links, so people get a clear picture of what you do.',
  },
  {
    n: '02',
    k: 'Share',
    h: 'A better way to introduce yourself.',
    p: 'Share your CodeCard instantly with a QR code. Your profile and work are ready to explore the moment you meet someone.',
  },
  {
    n: '03',
    k: 'Keep',
    h: 'Remember more than a name.',
    p: 'Save the people you meet and the detail behind each introduction: where you met, what you discussed and what comes next.',
  },
] as const;

const TABS = [
  {
    id: 'card',
    label: 'The card',
    art: ArtScattered,
    h: 'Everything you do, under one link.',
    p: 'Your headline, your experience, your projects and the research behind them. One address that stays current instead of a CV that goes stale the week you send it.',
    points: ['Profile, projects and research together', 'Media, links and write-ups on every project', 'Always current — you update it once'],
  },
  {
    id: 'share',
    label: 'The exchange',
    art: ArtExchange,
    h: 'A scan instead of a spelling.',
    p: 'Show the code, they scan it, your card opens on their phone. No app to install on their side, no name to mistype, nothing lost between the conversation and the follow-up.',
    points: ['QR code or a plain link', 'Opens in any browser, no account needed', 'Works the same on a badge, a slide or a phone'],
  },
  {
    id: 'keep',
    label: 'The memory',
    art: ArtKept,
    h: 'The part everyone loses.',
    p: 'Each connection keeps where you met and what you talked about, so a name from three months ago is still a person you can write to with something to say.',
    points: ['Where and when you met, saved with the person', 'Your own notes on the conversation', 'The work they showed you, still attached'],
  },
] as const;

export function StoryHow() {
  const root = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('card');
  useReveal(root);
  useChromeTone(root);

  const active = TABS.find((t) => t.id === tab) ?? TABS[0];
  const ActiveArt = active.art;

  return (
    <div ref={root} className="pl" data-testid="story-how">
      <StoryNav />

      <StoryHero
        words={HERO_WORDS}
        sub="Build your professional identity, share your work and keep the people you meet."
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

      <section className="pl-band" data-band="light" aria-labelledby="pl-three">
        <div className="pl-wrap">
          <h2 id="pl-three" className="pl-section-title" data-reveal>
            Three things, in order
          </h2>
          <ol className="pl-three">
            {STEPS.map((s) => (
              <li key={s.n} className="pl-three__item" data-reveal>
                <p className="pl-panel__n">
                  {s.n} <span className="pl-emb" aria-hidden /> {s.k}
                </p>
                <h3 className="pl-panel__h">{s.h}</h3>
                <p className="pl-panel__p">{s.p}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* One tabbed explanation. Drawn art, never a screenshot. */}
      <section className="pl-band pl-live" data-band="dark" aria-labelledby="pl-live-h">
        <div className="pl-wrap">
          <div className="pl-live__head">
            <h2 id="pl-live-h" className="pl-section-title pl-section-title--inv">
              What it actually does
            </h2>
            <div className="pl-live__tabs" role="tablist" aria-label="How CodeCard works">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`pl-tab-${t.id}`}
                  aria-selected={tab === t.id}
                  aria-controls={`pl-pane-${t.id}`}
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
            id={`pl-pane-${active.id}`}
            aria-labelledby={`pl-tab-${active.id}`}
            key={active.id}
          >
            <div className="pl-art pl-art--wide">
              <ActiveArt />
            </div>
            <div className="pl-live__copy">
              <h3 className="pl-live__h">{active.h}</h3>
              <p className="pl-live__p">{active.p}</p>
              <ul className="pl-live__list">
                {active.points.map((pt) => (
                  <li key={pt}>
                    <span className="pl-emb" aria-hidden />
                    {pt}
                  </li>
                ))}
              </ul>
              <a href={LIVE_DEMO_HREF} className="pl-btn pl-btn--light">
                Open the live demo
              </a>
            </div>
          </div>

          <p className="pl-live__foot">
            Prefer to click around? <a href={LIVE_DEMO_PROFILE_HREF}>Open a published card</a>.
          </p>
        </div>
      </section>

      <section className="pl-band pl-end" data-band="light" aria-labelledby="pl-how-end">
        <div className="pl-wrap pl-end__in">
          <h2 id="pl-how-end" className="pl-closer pl-center" data-reveal>
            Your next opportunity starts with an introduction
            <span className="pl-emb pl-emb--period" aria-hidden />
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
