'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AsyncActionButton } from '@/components/ui/async-action-button';
import { AccountExportAction } from '@/components/dashboard/account-export-action';
import { GithubConnectionAction } from '@/components/dashboard/github-connection-action';
import {
  AccountDeletionDialog,
  type AccountDeletionAuthMode,
} from '@/components/dashboard/account-deletion-dialog';
import {
  currentPlanHint,
  formatCurrentPlanLabel,
  type AccountPlanId,
} from '@/lib/billing/current-plan';
import { FadeInView } from './fade-in-view';
import { AppButton, AppCard, AppMono, PageHeader } from './ui/dashboard-ui';

type SettingControl =
  | 'button'
  | 'toggle'
  | 'status'
  | 'value-edit'
  | 'account-export'
  | 'account-delete'
  | 'github-connection';

type SettingRow = {
  label: string;
  hint?: string;
  value?: string;
  action?: string;
  href?: string;
  control: SettingControl;
  enabled?: boolean;
  /** Shown instead of a working edit control. */
  comingSoon?: boolean;
};

type SettingSection = {
  id: string;
  eyebrow: string;
  title: string;
  navHint: string;
  description: string;
  rows: SettingRow[];
};

export type SettingsSnapshot = {
  email?: string;
  profileSlug?: string | null;
  isPublic?: boolean;
  plan?: AccountPlanId;
  hasPassword?: boolean;
  googleConnected?: boolean;
  githubConnected?: boolean;
};

function profileEditorHref(hash?: string, live = true) {
  const path = hash ? `/dashboard#${hash}` : '/dashboard#profile';
  if (!live) return `/sign-in?redirect=${encodeURIComponent(path)}`;
  return path;
}

function buildSections(snapshot: SettingsSnapshot, live: boolean): SettingSection[] {
  const plan = snapshot.plan ?? 'free';
  const slug = snapshot.profileSlug?.trim() || null;
  const isPublic = Boolean(snapshot.isPublic);
  const email = snapshot.email ?? (live ? 'Not set' : 'demo@codecard.app');
  const username = slug ?? (live ? 'Not set yet' : 'demo');
  const billingHref = live
    ? '/dashboard/billing'
    : `/sign-in?redirect=${encodeURIComponent('/dashboard/billing')}`;
  const shareHref = live
    ? '/dashboard#share'
    : `/sign-in?redirect=${encodeURIComponent('/dashboard#share')}`;

  return [
    {
      id: 'account',
      eyebrow: 'Account',
      title: 'Sign-in & email',
      navHint: 'Password & GitHub',
      description:
        'The email and providers you use to sign in. Changes here affect how you access your workspace.',
      rows: [
        {
          label: 'Email',
          hint: 'Used for sign-in and receipts',
          value: email,
          control: 'status',
        },
        {
          label: 'Password',
          hint: snapshot.hasPassword
            ? 'We will email you a reset link'
            : 'Add a password via email reset if you signed up with OAuth',
          action: 'Email reset link',
          href: '/forgot-password',
          control: 'value-edit',
          value: snapshot.hasPassword ? 'Set' : 'Not set',
        },
        {
          label: 'Google',
          hint: 'Not available in MVP yet',
          value: 'Coming later',
          control: 'status',
          comingSoon: true,
        },
        {
          label: 'GitHub',
          hint: snapshot.githubConnected
            ? 'Used only to identify your account — no repository access'
            : 'Optional sign-in. CodeCard requests your GitHub profile and email only.',
          value: snapshot.githubConnected ? 'Connected' : 'Not connected',
          control: 'github-connection',
        },
      ],
    },
    {
      id: 'public',
      eyebrow: 'Profile',
      title: 'Public URL & visibility',
      navHint: 'Username, domain & search',
      description:
        'How people find your CodeCard on the web: your handle, whether the card is public, and Pro domain options.',
      rows: [
        {
          label: 'Username',
          hint: 'codecard.app/your-name',
          value: username,
          action: 'Edit',
          href: profileEditorHref('slug', live),
          control: 'value-edit',
        },
        {
          label: 'Custom domain',
          hint: plan === 'pro' ? 'Available on your plan' : 'Included with Pro — claim a custom domain',
          value: plan === 'pro' ? 'Not configured' : 'Available on Pro',
          action: plan === 'pro' ? 'Set up' : 'Upgrade',
          href: billingHref,
          control: 'value-edit',
          comingSoon: plan === 'pro',
        },
        {
          label: 'Profile visibility',
          hint: 'Who can open your card',
          value: isPublic ? 'Public' : 'Private',
          action: 'Edit',
          href: profileEditorHref('visibility', live),
          control: 'value-edit',
        },
        {
          label: 'Photo, bio & links',
          hint: 'Everything visitors see on your card',
          value: 'Edit on Profile',
          action: 'Open Profile',
          href: profileEditorHref('photo', live),
          control: 'value-edit',
        },
        {
          label: 'Search indexing',
          hint: 'Show up on Google when public',
          value: isPublic ? 'Follows public status' : 'Off while private',
          action: 'Edit visibility',
          href: profileEditorHref('visibility', live),
          control: 'value-edit',
        },
      ],
    },
    {
      id: 'sharing',
      eyebrow: 'Share',
      title: 'QR & profile sharing',
      navHint: 'Home share tools',
      description:
        'Share from Home with Copy public link, Share profile, QR preview, and Download QR. Wallet and NFC come later.',
      rows: [
        {
          label: 'Share tools',
          hint: 'Copy link, native share, QR preview, and PNG download',
          value: 'On Home',
          action: 'Open',
          href: shareHref,
          control: 'value-edit',
        },
        {
          label: 'Public card preview',
          hint: 'See your live page like visitors do',
          value: slug ? `/${slug}` : 'Publish first',
          action: slug ? 'View' : 'Edit profile',
          href: slug ? `/${slug}` : profileEditorHref(),
          control: 'value-edit',
        },
        {
          label: 'Wallet passes',
          hint: 'Apple Wallet and Google Wallet',
          value: 'Coming later',
          control: 'status',
          comingSoon: true,
        },
        {
          label: 'NFC tags',
          hint: 'Programmable tap-to-open tags',
          value: 'Coming later',
          control: 'status',
          comingSoon: true,
        },
      ],
    },
    {
      id: 'branding',
      eyebrow: 'Appearance',
      title: 'Theme, logo & accent',
      navHint: 'Colors and CodeCard watermark',
      description:
        'Public card branding controls. Theme and logo ship after MVP; remove-branding is a Pro toggle when available.',
      rows: [
        {
          label: 'Color theme',
          hint: 'Card layout and palette',
          value: 'Default',
          control: 'status',
          comingSoon: true,
        },
        {
          label: 'Accent color',
          hint: 'Buttons, links and highlights',
          value: 'Default',
          control: 'status',
          comingSoon: true,
        },
        {
          label: 'Remove CodeCard branding',
          hint: plan === 'pro' ? 'Hide the small footer mark' : 'Included with Pro',
          control: 'toggle',
          enabled: false,
          comingSoon: true,
        },
        {
          label: 'Custom logo',
          hint: 'Replaces the default mark',
          value: 'Coming later',
          control: 'status',
          comingSoon: true,
        },
      ],
    },
    {
      id: 'billing',
      eyebrow: 'Billing',
      title: 'Plan & invoices',
      navHint: 'Subscription and payment history',
      description: 'Your current plan, renewal, and invoices. Upgrade or manage anytime.',
      rows: [
        {
          label: 'Current plan',
          hint: currentPlanHint(plan),
          value: formatCurrentPlanLabel(plan),
          action: plan === 'pro' ? 'Manage' : 'Upgrade',
          href: billingHref,
          control: 'value-edit',
        },
        {
          label: 'Manage subscription',
          hint: 'Change plan or cancel',
          href: billingHref,
          control: 'button',
          action: 'Manage subscription',
        },
        {
          label: 'Invoices',
          hint: 'PDF receipts for expenses',
          href: billingHref,
          control: 'button',
          action: 'View invoices',
        },
      ],
    },
    {
      id: 'security',
      eyebrow: 'Security',
      title: 'Sessions & data',
      navHint: '2FA, export & deletion',
      description:
        'Keep your account secure. Export your data or delete your account. Sign out ends this device session.',
      rows: [
        {
          label: 'This device session',
          hint: 'Use Sign out below to end it',
          value: 'Signed in here',
          control: 'status',
        },
        {
          label: 'Two-factor authentication',
          hint: 'Authenticator app or SMS',
          value: 'Coming later',
          control: 'status',
          comingSoon: true,
        },
        {
          label: 'Export data',
          hint: 'JSON download of approved account data (profile, projects, research, and related records)',
          control: 'account-export',
        },
        {
          label: 'Delete account',
          hint: 'Requires recent reauthentication and exact confirmation. Cannot be undone.',
          control: 'account-delete',
        },
      ],
    },
  ];
}

function RowActions({
  row,
  live,
  email,
  deletionAuth,
  openDeletionOnMount,
  githubConnected,
  githubCanDisconnect,
}: {
  row: SettingRow;
  live: boolean;
  email?: string;
  deletionAuth: AccountDeletionAuthMode;
  openDeletionOnMount: boolean;
  githubConnected: boolean;
  githubCanDisconnect: boolean;
}) {
  if (row.control === 'account-export') {
    return <AccountExportAction live={live} />;
  }
  if (row.control === 'github-connection') {
    return (
      <GithubConnectionAction
        live={live}
        connected={githubConnected}
        canDisconnect={githubCanDisconnect}
      />
    );
  }
  if (row.control === 'account-delete') {
    return (
      <AccountDeletionDialog
        live={live}
        auth={deletionAuth}
        email={email}
        initiallyOpen={live && openDeletionOnMount}
      />
    );
  }

  if (row.control === 'toggle') {
    return (
      <div className="flex flex-wrap items-center gap-3">
        {row.comingSoon ? (
          <span className="text-[12px] text-[var(--app-smoke)]">Coming later</span>
        ) : null}
        <button
          type="button"
          role="switch"
          aria-checked={row.enabled}
          aria-label={row.label}
          disabled={row.comingSoon || !live}
          className={`h-6 w-11 rounded-full p-0.5 transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--app-iris)] disabled:cursor-not-allowed disabled:opacity-50 ${
            row.enabled ? 'bg-[var(--app-iris)]' : 'bg-[var(--app-border-strong)]'
          }`}
        >
          <span
            className={`block h-5 w-5 rounded-full bg-white transition-transform ${
              row.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    );
  }

  if (row.comingSoon && row.control === 'status') {
    return (
      <span className="rounded-full border border-[var(--app-border)] px-3 py-1 text-[12px] text-[var(--app-smoke)]">
        Coming later
      </span>
    );
  }

  if (row.control === 'status') {
    return <span className="text-[14px] text-[var(--app-smoke)]">{row.value}</span>;
  }

  if (row.control === 'value-edit') {
    return (
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
        {row.value ? (
          <span className="max-w-[14rem] break-words text-right text-[14px] text-[var(--app-smoke)]">
            {row.value}
          </span>
        ) : null}
        {row.comingSoon ? (
          <span className="rounded-full border border-[var(--app-border)] px-3 py-1 text-[12px] text-[var(--app-smoke)]">
            Coming later
          </span>
        ) : row.href && row.action ? (
          <Link href={row.href}>
            <AppButton variant="ghost">{row.action}</AppButton>
          </Link>
        ) : null}
      </div>
    );
  }

  if (row.control === 'button' && row.href) {
    return (
      <Link href={row.href}>
        <AppButton variant="ghost">{row.action}</AppButton>
      </Link>
    );
  }

  if (row.control === 'button' && row.action) {
    return (
      <AsyncActionButton
        variant="ghost"
        successLabel="Done"
        onAction={async () => {
          await new Promise((r) => setTimeout(r, 420));
        }}
      >
        {row.action}
      </AsyncActionButton>
    );
  }

  return null;
}

export function DashboardSettingsView({
  email,
  plan = 'free',
  profileSlug,
  isPublic = false,
  hasPassword = true,
  googleConnected = false,
  githubConnected = false,
  signOutAction,
  accountControls = 'demo',
  deletionAuth = { hasPassword: true, oauthProvider: null },
  openDeletionOnMount = false,
}: {
  email?: string;
  plan?: AccountPlanId;
  profileSlug?: string | null;
  isPublic?: boolean;
  hasPassword?: boolean;
  googleConnected?: boolean;
  githubConnected?: boolean;
  signOutAction?: () => Promise<void>;
  accountControls?: 'live' | 'demo';
  deletionAuth?: AccountDeletionAuthMode;
  openDeletionOnMount?: boolean;
}) {
  const [openId, setOpenId] = useState<string>(
    openDeletionOnMount ? 'security' : 'account',
  );
  const live = accountControls === 'live';
  const githubCanDisconnect = Boolean(
    (hasPassword || googleConnected) && githubConnected,
  );

  const sections = buildSections(
    {
      email,
      profileSlug:
        profileSlug ?? (live ? null : 'demo'),
      isPublic: live ? isPublic : true,
      plan,
      hasPassword: live ? hasPassword : true,
      googleConnected: live ? googleConnected : true,
      githubConnected: live ? githubConnected : false,
    },
    live,
  );

  const active = sections.find((s) => s.id === openId) ?? sections[0];

  return (
    <div className="cc-app-page cc-app-page--1040">
      <PageHeader
        title="Settings"
        description="Workspace preferences: sign-in, how you share, how your card looks, billing, and security."
      />

      <FadeInView delay={0}>
        <div className="grid gap-6 lg:grid-cols-[minmax(260px,300px)_1fr]">
          <nav className="flex flex-col gap-1" aria-label="Settings categories">
            {sections.map((section) => {
              const isOpen = openId === section.id;
              return (
                <div key={section.id} className="cc-settings-accordion-item">
                  <button
                    type="button"
                    onClick={(event) => {
                      setOpenId(section.id);
                      const item = event.currentTarget.closest('.cc-settings-accordion-item');
                      window.requestAnimationFrame(() => {
                        item?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                      });
                    }}
                    aria-expanded={isOpen}
                    aria-controls={`settings-panel-${section.id}`}
                    className={`cc-settings-nav-link ${isOpen ? 'cc-settings-nav-link--active' : ''}`}
                  >
                    <span className="cc-settings-nav-link__title">{section.title}</span>
                    <span className="cc-settings-nav-link__hint">{section.navHint}</span>
                  </button>
                  {isOpen ? (
                    <div
                      id={`settings-panel-${section.id}`}
                      className="cc-settings-accordion-panel"
                    >
                      <AppCard reactive={false} className="!mt-2 !rounded-[16px] !p-4 sm:!p-5">
                        <AppMono>{section.eyebrow}</AppMono>
                        <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.025em] text-[var(--app-ink)]">
                          {section.title}
                        </h2>
                        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--app-smoke)]">
                          {section.description}
                        </p>
                        <ul className="mt-5 divide-y divide-[var(--app-border)]">
                          {section.rows.map((row) => (
                            <li
                              key={row.label}
                              className="flex flex-wrap items-center justify-between gap-4 py-4"
                            >
                              <div className="min-w-0">
                                <span className="text-[14px] font-medium text-[var(--app-ink)]">
                                  {row.label}
                                </span>
                                {row.hint ? (
                                  <p className="mt-0.5 text-[12px] leading-snug text-[var(--app-smoke)]">
                                    {row.hint}
                                  </p>
                                ) : null}
                              </div>
                              <RowActions
                                row={row}
                                live={live}
                                email={email}
                                deletionAuth={deletionAuth}
                                openDeletionOnMount={openDeletionOnMount}
                                githubConnected={githubConnected}
                                githubCanDisconnect={githubCanDisconnect}
                              />
                            </li>
                          ))}
                        </ul>
                        {signOutAction && section.id === 'account' ? (
                          <form
                            action={signOutAction}
                            className="mt-5 border-t border-[var(--app-border)] pt-5"
                          >
                            <AppButton variant="ghost" type="submit">
                              Sign out
                            </AppButton>
                          </form>
                        ) : null}
                      </AppCard>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <AppCard reactive={false} className="cc-settings-desktop-panel">
            <AppMono>{active.eyebrow}</AppMono>
            <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.025em] text-[var(--app-ink)]">
              {active.title}
            </h2>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--app-smoke)]">
              {active.description}
            </p>

            <ul className="mt-6 divide-y divide-[var(--app-border)]">
              {active.rows.map((row) => (
                <li
                  key={row.label}
                  className="flex flex-wrap items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <span className="text-[14px] font-medium text-[var(--app-ink)]">
                      {row.label}
                    </span>
                    {row.hint ? (
                      <p className="mt-0.5 text-[12px] leading-snug text-[var(--app-smoke)]">
                        {row.hint}
                      </p>
                    ) : null}
                  </div>
                  <RowActions
                    row={row}
                    live={live}
                    email={email}
                    deletionAuth={deletionAuth}
                    openDeletionOnMount={openDeletionOnMount}
                    githubConnected={githubConnected}
                    githubCanDisconnect={githubCanDisconnect}
                  />
                </li>
              ))}
            </ul>

            {signOutAction ? (
              <form
                action={signOutAction}
                className="mt-6 border-t border-[var(--app-border)] pt-6"
              >
                <AppButton variant="ghost" type="submit">
                  Sign out
                </AppButton>
              </form>
            ) : null}
          </AppCard>
        </div>
      </FadeInView>
    </div>
  );
}
