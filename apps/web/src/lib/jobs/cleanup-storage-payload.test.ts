import { describe, expect, it } from 'vitest';
import { STORAGE_BUCKETS } from '@codecard/config';
import {
  STORAGE_CLEANUP_JOB_TYPE,
  STORAGE_CLEANUP_MAX_OBJECTS,
  STORAGE_CLEANUP_PAYLOAD_VERSION,
  buildStorageCleanupPayload,
  computeCleanupRetryDelaySeconds,
  dedupeCleanupObjects,
  parseStorageCleanupPayload,
} from './cleanup-storage-payload';

const TENANT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OWNER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PROJECT = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const OTHER = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const PATH = `${TENANT}/${OWNER}/project-media/${PROJECT}/file.png`;

describe('WS04-T010 cleanup payload validation', () => {
  it('accepts a valid versioned payload', () => {
    const result = buildStorageCleanupPayload({
      resourceType: 'project',
      resourceId: PROJECT,
      ownerUserId: OWNER,
      tenantId: TENANT,
      objects: [
        {
          bucket: STORAGE_BUCKETS.projectMedia,
          path: PATH,
          resource_type: 'project-media',
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.version).toBe(STORAGE_CLEANUP_PAYLOAD_VERSION);
    expect(result.payload.operation).toBe('delete_objects');
  });

  it('rejects wrong version, unknown fields, and zip-like extras', () => {
    expect(
      parseStorageCleanupPayload({
        version: 2,
        operation: 'delete_objects',
        resource_type: 'project',
        resource_id: PROJECT,
        owner_user_id: OWNER,
        tenant_id: TENANT,
        objects: [],
      }).ok,
    ).toBe(false);

    expect(
      parseStorageCleanupPayload({
        version: 1,
        operation: 'delete_objects',
        resource_type: 'project',
        resource_id: PROJECT,
        owner_user_id: OWNER,
        tenant_id: TENANT,
        objects: [],
        secret: 'nope',
      }).ok,
    ).toBe(false);
  });

  it('rejects forbidden buckets, empty paths, traversal, and URLs', () => {
    expect(
      parseStorageCleanupPayload({
        version: 1,
        operation: 'delete_objects',
        resource_type: 'project',
        resource_id: PROJECT,
        owner_user_id: OWNER,
        tenant_id: TENANT,
        objects: [{ bucket: 'evil-bucket', path: PATH, resource_type: 'project-media' }],
      }).ok,
    ).toBe(false);

    expect(
      parseStorageCleanupPayload({
        version: 1,
        operation: 'delete_objects',
        resource_type: 'project',
        resource_id: PROJECT,
        owner_user_id: OWNER,
        tenant_id: TENANT,
        objects: [
          {
            bucket: STORAGE_BUCKETS.projectMedia,
            path: '',
            resource_type: 'project-media',
          },
        ],
      }).ok,
    ).toBe(false);

    expect(
      parseStorageCleanupPayload({
        version: 1,
        operation: 'delete_objects',
        resource_type: 'project',
        resource_id: PROJECT,
        owner_user_id: OWNER,
        tenant_id: TENANT,
        objects: [
          {
            bucket: STORAGE_BUCKETS.projectMedia,
            path: `${TENANT}/${OWNER}/project-media/${PROJECT}/../evil.png`,
            resource_type: 'project-media',
          },
        ],
      }).ok,
    ).toBe(false);

    expect(
      parseStorageCleanupPayload({
        version: 1,
        operation: 'delete_objects',
        resource_type: 'project',
        resource_id: PROJECT,
        owner_user_id: OWNER,
        tenant_id: TENANT,
        objects: [
          {
            bucket: STORAGE_BUCKETS.projectMedia,
            path: 'https://cdn.example.com/a.png',
            resource_type: 'project-media',
          },
        ],
      }).ok,
    ).toBe(false);
  });

  it('rejects cross-owner paths and bucket mismatches', () => {
    const crossOwner = `${TENANT}/${OTHER}/project-media/${PROJECT}/file.png`;
    expect(
      parseStorageCleanupPayload({
        version: 1,
        operation: 'delete_objects',
        resource_type: 'project',
        resource_id: PROJECT,
        owner_user_id: OWNER,
        tenant_id: TENANT,
        objects: [
          {
            bucket: STORAGE_BUCKETS.projectMedia,
            path: crossOwner,
            resource_type: 'project-media',
          },
        ],
      }).ok,
    ).toBe(false);

    expect(
      parseStorageCleanupPayload({
        version: 1,
        operation: 'delete_objects',
        resource_type: 'project',
        resource_id: PROJECT,
        owner_user_id: OWNER,
        tenant_id: TENANT,
        objects: [
          {
            bucket: STORAGE_BUCKETS.avatars,
            path: PATH,
            resource_type: 'project-media',
          },
        ],
      }).ok,
    ).toBe(false);
  });

  it('deduplicates targets and rejects oversized lists', () => {
    const objects = [
      {
        bucket: STORAGE_BUCKETS.projectMedia,
        path: PATH,
        resource_type: 'project-media' as const,
      },
      {
        bucket: STORAGE_BUCKETS.projectMedia,
        path: PATH,
        resource_type: 'project-media' as const,
      },
    ];
    expect(dedupeCleanupObjects(objects)).toHaveLength(1);

    const tooMany = Array.from({ length: STORAGE_CLEANUP_MAX_OBJECTS + 1 }, (_, i) => ({
      bucket: STORAGE_BUCKETS.projectMedia,
      path: `${TENANT}/${OWNER}/project-media/${PROJECT}/file-${i}.png`,
      resource_type: 'project-media' as const,
    }));
    // Invalid filenames (not uuid.ext) will fail path parse; use valid-looking names
    const oversized = Array.from({ length: STORAGE_CLEANUP_MAX_OBJECTS + 1 }, () => ({
      bucket: STORAGE_BUCKETS.projectMedia,
      path: PATH,
      resource_type: 'project-media' as const,
    }));
    expect(parseStorageCleanupPayload({
      version: 1,
      operation: 'delete_objects',
      resource_type: 'project',
      resource_id: PROJECT,
      owner_user_id: OWNER,
      tenant_id: TENANT,
      objects: oversized,
    }).ok).toBe(false);
    void tooMany;
  });

  it('computes bounded retry delays and documents job type', () => {
    expect(STORAGE_CLEANUP_JOB_TYPE).toBe('storage_cleanup');
    expect(computeCleanupRetryDelaySeconds(1)).toBe(2);
    expect(computeCleanupRetryDelaySeconds(10)).toBeLessThanOrEqual(3600);
  });
});
