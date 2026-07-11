#!/usr/bin/env node
/**
 * Configure Supabase Auth for CodeCard MVP (Vercel + local).
 *
 * Requires a personal access token from:
 * https://supabase.com/dashboard/account/tokens
 *
 * Usage:
 *   set SUPABASE_ACCESS_TOKEN=sbp_...
 *   node scripts/configure-supabase-mvp-auth.mjs
 *
 * Optional OAuth (create apps first, then re-run):
 *   set GITHUB_OAUTH_CLIENT_ID=...
 *   set GITHUB_OAUTH_CLIENT_SECRET=...
 *   set GOOGLE_OAUTH_CLIENT_ID=...
 *   set GOOGLE_OAUTH_CLIENT_SECRET=...
 */

const PROJECT_REF = 'gclteunkzorwaliwhatp';
const MVP_URL = 'https://codecard-mvp.vercel.app';

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error('Missing SUPABASE_ACCESS_TOKEN.');
  console.error('Create one at https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

const redirectUrls = [
  'http://localhost:3000/**',
  `${MVP_URL}/**`,
  `${MVP_URL}/auth/callback`,
  'https://code-card-web.vercel.app/**',
];

const body = {
  site_url: MVP_URL,
  additional_redirect_urls: redirectUrls,
};

if (process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET) {
  body.external_github_enabled = true;
  body.external_github_client_id = process.env.GITHUB_OAUTH_CLIENT_ID;
  body.external_github_secret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
}

if (process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
  body.external_google_enabled = true;
  body.external_google_client_id = process.env.GOOGLE_OAUTH_CLIENT_ID;
  body.external_google_secret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
}

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

const text = await res.text();
if (!res.ok) {
  console.error(`Supabase API error (${res.status}):`, text);
  process.exit(1);
}

const updated = JSON.parse(text);
console.log('Auth config updated.');
console.log('  site_url:', updated.site_url ?? MVP_URL);
console.log('  redirect_urls:', updated.additional_redirect_urls?.length ?? redirectUrls.length);
console.log('  github:', updated.external_github_enabled ? 'enabled' : 'unchanged/disabled');
console.log('  google:', updated.external_google_enabled ? 'enabled' : 'unchanged/disabled');
console.log('\nSupabase OAuth callback (for GitHub/Google apps):');
console.log(`  https://${PROJECT_REF}.supabase.co/auth/v1/callback`);
