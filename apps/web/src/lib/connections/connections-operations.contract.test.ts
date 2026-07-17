import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  addConnectionInputSchema,
  connectionStatusInputSchema,
  removeConnectionInputSchema,
  saveConnectionSchema,
} from '@codecard/validation';

describe('WS15-T003 connections validation schemas', () => {
  it('requires a target id or slug and never accepts owner_user_id', () => {
    expect(addConnectionInputSchema.safeParse({}).success).toBe(false);
    expect(
      addConnectionInputSchema.safeParse({
        targetProfileId: '11111111-1111-4111-8111-111111111111',
      }).success,
    ).toBe(true);
    expect(
      addConnectionInputSchema.safeParse({
        targetSlug: 'bob-smith',
      }).success,
    ).toBe(true);

    const withOwner = addConnectionInputSchema.safeParse({
      targetProfileId: '11111111-1111-4111-8111-111111111111',
      owner_user_id: '22222222-2222-4222-8222-222222222222',
    });
    expect(withOwner.success).toBe(true);
    if (withOwner.success) {
      expect(withOwner.data).not.toHaveProperty('owner_user_id');
    }
  });

  it('remove schema requires connection id or target profile id', () => {
    expect(removeConnectionInputSchema.safeParse({}).success).toBe(false);
    expect(
      removeConnectionInputSchema.safeParse({
        connectionId: '11111111-1111-4111-8111-111111111111',
      }).success,
    ).toBe(true);
  });

  it('status schema mirrors add target identity rules', () => {
    expect(connectionStatusInputSchema.safeParse({}).success).toBe(false);
    expect(
      connectionStatusInputSchema.safeParse({ targetSlug: 'alice' }).success,
    ).toBe(true);
  });

  it('keeps legacy saveConnectionSchema for export/inventory compatibility', () => {
    expect(
      saveConnectionSchema.safeParse({
        saved_profile_id: '11111111-1111-4111-8111-111111111111',
      }).success,
    ).toBe(true);
  });
});

describe('WS15-T003 connections server actions wiring', () => {
  it('exposes add/remove/list/status actions without client owner identity', () => {
    const actions = readFileSync(
      resolve(process.cwd(), 'src/app/actions/connections.ts'),
      'utf8',
    );
    expect(actions).toContain("'use server'");
    expect(actions).toContain('addConnectionAction');
    expect(actions).toContain('removeConnectionAction');
    expect(actions).toContain('getConnectionStatusAction');
    expect(actions).toContain('listConnectionsAction');
    expect(actions).toContain('revalidatePath');
    expect(actions).toContain("rateLimit(`connections:user:${userId}`, 'connections')");
    expect(actions).not.toMatch(/ownerUserId\s*:/);
  });

  it('core operations never select forbidden target fields', () => {
    const core = readFileSync(
      resolve(process.cwd(), 'src/lib/connections/connections-core.ts'),
      'utf8',
    );
    expect(core).toContain('executeAddConnection');
    expect(core).toContain('executeRemoveConnection');
    expect(core).toContain('listOwnerConnections');
    expect(core).toContain('executeConnectionStatus');
    expect(core).toContain("eq('owner_user_id', user.id)");
    expect(core).not.toMatch(/select\([^)]*email/i);
    expect(core).not.toMatch(/stripe_customer/i);
    expect(core).toContain('TARGET_NOT_AVAILABLE');
    expect(core).toContain('SELF_CONNECTION');
    expect(core).toContain('ALREADY_CONNECTED');
  });

  it('account export and deletion still cover saved_connections', () => {
    const inventoryPath = resolve(process.cwd(), '../../docs/account-data-inventory.md');
    expect(existsSync(inventoryPath)).toBe(true);
    const inventory = readFileSync(inventoryPath, 'utf8');
    expect(inventory).toContain('saved_connections');

    const deletion = readFileSync(
      resolve(process.cwd(), 'src/lib/account/delete-local-content.ts'),
      'utf8',
    );
    const exportBuild = readFileSync(
      resolve(process.cwd(), 'src/lib/account/export-build.ts'),
      'utf8',
    );
    expect(deletion).toContain(".from('saved_connections')");
    expect(exportBuild).toContain(".from('saved_connections')");
  });
});
