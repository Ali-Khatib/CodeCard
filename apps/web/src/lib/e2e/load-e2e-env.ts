import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Explicit loader for the git-ignored E2E environment file. It never falls
 * back to `.env.local` (production/dev values are forbidden for E2E) and only
 * ever surfaces CODECARD_E2E-prefixed variables.
 */

export const E2E_ENV_FILE_NAME = '.env.e2e.local';

export function e2eEnvFilePath(): string {
  // apps/web/src/lib/e2e -> apps/web
  return path.resolve(__dirname, '../../..', E2E_ENV_FILE_NAME);
}

export function loadE2EEnvFile(filePath: string = e2eEnvFilePath()): Record<string, string> {
  if (!existsSync(filePath)) {
    throw new Error(
      `Missing ${E2E_ENV_FILE_NAME}. Real E2E requires the isolated environment file at ` +
        `apps/web/${E2E_ENV_FILE_NAME} (git-ignored). Production .env.local is never used as a fallback.`,
    );
  }
  const values: Record<string, string> = {};
  for (const rawLine of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    // Only E2E-scoped variables may flow out of this file.
    if (!key.startsWith('CODECARD_E2E')) continue;
    values[key] = match[2].replace(/^["']|["']$/g, '');
  }
  return values;
}

/** Merge E2E variables into process.env for a livetest run. */
export function applyE2EEnv(filePath?: string): void {
  const values = loadE2EEnvFile(filePath);
  for (const [key, value] of Object.entries(values)) {
    process.env[key] = value;
  }
}
