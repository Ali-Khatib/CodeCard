import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LEGAL_LAST_UPDATED } from './constants';

function readWeb(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

function readRepo(rel: string) {
  return readFileSync(resolve(process.cwd(), '../..', rel), 'utf8');
}

describe('production-hardening legal and claim safety', () => {
  const privacy = readWeb('src/app/legal/privacy/page.tsx');
  const terms = readWeb('src/app/legal/terms/page.tsx');
  const dmca = readWeb('src/app/legal/dmca/page.tsx');
  const cookies = readWeb('src/app/legal/cookies/page.tsx');
  const security = readWeb('src/app/legal/security/page.tsx');
  const signUp = readWeb('src/app/sign-up/page.tsx');
  const nextConfig = readWeb('next.config.ts');

  it('does not invent a registered DMCA agent or legal entity', () => {
    expect(dmca).not.toMatch(/Our designated DMCA agent/i);
    expect(dmca).not.toContain('CodeCard, Inc.');
    expect(dmca).toContain('[COMPANY LEGAL NAME]');
    expect(dmca).toContain('[DESIGNATED AGENT NAME IF REGISTERED]');
    expect(dmca).toContain('not published a registered DMCA designated agent');
    expect(dmca).toMatch(/do not automatically delete|not deleted automatically/i);
  });

  it('does not make unsupported compliance claims', () => {
    for (const src of [privacy, terms, dmca, cookies, security]) {
      expect(src).not.toMatch(/GDPR compliant|CCPA compliant|ADA compliant|WCAG certified/i);
      expect(src).not.toMatch(/100% secure|guaranteed secure|legally compliant/i);
      expect(src).not.toMatch(/COPPA compliant/i);
    }
  });

  it('states children are not the intended audience without inventing COPPA certification', () => {
    expect(privacy).toMatch(/children under/);
    expect(privacy).toContain('MINIMUM_ACCOUNT_AGE_YEARS');
    expect(privacy).toContain('not a COPPA');
    expect(terms).toContain('MINIMUM_ACCOUNT_AGE_YEARS');
    expect(signUp).toContain('AuthSignupConsent');
    expect(signUp).toContain('acceptedTerms');
  });

  it('discloses that CodeCard does not currently send content to AI providers', () => {
    expect(privacy).toMatch(/does not currently send your profile content/i);
    expect(terms).toMatch(/does not currently generate profile content/i);
  });

  it('classifies cookies without adding a fake marketing banner', () => {
    expect(cookies).toContain('Essential');
    expect(cookies).toContain('Analytics');
    expect(cookies).toContain('Marketing');
    expect(cookies).toMatch(/does not show a marketing\s+cookie popup/);
    expect(cookies).toContain('Session storage');
    expect(privacy).toContain('Session storage');
    expect(privacy).toContain('not offered as an MVP sign-in');
    expect(privacy).toContain('does not send profile URLs to a');
    expect(readWeb('src/app/layout.tsx')).not.toMatch(/Accept all cookies|CookieConsentBanner/i);
  });

  it('publishes a security contact without inventing security@', () => {
    expect(security).toContain('hello@codecard.app');
    expect(security).not.toContain('security@codecard.app');
    expect(security).toContain('does not currently offer a paid bug-bounty');
  });

  it('redirects common legal URLs to canonical /legal pages', () => {
    expect(nextConfig).toContain("source: '/privacy'");
    expect(nextConfig).toContain("destination: '/legal/privacy'");
    expect(nextConfig).toContain("source: '/copyright'");
    expect(nextConfig).toContain("destination: '/legal/dmca'");
    expect(nextConfig).toContain("source: '/cookies'");
    expect(nextConfig).toContain("source: '/security'");
  });

  it('keeps legal last-updated dates on the shared constant', () => {
    expect(privacy).toContain('LEGAL_LAST_UPDATED');
    expect(terms).toContain('LEGAL_LAST_UPDATED');
    expect(LEGAL_LAST_UPDATED.length).toBeGreaterThan(8);
  });

  it('documents security and privacy data map without certification language', () => {
    const securityDoc = readRepo('docs/security.md');
    const dataMap = readRepo('docs/privacy-data-map.md');
    expect(securityDoc).toContain('Authentication model');
    expect(securityDoc).toContain('RLS');
    expect(securityDoc).not.toMatch(/fully compliant|GDPR certified|ADA compliant/i);
    expect(dataMap).toContain('Email');
    expect(dataMap).toContain('LEGAL REVIEW');
    expect(readRepo('docs/LAUNCH_CHECKLIST.md')).toContain('[COMPANY LEGAL NAME]');
    expect(readRepo('docs/LAUNCH_CHECKLIST.md')).toContain('[DESIGNATED AGENT NAME IF REGISTERED]');
  });
});
