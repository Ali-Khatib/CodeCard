'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { CountUp } from '@/components/landing/count-up';
import { Sparkline } from './sparkline';
import { ProjectCardRich, type RichProjectCard } from './project-card-rich';

export type HomeStats = {
  profileViews: number;
  projectClicks: number;
  saves: number;
};

const ACTIVITY = [
  { text: 'Profile viewed from San Francisco', time: '2m ago' },
  { text: 'DevFlow opened via QR scan', time: '18m ago' },
  { text: 'Resume link clicked', time: '1h ago' },
  { text: 'New connection saved', time: '3h ago' },
];

export function DashboardHomeView({
  greeting,
  displayName,
  completion,
  stats,
  featured,
}: {
  greeting: string;
  displayName: string;
  completion: number;
  stats: HomeStats;
  featured: RichProjectCard | null;
}) {
  return (
    <div className="space-y-8">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="font-eyebrow text-[12px] uppercase tracking-[0.08em] text-reactor">Dashboard</p>
        <h1 className="mt-2 font-display text-[36px] text-vellum md:text-[48px]">
          {greeting}, {displayName.split(' ')[0]} <span className="inline-block animate-[wave_2s_ease-in-out_infinite]">👋</span>
        </h1>
        <p className="mt-2 text-[15px] text-lichen">Here&apos;s what&apos;s happening with your CodeCard today.</p>
      </motion.header>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="cc-dash-glass cc-dash-glow rounded-[16px] p-6 md:p-8"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[13px] text-lichen">Profile strength</p>
              <p className="mt-1 font-display text-[40px] leading-none text-vellum">
                <CountUp value={completion} />%
              </p>
            </div>
            <Link href="/dashboard/profile" className="cc-btn-pill-primary h-9 px-4 text-[13px]">
              Complete profile
            </Link>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-charcoal/80">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-reactor to-reactorBright"
              initial={{ width: 0 }}
              animate={{ width: `${completion}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className="mt-3 text-[13px] text-graphite">
            Add a featured project and publish to reach 100%.
          </p>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {[
            { label: 'Profile views', value: stats.profileViews, spark: [4, 8, 6, 12, 9, 14, 11] },
            { label: 'Project clicks', value: stats.projectClicks, spark: [2, 5, 4, 8, 6, 9, 7] },
            { label: 'Saves', value: stats.saves, spark: [1, 2, 1, 3, 2, 4, 3] },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="cc-dash-stat-card"
            >
              <p className="text-[12px] text-graphite">{s.label}</p>
              <p className="mt-1 font-display text-[28px] text-vellum">
                <CountUp value={s.value} />
              </p>
              <Sparkline points={s.spark} className="mt-2 h-7 w-full" />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[22px] text-vellum">Featured project</h2>
            <Link href="/dashboard/projects" className="text-[13px] text-reactor hover:text-reactorBright">
              All projects →
            </Link>
          </div>
          {featured ? (
            <ProjectCardRich card={featured} />
          ) : (
            <div className="cc-dash-glass rounded-[14px] p-8 text-center">
              <p className="text-[15px] text-lichen">No featured project yet.</p>
              <Link href="/dashboard/projects/new" className="cc-btn-pill-primary mt-4 inline-flex h-10 items-center px-5 text-[14px]">
                Add project
              </Link>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-display text-[22px] text-vellum">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/dashboard/projects/new', label: 'Upload project', sub: 'Add featured work' },
              { href: '/dashboard/profile', label: 'Edit profile', sub: 'Identity & links' },
              { href: '/dashboard/analytics', label: 'View analytics', sub: 'Traffic & opens' },
              { href: '/dashboard/settings', label: 'Generate QR', sub: 'Share anywhere' },
            ].map((action, i) => (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.05 }}
              >
                <Link href={action.href} className="cc-dash-action-tile block rounded-[12px] p-4">
                  <p className="font-medium text-vellum">{action.label}</p>
                  <p className="mt-1 text-[12px] text-graphite">{action.sub}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      <section className="cc-dash-glass rounded-[14px] p-6">
        <h2 className="font-display text-[20px] text-vellum">Recent activity</h2>
        <ul className="mt-4 divide-y divide-border/30">
          {ACTIVITY.map((item) => (
            <li key={item.text} className="flex items-center justify-between py-3 text-[14px]">
              <span className="text-lichen">{item.text}</span>
              <span className="shrink-0 text-graphite">{item.time}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
