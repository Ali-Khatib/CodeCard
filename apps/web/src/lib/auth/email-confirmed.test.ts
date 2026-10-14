import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  EMAIL_CONFIRMED_TITLE,
  NEW_ACCOUNT_SETUP_GUIDE,
} from '@/lib/auth/email-confirmed';

const webSrc = join(process.cwd(), 'src');

describe('email confirmed setup guide', () => {
  it('names concrete dashboard destinations for new accounts', () => {
    expect(EMAIL_CONFIRMED_TITLE).toBe('Email confirmed');
    expect(NEW_ACCOUNT_SETUP_GUIDE.length).toBeGreaterThanOrEqual(5);
    expect(NEW_ACCOUNT_SETUP_GUIDE.map((s) => s.href)).toEqual(
      expect.arrayContaining([
        '/dashboard/profile',
        '/dashboard/projects/new',
        '/dashboard/connections',
        '/dashboard/circle',
        '/dashboard',
      ]),
    );
  });

  it('signup confirmation emails redirect through callback into the confirmed page', () => {
    const signUp = readFileSync(join(webSrc, 'app/sign-up/page.tsx'), 'utf8');
    expect(signUp).toContain("authCallbackRedirectUrl('/auth/confirmed')");
    expect(signUp).not.toContain("authCallbackRedirectUrl('/dashboard')");
  });

  it('renders a confirmed page with sign-in and setup guide', () => {
    const page = readFileSync(join(webSrc, 'app/auth/confirmed/page.tsx'), 'utf8');
    expect(page).toContain('auth-email-confirmed');
    expect(page).toContain('auth-confirmed-sign-in');
    expect(page).toContain('auth-confirmed-setup-guide');
    expect(page).toContain('/sign-in?redirect=%2Fdashboard');
  });
});
