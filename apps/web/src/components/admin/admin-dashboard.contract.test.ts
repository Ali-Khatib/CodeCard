import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const web = resolve(__dirname, '../../..');
const read = (relative: string) => readFileSync(resolve(web, relative), 'utf8');

describe('WS13-T003 admin dashboard contracts', () => {
  const page = read('src/app/admin/page.tsx');
  const dashboard = read('src/components/admin/moderation-dashboard.tsx');
  const loading = read('src/app/admin/loading.tsx');

  it('authorizes before fetching through the T002 readers', () => {
    const gate = page.indexOf('await enforceGlobalAdminAccess()');
    const reports = page.indexOf('listModerationReports(reportsQuery.data)');
    const dmca = page.indexOf('listDmcaNotices(dmcaQuery.data)');

    expect(gate).toBeGreaterThanOrEqual(0);
    expect(reports).toBeGreaterThan(gate);
    expect(dmca).toBeGreaterThan(gate);
    expect(page).not.toContain("from('moderation_reports')");
    expect(page).not.toContain("from('dmca_notices')");
    expect(page).not.toContain('createServiceClient');
    expect(page).not.toContain('createClient');
  });

  it('forces private dynamic rendering and safe query validation', () => {
    expect(page).toContain("dynamic = 'force-dynamic'");
    expect(page).toContain('revalidate = 0');
    expect(page).toContain('moderationReportListQuerySchema.safeParse');
    expect(page).toContain('dmcaNoticeListQuerySchema.safeParse');
    expect(page).toContain('These filters are invalid');
  });

  it('contains no synthetic or demo moderation fallback', () => {
    expect(page).not.toMatch(/DEMO_|fixture|mockReport/i);
    expect(dashboard).not.toMatch(/DEMO_|Alex Chen|fixture/i);
  });

  it('provides labelled sections, filters, status text, and navigation', () => {
    expect(dashboard).toContain('aria-labelledby="reports-heading"');
    expect(dashboard).toContain('aria-labelledby="dmca-heading"');
    expect(dashboard).toContain('<label');
    expect(dashboard).toContain('Status: {humanize(status)}');
    expect(dashboard).toContain('aria-label={label}');
    expect(dashboard).toContain('min-h-11');
  });

  it('provides announced loading and error states', () => {
    expect(loading).toContain('aria-busy="true"');
    expect(loading).toContain('aria-live="polite"');
    expect(dashboard).toContain('role="alert"');
    expect(dashboard).toContain('No reports match these filters.');
    expect(dashboard).toContain('No DMCA notices match this filter.');
    expect(dashboard).toContain('Reports could not be loaded. Please try again.');
    expect(dashboard).toContain('DMCA notices could not be loaded. Please try again.');
    expect(dashboard).not.toMatch(/error\.message|JSON\.stringify\(error\)/);
  });

  it('renders only T002 DTO fields and guards external notice links', () => {
    expect(dashboard).toContain('reasonPreview');
    expect(dashboard).toContain('copyrightedWorkPreview');
    expect(dashboard).toContain('toSafeHttpHref');
    expect(dashboard).not.toMatch(/claimantEmail|reporterUserId|legalStatement|signature/);
  });
});
