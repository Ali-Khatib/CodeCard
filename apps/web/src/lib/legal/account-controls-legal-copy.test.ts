import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS10-T009 account controls legal copy', () => {
  const privacy = read('src/app/legal/privacy/page.tsx');
  const terms = read('src/app/legal/terms/page.tsx');
  const footer = read('src/components/landing/hume-footer-cluster.tsx');
  const siteFooter = read('src/components/site-footer.tsx');
  const legalPage = read('src/components/legal-page.tsx');

  it('privacy page documents in-app export and deletion accurately', () => {
    const privacyFlat = privacy.replace(/\s+/g, ' ');

    expect(privacy).toContain('Data export');
    expect(privacy).toContain('Account deletion');
    expect(privacy).toContain('in-app');
    expect(privacy).toContain('structured JSON');
    expect(privacy).toContain('Settings');
    expect(privacy).toContain('DELETE');
    expect(privacy).toContain('reauthentication');
    expect(privacy).toContain('Stripe');
    expect(privacyFlat).toContain('anonymize');
    expect(privacyFlat).toContain('privacy-safe deletion record');
    expect(privacy).toContain('temporarily unavailable');
    expect(privacy).toContain('asynchronously');
    expect(privacy).toContain('up to 90 days');
    expect(privacy).toContain('privacy@codecard.app');
    expect(privacyFlat).toContain(
      'Technical/product copy alignment completed — attorney review pending.',
    );

    expect(privacyFlat).toContain('not packaged as a ZIP or binary archive');
    expect(privacyFlat).not.toMatch(/\bZIP\b(?! or binary archive)/);
    expect(privacy).not.toMatch(/attorney approved|legally approved|GDPR compliant|CCPA compliant/i);
    expect(privacy).not.toContain('WS10');
    expect(privacy).not.toContain('service-role');
    expect(privacy).not.toContain('analytics_events');
  });

  it('terms page matches implemented account controls', () => {
    const termsFlat = terms.replace(/\s+/g, ' ');

    expect(terms).toContain('Account data export and deletion');
    expect(terms).toContain('structured JSON');
    expect(terms).toContain('Settings');
    expect(terms).toContain('reauthentication');
    expect(termsFlat).toContain('cancels it as part of a successful deletion');
    expect(terms).toContain('Privacy Policy');
    expect(terms).toContain('temporarily unavailable');
    expect(termsFlat).toContain(
      'Technical/product copy alignment completed — attorney review pending.',
    );
    expect(terms).not.toContain('by contacting support');
    expect(terms).not.toMatch(/attorney approved|GDPR compliant|CCPA compliant/i);
    expect(termsFlat).not.toMatch(/download.*ZIP|ZIP export|export.*ZIP/i);
    expect(terms).not.toContain('WS10');
  });

  it('keeps legal navigation links and accessible headings', () => {
    expect(privacy).toContain('<h2>');
    expect(terms).toContain('<h2>');
    expect(privacy).toContain("title: 'Privacy Policy'");
    expect(terms).toContain("title: 'Terms of Service'");
    expect(legalPage).toContain('<h1');
    expect(legalPage).toContain('Last updated:');
    expect(footer).toContain("/legal/privacy");
    expect(footer).toContain("/legal/terms");
    expect(siteFooter).toContain("/legal/privacy");
    expect(privacy).not.toContain('onClick');
    expect(privacy).not.toContain('/api/account/delete');
    expect(terms).not.toContain('/api/account/delete');
  });

  it('does not claim hosted binary export or unsupported controls', () => {
    expect(privacy).toContain('not packaged as a ZIP or binary archive');
    expect(privacy).toContain('not a bulk download of hosted file bytes');
    expect(privacy).not.toContain('delete button');
    expect(terms).not.toContain('delete button');
  });
});
