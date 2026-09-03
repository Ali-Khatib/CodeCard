'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ensureGsapPlugins } from '@/components/motion/gsap-runtime';
import { useMotionPreferences } from '@/components/motion/motion-preferences-provider';
import {
  applyLandingChromeInk,
  createChromeToneRafScheduler,
  syncLandingChromeFromCinema,
  type LandingChromeInk,
} from '@/components/landing/editorial/landing-chrome-tone';

/** Chapters where the fixed CC mark sits over a dark surface (light logo). */
const LIGHT_LOGO_CHAPTERS = new Set(['hero', 'statement', 'finale']);
/** Full-bleed immersive chapters — nav collapses to a circular expand control.
 *  Crash Course only — Research keeps the full pill. */
const COMPACT_NAV_CHAPTERS = ['walkthrough'] as const;

function chapterInk(chapter: string, navCompact: boolean): LandingChromeInk {
  if (navCompact) return 'light';
  return LIGHT_LOGO_CHAPTERS.has(chapter) ? 'light' : 'dark';
}

/** Returns a tone only when the fixed CC sits over the footer; otherwise null. */
function logoToneFromFooterOnly(): LandingChromeInk | null {
  const logoY = 56;
  const covers = (el: Element | null) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.top <= logoY && r.bottom >= logoY;
  };

  const bar = document.querySelector('.cc-site-footer__bar');
  if (covers(bar)) return 'light';

  const seam = document.querySelector('.cc-site-footer__seam');
  if (covers(seam)) {
    const r = seam!.getBoundingClientRect();
    // Upper band is the cream wave; lower band is the dark field.
    return logoY < r.top + r.height * 0.42 ? 'dark' : 'light';
  }

  if (
    covers(document.querySelector('.cc-site-footer__statement-grid')) ||
    covers(document.querySelector('.cc-site-footer__from-finale'))
  ) {
    return 'dark';
  }

  const statement = document.querySelector('.cc-site-footer__statement');
  if (statement && seam) {
    const sr = seam.getBoundingClientRect();
    const st = statement.getBoundingClientRect();
    if (st.top <= logoY && logoY < sr.top) return 'dark';
  }

  return null;
}

/**
 * Single owner for logo + nav ink.
 * Priority: footer surface → hero cinema clip geometry → chapter fallback.
 */
function syncChromeTone(chapter: string) {
  const footerTone = logoToneFromFooterOnly();
  if (footerTone) {
    applyLandingChromeInk(footerTone);
    return;
  }
  if (syncLandingChromeFromCinema()) return;
  const compact = document.documentElement.dataset.navCompact === 'true';
  applyLandingChromeInk(chapterInk(chapter, compact));
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
    /* Cream letterbox under chrome on first paint — black ink until cinema owns it. */
    document.documentElement.dataset.landingChapter = 'hero';
    applyLandingChromeInk('dark');
    syncChromeTone('hero');
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
      syncChromeTone(id);
    };

    apply(sections[0]?.dataset.chapterSection ?? 'hero');

    const compactActive = new Set<string>();
    const syncCompact = () => {
      setNavCompact(compactActive.size > 0);
      syncChromeTone(activeRef.current || 'hero');
    };

    const cleanupHtml = () => {
      delete document.documentElement.dataset.landingChapter;
      delete document.documentElement.dataset.navTone;
      delete document.documentElement.dataset.navCompact;
      delete document.documentElement.dataset.logoTone;
    };

    const footerRoots = [
      document.querySelector<HTMLElement>('.cc-site-footer__statement'),
      document.querySelector<HTMLElement>('.cc-site-footer__bar'),
    ].filter((el): el is HTMLElement => Boolean(el));

    const scheduler = createChromeToneRafScheduler(() => {
      syncChromeTone(activeRef.current || 'hero');
    });

    const footerObserver = new IntersectionObserver(() => scheduler.request(), {
      root: null,
      rootMargin: '0px 0px -70% 0px',
      threshold: [0, 0.05, 0.25, 0.5, 1],
    });
    footerRoots.forEach((el) => footerObserver.observe(el));
    window.addEventListener('scroll', scheduler.request, { passive: true });
    scheduler.request();

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
        footerObserver.disconnect();
        window.removeEventListener('scroll', scheduler.request);
        scheduler.cancel();
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
      footerObserver.disconnect();
      window.removeEventListener('scroll', scheduler.request);
      scheduler.cancel();
      cleanupHtml();
    };
  }, [canEnhanceMotion]);

  return <div className="cc-ed-atmosphere" aria-hidden data-testid="editorial-atmosphere" />;
}
