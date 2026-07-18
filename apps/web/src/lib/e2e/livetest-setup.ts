/**
 * Setup for live E2E readiness/smoke runs (vitest.e2e.config.ts only).
 * Loads apps/web/.env.e2e.local explicitly and fails loudly when absent.
 */
import { applyE2EEnv } from './load-e2e-env';

applyE2EEnv();
