import { describe, expect, it } from 'vitest';
import { STORAGE_BUCKETS } from '@codecard/config';
import {
  buildCanonicalStoragePath,
  generateStorageFilename,
  isAllowedStorageExtension,
  normalizeStorageExtension,
  parseCanonicalStoragePath,
  validateCanonicalPathSegment,
} from './path';

const tenantId = '11111111-1111-4111-8111-111111111111';
const ownerUserId = '22222222-2222-4222-8222-222222222222';
const resourceId = '33333333-3333-4333-8333-333333333333';

describe('buildCanonicalStoragePath', () => {
  it('builds a valid avatar path in the avatars bucket', () => {
    const result = buildCanonicalStoragePath({
      tenantId,
      ownerUserId,
      resourceType: 'avatar',
      resourceId,
      extension: 'png',
    });

    expect(result.bucket).toBe(STORAGE_BUCKETS.avatars);
    expect(result.path).toMatch(
      new RegExp(
        `^${tenantId}/${ownerUserId}/avatar/${resourceId}/[0-9a-f-]+\\.png$`,
      ),
    );
    expect(result.path.split('/')).toHaveLength(5);
  });

  it('maps project-media and private-doc resource types to the correct buckets', () => {
    const project = buildCanonicalStoragePath({
      tenantId,
      ownerUserId,
      resourceType: 'project-media',
      resourceId,
      extension: 'webp',
    });
    const doc = buildCanonicalStoragePath({
      tenantId,
      ownerUserId,
      resourceType: 'private-doc',
      resourceId,
      extension: 'pdf',
    });

    expect(project.bucket).toBe(STORAGE_BUCKETS.projectMedia);
    expect(doc.bucket).toBe(STORAGE_BUCKETS.privateDocs);
  });

  it('generates collision-resistant filenames and normalizes extensions', () => {
    const first = generateStorageFilename('PNG');
    const second = generateStorageFilename('png');
    expect(first).not.toBe(second);
    expect(first.endsWith('.png')).toBe(true);
    expect(normalizeStorageExtension('.JpEg')).toBe('jpeg');
  });

  it('rejects unsupported resource types and extensions', () => {
    expect(() =>
      buildCanonicalStoragePath({
        tenantId,
        ownerUserId,
        resourceType: 'avatar',
        resourceId,
        extension: 'svg',
      }),
    ).toThrow(/extension/i);

    expect(() =>
      buildCanonicalStoragePath({
        tenantId,
        ownerUserId,
        resourceType: 'private-doc',
        resourceId,
        extension: 'exe',
      }),
    ).toThrow(/extension/i);
  });

  it('rejects empty, traversal, encoded, and separator segments', () => {
    expect(() => validateCanonicalPathSegment('', 'segment')).toThrow();
    expect(() => validateCanonicalPathSegment('a/b', 'segment')).toThrow();
    expect(() => validateCanonicalPathSegment('..', 'segment')).toThrow();
    expect(() => validateCanonicalPathSegment('%2e%2e', 'segment')).toThrow();
    expect(() => validateCanonicalPathSegment('a\\b', 'segment')).toThrow();
    expect(() => validateCanonicalPathSegment('a?b', 'segment')).toThrow();
    expect(() => validateCanonicalPathSegment('a#b', 'segment')).toThrow();
    expect(() => validateCanonicalPathSegment('a\u0000b', 'segment')).toThrow();
  });

  it('never uses personal text in generated filenames', () => {
    const result = buildCanonicalStoragePath({
      tenantId,
      ownerUserId,
      resourceType: 'avatar',
      resourceId,
      extension: 'jpg',
    });

    expect(result.filename).not.toMatch(/@/);
    expect(result.path).not.toContain('alex@example.com');
    expect(result.path).not.toContain('Display Name');
    expect(result.filename).toMatch(/^[0-9a-f-]+\.jpg$/);
  });

  it('round-trips parsed canonical paths', () => {
    const built = buildCanonicalStoragePath({
      tenantId,
      ownerUserId,
      resourceType: 'project-media',
      resourceId,
      extension: 'mp4',
    });

    expect(parseCanonicalStoragePath(built.path)).toEqual(built.segments);
  });

  it('exposes allowed extensions per resource type', () => {
    expect(isAllowedStorageExtension('avatar', 'png')).toBe(true);
    expect(isAllowedStorageExtension('project-media', 'mp4')).toBe(true);
    expect(isAllowedStorageExtension('private-doc', 'pdf')).toBe(true);
    expect(isAllowedStorageExtension('avatar', 'pdf')).toBe(false);
  });
});
