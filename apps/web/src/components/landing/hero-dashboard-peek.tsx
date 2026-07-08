'use client';

import Image from 'next/image';
import { CountUp } from './count-up';
import { Sparkline } from '@/components/dashboard/sparkline';
import { DEMO_PROFILE } from '@/lib/projects/demo-data';
import {
  DEMO_OVERVIEW_ACTIVITY,
  DEMO_SUGGESTED_STEP,
  DEMO_WORKSPACE,
} from '@/lib/dashboard/workspace-demo';

const NAV_ITEMS = ['Home', 'Projects', 'Circle', 'Analytics', 'Profile'] as const;

export function HeroDashboardPeek() {
  return (
    <div className="cc-hume-hero__peek" data-hero-peek>
      <div className="cc-hume-hero__peek-frame">
        <div className="cc-hume-hero__peek-layout">
          <aside className="cc-hume-hero__peek-sidebar">
            <p className="font-display text-[14px] text-ink">CodeCard</p>
            <div className="mt-3 flex items-center gap-2 rounded-[8px] border border-[rgba(34,34,34,0.08)] bg-paper/80 p-1.5">
              <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
                <Image
                  src={DEMO_PROFILE.avatar_url!}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="24px"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-medium text-ink">Alex Chen</p>
                <p className="truncate text-[8px] text-smoke">@demo</p>
              </div>
            </div>
            <nav className="mt-3 space-y-0.5">
              {NAV_ITEMS.map((label, i) => (
                <div
                  key={label}
                  className={`rounded-[6px] px-2 py-1.5 text-[11px] font-medium ${
                    i === 0
                      ? 'border border-[rgba(34,34,34,0.08)] bg-[var(--hume-lavender-mist)] text-ink'
                      : 'text-smoke'
                  }`}
                >
                  {label}
                </div>
              ))}
            </nav>
          </aside>

          <div className="cc-hume-hero__peek-main">
            <header className="cc-hume-hero__peek-topbar">
              <h3 className="font-display text-[13px] text-ink">Home</h3>
              <span className="rounded-[6px] bg-ink px-2 py-0.5 text-[9px] font-medium text-paper">
                Create project
              </span>
            </header>

            <div className="cc-hume-hero__peek-body">
              <p className="font-display text-[15px] text-vellum">Good evening, Alex</p>

              <div className="cc-hume-hero__peek-suggested mt-2 rounded-[10px] p-2">
                <p className="text-[8px] font-semibold uppercase tracking-wider text-reactor-bright">
                  Suggested for you
                </p>
                <p className="mt-0.5 font-display text-[12px] text-vellum">{DEMO_SUGGESTED_STEP.title}</p>
                <p className="text-[9px] text-lichen">{DEMO_SUGGESTED_STEP.detail}</p>
              </div>

              <div className="mt-2 grid grid-cols-4 gap-1">
                {[
                  { label: 'Views', value: 1284, spark: [8, 12, 10, 16, 14, 18] },
                  { label: 'Opens', value: 342, spark: [3, 6, 5, 9, 7, 11] },
                  { label: 'Saves', value: 47, spark: [1, 2, 2, 4, 3, 5] },
                  { label: 'QR', value: 128, spark: [2, 4, 3, 6, 5, 7] },
                ].map((s) => (
                  <div key={s.label} className="cc-hume-hero__peek-kpi rounded-[8px] p-1.5">
                    <p className="text-[7px] text-graphite">{s.label}</p>
                    <p className="font-display text-[13px] text-vellum">
                      <CountUp value={s.value} durationMs={600} />
                    </p>
                    <Sparkline points={s.spark} className="mt-0.5 h-3 w-full opacity-50" />
                  </div>
                ))}
              </div>

              <div className="mt-2 flex items-center gap-2 rounded-[10px] border border-[rgba(34,34,34,0.06)] bg-[var(--hume-lavender-mist)]/60 p-2">
                <div
                  className="cc-dash-completion-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] text-vellum"
                  style={{ '--pct': DEMO_WORKSPACE.completion } as React.CSSProperties}
                >
                  <CountUp value={DEMO_WORKSPACE.completion} />%
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-medium text-vellum">Profile completion</p>
                  <p className="truncate text-[8px] text-lichen">{DEMO_OVERVIEW_ACTIVITY[0]?.text}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
