'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'motion/react';
import { BorderGlowCard } from './border-glow-card';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useIsMobile } from '@/hooks/use-is-mobile';
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
    body: 'Share a link with your repos, demos, and case studies — the first thing they see, not the footnote.',
    detail: 'A showcase where your proof is the headline, not buried below schools and titles.',
    highlights: ['Featured work stack', 'Stack tags & outcomes', 'One link for every channel'],
    cta: { href: '/demo/card', label: 'See a showcase' },
  },
  {
    eyebrow: 'For recruiters',
    title: 'Decide faster.',
    body: 'Identity, role, and demonstrated work in one glance.',
    detail: 'Skip the PDF chase. Open one living page with role, proof, and project depth.',
    highlights: ['Name + role up top', 'Scrollable project stories', 'Shareable in one tap'],
    cta: { href: '/demo/card', label: 'See a live profile' },
  },
  {
    eyebrow: 'For events',
    title: 'Show it on their phone.',
    body: 'QR or your screen at a meetup — they scan or scroll with you live.',
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
    cta: { href: '/demo/card', label: 'See a student profile' },
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
  'rotate(2deg) translate(-300px)',
  'rotate(1deg) translate(-150px)',
  'rotate(0deg)',
  'rotate(-1deg) translate(150px)',
  'rotate(-2deg) translate(300px)',
] as const;

/** Distinct Hume pastels — one per audience card (ink text on light fills) */
const AUDIENCE_CARD_TONES = [
  'cc-audience-bounce-card--sky',
  'cc-audience-bounce-card--mint',
  'cc-audience-bounce-card--blush',
  'cc-audience-bounce-card--lavender',
  'cc-audience-bounce-card--peach',
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
      <p className="font-eyebrow text-[13px] uppercase tracking-[0.06em] text-smoke">{eyebrow}</p>
      <h3 className="mt-3 font-display text-[22px] font-normal leading-[1.2] tracking-[-0.02em] text-ink md:text-[24px]">
        {title}
      </h3>
      <p className="mt-3 line-clamp-3 text-[15px] leading-[1.5] text-smoke">{body}</p>
      {!compact && (
        <p className="mt-5 text-[14px] font-medium text-ink">{ctaLabel} →</p>
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
  const isMobile = useIsMobile();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const center = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
    el.scrollLeft = center;
  }, []);

  if (reducedMotion || isMobile) {
    return (
      <div className="cc-container mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {AUDIENCE_CARDS.map((card, index) => (
          <motion.div
            key={card.title}
            initial={isMobile && !reducedMotion ? { opacity: 0, y: 18 } : false}
            whileInView={isMobile && !reducedMotion ? { opacity: 1, y: 0 } : undefined}
            viewport={{ once: true, amount: 0.22 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <BorderGlowCard
              className={`h-full ${AUDIENCE_CARD_TONES[index] ?? ''}`}
            >
              <AudienceCardContent
                eyebrow={card.eyebrow}
                title={card.title}
                body={card.body}
                ctaLabel={card.cta.label}
              />
            </BorderGlowCard>
          </motion.div>
        ))}
      </div>
    );
  }

  const items = AUDIENCE_CARDS.map((card, index) => ({
    content: (
      <BorderGlow
        {...CARD_BORDER_GLOW}
        className={`cc-audience-bounce-card ${AUDIENCE_CARD_TONES[index] ?? ''} h-full w-full`}
      >
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
          containerWidth={1520}
          containerHeight={300}
          cardWidth={272}
          animationDelay={0}
          animationStagger={0}
          easeType="power2.out"
          transformStyles={[...AUDIENCE_TRANSFORMS]}
          enableEntranceAnimation={false}
          enableHover={selectedIndex === null}
          hoverPushAmount={100}
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
