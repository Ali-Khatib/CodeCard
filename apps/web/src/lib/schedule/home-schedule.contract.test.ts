import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('Home calendar and follow-ups', () => {
  it('keeps events on Home without a seventh nav tab', () => {
    const shell = read('src/components/dashboard/dashboard-shell.tsx');
    const overview = read('src/components/dashboard/dashboard-overview-view.tsx');
    const page = read('src/app/dashboard/(authenticated)/page.tsx');
    expect(shell).not.toContain("label: 'Events'");
    expect(shell).not.toContain("label: 'Calendar'");
    expect(overview).toContain('HomeScheduleSection');
    expect(overview).toContain('HomeIdentitySection');
    expect(page).toContain('loadHomeSchedule');
    const calendar = read('src/components/dashboard/home-schedule-section.tsx');
    expect(calendar).toContain('cc-home-calendar');
    expect(calendar).toContain('data-calendar-day');
    expect(calendar).toContain('updateOwnerEventAction');
    expect(calendar).toContain('Follow-up');
  });

  it('stores owner events privately and follow-ups on connections', () => {
    const sql = read('../../supabase/migrations/20260919160000_owner_events_and_follow_ups.sql');
    expect(sql).toContain('CREATE TABLE public.owner_events');
    expect(sql).toContain('FORCE ROW LEVEL SECURITY');
    expect(sql).toContain('owner_events_owner');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS follow_up_at');
    expect(sql).toContain('REVOKE ALL ON TABLE public.owner_events FROM anon');
  });
});
