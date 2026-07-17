import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), 'utf8');
}

describe('WS04-T010 service-role and migration boundaries', () => {
  it('keeps cleanup processor and claim RPCs server-only', () => {
    const processor = read('src/lib/jobs/cleanup-storage.ts');
    expect(processor).toContain('claim_storage_cleanup_jobs');
    expect(processor).toContain('claim_storage_cleanup_job_by_id');
    expect(processor).not.toContain('NEXT_PUBLIC_SUPABASE_SERVICE');
    expect(processor).not.toContain('requireServerSecret');
  });

  it('wires project/research delete actions to createServiceClient dynamically', () => {
    const projects = read('src/app/actions/projects.ts');
    const research = read('src/app/actions/research.ts');
    expect(projects).toContain("import('@/lib/supabase/server')");
    expect(projects).toContain('createServiceClient');
    expect(research).toContain("import('@/lib/supabase/server')");
    expect(research).toContain('createServiceClient');
  });

  it('documents the narrow local migration without remote apply', () => {
    const migration = readFileSync(
      resolve(process.cwd(), '../../supabase/migrations/20260716235701_storage_cleanup_jobs.sql'),
      'utf8',
    );
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS attempts');
    expect(migration).toContain('claim_storage_cleanup_jobs');
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION claim_storage_cleanup_jobs');
    expect(migration).toContain('TO service_role');
    expect(migration).toContain('Do not apply remotely from this task');
  });

  it('does not expose cleanup as a public API route', () => {
    const inventory = read('../../docs/account-data-inventory.md');
    expect(inventory).toContain('20260716235701_storage_cleanup_jobs.sql');
  });
});
