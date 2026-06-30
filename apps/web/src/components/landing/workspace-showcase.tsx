'use client';

import { useState } from 'react';
import { ScrollReveal } from './scroll-reveal';
import { SectionCounter } from './section-counter';
import { CountUp } from './count-up';
import { TYPE } from '@/lib/design/tokens';

const TABS = [
  { id: 'projects', label: 'Projects' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'profile', label: 'Profile' },
  { id: 'connections', label: 'Connections' },
  { id: 'settings', label: 'Settings' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function WorkspaceShowcase() {
  const [tab, setTab] = useState<TabId>('projects');

  return (
    <section id="workspace" className="scroll-mt-28 py-20 md:py-[100px]">
      <div className="cc-container">
        <ScrollReveal>
          <SectionCounter label="Your workspace" index="" />
          <h2 className={`mt-4 ${TYPE.sectionHeading} text-vellum`}>
            Everything behind your CodeCard.
          </h2>
          <p className={`mt-4 max-w-[600px] ${TYPE.subheading}`}>
            Projects, analytics, profile, connections, and settings in one calm dashboard.
            Not just the public page visitors see.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.08} scale={0.98} className="mt-12 md:mt-16">
          <div className="cc-workspace-frame overflow-hidden rounded-[14px] border border-border/50 bg-midnight/80 shadow-rim">
            <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
              <span className="cc-workspace-frame__dot" />
              <span className="cc-workspace-frame__dot" />
              <span className="cc-workspace-frame__dot" />
              <span className="ml-2 font-eyebrow text-[11px] uppercase tracking-[0.08em] text-graphite">
                app.codecard.io/dashboard
              </span>
            </div>

            <div className="flex flex-col md:flex-row">
              <nav
                className="flex gap-1 overflow-x-auto border-b border-border/30 p-3 md:w-52 md:flex-col md:border-b-0 md:border-r md:p-4"
                aria-label="Dashboard sections"
              >
                {TABS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`rounded-[8px] px-3 py-2 text-left text-[14px] font-medium transition-colors ${
                      tab === item.id
                        ? 'bg-reactor/15 text-phosphor'
                        : 'text-graphite hover:bg-fern/50 hover:text-lichen'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="min-h-[320px] flex-1 p-5 md:p-8">
                {tab === 'projects' && (
                  <div className="space-y-4">
                    <p className="font-eyebrow text-[12px] uppercase tracking-[0.08em] text-graphite">Projects</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {['DevFlow', 'SchemaSync', 'Pulse'].map((name, i) => (
                        <div
                          key={name}
                          className="cc-workspace-tile rounded-[10px] border border-border/40 p-4"
                          style={{ animationDelay: `${i * 80}ms` }}
                        >
                          <p className="font-display text-[18px] text-phosphor">{name}</p>
                          <p className="mt-1 text-[13px] text-lichen">Published · featured</p>
                          <div className="mt-3 h-16 rounded-[8px] bg-gradient-to-br from-reactor/20 to-transparent" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tab === 'analytics' && (
                  <div className="space-y-5">
                    <p className="font-eyebrow text-[12px] uppercase tracking-[0.08em] text-graphite">Analytics</p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      {[
                        { label: 'Profile views', value: 1284 },
                        { label: 'Project opens', value: 342 },
                        { label: 'Saves', value: 47 },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="cc-workspace-stat rounded-[10px] border border-border/40 p-4"
                        >
                          <p className="text-[13px] text-lichen">{stat.label}</p>
                          <p className="mt-2 font-display text-[32px] leading-none text-phosphor">
                            <CountUp value={stat.value} />
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="cc-workspace-chart h-28 rounded-[10px] border border-border/40" />
                  </div>
                )}

                {tab === 'profile' && (
                  <div className="space-y-4">
                    <p className="font-eyebrow text-[12px] uppercase tracking-[0.08em] text-graphite">Profile</p>
                    <div className="cc-workspace-tile rounded-[10px] border border-border/40 p-5">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-reactor/40 to-lavender/20" />
                        <div>
                          <p className="font-display text-[22px] text-phosphor">Alex Chen</p>
                          <p className="text-[14px] text-lichen">AI Engineer · building developer tools</p>
                        </div>
                      </div>
                      <div className="mt-5 space-y-2">
                        <div className="h-2 w-full rounded bg-charcoal/80" />
                        <div className="h-2 w-4/5 rounded bg-charcoal/60" />
                      </div>
                    </div>
                  </div>
                )}

                {tab === 'connections' && (
                  <div className="space-y-3">
                    <p className="font-eyebrow text-[12px] uppercase tracking-[0.08em] text-graphite">Connections</p>
                    {['Met at DevConf', 'Recruiter intro', 'Mentor coffee chat'].map((note) => (
                      <div
                        key={note}
                        className="cc-workspace-tile flex items-center justify-between rounded-[10px] border border-border/40 px-4 py-3"
                      >
                        <span className="text-[15px] text-phosphor">{note}</span>
                        <span className="text-[12px] text-graphite">Private note</span>
                      </div>
                    ))}
                  </div>
                )}

                {tab === 'settings' && (
                  <div className="space-y-3">
                    <p className="font-eyebrow text-[12px] uppercase tracking-[0.08em] text-graphite">Settings</p>
                    {['Custom domain', 'QR & NFC links', 'Branding', 'Billing'].map((row) => (
                      <div
                        key={row}
                        className="cc-workspace-tile flex items-center justify-between rounded-[10px] border border-border/40 px-4 py-3"
                      >
                        <span className="text-[15px] text-lichen">{row}</span>
                        <span className="h-5 w-9 rounded-full bg-charcoal" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
