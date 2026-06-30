'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { BorderGlowCard } from './border-glow-card';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { CARD_BORDER_GLOW } from '@/lib/design/border-glow-preset';

const BounceCards = dynamic(() => import('@/components/react-bits/bounce-cards/bounce-cards'), {
  ssr: false,
});

const BorderGlow = dynamic(() => import('@/components/react-bits/border-glow/border-glow'), {
  ssr: false,
});

const AUDIENCE_CARDS = [
  {
    eyebrow: 'For builders',
    title: 'Lead with proof.',
    body: 'Projects, outcomes, and stack up front, not buried on page two.',
    detail: 'Ship a profile where your repos, demos, and case studies are the first thing someone sees.',
    highlights: ['Featured work stack', 'Stack tags & outcomes', 'One link for every channel'],
    cta: { href: '/profiles', label: 'See profiles' },
  },
  {
    eyebrow: 'For recruiters',
    title: 'Decide faster.',
    body: 'Identity, role, and demonstrated work in one glance.',
    detail: 'Skip the PDF chase. Open one living page with role, proof, and project depth.',
    highlights: ['Name + role up top', 'Scrollable project stories', 'Shareable in one tap'],
    cta: { href: '/profiles', label: 'See a live profile' },
  },
  {
    eyebrow: 'For events',
    title: 'Show it on their phone.',
    body: 'QR on your badge or screen. They scroll your projects right there.',
    detail:
      'One scan opens your live profile. They flip through featured work on mobile while you talk, not a PDF that gets buried in their inbox.',
    highlights: ['QR-ready profile link', 'Projects on mobile', 'Still works weeks later'],
    cta: { href: '#how-it-works', label: 'How it works' },
  },
  {
    eyebrow: 'For students',
    title: 'Stand out early.',
    body: 'Ship projects before the degree line. Show skill, not just school.',
    detail: 'Lead with what you built in class, clubs, and side projects, not just your major.',
    highlights: ['Project-first layout', 'Internship-ready proof', 'Easy to share with mentors'],
    cta: { href: '/profiles', label: 'See student profiles' },
  },
  {
    eyebrow: 'For freelancers',
    title: 'Win the brief.',
    body: 'One link that shows how you think, build, and deliver for clients.',
    detail: 'Send prospects a profile that reads like a pitch deck: work, process, and results.',
    highlights: ['Client-ready case studies', 'Pricing & contact paths', 'Professional first impression'],
    cta: { href: '/pricing', label: 'View plans' },
  },
] as const;

const AUDIENCE_TRANSFORMS = [
  'rotate(3deg) translate(-140px)',
  'rotate(1.5deg) translate(-70px)',
  'rotate(0deg)',
  'rotate(-1.5deg) translate(70px)',
  'rotate(-3deg) translate(140px)',
] as const;

function AudienceCardContent({
  eyebrow,
  title,
  body,
  ctaLabel,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  compact?: boolean;
}) {
  return (
    <>
      <div className="cc-feature-column__icon" aria-hidden>
        ✦
      </div>
      <p className="font-eyebrow text-[13px] uppercase tracking-[0.06em] text-iris">{eyebrow}</p>
      <h3 className="mt-3 font-display text-[20px] font-medium leading-[1.25] text-vellum md:text-[22px]">
        {title}
      </h3>
      <p className="mt-3 text-[15px] leading-[1.5] text-ash md:text-[16px]">{body}</p>
      {!compact && (
        <p className="mt-5 text-[14px] font-medium text-reactor">{ctaLabel} →</p>
      )}
    </>
  );
}

function AudienceDetailPanel({ index }: { index: number }) {
  const card = AUDIENCE_CARDS[index];
  if (!card) return null;

  const cta =
    card.cta.href.startsWith('#') ? (
      <a href={card.cta.href} className="cc-audience-detail__cta">
        {card.cta.label} →
      </a>
    ) : (
      <Link href={card.cta.href} className="cc-audience-detail__cta">
        {card.cta.label} →
      </Link>
    );

  return (
    <div className="cc-audience-detail">
      <div className="cc-audience-detail__glow" aria-hidden />
      <div className="cc-audience-detail__inner">
        <div className="cc-audience-detail__header">
          <span className="cc-audience-detail__badge font-eyebrow">{card.eyebrow}</span>
        </div>
        <h3 className="cc-audience-detail__title font-display">{card.title}</h3>
        <p className="cc-audience-detail__body font-sans">{card.detail}</p>
        <ul className="cc-audience-detail__list">
          {card.highlights.map((item) => (
            <li key={item} className="cc-audience-detail__list-item font-sans">
              <span className="cc-audience-detail__bullet" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
        <div className="cc-audience-detail__footer">{cta}</div>
      </div>
    </div>
  );
}

export function AudienceBounceCards() {
  const reducedMotion = useReducedMotion();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const center = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
    el.scrollLeft = center;
  }, []);

  if (reducedMotion) {
    return (
      <div className="cc-container mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {AUDIENCE_CARDS.map((card) => (
          <BorderGlowCard key={card.title} className="h-full">
            <AudienceCardContent
              eyebrow={card.eyebrow}
              title={card.title}
              body={card.body}
              ctaLabel={card.cta.label}
            />
          </BorderGlowCard>
        ))}
      </div>
    );
  }

  const items = AUDIENCE_CARDS.map((card) => ({
    content: (
      <BorderGlow {...CARD_BORDER_GLOW} className="cc-audience-bounce-card h-full w-full">
        <AudienceCardContent
          eyebrow={card.eyebrow}
          title={card.title}
          body={card.body}
          ctaLabel={card.cta.label}
          compact
        />
      </BorderGlow>
    ),
    ariaLabel: `${card.title}, ${card.eyebrow}`,
  }));

  return (
    <div className="cc-audience-bounce mt-12 md:mt-16">
      <div ref={scrollRef} className="cc-audience-bounce__scroll">
        <BounceCards
          className="cc-audience-bounce__stack mx-auto"
          items={items}
          orientation="horizontal"
          containerWidth={1080}
          containerHeight={320}
          cardWidth={268}
          animationDelay={0}
          animationStagger={0}
          easeType="power2.out"
          transformStyles={[...AUDIENCE_TRANSFORMS]}
          enableEntranceAnimation={false}
          enableHover={selectedIndex === null}
          hoverPushAmount={70}
          pickOnClick
          pickBehavior="in-place"
          selectedIndex={selectedIndex}
          onSelectedIndexChange={setSelectedIndex}
          showPickDim={false}
        />
      </div>

      {selectedIndex !== null && (
        <div className="cc-audience-bounce__stage cc-container">
          <AudienceDetailPanel index={selectedIndex} />
        </div>
      )}
    </div>
  );
}
