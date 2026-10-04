import { describe, expect, it } from 'vitest';
import {
  SIGNED_IN_PUBLIC_BACK_HREF,
  publicProfileBackHrefForViewer,
} from '@/lib/profile/public-back-target';

describe('publicProfileBackHrefForViewer', () => {
  it('keeps the marketing home for signed-out visitors', () => {
    expect(publicProfileBackHrefForViewer('/', '')).toBe('/');
    expect(publicProfileBackHrefForViewer('/', 'theme=dark')).toBe('/');
    expect(publicProfileBackHrefForViewer('/', null)).toBe('/');
  });

  it('sends signed-in visitors to the dashboard Home tab', () => {
    expect(
      publicProfileBackHrefForViewer('/', 'sb-project-auth-token=session'),
    ).toBe(SIGNED_IN_PUBLIC_BACK_HREF);
    expect(SIGNED_IN_PUBLIC_BACK_HREF).toBe('/dashboard');
  });

  it('recognizes chunked Supabase auth cookies', () => {
    expect(
      publicProfileBackHrefForViewer('/', 'sb-project-auth-token.0=chunk'),
    ).toBe('/dashboard');
  });

  it('leaves explicit destinations alone', () => {
    expect(
      publicProfileBackHrefForViewer('/demo', 'sb-project-auth-token=session'),
    ).toBe('/demo');
    expect(
      publicProfileBackHrefForViewer('/dashboard', 'sb-project-auth-token=session'),
    ).toBe('/dashboard');
  });
});
