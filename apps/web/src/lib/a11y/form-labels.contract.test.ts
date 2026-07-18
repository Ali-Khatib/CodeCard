import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const WEB = resolve(process.cwd());

function read(rel: string) {
  return readFileSync(resolve(WEB, 'src', rel), 'utf8');
}

/**
 * WS12-T002 — Accessible form-label contracts.
 * Prefer visible labels / htmlFor over aria-label; no placeholder-only names.
 * Automated axe CI remains deferred to WS12-T011 / WS14.
 */
describe('WS12-T002 accessible form labels', () => {
  it('AuthField associates a visible label via htmlFor and stable ids', () => {
    const source = read('components/auth/auth-field.tsx');
    expect(source).toContain('htmlFor={inputId}');
    expect(source).toContain('id={inputId}');
    expect(source).toContain('useId()');
    expect(source).not.toMatch(/placeholder=\{?["'][^"']+["']\}?\s*\n\s*\/>/);
  });

  it('AuthPasswordField labels the input and names the show/hide control', () => {
    const source = read('components/auth/auth-password-field.tsx');
    expect(source).toContain('htmlFor={inputId}');
    expect(source).toMatch(/aria-label=\{[^}]*Show|Hide/);
    expect(source).toContain('aria-pressed');
  });

  it('settings branding switch exposes an accessible name', () => {
    const source = read('components/dashboard/dashboard-settings-view.tsx');
    expect(source).toContain('role="switch"');
    expect(source).toContain('aria-label={row.label}');
    expect(source).toContain('aria-checked={row.enabled}');
  });

  it('project form uses a visible Technologies label and group legends', () => {
    const source = read('components/dashboard/project-form.tsx');
    expect(source).toContain('htmlFor="project-technologies"');
    expect(source).toContain('id="project-technologies"');
    expect(source).toContain('aria-describedby="project-technologies-hint"');
    expect(source).not.toContain('aria-label="Add technology"');
    expect(source).toContain('<legend className="text-[13px] font-medium text-graphite">Domains</legend>');
    expect(source).toContain(
      '<legend className="text-[13px] font-medium text-graphite">Focus areas</legend>',
    );
    expect(source).toContain('aria-label={`Remove technology ${tech}`}');
  });

  it('profile editor pairs Label htmlFor with control ids', () => {
    const source = read('components/profile-editor.tsx');
    for (const id of ['display_name', 'headline', 'slug', 'bio', 'location', 'skills']) {
      expect(source).toContain(`htmlFor="${id}"`);
      expect(source).toContain(`id="${id}"`);
    }
  });

  it('avatar and project media file inputs keep labels and describe constraints', () => {
    const avatar = read('components/dashboard/avatar-upload.tsx');
    expect(avatar).toContain('htmlFor={inputId}');
    expect(avatar).toContain('Choose profile photo');
    expect(avatar).toContain('aria-describedby={`${inputId}-constraints`}');

    const media = read('components/dashboard/project-media-upload.tsx');
    expect(media).toContain('htmlFor={coverInputId}');
    expect(media).toContain('htmlFor={screenshotInputId}');
    expect(media).toContain('aria-describedby="project-media-constraints"');
    expect(media).toContain('id="project-media-constraints"');
  });

  it('research figures file input is labelled and describes constraints', () => {
    const source = read('components/dashboard/research-figure-manager.tsx');
    expect(source).toContain('htmlFor={inputId}');
    expect(source).toContain('Add figures');
    expect(source).toContain('aria-describedby={`${inputId}-constraints`}');
  });

  it('research authors use unique labelled ids per row', () => {
    const source = read('components/dashboard/research-form.tsx');
    expect(source).toContain('htmlFor={`${formId}-author-${index}`}');
    expect(source).toContain('id={`${formId}-author-${index}`}');
  });

  it('connections search and collection filter are labelled', () => {
    const source = read('components/dashboard/dashboard-connections-view.tsx');
    expect(source).toContain('aria-label="Search connections"');
    expect(source).toContain('htmlFor="connections-collection-filter"');
  });

  it('circle filter tablist has a group accessible name', () => {
    const circle = read('components/dashboard/authenticated-circle-view.tsx');
    expect(circle).toContain('ariaLabel="Circle feed filters"');
    const filterBar = read('components/dashboard/ui/dashboard-ui.tsx');
    expect(filterBar).toContain('role="tablist"');
    expect(filterBar).toContain('aria-label={ariaLabel}');
  });

  it('account deletion confirmation fields use htmlFor labels', () => {
    const source = read('components/dashboard/account-deletion-dialog.tsx');
    expect(source).toContain('htmlFor={confirmInputId}');
    expect(source).toContain('htmlFor={passwordInputId}');
  });

  it('public report and admin moderation note use wrapping labels', () => {
    const report = read('components/moderation/public-report-dialog.tsx');
    expect(report).toContain('<label className="grid gap-2 text-sm font-semibold">');
    const note = read('components/admin/moderation-note-editor.tsx');
    expect(note).toContain('<label className="grid gap-2 text-sm font-semibold">');
    expect(note).toContain('Private internal moderation note');
  });

  it('footer newsletter is not placeholder-only', () => {
    const source = read('components/landing/hume-footer-cluster.tsx');
    expect(source).toContain('htmlFor="footer-email"');
    expect(source).toContain('Email');
  });

  it('representative forms do not rely on placeholder as the only name source', () => {
    const files = [
      'components/auth/auth-field.tsx',
      'components/auth/auth-password-field.tsx',
      'components/profile-editor.tsx',
      'components/dashboard/project-form.tsx',
      'components/dashboard/research-form.tsx',
      'components/landing/hume-footer-cluster.tsx',
      'components/landing/morph-signup-cta.tsx',
    ];
    for (const file of files) {
      const source = read(file);
      // Every placeholder-bearing input in these files should also have id or aria-label nearby.
      const placeholders = [...source.matchAll(/placeholder=/g)];
      if (placeholders.length === 0) continue;
      expect(
        source.includes('htmlFor') ||
          source.includes('aria-label') ||
          /<label[\s>]/.test(source),
      ).toBe(true);
    }
  });
});
