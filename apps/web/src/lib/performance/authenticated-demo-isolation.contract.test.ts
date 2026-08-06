import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const WEB = resolve(process.cwd());

function walk(dir: string, files: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (/\.(tsx|ts)$/.test(name)) files.push(full);
  }
  return files;
}

describe('authenticated dashboard isolation from Alex Chen demo', () => {
  it('does not import demo fixtures into authenticated dashboard routes', () => {
    const root = resolve(WEB, 'src/app/dashboard/(authenticated)');
    const files = walk(root);
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      expect(src, file).not.toMatch(/from ['"]@\/lib\/projects\/demo-data['"]/);
      expect(src, file).not.toMatch(/from ['"]@\/lib\/dashboard\/workspace-demo['"]/);
      expect(src, file).not.toMatch(/from ['"]@\/lib\/research\/demo-data['"]/);
      expect(src, file).not.toContain('Alex Chen');
      expect(src, file).not.toContain('DEMO_PROFILE');
      expect(src, file).not.toContain('DEMO_FEATURED_PROJECTS');
      expect(src, file).not.toContain('DEMO_WORKSPACE');
    }
  });

  it('keeps My Profile out of the workspace sidebar nav', () => {
    const shell = readFileSync(resolve(WEB, 'src/components/dashboard/dashboard-shell.tsx'), 'utf8');
    expect(shell).not.toMatch(/label:\s*['"]My Profile['"]/);
    expect(shell).toContain("label: 'Home'");
    expect(shell).toContain("label: 'Projects'");
  });
});
