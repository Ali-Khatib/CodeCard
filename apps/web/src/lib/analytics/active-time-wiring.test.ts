import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS08-T009 visibility-aware time tracking wiring', () => {
  it('uses the shared hook on project and research detail pages', () => {
    const project = read('src/components/featured-work/project-detail-view.tsx');
    const research = read('src/components/research/research-paper-detail.tsx');
    const route = read('src/app/api/analytics/route.ts');

    expect(project).toContain('useActiveTimeTracking');
    expect(project).toContain("eventType: 'project_time_spent'");
    expect(project).not.toMatch(/Date\.now\(\) - startedAt/);

    expect(research).toContain('useActiveTimeTracking');
    expect(research).toContain("eventType: 'time_spent_on_research'");
    expect(research).not.toMatch(/Date\.now\(\) - startedAt/);

    expect(route).toContain('parseActiveTimeSeconds');
    expect(route).toContain('TIME_SPENT_EVENTS');
  });
});
