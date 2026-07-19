import { defineConfig, devices } from '@playwright/test';
import { E2E_PORT, E2E_BASE_URL, loadIsolatedE2EEnv, webServerEnv } from './e2e/support/isolated-e2e';

/**
 * Isolated real-backend Playwright config (WS14-T002 authentication E2E).
 *
 * Separate from playwright.config.ts (page-load smoke) because this config
 * BUILDS and SERVES the app against the isolated E2E Supabase project so real
 * sign-up / sign-in / sign-out / reset flows exercise the real UI without ever
 * touching production. Traces/screenshots are kept off by default so recovery
 * links, cookies, and tokens are never retained in reports.
 */

// Fail-closed at config load: no isolated env => no run (never falls back to
// production/dev .env.local).
const e2eEnv = loadIsolatedE2EEnv();

const inheritedEnv: Record<string, string> = {};
for (const [key, value] of Object.entries(process.env)) {
  if (typeof value === 'string') inheritedEnv[key] = value;
}

export default defineConfig({
  testDir: './e2e',
  testMatch: /auth\.live\.spec\.ts$/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 90_000,
  globalSetup: './e2e/support/global-setup.ts',
  use: {
    baseURL: E2E_BASE_URL,
    // Never retain secrets (recovery links, cookies, tokens) in artifacts.
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  // Single project: the serial suite shares one primary user across tests and
  // exercises mobile widths in-test via setViewportSize.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    // Build with the isolated public env baked in, then serve it.
    command: `npm run build && npm run start -- -p ${E2E_PORT}`,
    url: E2E_BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      ...inheritedEnv,
      ...webServerEnv(e2eEnv),
    },
  },
});
