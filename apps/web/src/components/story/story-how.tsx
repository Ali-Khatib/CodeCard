'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import { StoryNav, StoryFooter } from './story-chrome';
import { StoryHero } from './story-hero';
import { useChromeTone, useFitShots, useReveal } from './story-hooks';
import type { EditorialProductState } from '@/components/landing/editorial/editorial-product-frame';
import { LIVE_DEMO_HREF, LIVE_DEMO_PROFILE_HREF } from '@/lib/marketing/demo-url';
import '@/styles/editorial-landing.css';
import '@/styles/story.css';

const EditorialProductFrame = dynamic(
  () =>
    import('@/components/landing/editorial/editorial-product-frame').then(
      (m) => m.EditorialProductFrame,
    ),
  { ssr: false, loading: () => <div className="pl-hold" /> },
);

const HERO_WORDS = ['One', 'introduction.', 'Everything', 'connected.'] as const;

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

const TABS: { id: EditorialProductState; label: string; note: string }[] = [
  { id: 'profile', label: 'The card', note: 'What someone sees the moment they scan you.' },
  { id: 'projects', label: 'Your work', note: 'Projects and research, with the context that explains them.' },
  { id: 'connections', label: 'Connections', note: 'The people you met, and what happens next with each one.' },
];

export function StoryHow() {
  const root = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<EditorialProductState>('profile');
  useReveal(root);
  useChromeTone(root);
  useFitShots(root);

  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

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

      {/* The three actions, stated once, instead of one layout repeated. */}
      <section className="pl-band" data-band="light" aria-labelledby="pl-three">
        <div className="pl-wrap">
          <h2 id="pl-three" className="sr-only">
            What CodeCard does
          </h2>
          <ol className="pl-three">
            {STEPS.map((s) => (
              <li key={s.n} className="pl-three__item" data-reveal>
                <p className="pl-panel__n">
                  {s.n} <span className="pl-emb" aria-hidden /> {s.k}
                </p>
                <h3 className="pl-heading">{s.h}</h3>
                <p className="pl-panel__p">{s.p}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* One live demo, tabbed, rather than three cropped screenshots. */}
      <section className="pl-band pl-live" data-band="dark" aria-labelledby="pl-live-h">
        <div className="pl-wrap">
          <div className="pl-live__head">
            <div>
              <p className="pl-live__eyebrow">
                <span className="pl-emb pl-emb--live" aria-hidden /> Live demo
              </p>
              <h2 id="pl-live-h" className="pl-display pl-live__title">
                Use the real thing, right here.
              </h2>
            </div>
            <div className="pl-live__aside">
              <p className="pl-live__note">{active.note}</p>
              <a href={LIVE_DEMO_HREF} className="pl-btn pl-btn--light">
                Open the full demo
              </a>
            </div>
          </div>

          <div className="pl-live__tabs" role="tablist" aria-label="Live demo views">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className="pl-live__tab"
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="pl-live__screen">
            <div className="pl-shot" data-w="1240">
              <EditorialProductFrame state={tab} />
            </div>
          </div>

          <p className="pl-live__foot">
            Real screens on demo data. <a href={LIVE_DEMO_PROFILE_HREF}>See a published card</a>.
          </p>
        </div>
      </section>

      <section className="pl-band pl-end" data-band="light" aria-labelledby="pl-how-end">
        <div className="pl-wrap pl-end__in">
          <h2 id="pl-how-end" className="pl-display pl-display--big pl-center" data-reveal>
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
