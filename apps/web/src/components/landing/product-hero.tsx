import Link from 'next/link';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { CODECARD_TAGLINE } from '@/lib/marketing/positioning';
import { ProductHeroDecorations } from './product-hero-decorations';

/**
 * Landing hero — Server Component so the LCP headline is in the initial HTML
 * without a client boundary wrapping the text (Phase 0C).
 */
export function ProductHero() {
  return (
    <section
      className="cc-hume-hero relative flex min-h-[min(78svh,720px)] scroll-mt-28 flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-[104px] text-center text-ink md:pb-24 md:pt-[112px]"
      data-testid="hero-section"
    >
      <div className="cc-hume-hero__blobs pointer-events-none" aria-hidden />

      <ProductHeroDecorations />

      <div className="relative z-[1] mx-auto flex w-full max-w-[760px] translate-y-3 flex-col items-center text-center md:translate-y-6">
        <h1
          data-hero-statement
          className="cc-hume-hero__headline mx-auto max-w-[760px] text-balance text-center"
        >
          Your best work. Ready to{' '}
          <span className="cc-hume-gradient-text">share in seconds.</span>
        </h1>

        <p
          data-hero-pitch
          className="cc-hume-hero__tagline mx-auto mt-6 max-w-[480px] text-balance text-center"
        >
          {CODECARD_TAGLINE}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3" data-hero-cta>
          <Link href="/sign-up" className="cc-btn-pill-primary cc-instant-press h-11 px-8 text-[15px]">
            Start free →
          </Link>
          <LiveDemoLink className="cc-btn-pill-ghost cc-instant-press h-11 px-8 text-[15px]">
            Live demo
          </LiveDemoLink>
        </div>
      </div>
    </section>
  );
}
