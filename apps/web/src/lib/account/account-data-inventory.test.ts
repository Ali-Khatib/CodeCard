import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('WS10-T001 account data inventory', () => {
  const path = resolve(process.cwd(), '../../docs/account-data-inventory.md');

  it('exists and marks legal review as pending', () => {
    expect(existsSync(path)).toBe(true);
    const doc = readFileSync(path, 'utf8');
    expect(doc).toContain('Technical implementation map — legal review pending');
    expect(doc).toMatch(/legal review pending/i);
    expect(doc).toContain('has **not** been attorney-approved');
  });

  it('maps required tables and storage buckets', () => {
    const doc = readFileSync(path, 'utf8');
    for (const table of [
      'profiles',
      'profile_links',
      'projects',
      'project_media_assets',
      'research_papers',
      'research_figures',
      'analytics_events',
      'subscription_customers',
      'subscriptions',
      'saved_connections',
      'jobs',
    ]) {
      expect(doc).toContain(table);
    }
    expect(doc).toContain('avatars');
    expect(doc).toContain('project-media');
    expect(doc).toContain('private-docs');
    expect(doc).toContain('Aggregate only');
    expect(doc).toContain('WS04-T010');
    expect(doc).toContain('JSON only');
  });
});
