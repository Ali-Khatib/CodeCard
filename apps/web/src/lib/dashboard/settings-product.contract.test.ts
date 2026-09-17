import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

const VIEW = 'src/components/dashboard/dashboard-settings-view.tsx';
const PAGE = 'src/app/dashboard/(authenticated)/settings/page.tsx';
const DEMO = 'src/app/demo/(workspace)/settings/page.tsx';
const BILLING = 'src/app/dashboard/(authenticated)/billing/page.tsx';
const SHELL = 'src/components/dashboard/dashboard-shell.tsx';

describe('Settings product contract', () => {
  it('keeps Settings as account configuration, not a second Home or extra nav item', () => {
    const shell = read(SHELL);
    const view = read(VIEW);
    expect(shell).toContain("label: 'Settings'");
    expect(shell).not.toContain("label: 'Billing'");
    expect(view).toContain("id: 'profile'");
    expect(view).toContain("id: 'account'");
    expect(view).toContain("id: 'billing'");
    expect(view).toContain("id: 'danger'");
    expect(view).not.toContain("id: 'sharing'");
    expect(view).not.toContain("id: 'branding'");
    expect(view).not.toContain("id: 'security'");
  });

  it('wires live profile visibility and billing without a second editor or Stripe rewrite', () => {
    const page = read(PAGE);
    const view = read(VIEW);
    const billing = read(BILLING);

    expect(page).toContain('accountControls="live"');
    expect(page).toContain('isPublic={Boolean(profile?.is_public)}');
    expect(page).toContain('resolveAccountPlanId');
    expect(view).toContain("href: profileEditorHref('visibility', live)");
    expect(view).toContain("href: profileEditorHref('photo', live)");
    expect(view).toContain('/dashboard/billing');
    expect(view).not.toContain('pro.codecard.app');

    expect(billing).toContain('createCheckout');
    expect(billing).toContain('openPortal');
    expect(billing).toContain('unlimited projects');
    expect(billing).toContain('are not included yet');
    expect(billing).toContain('are still planned');
  });

  it('exposes only account actions that exist', () => {
    const view = read(VIEW);
    const page = read(PAGE);
    expect(page).toContain('signOutAction={signOut}');
    expect(view).toContain('Sign out');
    expect(view).toContain('/forgot-password');
    expect(view).toContain('GithubConnectionAction');
    expect(view).toContain('AccountExportAction');
    expect(view).toContain('AccountDeletionDialog');
    expect(view).not.toContain('Two-factor authentication');
    expect(view).not.toContain('demoAction');
    expect(view).not.toContain('setTimeout');
  });

  it('keeps planned product capabilities honest and out of fake controls', () => {
    const view = read(VIEW);
    expect(view).toContain("label: 'Custom domain'");
    expect(view).toContain('not available yet');
    expect(view).toContain('Coming later');
    expect(view).not.toContain('Wallet passes');
    expect(view).not.toContain('NFC tags');
    expect(view).not.toContain('Remove CodeCard branding');
    expect(view).not.toContain('Color theme');
    expect(view).not.toContain('Available on Pro');
    expect(view).not.toContain('claim a custom domain');
    expect(view).not.toContain("control: 'toggle'");
  });

  it('keeps demo Settings on fixture controls', () => {
    const demo = read(DEMO);
    expect(demo).toContain('accountControls="demo"');
    expect(demo).toContain('Sample settings');
    expect(demo).not.toContain('/api/account/delete');
    expect(demo).not.toContain('signOutAction');
  });
});
