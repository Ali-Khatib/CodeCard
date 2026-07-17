import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Allow unit-testing modules that import `server-only` (Next RSC boundary).
      'server-only': path.resolve(__dirname, './src/test/stubs/server-only.ts'),
    },
  },
});
