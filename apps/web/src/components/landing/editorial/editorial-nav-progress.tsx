'use client';

import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ensureGsapPlugins } from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';

function sectionY(el: Element | null) {
  if (!(el instanceof HTMLElement)) return null;
  const top = el.getBoundingClientRect().top + window.scrollY;
  return { top, bottom: top + el.offsetHeight };
}

/**
 * Colors the existing nav pill border after the hero. Crash Course and the
 * life timeline do not advance the stroke; it resumes after those chapters.
 */
export function EditorialNavProgress() {
  const { canEnhanceMotion, hydrated } = useMotionPreferences();

  useGSAP(
    () => {
      const page = document.querySelector('.cc-ed');
      const hero =
        document.querySelector<HTMLElement>('.cc-ed-hero-scene') ??
        document.querySelector<HTMLElement>('[data-chapter-section="hero"]');
      const crash = document.querySelector<HTMLElement>(
        '[data-chapter-section="walkthrough"]',
      );
      const timeline = document.querySelector<HTMLElement>(
        '[data-chapter-section="audience"]',
      );
      const footer = document.querySelector<HTMLElement>('.cc-site-footer');
      if (!page || !hero || !footer) return;

      const html = document.documentElement;

      const progressFromScroll = () => {
        const heroBox = sectionY(hero);
        const footerBox = sectionY(footer);
        if (!heroBox || !footerBox) return 0;

        const skip = [sectionY(crash), sectionY(timeline)].filter(
          (box): box is { top: number; bottom: number } => Boolean(box),
        );
        const finish = footerBox.bottom - window.innerHeight;
        const ranges: Array<{ start: number; end: number }> = [];
        let cursor = heroBox.bottom;

        for (const gap of skip.sort((a, b) => a.top - b.top)) {
          if (gap.top > cursor) ranges.push({ start: cursor, end: gap.top });
          cursor = Math.max(cursor, gap.bottom);
        }
        if (finish > cursor) ranges.push({ start: cursor, end: finish });

        const total = ranges.reduce(
          (sum, range) => sum + Math.max(0, range.end - range.start),
          0,
        );
        if (total <= 0) return 0;

        const y = window.scrollY;
        let filled = 0;
        for (const range of ranges) {
          const length = Math.max(0, range.end - range.start);
          if (y >= range.end) filled += length;
          else if (y > range.start) filled += y - range.start;
        }
        return Math.min(1, Math.max(0, filled / total));
      };

      const apply = () => {
        const next = progressFromScroll();
        html.style.setProperty('--cc-nav-progress', String(next));
        if (next > 0.01) html.dataset.navProgress = 'on';
        else delete html.dataset.navProgress;
      };

      apply();
      if (!hydrated) return;

      ensureGsapPlugins();
      ScrollTrigger.create({
        id: 'editorial-nav-progress',
        start: 0,
        end: 'max',
        scrub: canEnhanceMotion ? 0.35 : true,
        onUpdate: apply,
        onRefresh: apply,
      });

      return () => {
        html.style.removeProperty('--cc-nav-progress');
        delete html.dataset.navProgress;
      };
    },
    {
      dependencies: [canEnhanceMotion, hydrated],
      revertOnUpdate: true,
    },
  );

  return null;
}
