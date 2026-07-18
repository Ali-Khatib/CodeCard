import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const WEB = resolve(process.cwd());

function read(rel: string) {
  return readFileSync(resolve(WEB, 'src', rel), 'utf8');
}

describe('WS12-T010 accessible dialogs contracts', () => {
  it('provides a shared confirm-panel a11y helper', () => {
    const hook = read('lib/a11y/use-confirm-panel-a11y.ts');
    expect(hook).toContain('initialFocus');
    expect(hook).toContain("'cancel'");
    expect(hook).toContain('Escape');
    expect(hook).toContain('triggerRef');
  });

  it('project delete uses alertdialog with cancel-first focus', () => {
    const source = read('components/dashboard/project-delete-dialog.tsx');
    expect(source).toContain('role="alertdialog"');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain('useConfirmPanelA11y');
    expect(source).toContain("initialFocus: 'cancel'");
    expect(source).toContain('data-confirm-cancel');
    expect(source.indexOf('data-confirm-cancel')).toBeLessThan(source.indexOf('Confirm delete'));
  });

  it('research delete uses alertdialog with cancel-first focus', () => {
    const source = read('components/dashboard/research-delete-dialog.tsx');
    expect(source).toContain('role="alertdialog"');
    expect(source).toContain('useConfirmPanelA11y');
    expect(source).toContain("initialFocus: 'cancel'");
  });

  it('figure delete uses alertdialog and disables pending actions', () => {
    const source = read('components/dashboard/research-figure-manager.tsx');
    expect(source).toContain('role="alertdialog"');
    expect(source).toContain('FigureDeleteConfirm');
    expect(source).toContain('disabled={pending}');
    expect(source).not.toMatch(/role="dialog"\s*\n\s*aria-labelledby=\{`delete-figure/);
  });

  it('unpublish confirms distinguish unpublish from deletion', () => {
    const project = read('components/dashboard/project-publish-controls.tsx');
    const research = read('components/dashboard/research-publish-controls.tsx');
    const profile = read('components/profile/profile-publish-controls.tsx');
    for (const source of [project, research, profile]) {
      expect(source).toContain('role="alertdialog"');
      expect(source).toMatch(/not\s+deletion/i);
      expect(source.indexOf('Cancel')).toBeLessThan(source.indexOf('Confirm unpublish'));
    }
  });

  it('account deletion and public report retain modal dialog semantics', () => {
    const account = read('components/dashboard/account-deletion-dialog.tsx');
    expect(account).toContain('role="dialog"');
    expect(account).toContain('aria-modal="true"');
    expect(account).toContain('Escape');
    const report = read('components/moderation/public-report-dialog.tsx');
    expect(report).toContain('<dialog');
    expect(report).toContain('showModal');
  });

  it('admin destructive actions keep window.confirm confirmations', () => {
    const actions = read('components/admin/report-actions.tsx');
    expect(actions).toContain('window.confirm');
  });
});
