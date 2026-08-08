import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  REDUCED_MOTION_QUERY,
  scrollBehaviorForPreference,
} from '@/hooks/use-reduced-motion';

const WEB = resolve(process.cwd());

function read(rel: string) {
  return readFileSync(resolve(WEB, 'src', rel), 'utf8');
}

describe('WS12-T006 reduced motion', () => {
  it('exposes a stable reduced-motion media query', () => {
    expect(REDUCED_MOTION_QUERY).toBe('(prefers-reduced-motion: reduce)');
  });

  it('maps scroll behavior from preference without window', () => {
    expect(scrollBehaviorForPreference(true)).toBe('auto');
    expect(scrollBehaviorForPreference(false)).toBe('smooth');
  });

  it('keeps the reduced-motion hook hydration-safe', () => {
    const hook = read('hooks/use-reduced-motion.ts');
    expect(hook).toContain('useState(false)');
    expect(hook).toContain('addEventListener');
    expect(hook).toContain('REDUCED_MOTION_QUERY');
    expect(hook).toContain('scrollBehaviorForPreference');
    // View transitions skip when reduced.
    expect(hook).toMatch(/!reduced[\s\S]*startViewTransition/);
  });

  it('uses preference-aware smooth scrolling in JS helpers', () => {
    expect(read('components/landing/marketing-hash-redirect.tsx')).toContain(
      'scrollBehaviorForPreference()',
    );
    expect(read('components/profile/scroll-strip.tsx')).toContain(
      'scrollBehaviorForPreference()',
    );
    expect(read('hooks/use-view-transition-navigate.ts')).toContain(
      "matchMedia('(prefers-reduced-motion: reduce)')",
    );
  });

  it('disables decorative CSS motion under prefers-reduced-motion', () => {
    const globals = read('app/globals.css');
    expect(globals).toContain('@media (prefers-reduced-motion: reduce)');
    expect(globals).toContain('scroll-behavior: auto !important');
    expect(globals).toContain('animation-duration: 0.01ms !important');
    expect(globals).toContain('.cc-logo-loop__track');
    expect(globals).toContain('.animate-pulse');

    const app = read('styles/codecard-app-system.css');
    expect(app).toContain('@media (prefers-reduced-motion: no-preference)');
    expect(app).toContain('scroll-behavior: smooth');

    const dash = read('styles/dashboard-ember.css');
    expect(dash).toContain('@media (prefers-reduced-motion: reduce)');
    expect(dash).toContain('animation: none !important');
  });

  it('keeps essential loading affordances available via motion-reduce utilities', () => {
    const github = read('components/auth/auth-github-button.tsx');
    const primary = read('components/auth/auth-primary-button.tsx');
    expect(github).toContain('motion-reduce:animate-none');
    expect(primary).toContain('motion-reduce:animate-none');
  });

  it('hero parallax aborts when reduced motion is requested', () => {
    const parallax = read('hooks/use-hero-parallax.ts');
    expect(parallax).toContain('useReducedMotion');
    expect(parallax).toContain('if (reduced) return');
  });
});
