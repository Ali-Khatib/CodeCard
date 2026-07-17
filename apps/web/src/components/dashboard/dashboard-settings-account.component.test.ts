import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS09-T008 Settings account controls wiring', () => {
  it('authenticated Settings enables live export and deletion controls', () => {
    const page = read('src/app/dashboard/(authenticated)/settings/page.tsx');
    const view = read('src/components/dashboard/dashboard-settings-view.tsx');
    expect(page).toContain('accountControls="live"');
    expect(page).toContain('deletionAuth');
    expect(view).toContain('AccountExportAction');
    expect(view).toContain('AccountDeletionDialog');
    expect(view).toContain("accountControls === 'live'");
  });

  it('preview Settings stays on demo account controls', () => {
    const preview = read('src/app/dashboard/preview/settings/page.tsx');
    expect(preview).toContain('accountControls="demo"');
    expect(preview).not.toContain('/api/account/delete');
    expect(preview).not.toContain('/api/account/export');
  });

  it('export action calls the real route and prevents duplicate in-flight clicks', () => {
    const action = read('src/components/dashboard/account-export-action.tsx');
    const client = read('src/lib/account/account-export-client.ts');
    expect(client).toContain('/api/account/export');
    expect(client).toContain("method: 'POST'");
    expect(client).toContain('URL.createObjectURL');
    expect(client).toContain('revokeObjectURL');
    expect(action).toContain('inFlightRef');
    expect(action).toContain('downloadAccountExport');
    expect(action).not.toContain('demoAction');
  });

  it('deletion dialog requires exact DELETE and recent reauthentication', () => {
    const dialog = read('src/components/dashboard/account-deletion-dialog.tsx');
    expect(dialog).toContain('ACCOUNT_DELETION_CONFIRMATION');
    expect(dialog).toContain('isExactAccountDeletionConfirmation');
    expect(dialog).toContain('signInWithPassword');
    expect(dialog).toContain("method: 'recent_login'");
    expect(dialog).toContain('requestAccountDeletion');
    expect(dialog).toContain('Permanently delete account');
    expect(dialog).toContain('role="dialog"');
    expect(dialog).not.toContain('userId');
    expect(dialog).not.toContain('service_role');
  });

  it('does not delete on the initial Settings button click', () => {
    const dialog = read('src/components/dashboard/account-deletion-dialog.tsx');
    expect(dialog).toContain('account-deletion-open');
    expect(dialog).toContain('setOpen(true)');
    expect(dialog).toContain('account-deletion-submit');
  });

  it('settings view no longer maps Export/Delete to demoAction', () => {
    const view = read('src/components/dashboard/dashboard-settings-view.tsx');
    expect(view).not.toContain("'Export data': 'Started'");
    expect(view).not.toContain("'Delete account': 'Requested'");
    expect(view).toContain("control: 'account-export'");
    expect(view).toContain("control: 'account-delete'");
  });
});
