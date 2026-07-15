'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PLANS } from '@codecard/config';
import { AsyncActionButton } from '@/components/ui/async-action-button';
import { FadeInView } from './fade-in-view';
import { AppButton, AppCard, AppMono, PageHeader } from './ui/dashboard-ui';

type SettingRow = {
  label: string;
  hint?: string;
  value?: string;
  action?: string;
  href?: string;
  control?: 'button' | 'toggle' | 'status';
  enabled?: boolean;
};

type SettingSection = {
  id: string;
  eyebrow: string;
  title: string;
  navHint: string;
  description: string;
  rows: SettingRow[];
};

const SECTIONS: SettingSection[] = [
  {
    id: 'account',
    eyebrow: 'Account',
    title: 'Sign-in & email',
    navHint: 'Password, Google & GitHub',
    description:
      'The email and providers you use to sign in. Changes here affect how you access your workspace.',
    rows: [
      { label: 'Email', hint: 'Used for sign-in and receipts', value: 'alex.chen@stripe.com', control: 'status' },
      { label: 'Password', hint: 'We’ll email you a reset link', action: 'Change password', control: 'button' },
      { label: 'Google', hint: 'One-tap sign-in', value: 'Connected', control: 'status' },
      { label: 'GitHub', hint: 'Import repos & verify commits', action: 'Connect', control: 'button' },
    ],
  },
  {
    id: 'public',
    eyebrow: 'Profile',
    title: 'Public URL & visibility',
    navHint: 'Username, domain & search',
    description:
      'How people find your CodeCard on the web — your handle, custom domain, and whether search engines can index you.',
    rows: [
      { label: 'Username', hint: 'codecard.app/your-name', value: 'alexchen', control: 'status' },
      { label: 'Custom domain', hint: 'Pro feature', value: 'pro.codecard.app', control: 'status' },
      { label: 'Profile visibility', hint: 'Who can open your card', value: 'Public', control: 'status' },
      { label: 'Search indexing', hint: 'Show up on Google', value: 'Enabled', control: 'status' },
    ],
  },
  {
    id: 'sharing',
    eyebrow: 'Share',
    title: 'QR & profile sharing',
    navHint: 'Home share tools',
    description:
      'Share from Home with Copy public link, Share profile (where supported), QR preview, and Download QR. Wallet passes and NFC are not part of the MVP.',
    rows: [
      {
        label: 'Share tools',
        hint: 'Copy link, native share, QR preview, and PNG download',
        value: 'Available on Home',
        control: 'status',
      },
      {
        label: 'Wallet passes',
        hint: 'Apple Wallet and Google Wallet',
        value: 'Coming later',
        control: 'status',
      },
      {
        label: 'NFC tags',
        hint: 'Programmable tap-to-open tags',
        value: 'Coming later',
        control: 'status',
      },
      { label: 'Default share page', hint: 'What opens first', value: 'Public profile', control: 'status' },
    ],
  },
  {
    id: 'branding',
    eyebrow: 'Appearance',
    title: 'Theme, logo & accent',
    navHint: 'Colors and CodeCard watermark',
    description:
      'Make your public card feel like yours — pick a theme, set an accent color, upload a logo, and remove the CodeCard badge on Pro.',
    rows: [
      { label: 'Color theme', hint: 'Card layout & palette', value: 'Original', control: 'status' },
      { label: 'Accent color', hint: 'Buttons, links & highlights', value: '#c094e4', control: 'status' },
      { label: 'Remove CodeCard branding', hint: 'Hide the small footer mark', control: 'toggle', enabled: false },
      { label: 'Custom logo', hint: 'Replaces the default mark', action: 'Upload logo', control: 'button' },
    ],
  },
  {
    id: 'billing',
    eyebrow: 'Billing',
    title: 'Plan & invoices',
    navHint: 'Subscription and payment history',
    description:
      'Your current plan, renewal date, and past invoices. Upgrade or downgrade anytime.',
    rows: [
      { label: 'Current plan', hint: 'Renews monthly', value: `Pro · $${PLANS.pro.priceMonthly}/mo`, control: 'status' },
      { label: 'Manage subscription', hint: 'Change plan or cancel', href: '/dashboard/billing', control: 'button', action: 'Manage subscription' },
      { label: 'Invoices', hint: 'PDF receipts for expenses', action: 'View history', control: 'button' },
    ],
  },
  {
    id: 'security',
    eyebrow: 'Security',
    title: 'Sessions & data',
    navHint: '2FA, export & deletion',
    description:
      'Keep your account secure — review active sessions, turn on two-factor auth, export your data, or delete your account.',
    rows: [
      { label: 'Active sessions', hint: 'Sign out remotely if needed', value: '2 devices', control: 'status' },
      { label: 'Two-factor authentication', hint: 'Authenticator app or SMS', action: 'Enable', control: 'button' },
      { label: 'Export data', hint: 'JSON of profile & projects', action: 'Export data', control: 'button' },
      { label: 'Delete account', hint: 'Permanent — cannot undo', action: 'Delete account', control: 'button' },
    ],
  },
];

export function DashboardSettingsView({
  email,
  signOutAction,
}: {
  email?: string;
  signOutAction?: () => Promise<void>;
}) {
  const [openId, setOpenId] = useState<string>('account');

  const sections = SECTIONS.map((s) => {
    if (s.id === 'account' && email) {
      return { ...s, rows: s.rows.map((r) => (r.label === 'Email' ? { ...r, value: email } : r)) };
    }
    return s;
  });

  const active = sections.find((s) => s.id === openId) ?? sections[0];

  const demoAction = async () => {
    await new Promise((r) => setTimeout(r, 420));
  };

  const successLabels: Record<string, string> = {
    'Change password': 'Email sent',
    Connect: 'Connected',
    'Upload logo': 'Uploaded',
    'View history': 'Opened',
    Enable: 'Enabled',
    'Export data': 'Started',
    'Delete account': 'Requested',
  };

  return (
    <div className="cc-app-page cc-app-page--1040">
      <PageHeader
        title="Settings"
        description="Workspace preferences — sign-in, how you share, how your card looks, billing, and security."
      />

      <FadeInView delay={0}>
      <div className="grid gap-6 lg:grid-cols-[minmax(260px,300px)_1fr]">
        <nav className="flex flex-col gap-1.5" aria-label="Settings categories">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setOpenId(section.id)}
              className={`cc-settings-nav-link ${openId === section.id ? 'cc-settings-nav-link--active' : ''}`}
            >
              <span className="cc-settings-nav-link__title">{section.title}</span>
              <span className="cc-settings-nav-link__hint">{section.navHint}</span>
            </button>
          ))}
        </nav>

        <AppCard reactive={false}>
          <AppMono>{active.eyebrow}</AppMono>
          <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.025em] text-[var(--app-ink)]">
            {active.title}
          </h2>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--app-smoke)]">
            {active.description}
          </p>

          <ul className="mt-6 divide-y divide-[var(--app-border)]">
            {active.rows.map((row) => (
              <li key={row.label} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <span className="text-[14px] font-medium text-[var(--app-ink)]">{row.label}</span>
                  {row.hint && (
                    <p className="mt-0.5 text-[12px] leading-snug text-[var(--app-smoke)]">{row.hint}</p>
                  )}
                </div>
                {row.control === 'status' && (
                  <span className="text-[14px] text-[var(--app-smoke)]">{row.value}</span>
                )}
                {row.control === 'toggle' && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={row.enabled}
                    className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
                      row.enabled ? 'bg-[var(--app-iris)]' : 'bg-[var(--app-border-strong)]'
                    }`}
                  >
                    <span
                      className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                        row.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                )}
                {row.control === 'button' &&
                  (row.href ? (
                    <Link href={row.href}>
                      <AppButton variant="ghost">{row.action}</AppButton>
                    </Link>
                  ) : (
                    <AsyncActionButton
                      variant="ghost"
                      successLabel={row.action ? successLabels[row.action] ?? 'Done' : 'Done'}
                      onAction={demoAction}
                    >
                      {row.action}
                    </AsyncActionButton>
                  ))}
              </li>
            ))}
          </ul>

          {signOutAction && (
            <form action={signOutAction} className="mt-6 border-t border-[var(--app-border)] pt-6">
              <AppButton variant="ghost" type="submit">
                Sign out
              </AppButton>
            </form>
          )}
        </AppCard>
      </div>
      </FadeInView>
    </div>
  );
}
