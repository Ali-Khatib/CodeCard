import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  accountExportRequestSchema,
  buildAccountExportFilename,
  FORBIDDEN_EXPORT_FIELD_NAMES,
  isStablePublicHttpUrl,
} from './export-schema';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS10-T002 account export endpoint', () => {
  it('accepts minimal JSON request and rejects unknown fields / zip', () => {
    expect(accountExportRequestSchema.safeParse({}).success).toBe(true);
    expect(accountExportRequestSchema.safeParse({ format: 'json' }).success).toBe(true);
    expect(accountExportRequestSchema.safeParse({ format: 'zip' }).success).toBe(false);
    expect(accountExportRequestSchema.safeParse({ userId: 'x' }).success).toBe(false);
    expect(accountExportRequestSchema.safeParse({ owner_user_id: 'x' }).success).toBe(false);
  });

  it('builds a safe deterministic attachment filename', () => {
    expect(buildAccountExportFilename(new Date('2026-07-17T12:00:00.000Z'))).toBe(
      'codecard-account-export-2026-07-17.json',
    );
    expect(buildAccountExportFilename(new Date('2026-07-17T12:00:00.000Z'))).not.toContain('@');
  });

  it('rejects signed-looking URLs for avatar export', () => {
    expect(isStablePublicHttpUrl('https://cdn.example.com/a.png')).toBe(
      'https://cdn.example.com/a.png',
    );
    expect(isStablePublicHttpUrl('https://cdn.example.com/a.png?token=abc')).toBeNull();
    expect(isStablePublicHttpUrl('tenant/user/avatar/id/file.png')).toBeNull();
  });

  it('wires authenticated POST export route with no-store headers', () => {
    const route = read('src/app/api/account/export/route.ts');
    expect(route).toContain('secureJsonRoute');
    expect(route).toContain("rateLimitType: 'accountExport'");
    expect(route).toContain('requireAuth: true');
    expect(route).toContain('buildAccountExportDocument');
    expect(route).toContain('createClient');
    expect(route).not.toContain('createServiceClient');
    expect(route).toContain('no-store');
    expect(route).toContain('Content-Disposition');
    expect(route).toContain('Method not allowed');
    expect(route).toContain('ACCOUNT_EXPORT_MAX_BYTES');
  });

  it('keeps forbidden secret field names documented for scans', () => {
    expect(FORBIDDEN_EXPORT_FIELD_NAMES).toContain('stripe_customer_id');
    expect(FORBIDDEN_EXPORT_FIELD_NAMES).toContain('storage_path');
    expect(FORBIDDEN_EXPORT_FIELD_NAMES).toContain('access_token');
  });
});
