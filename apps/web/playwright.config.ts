import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? '3000');
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: './e2e',
  /*
   * `.live.spec.ts` belongs to playwright.e2e.config.ts, which builds against the
   * isolated Supabase project. Without that config those specs abort in
   * `loadIsolatedE2EEnv()`, so leaving them in scope here made `test:e2e`
   * unrunnable rather than reporting on the specs it actually owns.
   */
  testIgnore: /\.live\.spec\.ts$/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop-1920', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } } },
    { name: 'desktop-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-390', use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `npm run start -- -p ${port}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 90000,
    env: {
      ...process.env,
      CODECARD_E2E_FIXTURES: '1',
    },
  },
});
