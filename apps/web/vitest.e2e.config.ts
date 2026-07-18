import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Live isolated-backend E2E readiness/smoke runs (WS14 bootstrap).
 * Separate from vitest.config.ts so ordinary `npm test` never contacts a
 * real backend: only *.livetest.ts files run here, sequentially, and setup
 * loads the explicit .env.e2e.local file (never production .env.local).
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/lib/e2e/**/*.livetest.ts'],
    setupFiles: ['src/lib/e2e/livetest-setup.ts'],
    fileParallelism: false,
    testTimeout: 90_000,
    hookTimeout: 90_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'server-only': path.resolve(__dirname, './src/test/stubs/server-only.ts'),
    },
  },
});
