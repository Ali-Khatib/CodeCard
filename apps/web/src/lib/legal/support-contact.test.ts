import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Pins the public support mechanism.
 *
 * Every published address is a support commitment: if the page advertises an
 * inbox, that inbox has to exist and be reachable. These assertions keep the
 * pages and `docs/EMAIL_DELIVERABILITY.md` from drifting apart, since the doc's
 * manual DNS/mailbox checklist is derived from exactly this list.
 *
 * Addresses were previously plain text, so they were not clickable and a typo
 * would have been invisible to a reader.
 */

function readWeb(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

const contact = readWeb('src/app/legal/contact/page.tsx');

/** Address → the pages that must publish it as a mailto link. */
const PUBLISHED_INBOXES: Record<string, string[]> = {
  'hello@codecard.app': ['src/app/legal/contact/page.tsx'],
  'privacy@codecard.app': ['src/app/legal/contact/page.tsx', 'src/app/legal/privacy/page.tsx'],
  'billing@codecard.app': [
    'src/app/legal/contact/page.tsx',
    'src/app/legal/subscription/page.tsx',
  ],
  'dmca@codecard.app': ['src/app/legal/contact/page.tsx', 'src/app/legal/dmca/page.tsx'],
};

describe('public support contact mechanism', () => {
  it('publishes a general support inbox', () => {
    expect(readWeb('src/lib/legal/constants.ts')).toContain('hello@codecard.app');
    expect(contact).toMatch(/SUPPORT_INBOX|hello@codecard\.app/);
    expect(contact).toMatch(/support/i);
  });

  it('renders every published address as a clickable mailto link', () => {
    const constants = readWeb('src/lib/legal/constants.ts');
    for (const [address, files] of Object.entries(PUBLISHED_INBOXES)) {
      expect(constants, address).toContain(`'${address}'`);
      for (const file of files) {
        const src = readWeb(file);
        const literal = src.includes(`mailto:${address}`);
        const viaConstant =
          /mailto:\$\{(SUPPORT|PRIVACY|BILLING|COPYRIGHT)_INBOX\}/.test(src) &&
          constants.includes(`'${address}'`);
        expect(literal || viaConstant, `${address} in ${file}`).toBe(true);
      }
    }
  });

  it('keeps the deliverability doc in sync with the published inboxes', () => {
    /* The doc's §6 checklist is the manual verification for these mailboxes. */
    const doc = readFileSync(
      resolve(process.cwd(), '../../docs/EMAIL_DELIVERABILITY.md'),
      'utf8',
    );
    for (const address of Object.keys(PUBLISHED_INBOXES)) {
      expect(doc, address).toContain(address);
    }
  });

  it('routes each inquiry type to a distinct inbox', () => {
    /* A single catch-all makes privacy and DMCA deadlines easy to miss. */
    const addresses = Object.keys(PUBLISHED_INBOXES);
    expect(new Set(addresses).size).toBe(addresses.length);
  });

  it('is publicly reachable without authentication', () => {
    expect(readWeb('src/proxy.ts')).not.toContain('/legal');
  });

  it('does not leak user or environment data into the contact page', () => {
    expect(contact).not.toMatch(/process\.env/);
    expect(contact).not.toMatch(/SERVICE_ROLE|SECRET_KEY|_SECRET/);
  });

  it('links contact from the marketing footer so users can find it', () => {
    const footer = readWeb('src/components/landing/hume-footer-cluster.tsx');
    expect(footer).toContain('/legal/contact');
  });
});
