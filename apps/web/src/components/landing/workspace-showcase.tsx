'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ScrollReveal } from './scroll-reveal';
import { SectionCounter } from './section-counter';
import { CountUp } from './count-up';
import { Sparkline } from '@/components/dashboard/sparkline';
import { useCodecardTheme } from '@/components/theme/theme-provider';
import { hexToRgba } from '@/lib/themes/codecard-themes';
import { TYPE } from '@/lib/design/tokens';
import { LiveDemoLink } from '@/components/marketing/live-demo-link';
import { DEMO_FEATURED_PROJECTS, DEMO_PROFILE } from '@/lib/projects/demo-data';
import { DEMO_CONNECTIONS, DEMO_OVERVIEW_ACTIVITY, DEMO_SUGGESTED_STEP, DEMO_WORKSPACE } from '@/lib/dashboard/workspace-demo';
import { DEMO_CIRCLE_FEED } from '@/lib/dashboard/circle-demo';

const TABS = [
  { id: 'overview', label: 'Home' },
  { id: 'projects', label: 'Projects' },
  { id: 'circle', label: 'Circle' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'profile', label: 'Profile' },
  { id: 'connections', label: 'Connections' },
  { id: 'settings', label: 'Settings' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const PAGE_TITLES: Record<TabId, string> = {
  overview: 'Home',
  projects: 'Projects',
  circle: 'Circle',
  analytics: 'Analytics',
  profile: 'Profile',
  connections: 'Connections',
  settings: 'Settings',
};


export function WorkspaceShowcase() {
  const [tab, setTab] = useState<TabId>('overview');

  return (
    <section id="workspace" className="scroll-mt-28 py-20 md:py-[100px]">
      <div className="cc-container">
        <ScrollReveal>
          <SectionCounter label="Your workspace" index="" />
          <h2 className={`mt-4 ${TYPE.sectionHeading} text-vellum`}>
            Everything behind your CodeCard.
          </h2>
          <p className={`mt-4 max-w-[600px] ${TYPE.subheading}`}>
            Home, Circle, projects, analytics, profile, connections, and settings — a premium workspace,
            not a placeholder admin panel.
          </p>
          <LiveDemoLink className="cc-btn-pill-demo cc-instant-press mt-8 inline-flex h-11 px-8 text-[15px]">
            Open live demo workspace →
          </LiveDemoLink>
        </ScrollReveal>

        <ScrollReveal delay={0.08} scale={0.98} className="mt-12 md:mt-16">
          <div className="cc-workspace-showcase overflow-hidden rounded-[18px]">
            <div className="flex max-h-[min(72vh,640px)] min-h-[420px] flex-col md:min-h-[480px] md:flex-row">
              {/* Sidebar */}
              <aside className="cc-workspace-showcase__sidebar shrink-0 md:w-[200px] md:overflow-y-auto lg:w-[220px]">
                <p className="font-display text-[17px] text-ink">CodeCard</p>
                <div className="mt-5 flex items-center gap-2.5 rounded-[10px] border border-[rgba(34,34,34,0.08)] bg-paper p-2">
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[rgba(34,34,34,0.08)]">
                    <Image
                      src={DEMO_PROFILE.avatar_url!}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-ink">Alex Chen</p>
                    <p className="truncate text-[10px] text-smoke">@demo</p>
                  </div>
                </div>
                <nav className="mt-4 flex gap-1 overflow-x-auto md:flex-col md:gap-0.5" aria-label="Dashboard">
                  {TABS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      className={`relative whitespace-nowrap rounded-[8px] px-2.5 py-2 text-left text-[13px] font-medium transition-colors md:px-3 ${
                        tab === item.id
                          ? 'text-ink'
                          : 'text-smoke hover:text-ink'
                      }`}
                    >
                      {tab === item.id && (
                        <span className="absolute inset-0 rounded-[8px] border border-[rgba(34,34,34,0.08)] bg-[var(--hume-lavender-mist)]" />
                      )}
                      {tab === item.id && (
                        <span className="absolute left-0 top-1/2 hidden h-4 w-[2px] -translate-y-1/2 rounded-full bg-ink md:block" />
                      )}
                      <span className="relative">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </aside>

              {/* Main */}
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <header className="cc-workspace-showcase__topbar flex shrink-0 flex-wrap items-center gap-3 px-4 py-3 md:px-5">
                  <h3 className="font-display text-[16px] text-ink">{PAGE_TITLES[tab]}</h3>
                  <div className="flex-1" />
                  <span className="rounded-[8px] bg-ink px-2.5 py-1 text-[11px] font-medium text-paper">
                    Create project
                  </span>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-5">
                  {tab === 'overview' && <OverviewPanel />}
                  {tab === 'projects' && <ProjectsPanel />}
                  {tab === 'circle' && <CirclePanel />}
                  {tab === 'analytics' && <AnalyticsPanel />}
                  {tab === 'profile' && <ProfilePanel />}
                  {tab === 'connections' && <ConnectionsPanel />}
                  {tab === 'settings' && <SettingsPanel />}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function OverviewPanel() {
  return (
    <div className="space-y-3">
      <p className="font-display text-[20px] text-vellum md:text-[22px]">Good evening, Alex</p>
      <div className="cc-dash-suggested-bar rounded-[12px] border border-reactor/25 bg-gradient-to-r from-reactor/15 to-transparent p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-reactor-bright">Suggested for you</p>
        <p className="mt-1 font-display text-[15px] text-vellum">{DEMO_SUGGESTED_STEP.title}</p>
        <p className="mt-0.5 text-[11px] text-lichen">{DEMO_SUGGESTED_STEP.detail}</p>
        <span className="cc-btn-pill-primary mt-2 inline-flex h-9 px-4 text-[12px]">Do this now →</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="cc-workspace-showcase__card flex flex-col items-center p-3 text-center">
          <div
            className="cc-dash-completion-ring flex h-14 w-14 items-center justify-center rounded-full text-[16px] text-vellum"
            style={{ '--pct': DEMO_WORKSPACE.completion } as React.CSSProperties}
          >
            <CountUp value={DEMO_WORKSPACE.completion} />%
          </div>
          <p className="mt-2 text-[10px] text-graphite">Profile completion</p>
        </div>
        <div className="cc-workspace-showcase__card p-2.5 sm:col-span-2">
          <p className="text-[9px] uppercase tracking-wider text-graphite">Public preview</p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="relative h-8 w-8 overflow-hidden rounded-[6px] border border-reactor/15">
              <Image src={DEMO_PROFILE.avatar_url!} alt="" fill className="object-cover" sizes="32px" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-vellum">{DEMO_PROFILE.display_name}</p>
              <p className="truncate text-[10px] text-lichen">{DEMO_PROFILE.headline}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: 'Views', value: 1284, spark: [8, 12, 10, 16, 14, 18] },
          { label: 'Opens', value: 342, spark: [3, 6, 5, 9, 7, 11] },
          { label: 'Saves', value: 47, spark: [1, 2, 2, 4, 3, 5] },
          { label: 'QR', value: 128, spark: [2, 4, 3, 6, 5, 7] },
        ].map((s) => (
          <div key={s.label} className="cc-analytics-kpi !p-2">
            <p className="text-[9px] text-graphite">{s.label}</p>
            <p className="font-display text-[16px] text-vellum">
              <CountUp value={s.value} durationMs={800} />
            </p>
            <Sparkline points={s.spark} className="mt-0.5 h-4 w-full opacity-50" />
          </div>
        ))}
      </div>
      <div className="cc-workspace-showcase__card p-2.5">
        <p className="text-[11px] font-medium text-vellum">Recent activity</p>
        <ul className="mt-1.5 space-y-1">
          {DEMO_OVERVIEW_ACTIVITY.slice(0, 3).map((a) => (
            <li key={a.id} className="flex justify-between gap-2 text-[10px]">
              <span className="truncate text-lichen">{a.text}</span>
              <span className="shrink-0 text-graphite">{a.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CirclePanel() {
  const item = DEMO_CIRCLE_FEED[0];
  return (
    <div className="space-y-2.5">
      <p className="text-[11px] text-lichen">Projects from your Circle</p>
      <span className="cc-dash-filter-label inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold">
        Filter · All · New
      </span>
      <div className="cc-workspace-showcase__card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-reactor/10 px-3 py-2">
          <div className="relative h-7 w-7 overflow-hidden rounded-full">
            {item.avatarUrl && (
              <Image src={item.avatarUrl} alt="" fill className="object-cover" sizes="28px" />
            )}
          </div>
          <p className="text-[11px] font-medium text-vellum">{item.connectionName}</p>
          <span className="ml-auto rounded-full bg-reactor/20 px-1.5 py-0.5 text-[8px] text-reactor-bright">New</span>
        </div>
        <div className="relative h-20">
          {item.posterUrl && (
            <Image src={item.posterUrl} alt="" fill className="object-cover" sizes="300px" />
          )}
          <div className="absolute bottom-2 left-3">
            <p className="font-display text-[14px] text-vellum">{item.projectTitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectsPanel() {
  const hero = DEMO_FEATURED_PROJECTS[0];
  return (
    <div className="space-y-2.5">
      <div className="cc-workspace-showcase__card overflow-hidden p-3">
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8 overflow-hidden rounded-full border border-reactor/25">
            <Image src={DEMO_PROFILE.avatar_url!} alt="" fill className="object-cover" sizes="32px" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-vellum">{DEMO_PROFILE.display_name}</p>
            <p className="text-[10px] text-lichen">Senior AI Engineer · Stripe</p>
          </div>
          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] text-emerald-300">
            Available
          </span>
        </div>
      </div>
      <p className="text-[11px] font-medium text-vellum">Your featured work</p>
      <span className="cc-dash-filter-label inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold">
        Filter · All · Published · With demo
      </span>
      <div className="cc-workspace-showcase__card overflow-hidden">
        <div className="grid sm:grid-cols-[1.2fr_1fr]">
          <div className="relative min-h-[88px]">
            {hero.posterUrl && (
              <Image src={hero.posterUrl} alt="" fill className="object-cover" sizes="300px" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-void-canvas/90 to-transparent" />
            <div className="absolute bottom-2 left-2">
              <p className="font-display text-[14px] text-vellum">{hero.title}</p>
              <p className="text-[10px] text-lichen">{hero.tagline}</p>
            </div>
          </div>
          <div className="flex flex-col justify-between border-t border-reactor/10 p-2 sm:border-l sm:border-t-0">
            <div className="grid grid-cols-3 gap-1 text-center">
              {[
                { label: 'Views', value: 468 },
                { label: 'Saves', value: 37 },
                { label: 'GitHub', value: 111 },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-display text-[14px] text-vellum">{s.value}</p>
                  <p className="text-[8px] text-graphite">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {['Edit', 'Preview', 'Live demo'].map((btn) => (
                <span
                  key={btn}
                  className={`rounded-[6px] px-1.5 py-0.5 text-[8px] ${
                    btn === 'Live demo'
                      ? 'border border-vellum/40 text-vellum'
                      : 'border border-reactor/15 text-graphite'
                  }`}
                >
                  {btn}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      {DEMO_FEATURED_PROJECTS.slice(1, 3).map((p) => (
        <div key={p.id} className="cc-workspace-showcase__card flex gap-2 overflow-hidden p-2">
          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-[6px] bg-midnight">
            {p.posterUrl && (
              <Image src={p.posterUrl} alt="" fill className="object-cover" sizes="64px" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[12px] text-vellum">{p.title}</p>
            <p className="truncate text-[9px] text-lichen">{p.tagline}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AnalyticsPanel() {
  const { theme } = useCodecardTheme();
  const accent = theme.vars['--accent'];
  const bright = theme.vars['--reactor-bright'];

  return (
    <div className="space-y-2.5">
      <div className="cc-workspace-showcase__card cc-workspace-showcase__card--glow p-3">
        <p className="text-[10px] text-lichen">
          Good evening, <span className="text-vellum">Alex</span>.
        </p>
        <p className="mt-1 text-[10px] text-graphite">Your profile reached</p>
        <p className="font-display text-[28px] leading-none text-vellum">
          <CountUp value={1284} />
          <span className="ml-1 text-[14px] text-graphite">people</span>
        </p>
        <p className="mt-1 text-[10px] text-emerald-400">↑ 18% this month</p>
        <div className="mt-2 grid grid-cols-5 gap-1 border-t border-reactor/10 pt-2">
          {[
            { label: 'Today', value: 86 },
            { label: 'Clicks', value: 34 },
            { label: 'QR', value: 19 },
            { label: 'Saves', value: 12 },
            { label: 'Conv.', value: '6.8%' },
          ].map((m) => (
            <div key={m.label}>
              <p className="text-[7px] uppercase text-graphite">{m.label}</p>
              <p className="text-[11px] font-medium text-vellum">{m.value}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[9px] uppercase tracking-wider text-graphite">Main dashboard</p>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {[
          { label: 'Profile views', value: 1284, spark: [8, 12, 10, 16, 14, 18] },
          { label: 'Project opens', value: 342, spark: [3, 6, 5, 9, 7, 11] },
          { label: 'Saves', value: 47, spark: [1, 2, 2, 4, 3, 5] },
          { label: 'QR scans', value: 128, spark: [2, 4, 3, 6, 5, 7] },
        ].map((s) => (
          <div key={s.label} className="cc-analytics-kpi !p-2">
            <p className="text-[8px] text-graphite">{s.label}</p>
            <p className="font-display text-[16px] text-vellum">
              <CountUp value={s.value} durationMs={800} />
            </p>
            <Sparkline points={s.spark} className="mt-0.5 h-4 w-full opacity-50" />
          </div>
        ))}
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2">
        <div className="cc-workspace-showcase__card p-2.5">
          <p className="text-[10px] text-vellum">Daily profile traffic</p>
          <div className="mt-2 flex h-12 items-end gap-0.5">
            {[40, 55, 48, 72, 65, 80, 70, 90, 78].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm"
                style={{
                  height: `${h}%`,
                  background: `linear-gradient(to top, ${hexToRgba(accent, 0.5)}, ${hexToRgba(bright, 0.9)})`,
                }}
              />
            ))}
          </div>
        </div>
        <div className="cc-workspace-showcase__card space-y-1.5 p-2.5">
          <p className="text-[10px] text-vellum">Traffic sources</p>
          {[
            { label: 'GitHub', pct: 32 },
            { label: 'LinkedIn', pct: 24 },
            { label: 'QR Code', pct: 15 },
          ].map((s) => (
            <div key={s.label}>
              <div className="flex justify-between text-[9px]">
                <span className="text-lichen">{s.label}</span>
                <span className="text-graphite">{s.pct}%</span>
              </div>
              <div className="mt-0.5 h-1 rounded-full bg-midnight">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${s.pct}%`, background: hexToRgba(accent, 0.72) }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfilePanel() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="cc-workspace-showcase__card space-y-2 p-3">
        <p className="text-[11px] uppercase tracking-wider text-graphite">Edit profile</p>
        {['Name', 'Role', 'Company', 'Location', 'Bio'].map((field) => (
          <div key={field} className="rounded-[8px] border border-reactor/10 bg-midnight/50 px-2.5 py-1.5">
            <p className="text-[9px] text-graphite">{field}</p>
            <p className="text-[12px] text-lichen">
              {field === 'Name' && DEMO_PROFILE.display_name}
              {field === 'Role' && 'Senior AI Engineer'}
              {field === 'Company' && 'Stripe'}
              {field === 'Location' && DEMO_PROFILE.location}
              {field === 'Bio' && 'Building developer tools…'}
            </p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="cc-workspace-showcase__card p-3">
          <p className="text-[10px] text-graphite">Live preview</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="relative h-9 w-9 overflow-hidden rounded-full">
              <Image src={DEMO_PROFILE.avatar_url!} alt="" fill className="object-cover" sizes="36px" />
            </div>
            <p className="text-[13px] text-vellum">{DEMO_PROFILE.display_name}</p>
          </div>
        </div>
        <div className="cc-workspace-showcase__card p-3 text-center">
          <p className="text-[10px] text-graphite">QR code</p>
          <div className="mx-auto mt-2 grid h-16 w-16 grid-cols-4 grid-rows-4 gap-px bg-midnight p-1">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className={i % 2 === 0 ? 'bg-void-canvas' : 'bg-midnight'} />
            ))}
          </div>
          <p className="mt-2 text-[10px] text-reactor/80">78% complete</p>
        </div>
      </div>
    </div>
  );
}

function ConnectionsPanel() {
  const [selected] = DEMO_CONNECTIONS;
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_0.85fr]">
      <div className="space-y-1.5">
        <p className="text-[11px] text-lichen">People you saved</p>
        {DEMO_CONNECTIONS.slice(0, 3).map((c, i) => (
          <div
            key={c.id}
            className={`cc-workspace-showcase__card flex items-center gap-2 p-2 ${
              i === 0 ? 'border-reactor/25' : ''
            }`}
          >
            <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-reactor/15">
              {c.avatarUrl && (
                <Image src={c.avatarUrl} alt="" fill className="object-cover" sizes="28px" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-vellum">{c.name}</p>
              <p className="truncate text-[9px] text-graphite">{c.note}</p>
            </div>
            <span className="shrink-0 text-[8px] text-graphite">{c.source}</span>
          </div>
        ))}
      </div>
      <div className="cc-workspace-showcase__card space-y-1.5 p-2.5">
        <p className="text-[11px] font-medium text-vellum">{selected.name}</p>
        <p className="text-[9px] text-lichen">{selected.role} · {selected.company}</p>
        <div className="space-y-1 text-[9px] text-graphite">
          <p>Met at: {selected.metAt}</p>
          <p>Follow-up: {selected.followUpDate ?? 'None'}</p>
        </div>
        <p className="text-[9px] text-lichen">{selected.note}</p>
        <div className="flex gap-1">
          {selected.tags.map((t) => (
            <span key={t} className="rounded-full border border-reactor/15 px-1.5 py-0.5 text-[8px] text-graphite">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsPanel() {
  const sections = ['Account', 'Public profile', 'Sharing', 'Branding', 'Billing', 'Security'];
  return (
    <div className="space-y-2">
      {sections.map((s, i) => (
        <div
          key={s}
          className={`cc-workspace-showcase__card flex items-center justify-between px-3 py-2.5 ${
            i === 0 ? 'border-reactor/25' : ''
          }`}
        >
          <div>
            <p className="text-[13px] font-medium text-vellum">{s}</p>
            <p className="text-[10px] text-graphite">
              {s === 'Account' && 'Email, password, connected accounts'}
              {s === 'Billing' && 'Pro · $8/mo'}
              {s === 'Security' && 'Sessions, 2FA'}
            </p>
          </div>
          <span className="text-graphite">▾</span>
        </div>
      ))}
    </div>
  );
}
