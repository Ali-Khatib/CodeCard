'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ensureGsapPlugins } from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';

/** Dark chapters — light type on frosted glass nav (matches cinema / finale fields). */
const DARK_CHAPTERS = new Set(['hero', 'statement', 'finale']);
/** Chapters where the fixed CC mark sits over a dark surface (light logo). */
const LIGHT_LOGO_CHAPTERS = new Set(['hero', 'statement', 'finale']);
/** Full-bleed immersive chapters — nav collapses to a circular expand control.
 *  Crash Course only — Research keeps the full pill. */
const COMPACT_NAV_CHAPTERS = ['walkthrough'] as const;

function navToneFor(chapter: string): 'dark' | 'light' {
  return DARK_CHAPTERS.has(chapter) ? 'dark' : 'light';
}

function logoToneFor(chapter: string, navCompact: boolean): 'light' | 'dark' {
  if (navCompact) return 'light';
  return LIGHT_LOGO_CHAPTERS.has(chapter) ? 'light' : 'dark';
}

function syncLogoTone(chapter: string) {
  const compact = document.documentElement.dataset.navCompact === 'true';
  document.documentElement.dataset.logoTone = logoToneFor(chapter, compact);
}

function setNavCompact(active: boolean) {
  if (active) {
    document.documentElement.dataset.navCompact = 'true';
  } else {
    delete document.documentElement.dataset.navCompact;
  }
}

/**
 * Sets data-chapter from section visibility. Backgrounds via CSS — no per-frame React color.
 * Also mirrors tone onto <html> so the marketing pill nav can follow chapter colors.
 * Compact nav is driven separately so it snaps only at Crash Course edges.
 * ~1 trigger per chapter (bounded).
 */
export function EditorialAtmosphere() {
  const { canEnhanceMotion } = useMotionPreferences();
  const activeRef = useRef('');

  useLayoutEffect(() => {
    /* First paint: hero cinema needs light nav type before scroll observers run. */
    document.documentElement.dataset.navTone = navToneFor('hero');
    document.documentElement.dataset.landingChapter = 'hero';
    syncLogoTone('hero');
  }, []);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.cc-ed');
    if (!root) return;

    const sections = Array.from(
      root.querySelectorAll<HTMLElement>('[data-chapter-section]'),
    );
    if (sections.length === 0) return;

    const apply = (id: string) => {
      if (activeRef.current === id) return;
      activeRef.current = id;
      root.dataset.chapter = id;
      document.documentElement.dataset.landingChapter = id;
      document.documentElement.dataset.navTone = navToneFor(id);
      syncLogoTone(id);
    };

    apply(sections[0]?.dataset.chapterSection ?? 'hero');

    const compactActive = new Set<string>();
    const syncCompact = () => {
      setNavCompact(compactActive.size > 0);
      syncLogoTone(activeRef.current);
    };

    const cleanupHtml = () => {
      delete document.documentElement.dataset.landingChapter;
      delete document.documentElement.dataset.navTone;
      delete document.documentElement.dataset.navCompact;
      delete document.documentElement.dataset.logoTone;
    };

    const compactSections = COMPACT_NAV_CHAPTERS.map((id) =>
      sections.find((section) => section.dataset.chapterSection === id),
    ).filter((section): section is HTMLElement => Boolean(section));

    if (!canEnhanceMotion) {
      const chapterObserver = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          const id = (visible?.target as HTMLElement | undefined)?.dataset
            .chapterSection;
          if (id) apply(id);
        },
        { root: null, rootMargin: '-40% 0px -40% 0px', threshold: [0, 0.25, 0.5, 1] },
      );
      sections.forEach((section) => chapterObserver.observe(section));

      // Compact only while Crash Course actually occupies the top of the viewport.
      const compactObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const id =
              (entry.target as HTMLElement).dataset.chapterSection ?? '';
            if (!id) continue;
            if (entry.isIntersecting && entry.boundingClientRect.top <= 8) {
              compactActive.add(id);
            } else if (
              !entry.isIntersecting ||
              entry.boundingClientRect.bottom <= 8
            ) {
              compactActive.delete(id);
            }
          }
          syncCompact();
        },
        {
          root: null,
          // Top band of the viewport — not mid-screen early flips.
          rootMargin: '0px 0px -85% 0px',
          threshold: [0, 0.01, 0.1],
        },
      );
      compactSections.forEach((section) => compactObserver.observe(section));

      return () => {
        chapterObserver.disconnect();
        compactObserver.disconnect();
        cleanupHtml();
      };
    }

    ensureGsapPlugins();

    const chapterTriggers = sections.map((section) => {
      const id = section.dataset.chapterSection ?? 'hero';
      // One active chapter at a time — flip when the section owns the viewport mid-band.
      // Avoids jump-scroll leaving the page stuck on finale while Research is visible.
      return ScrollTrigger.create({
        id: `editorial-atmosphere-${id}`,
        trigger: section,
        start: 'top 55%',
        end: 'bottom 45%',
        onToggle: (self) => {
          if (self.isActive) apply(id);
        },
      });
    });

    // Compact exactly for Crash Course: when the section top hits the
    // viewport top, until the section bottom leaves the viewport top.
    const compactTriggers = compactSections.map((section) => {
      const id = section.dataset.chapterSection ?? '';
      return ScrollTrigger.create({
        id: `editorial-nav-compact-${id}`,
        trigger: section,
        start: 'top top',
        end: 'bottom top',
        onToggle: (self) => {
          if (self.isActive) compactActive.add(id);
          else compactActive.delete(id);
          syncCompact();
        },
      });
    });

    return () => {
      chapterTriggers.forEach((t) => t.kill());
      compactTriggers.forEach((t) => t.kill());
      cleanupHtml();
    };
  }, [canEnhanceMotion]);

  return <div className="cc-ed-atmosphere" aria-hidden data-testid="editorial-atmosphere" />;
}
