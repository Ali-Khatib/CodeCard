'use client';

import { useState } from 'react';
import { ScrollReveal } from './scroll-reveal';
import { SectionCounter } from './section-counter';
import { TYPE } from '@/lib/design/tokens';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';

/** Same routes + nav order as `DashboardShell` live demo */
const PREVIEW_TABS = [
  { id: 'home', label: 'Home', path: '/dashboard/preview' },
  { id: 'projects', label: 'Projects', path: '/dashboard/preview/projects' },
  { id: 'circle', label: 'Circle', path: '/dashboard/preview/circle' },
  { id: 'analytics', label: 'Analytics', path: '/dashboard/preview/analytics' },
  { id: 'connections', label: 'Connections', path: '/dashboard/preview/connections' },
  { id: 'settings', label: 'Settings', path: '/dashboard/preview/settings' },
] as const;

type TabId = (typeof PREVIEW_TABS)[number]['id'];

export function WorkspaceShowcase() {
  const [tab, setTab] = useState<TabId>('home');
  const active = PREVIEW_TABS.find((t) => t.id === tab) ?? PREVIEW_TABS[0];

  return (
    <section id="workspace" className="scroll-mt-28 py-20 md:py-[100px]">
      <div className="cc-container">
        <ScrollReveal>
          <SectionCounter label="Your workspace" index="" />
          <h2 className={`mt-4 ${TYPE.sectionHeading} text-ink`}>
            Everything behind your CodeCard.
          </h2>
          <p className={`mt-4 max-w-[600px] ${TYPE.subheading}`}>
            This is the real dashboard — same UI as the live demo. Click a tab or explore inside.
          </p>
          <LiveDemoLink className="cc-btn-pill-demo cc-instant-press mt-8 inline-flex h-11 px-8 text-[15px]">
            Open live demo workspace →
          </LiveDemoLink>
        </ScrollReveal>

        <ScrollReveal delay={0.06} className="mt-8">
          <div
            className="cc-workspace-showcase-tabs flex flex-wrap gap-2"
            role="tablist"
            aria-label="Dashboard preview tabs"
          >
            {PREVIEW_TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`cc-workspace-showcase-tabs__btn ${tab === item.id ? 'cc-workspace-showcase-tabs__btn--active' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1} scale={0.99} className="mt-4 md:mt-5">
          <div className="cc-workspace-showcase-embed">
            <iframe
              key={active.path}
              src={active.path}
              title={`CodeCard dashboard — ${active.label}`}
              className="cc-workspace-showcase-embed__frame"
              loading="eager"
            />
          </div>
          <p className="mt-3 text-center text-[13px] text-smoke">
            Interactive preview — use the sidebar inside to switch tabs, just like the live demo.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
