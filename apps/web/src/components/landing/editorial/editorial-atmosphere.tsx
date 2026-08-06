'use client';

import { useEffect, useRef } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ensureGsapPlugins } from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';

/**
 * Sets data-chapter from section visibility. Backgrounds via CSS — no per-frame React color.
 * ~1 trigger per chapter (bounded).
 */
export function EditorialAtmosphere() {
  const { canEnhanceMotion } = useMotionPreferences();
  const activeRef = useRef('hero');

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
    };

    apply(sections[0]?.dataset.chapterSection ?? 'hero');

    if (!canEnhanceMotion) {
      return () => {
        delete document.documentElement.dataset.landingChapter;
      };
    }

    ensureGsapPlugins();

    const created = sections.map((section) =>
      ScrollTrigger.create({
        id: `editorial-atmosphere-${section.dataset.chapterSection}`,
        trigger: section,
        start: 'top 55%',
        end: 'bottom 45%',
        onEnter: () => apply(section.dataset.chapterSection ?? 'hero'),
        onEnterBack: () => apply(section.dataset.chapterSection ?? 'hero'),
      }),
    );

    return () => {
      created.forEach((t) => t.kill());
      delete document.documentElement.dataset.landingChapter;
    };
  }, [canEnhanceMotion]);

  return <div className="cc-ed-atmosphere" aria-hidden data-testid="editorial-atmosphere" />;
}
