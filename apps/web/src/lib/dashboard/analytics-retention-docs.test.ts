import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readRepo(rel: string) {
  return readFileSync(resolve(process.cwd(), '../..', rel), 'utf8');
}

function readWeb(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS08-T012 analytics retention documentation', () => {
  it('documents 90-day raw analytics retention and aligns privacy text', () => {
    const retentionPath = resolve(process.cwd(), '../../docs/ANALYTICS_RETENTION.md');
    const runbookPath = resolve(process.cwd(), '../../docs/RUNBOOK.md');
    const retention = readRepo('docs/ANALYTICS_RETENTION.md');
    const runbook = readRepo('docs/RUNBOOK.md');
    const privacy = readWeb('src/app/legal/privacy/page.tsx');
    const security = readRepo('docs/SECURITY_CHECKLIST.md');

    expect(existsSync(retentionPath)).toBe(true);
    expect(existsSync(runbookPath)).toBe(true);

    expect(retention).toContain('up to 90 days');
    expect(retention).toContain('analytics_events');
    expect(retention).toContain('public_profile_events');
    expect(retention).toContain('project_view_events');
    expect(retention).toContain('Dry-run');
    expect(retention).toContain('No automated cleanup job was added or executed');
    expect(retention).not.toContain('12 months');
    expect(retention).toContain('billing_events');
    expect(retention).toContain('WS10');

    expect(runbook).toContain('ANALYTICS_RETENTION.md');
    expect(runbook).toContain('up to 90 days');
    expect(runbook).toContain('Backup retention');

    expect(privacy).toContain('up to 90 days');
    expect(privacy).not.toContain('12 months');
    expect(privacy).toContain('fingerprinting');
    expect(privacy).toContain('User-Agent');

    expect(security).toContain('ANALYTICS_RETENTION.md');
    expect(security).toContain('up to 90 days');
  });

  it('does not introduce cleanup automation or secrets in retention docs', () => {
    const retention = readRepo('docs/ANALYTICS_RETENTION.md');
    expect(retention).not.toMatch(/service_role|SERVICE_ROLE|sk_live|eyJhbGci/i);
    expect(retention).toContain('Automation status (deferred)');
    expect(retention).toContain('Vercel Cron');
    expect(retention).toContain('Not present');
  });
});
