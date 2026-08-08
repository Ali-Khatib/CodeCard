import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { joinDescribedBy } from '@/lib/a11y/described-by';

const WEB = resolve(process.cwd());

function read(rel: string) {
  return readFileSync(resolve(WEB, 'src', rel), 'utf8');
}

/**
 * WS12-T003 — Validation-error accessibility contracts.
 * Associate field errors via aria-invalid / aria-describedby; join help+error ids.
 * Automated axe CI remains deferred to WS12-T011 / WS14.
 */
describe('WS12-T003 validation-error accessibility', () => {
  describe('joinDescribedBy', () => {
    it('joins truthy id tokens and omits empty values', () => {
      expect(joinDescribedBy('a', 'b')).toBe('a b');
      expect(joinDescribedBy('help', false, null, undefined, 'error')).toBe('help error');
      expect(joinDescribedBy('only')).toBe('only');
    });

    it('returns undefined when nothing remains', () => {
      expect(joinDescribedBy()).toBeUndefined();
      expect(joinDescribedBy(false, null, undefined, '')).toBeUndefined();
    });
  });

  it('AuthField already wires aria-invalid and describedby to an error id', () => {
    const source = read('components/auth/auth-field.tsx');
    expect(source).toContain('aria-invalid={error ? true : undefined}');
    expect(source).toContain('const errorId = `${inputId}-error`');
    expect(source).toContain('aria-describedby=');
    expect(source).toContain('id={errorId}');
  });

  it('project-form uses joinDescribedBy and aria-invalid on fields', () => {
    const source = read('components/dashboard/project-form.tsx');
    expect(source).toContain("import { joinDescribedBy } from '@/lib/a11y/described-by'");
    expect(source).toContain('joinDescribedBy(');
    expect(source).toContain('aria-invalid={Boolean(fieldErrors.title)}');
    expect(source).toContain('aria-invalid={Boolean(fieldErrors.slug)}');
    expect(source).toContain('id="project-slug-error"');
  });

  it('research-form associates help+error via joinDescribedBy and marks invalid fields', () => {
    const source = read('components/dashboard/research-form.tsx');
    expect(source).toContain("import { joinDescribedBy } from '@/lib/a11y/described-by'");
    expect(source).toContain('joinDescribedBy(');
    expect(source).toContain('fieldErrors.year ? `${formId}-year-error`');
    expect(source).toContain('fieldErrors.doi_url ? `${formId}-doi-error`');
    expect(source).toContain('fieldErrors.pdf_url ? `${formId}-pdf-url-error`');
    expect(source).toContain('fieldErrors.slug ? `${formId}-slug-error`');
    expect(source).toContain('aria-invalid={Boolean(fieldErrors.venue)}');
    expect(source).toContain('aria-invalid={Boolean(fieldErrors.publication_status)}');
    expect(source).toContain('aria-invalid={Boolean(fieldErrors.citation_text)}');
    expect(source).toContain('aria-invalid={Boolean(fieldErrors.authors)}');
    expect(source).toContain('focusResearchField(formId, validation.field)');
    expect(source).toContain('focusResearchField(formId, firstKey)');
  });

  it('profile-editor associates slug and display_name errors', () => {
    const source = read('components/profile-editor.tsx');
    expect(source).toContain('aria-invalid={Boolean(fieldErrors.display_name)}');
    expect(source).toContain('aria-describedby={fieldErrors.display_name ? \'display_name-error\' : undefined}');
    expect(source).toContain('id="display_name-error"');
    expect(source).toContain('aria-invalid={Boolean(fieldErrors.slug)}');
    expect(source).toContain('aria-describedby={fieldErrors.slug ? \'slug-error\' : undefined}');
    expect(source).toContain('id="slug-error"');
    expect(source).toContain('focusProfileField(parsed.field)');
  });

  it('public-report reason select associates the empty-reason alert', () => {
    const source = read('components/moderation/public-report-dialog.tsx');
    expect(source).toMatch(
      /aria-invalid=\{reasonInvalid \? true : undefined\}|aria-invalid=\{reasonInvalid \|\| undefined\}/,
    );
    expect(source).toContain('aria-describedby={reasonInvalid ? reasonErrorId : undefined}');
    expect(source).toContain('id={reasonErrorId}');
    expect(source).toContain('reasonSelectRef.current?.focus()');
  });

  it('account-deletion associates confirmation/password inputs with the alert', () => {
    const source = read('components/dashboard/account-deletion-dialog.tsx');
    expect(source).toContain("invalidField === 'confirmation'");
    expect(source).toContain("invalidField === 'password'");
    expect(source).toContain('aria-describedby={');
    expect(source).toContain('id={errorId}');
    expect(source).toContain('confirmInputRef.current?.focus()');
    expect(source).toContain('passwordInputRef.current?.focus()');
  });
});
