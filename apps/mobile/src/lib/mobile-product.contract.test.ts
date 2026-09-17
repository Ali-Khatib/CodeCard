import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(__dirname, '../..', rel), 'utf8');
}

describe('mobile product boundaries', () => {
  it('is a native companion, not the marketing site or web dashboard', () => {
    const app = read('App.tsx');
    const auth = read('src/screens/SignInScreen.tsx');
    expect(app).not.toContain('DashboardShell');
    expect(app).not.toContain('Landing');
    expect(app).not.toContain('/pricing');
    expect(app).not.toContain('WebView');
    expect(app).toContain("'card'");
    expect(app).toContain("'connections'");
    expect(app).not.toContain("'collections'");
    expect(auth).toContain('signInWithPassword');
    expect(auth).toContain('signUp');
    expect(auth).toContain('/forgot-password');
    const card = read('src/screens/CardScreen.tsx');
    expect(card).toContain('buildOwnerCardPresentation');
    expect(card).not.toContain('/dashboard');
    expect(card).toContain('Scan a CodeCard');
    expect(read('src/screens/SettingsScreen.tsx')).toContain('signOut');
    expect(read('src/screens/ConnectionsScreen.tsx')).toContain('getPublicProfileLinkForShare');
    expect(read('src/screens/ScanScreen.tsx')).toContain('parseScannedCodeCardUrl');
    expect(read('src/screens/ScannedProfileScreen.tsx')).toContain('connectFromQrScan');
  });

  it('persists the same Supabase session the web app uses', () => {
    const client = read('src/lib/supabase.ts');
    expect(client).toContain('expo-secure-store');
    expect(client).toContain('persistSession: true');
    expect(client).toContain('autoRefreshToken: true');
    expect(client).toContain('EXPO_PUBLIC_SUPABASE_URL');
  });
});
