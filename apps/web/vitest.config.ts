import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    // Playwright specs live under apps/web/e2e/. Live backend readiness/smoke
    // runs use vitest.e2e.config.ts (*.livetest.ts) and must never run under
    // `npm test`. Do NOT exclude src/lib/e2e — that holds unit/contract tests.
    exclude: [
      '**/node_modules/**',
      'e2e/**',
      '**/apps/web/e2e/**',
      '**/*.livetest.ts',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Allow unit-testing modules that import `server-only` (Next RSC boundary).
      'server-only': path.resolve(__dirname, './src/test/stubs/server-only.ts'),
    },
  },
});
