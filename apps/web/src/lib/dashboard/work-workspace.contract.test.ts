import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('Work workspace', () => {
  it('keeps Projects and Research inside Your Work without new nav items', () => {
    const shell = read('src/components/dashboard/dashboard-shell.tsx');
    const work = read('src/components/dashboard/dashboard-your-work-view.tsx');
    const navMatch = shell.match(/const NAV_ITEMS = \[([\s\S]*?)\] as const/);
    expect(navMatch).toBeTruthy();
    expect(navMatch![1]).toContain("label: 'Your Work'");
    expect(navMatch![1]).not.toContain("label: 'Projects'");
    expect(navMatch![1]).not.toContain("label: 'Research'");
    expect(work).toContain('id="projects"');
    expect(work).toContain('id="research"');
    expect(work).toContain('What appears on your CodeCard');
  });

  it('uses a single empty workspace with project primary and research secondary', () => {
    const work = read('src/components/dashboard/dashboard-your-work-view.tsx');
    const copy = read('src/lib/dashboard/empty-state-copy.ts');
    expect(copy).toContain("title: 'Build your CodeCard'");
    expect(work).toContain('EMPTY_STATE_COPY.work.title');
    expect(work).toContain('emptyWorkspace');
    expect(work).toContain("variant=\"primary\"");
    expect(work).toContain('workspaceCreateProjectHref(basePath)');
    expect(work).toContain('workspaceCreateResearchHref(basePath)');
  });

  it('keeps existing create and edit routes as the Work entry points', () => {
    const workPage = read('src/app/dashboard/(authenticated)/work/page.tsx');
    const portfolio = read('src/components/dashboard/dashboard-projects-portfolio.tsx');
    const research = read('src/components/dashboard/dashboard-research-view.tsx');
    expect(workPage).toContain("basePath=\"/dashboard\"");
    expect(portfolio).toContain('workspaceCreateProjectHref');
    expect(research).toContain('workspaceCreateResearchHref');
    expect(research).toContain('workspaceResearchEditHref');
  });

  it('explains the public CodeCard relationship without embedding the public UI', () => {
    const work = read('src/components/dashboard/dashboard-your-work-view.tsx');
    const stack = read('src/components/dashboard/projects-vertical-stack.tsx');
    expect(work).toContain('View public CodeCard');
    expect(work).toContain('publicDemoProfileBasePath');
    expect(work).not.toContain('chroma-work-section');
    expect(stack).toContain('Appears on your public CodeCard');
  });
});
