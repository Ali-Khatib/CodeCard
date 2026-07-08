'use client';

import { ArrowCta } from './arrow-cta';

import { LIVE_DEMO_HREF } from '@/lib/marketing/demo-url';

export function LandingPlayDemo() {
  return <ArrowCta href={LIVE_DEMO_HREF} label="Live demo" />;
}
