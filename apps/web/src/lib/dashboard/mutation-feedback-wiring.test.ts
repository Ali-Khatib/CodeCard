import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS09-T012 mutation feedback wiring', () => {
  it('mounts MutationFeedbackProvider once in DashboardShell', () => {
    const shell = read('src/components/dashboard/dashboard-shell.tsx');
    const provider = read('src/components/dashboard/mutation-feedback-provider.tsx');
    const css = read('src/styles/codecard-app-system.css');

    expect(shell).toContain('MutationFeedbackProvider');
    expect(shell.match(/<MutationFeedbackProvider>/g)?.length).toBe(1);
    expect(shell.match(/<\/MutationFeedbackProvider>/g)?.length).toBe(1);
    expect(provider).toContain("role={isError ? 'alert' : 'status'}");
    expect(provider).toContain("aria-live={isError ? 'assertive' : 'polite'}");
    expect(provider).toContain('Dismiss notification');
    expect(provider).toContain('DEDUPE_WINDOW_MS');
    expect(css).toContain('.cc-mutation-toast-region');
    expect(css).toContain('overflow-wrap: anywhere');
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).toContain('safe-area-inset-bottom');
  });

  it('wires profile save and publish feedback', () => {
    const editor = read('src/components/profile-editor.tsx');
    const publish = read('src/components/profile/profile-publish-controls.tsx');
    const links = read('src/components/profile/profile-links-editor.tsx');
    const avatar = read('src/components/dashboard/avatar-upload.tsx');

    expect(editor).toContain('notifySuccess(MUTATION_FEEDBACK.profile.saved)');
    expect(editor).toContain('MUTATION_FEEDBACK.profile.saveFailed');
    expect(editor).not.toContain('Profile saved.');
    expect(publish).toContain('MUTATION_FEEDBACK.profile.published');
    expect(publish).toContain('MUTATION_FEEDBACK.profile.unpublished');
    expect(links).toContain('MUTATION_FEEDBACK.profile.linkAdded');
    expect(links).toContain('MUTATION_FEEDBACK.profile.linkDeleted');
    expect(avatar).toContain('MUTATION_FEEDBACK.profile.photoUpdated');
    expect(avatar).toContain('!result.cancelled');
  });

  it('wires project create/update/publish/delete feedback', () => {
    const form = read('src/components/dashboard/project-form.tsx');
    const publish = read('src/components/dashboard/project-publish-controls.tsx');
    const del = read('src/components/dashboard/project-delete-dialog.tsx');

    expect(form).toContain('MUTATION_FEEDBACK.project.created');
    expect(form).toContain('MUTATION_FEEDBACK.project.saved');
    expect(publish).toContain('publishProjectAction');
    expect(publish).toContain('MUTATION_FEEDBACK.project.published');
    expect(publish).toContain('MUTATION_FEEDBACK.project.unpublished');
    expect(del).toContain('MUTATION_FEEDBACK.project.deleted');
    expect(del).toContain('notifySuccess(MUTATION_FEEDBACK.project.deleted)');
    expect(form).not.toContain('Project saved.');
  });

  it('wires research create/update/publish/delete/figure feedback', () => {
    const form = read('src/components/dashboard/research-form.tsx');
    const publish = read('src/components/dashboard/research-publish-controls.tsx');
    const del = read('src/components/dashboard/research-delete-dialog.tsx');
    const figures = read('src/components/dashboard/research-figure-manager.tsx');

    expect(form).toContain('MUTATION_FEEDBACK.research.created');
    expect(form).toContain('MUTATION_FEEDBACK.research.saved');
    expect(form).not.toContain('Research paper saved.');
    expect(publish).toContain('MUTATION_FEEDBACK.research.published');
    expect(publish).toContain('MUTATION_FEEDBACK.research.unpublished');
    expect(del).toContain('MUTATION_FEEDBACK.research.deleted');
    expect(figures).toContain('MUTATION_FEEDBACK.research.figureAdded');
    expect(figures).toContain('MUTATION_FEEDBACK.research.figureRemoved');
    expect(figures).toContain('MUTATION_FEEDBACK.research.figureOrderSaved');
  });

  it('wires Settings account export/delete outside the dashboard shell', () => {
    const shell = read('src/components/dashboard/dashboard-shell.tsx');
    const settings = read('src/components/dashboard/dashboard-settings-view.tsx');
    expect(shell).not.toContain('/api/account/export');
    expect(shell).not.toContain('/api/account/delete');
    expect(shell).not.toContain('cleanup-storage');
    expect(settings).toContain('AccountExportAction');
    expect(settings).toContain('AccountDeletionDialog');
  });
});
