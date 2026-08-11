'use client';

import { useEffect, useRef, useState } from 'react';
import { LAYOUT } from '@/lib/design/tokens';
import { MARKETING_HOME_HREF } from '@/lib/marketing/site-routes';
import { REDUCED_MOTION_QUERY } from '@/hooks/use-reduced-motion';
import { LandingHeroNav, type NavItem } from './landing-hero-nav';

export const MARKETING_NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: MARKETING_HOME_HREF, ariaLabel: 'Overview, research and how it works' },
  { label: 'Pricing', href: '/pricing' },
];

const MORPH_MS = 720;
const MORPH_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

let morphTimer = 0;

/**
 * Morph the centered pill into the left circle (and back) with a FLIP invert
 * so justify-content changes don't pop.
 */
function morphNavVeil(veil: HTMLElement, previous: DOMRect) {
  if (prefersReducedMotion()) return;

  const next = veil.getBoundingClientRect();
  const dx = previous.left - next.left;
  if (Math.abs(dx) < 1 && Math.abs(previous.width - next.width) < 1) return;

  const compact = document.documentElement.dataset.navCompact === 'true';
  const circle = window.matchMedia('(max-width: 767px)').matches ? 44 : 48;
  const startWidth = previous.width;
  const startHeight = previous.height;
  const endWidth = compact ? circle : next.width;
  const endHeight = compact ? circle : next.height;
  const inner = veil.querySelector<HTMLElement>('.cc-nav-veil__inner');
  const wide = Math.max(startWidth, endWidth);

  window.clearTimeout(morphTimer);
  document.documentElement.dataset.navMorphing = 'true';
  veil.classList.add('cc-nav-veil--morphing');
  veil.style.transition = 'none';
  veil.style.width = `${startWidth}px`;
  veil.style.maxWidth = `${startWidth}px`;
  veil.style.height = `${startHeight}px`;
  veil.style.minHeight = `${startHeight}px`;
  veil.style.transform = `translateX(${dx}px)`;
  if (inner) {
    inner.style.width = `${wide}px`;
    inner.style.minWidth = `${wide}px`;
    inner.style.maxWidth = 'none';
  }
  void veil.offsetWidth;

  const finish = () => {
    window.clearTimeout(morphTimer);
    veil.style.transition = '';
    veil.style.width = '';
    veil.style.maxWidth = '';
    veil.style.height = '';
    veil.style.minHeight = '';
    veil.style.transform = '';
    if (inner) {
      inner.style.width = '';
      inner.style.minWidth = '';
      inner.style.maxWidth = '';
    }
    veil.classList.remove('cc-nav-veil--morphing');
    delete document.documentElement.dataset.navMorphing;
    veil.removeEventListener('transitionend', onEnd);
  };

  const onEnd = (event: TransitionEvent) => {
    if (event.target !== veil) return;
    if (event.propertyName !== 'width' && event.propertyName !== 'transform') return;
    finish();
  };

  const play = () => {
    veil.addEventListener('transitionend', onEnd);
    morphTimer = window.setTimeout(finish, MORPH_MS + 80);
    veil.style.transition = [
      `transform ${MORPH_MS}ms ${MORPH_EASE}`,
      `width ${MORPH_MS}ms ${MORPH_EASE}`,
      `max-width ${MORPH_MS}ms ${MORPH_EASE}`,
      `height ${MORPH_MS}ms ${MORPH_EASE}`,
      `min-height ${MORPH_MS}ms ${MORPH_EASE}`,
      `border-radius ${MORPH_MS}ms ${MORPH_EASE}`,
    ].join(', ');
    veil.style.width = `${endWidth}px`;
    veil.style.maxWidth = `${endWidth}px`;
    veil.style.height = `${endHeight}px`;
    veil.style.minHeight = `${endHeight}px`;
    veil.style.transform = 'translateX(0)';
  };

  requestAnimationFrame(() => requestAnimationFrame(play));
}

export function LandingShellNav() {
  const [scrolled, setScrolled] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const expandedRectRef = useRef<DOMRect | null>(null);
  const collapsedRectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 18);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const veilOf = () => shell.querySelector<HTMLElement>('.cc-nav-veil');
    let morphing = false;

    const capture = () => {
      const veil = veilOf();
      if (
        !veil ||
        morphing ||
        veil.classList.contains('cc-nav-veil--morphing') ||
        document.documentElement.dataset.navMorphing === 'true'
      ) {
        return;
      }
      const rect = veil.getBoundingClientRect();
      if (rect.width < 8) return;
      // Size, not the compact flag — so a late scroll capture cannot clobber
      // the last full pill rect after layout has already snapped to 48px.
      if (rect.width > 80) {
        expandedRectRef.current = rect;
      } else {
        collapsedRectRef.current = rect;
      }
    };

    capture();
    window.addEventListener('resize', capture);

    const observer = new MutationObserver(() => {
      const veil = veilOf();
      if (!veil) return;
      const compact = document.documentElement.dataset.navCompact === 'true';
      const previous = compact ? expandedRectRef.current : collapsedRectRef.current;
      if (!previous) {
        capture();
        return;
      }
      morphing = true;
      morphNavVeil(veil, previous);
      window.setTimeout(() => {
        morphing = false;
        capture();
      }, MORPH_MS + 120);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-nav-compact'],
    });

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', capture);
      window.clearTimeout(morphTimer);
      delete document.documentElement.dataset.navMorphing;
    };
  }, []);

  return (
    <div
      ref={shellRef}
      className={`cc-marketing-nav-shell fixed inset-x-0 z-[100] flex justify-center px-3 pt-3 sm:px-5${
        scrolled ? ' cc-marketing-nav-shell--scrolled' : ''
      }`}
      style={{ top: LAYOUT.pillNavTop }}
      data-scrolled={scrolled ? 'true' : 'false'}
    >
      <LandingHeroNav items={MARKETING_NAV_ITEMS} />
    </div>
  );
}
