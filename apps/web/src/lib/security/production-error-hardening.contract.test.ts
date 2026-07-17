import { describe, expect, it, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { INTERNAL_ERROR_MESSAGE, internalError } from '@/lib/api-utils';

const WEB = resolve(process.cwd());
const REPO = resolve(process.cwd(), '../..');

function readWeb(rel: string) {
  return readFileSync(resolve(WEB, rel), 'utf8');
}

function readRepo(rel: string) {
  return readFileSync(resolve(REPO, rel), 'utf8');
}

describe('WS11-T008 production error hardening', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('exposes an opaque internalError helper', async () => {
    const res = internalError();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: INTERNAL_ERROR_MESSAGE });
    expect(JSON.stringify(body)).not.toMatch(/stack|details|hint|postgres|stripe/i);
  });

  it('secureJsonRoute maps unexpected handler throws to opaque 500 JSON', async () => {
    vi.doMock('@/lib/rate-limit', () => ({
      rateLimit: async () => ({ success: true }),
    }));
    vi.doMock('@/lib/supabase/server', () => ({
      createClient: async () => ({
        auth: { getUser: async () => ({ data: { user: null } }) },
      }),
    }));

    const { secureJsonRoute } = await import('@/lib/security/secure-route');
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    });

    const res = await secureJsonRoute(
      request,
      { schema: z.object({ ok: z.boolean() }), rateLimitType: 'analytics' },
      async () => {
        throw new Error('relation "secret_table" does not exist — postgres detail');
      },
    );

    expect(res).toBeInstanceOf(Response);
    const response = res as Response;
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toEqual({ error: INTERNAL_ERROR_MESSAGE });
    expect(JSON.stringify(json)).not.toContain('secret_table');
    expect(JSON.stringify(json)).not.toContain('postgres');
    expect(JSON.stringify(json)).not.toContain('stack');
  });

  it('adds a safe global-error boundary without rendering error.message', () => {
    const src = readWeb('src/app/global-error.tsx');
    expect(src).toContain("'use client'");
    expect(src).toContain('<html');
    expect(src).toContain('<body');
    expect(src).toContain('Try again');
    expect(src).not.toMatch(/error\.message/);
    expect(src).not.toMatch(/error\.stack/);
    expect(src).not.toMatch(/\{\s*error\./);
  });

  it('removes the dead PostgREST create-project-action leak pattern', () => {
    expect(existsSync(resolve(WEB, 'src/lib/projects/create-project-action.ts'))).toBe(false);
    const live = readWeb('src/app/actions/projects.ts');
    expect(live).toContain('createProjectAction');
    expect(live).not.toMatch(/error\?\.message/);
  });

  it('documents the production error contract', () => {
    const docs = readRepo('docs/PRODUCTION_ERROR_RESPONSES.md');
    expect(docs).toContain('internalError');
    expect(docs).toContain('global-error.tsx');
    expect(docs).toContain('create-project-action');
  });

  it('keeps billing Stripe failures off the redirect path without catching redirect()', () => {
    const page = readWeb('src/app/dashboard/(authenticated)/billing/page.tsx');
    expect(page).toContain("redirect('/dashboard/billing?error=billing')");
    expect(page).toMatch(/let checkoutUrl[\s\S]*try \{[\s\S]*checkout\.sessions\.create/);
    expect(page).toMatch(/redirect\(checkoutUrl\)/);
  });
});
