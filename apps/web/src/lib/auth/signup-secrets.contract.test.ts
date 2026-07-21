import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const webSrc = join(process.cwd(), 'src');

describe('signup confirmation flow secrets boundary', () => {
  it('does not put the service-role key in the sign-up page or browser supabase client', () => {
    const signUp = readFileSync(join(webSrc, 'app/sign-up/page.tsx'), 'utf8');
    const browserClient = readFileSync(join(webSrc, 'lib/supabase/client.ts'), 'utf8');
    const signupResult = readFileSync(join(webSrc, 'lib/auth/signup-result.ts'), 'utf8');

    for (const source of [signUp, browserClient, signupResult]) {
      expect(source).not.toMatch(/SERVICE_ROLE/);
      expect(source).not.toMatch(/service_role/);
      expect(source).not.toMatch(/sk_live_/);
      expect(source).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\./);
    }
  });

  it('callback route exchanges codes only through the server supabase client', () => {
    const route = readFileSync(join(webSrc, 'app/auth/callback/route.ts'), 'utf8');
    expect(route).toContain("from '@/lib/supabase/server'");
    expect(route).toContain('exchangeCodeForSession');
    expect(route).not.toMatch(/SERVICE_ROLE/);
    expect(route).not.toContain('@/lib/supabase/client');
  });
});
