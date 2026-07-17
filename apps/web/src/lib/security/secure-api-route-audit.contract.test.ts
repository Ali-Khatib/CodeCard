import { describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

const WEB = resolve(process.cwd());
const REPO = resolve(process.cwd(), '../..');

function readWeb(rel: string) {
  return readFileSync(resolve(WEB, rel), 'utf8');
}

function readRepo(rel: string) {
  return readFileSync(resolve(REPO, rel), 'utf8');
}

const API_ROOT = resolve(WEB, 'src/app/api');

function listApiRoutes(): string[] {
  return readdirSync(API_ROOT, { recursive: true })
    .map(String)
    .filter((f) => f.replace(/\\/g, '/').endsWith('route.ts'))
    .map((f) => f.replace(/\\/g, '/'));
}

describe('WS11-T005 secure API route audit', () => {
  const routes = listApiRoutes();
  const matrix = readRepo('docs/API_ROUTE_SECURITY_MATRIX.md');
  const secureRoute = readWeb('src/lib/security/secure-route.ts');

  it('inventories every API route in the security matrix', () => {
    expect(routes.sort()).toEqual(
      [
        'account/delete/route.ts',
        'account/export/route.ts',
        'analytics/route.ts',
        'dmca/route.ts',
        'moderation/report/route.ts',
        'public/research/[paperId]/pdf/route.ts',
        'upload/route.ts',
        'webhooks/stripe/route.ts',
      ].sort(),
    );
    for (const route of [
      '/api/analytics',
      '/api/dmca',
      '/api/moderation/report',
      '/api/account/export',
      '/api/account/delete',
      '/api/upload',
      '/api/public/research/[paperId]/pdf',
      '/api/webhooks/stripe',
    ]) {
      expect(matrix).toContain(route);
    }
  });

  it('uses secureJsonRoute for ordinary JSON APIs with schema + rate limit', () => {
    for (const rel of [
      'src/app/api/analytics/route.ts',
      'src/app/api/dmca/route.ts',
      'src/app/api/moderation/report/route.ts',
      'src/app/api/account/export/route.ts',
      'src/app/api/account/delete/route.ts',
    ]) {
      const src = readWeb(rel);
      expect(src).toContain('secureJsonRoute');
      expect(src).toMatch(/schema:/);
      expect(src).toMatch(/rateLimitType:/);
      expect(src).not.toContain('request.json()');
    }
  });

  it('documents and preserves binary/raw-body exceptions', () => {
    const stripe = readWeb('src/app/api/webhooks/stripe/route.ts');
    const upload = readWeb('src/app/api/upload/route.ts');
    const pdf = readWeb('src/app/api/public/research/[paperId]/pdf/route.ts');

    expect(stripe).toContain('readBodyWithLimit');
    expect(stripe).toContain('stripe-signature');
    expect(stripe).toContain('constructEvent');
    expect(stripe).not.toContain('secureJsonRoute');

    expect(upload).toContain('isSameOriginMutation');
    expect(upload).toContain('resolveUploadOwnership');
    expect(upload).toContain('application/json');
    expect(upload).not.toContain('secureJsonRoute');

    expect(pdf).toContain('fetchPublicResearchPdf');
    expect(pdf).not.toContain('secureJsonRoute');
    expect(matrix).toContain('Valid exceptions');
  });

  it('requires same-origin for cookie-authenticated account mutations', () => {
    const exportRoute = readWeb('src/app/api/account/export/route.ts');
    const deleteRoute = readWeb('src/app/api/account/delete/route.ts');
    expect(exportRoute).toContain('isSameOriginMutation');
    expect(deleteRoute).toContain('isSameOriginMutation');
    expect(exportRoute).toContain('requireAuth: true');
    expect(deleteRoute).toContain('requireAuth: true');
  });

  it('rejects non-JSON content types in secureJsonRoute by default', async () => {
    vi.resetModules();
    vi.doMock('@/lib/rate-limit', () => ({
      rateLimit: async () => ({ success: true }),
    }));
    vi.doMock('@/lib/supabase/server', () => ({
      createClient: async () => ({
        auth: { getUser: async () => ({ data: { user: null } }) },
      }),
    }));
    vi.doMock('@/lib/security/env', () => ({
      isProduction: () => false,
    }));

    const { secureJsonRoute } = await import('@/lib/security/secure-route');
    const schema = z.object({ ok: z.literal(true) });
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: '{"ok":true}',
    });
    const response = await secureJsonRoute(request, { schema, rateLimitType: 'analytics' }, async () => {
      throw new Error('handler should not run');
    });
    expect(response).toBeInstanceOf(Response);
    if (response instanceof Response) {
      expect(response.status).toBe(415);
    }
  });

  it('parses malformed JSON safely without leaking stacks', async () => {
    vi.resetModules();
    vi.doMock('@/lib/rate-limit', () => ({
      rateLimit: async () => ({ success: true }),
    }));
    vi.doMock('@/lib/security/env', () => ({
      isProduction: () => false,
    }));

    const { secureJsonRoute } = await import('@/lib/security/secure-route');
    const schema = z.object({ ok: z.boolean() });
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not-json',
    });
    const response = await secureJsonRoute(request, { schema, rateLimitType: 'analytics' }, async () => {
      throw new Error('handler should not run');
    });
    expect(response).toBeInstanceOf(Response);
    if (response instanceof Response) {
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(JSON.stringify(body)).not.toMatch(/stack|SyntaxError/i);
    }
  });

  it('keeps PDF SSRF and upload ownership regressions wired', () => {
    expect(secureRoute).toContain('requireJsonContentType');
    expect(secureRoute).toContain('Unsupported content type');
    expect(readWeb('src/lib/research/pdf-ssrf.ts')).toMatch(/ssrf|private|dns/i);
    expect(readWeb('src/lib/storage/upload-ownership.ts')).toContain('owner_user_id');
  });

  it('does not expose service-role usage on browser-facing JSON helpers', () => {
    expect(secureRoute).not.toContain('SERVICE_ROLE');
    expect(secureRoute).not.toContain('createServiceClient');
    expect(matrix).toContain('Session identity only');
  });
});
