'use client';

import { useEffect, useRef } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ensureGsapPlugins } from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';

const DARK_CHAPTERS = new Set(['hero', 'finale']);

function navToneFor(chapter: string): 'dark' | 'light' {
  return DARK_CHAPTERS.has(chapter) ? 'dark' : 'light';
}

/**
 * Sets data-chapter from section visibility. Backgrounds via CSS — no per-frame React color.
 * Also mirrors tone onto <html> so the marketing pill nav can follow chapter colors.
 * ~1 trigger per chapter (bounded).
 */
export function EditorialAtmosphere() {
  const { canEnhanceMotion } = useMotionPreferences();
  const activeRef = useRef('');

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
    };

    apply(sections[0]?.dataset.chapterSection ?? 'hero');

    const cleanupHtml = () => {
      delete document.documentElement.dataset.landingChapter;
      delete document.documentElement.dataset.navTone;
    };

    if (!canEnhanceMotion) {
      const observer = new IntersectionObserver(
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
      sections.forEach((section) => observer.observe(section));
      return () => {
        observer.disconnect();
        cleanupHtml();
      };
    }

    ensureGsapPlugins();

    const created = sections.map((section) => {
      const id = section.dataset.chapterSection ?? 'hero';
      // Flip when the chapter is the main surface — one solid color until then
      const start = id === 'demo' ? 'top 38%' : 'top 55%';
      return ScrollTrigger.create({
        id: `editorial-atmosphere-${id}`,
        trigger: section,
        start,
        end: 'bottom 45%',
        onEnter: () => apply(id),
        onEnterBack: () => apply(id),
      });
    });

    return () => {
      created.forEach((t) => t.kill());
      cleanupHtml();
    };
  }, [canEnhanceMotion]);

  return <div className="cc-ed-atmosphere" aria-hidden data-testid="editorial-atmosphere" />;
}
