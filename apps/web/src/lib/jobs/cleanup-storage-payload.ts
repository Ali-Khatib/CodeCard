import { z } from 'zod';
import { STORAGE_BUCKETS } from '@codecard/config';
import {
  parseCanonicalStoragePath,
  bucketForStorageResourceType,
  type StorageResourceType,
} from '@/lib/storage/path';

export const STORAGE_CLEANUP_JOB_TYPE = 'storage_cleanup' as const;
export const STORAGE_CLEANUP_PAYLOAD_VERSION = 1 as const;
export const STORAGE_CLEANUP_MAX_OBJECTS = 100;
export const STORAGE_CLEANUP_MAX_ATTEMPTS = 5;
export const STORAGE_CLEANUP_PATH_MAX_LENGTH = 512;

export const STORAGE_CLEANUP_BUCKET_ALLOWLIST = [
  STORAGE_BUCKETS.avatars,
  STORAGE_BUCKETS.projectMedia,
  STORAGE_BUCKETS.privateDocs,
] as const;

export type StorageCleanupBucket = (typeof STORAGE_CLEANUP_BUCKET_ALLOWLIST)[number];

const uuidSchema = z.string().uuid();

const cleanupObjectSchema = z
  .object({
    bucket: z.enum(STORAGE_CLEANUP_BUCKET_ALLOWLIST),
    path: z.string().min(1).max(STORAGE_CLEANUP_PATH_MAX_LENGTH),
    resource_type: z.enum(['avatar', 'project-media', 'private-doc', 'research-figure']),
  })
  .strict();

export const storageCleanupPayloadSchema = z
  .object({
    version: z.literal(STORAGE_CLEANUP_PAYLOAD_VERSION),
    operation: z.literal('delete_objects'),
    resource_type: z.enum(['project', 'research', 'profile', 'account']),
    resource_id: uuidSchema,
    owner_user_id: uuidSchema,
    tenant_id: uuidSchema,
    objects: z.array(cleanupObjectSchema).max(STORAGE_CLEANUP_MAX_OBJECTS),
  })
  .strict();

export type StorageCleanupPayload = z.infer<typeof storageCleanupPayloadSchema>;
export type StorageCleanupObject = z.infer<typeof cleanupObjectSchema>;

export type StorageCleanupValidationFailureReason =
  | 'invalid_payload'
  | 'forbidden_bucket'
  | 'invalid_path'
  | 'cross_owner_path'
  | 'bucket_mismatch'
  | 'too_many_objects';

export type StorageCleanupValidationResult =
  | { ok: true; payload: StorageCleanupPayload }
  | { ok: false; reason: StorageCleanupValidationFailureReason };

function isAllowedBucket(bucket: string): bucket is StorageCleanupBucket {
  return (STORAGE_CLEANUP_BUCKET_ALLOWLIST as readonly string[]).includes(bucket);
}

/**
 * Validate a single cleanup target against canonical path + owner/tenant/bucket rules.
 */
export function validateCleanupObject(
  object: StorageCleanupObject,
  expected: { ownerUserId: string; tenantId: string },
): { ok: true } | { ok: false; reason: StorageCleanupValidationFailureReason } {
  if (!isAllowedBucket(object.bucket)) {
    return { ok: false, reason: 'forbidden_bucket' };
  }

  if (
    !object.path ||
    object.path !== object.path.trim() ||
    object.path.includes('://') ||
    object.path.startsWith('/') ||
    object.path.includes('..') ||
    object.path.includes('*') ||
    object.path.includes('\\')
  ) {
    return { ok: false, reason: 'invalid_path' };
  }

  let segments;
  try {
    segments = parseCanonicalStoragePath(object.path);
  } catch {
    return { ok: false, reason: 'invalid_path' };
  }

  if (segments.resourceType !== object.resource_type) {
    return { ok: false, reason: 'invalid_path' };
  }

  if (segments.ownerUserId !== expected.ownerUserId) {
    return { ok: false, reason: 'cross_owner_path' };
  }

  if (segments.tenantId !== expected.tenantId) {
    return { ok: false, reason: 'cross_owner_path' };
  }

  const expectedBucket = bucketForStorageResourceType(object.resource_type as StorageResourceType);
  if (object.bucket !== expectedBucket) {
    return { ok: false, reason: 'bucket_mismatch' };
  }

  return { ok: true };
}

export function dedupeCleanupObjects(objects: StorageCleanupObject[]): StorageCleanupObject[] {
  const seen = new Set<string>();
  const out: StorageCleanupObject[] = [];
  for (const object of objects) {
    const key = `${object.bucket}:${object.path}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(object);
  }
  return out;
}

/**
 * Parse + validate a cleanup job payload. Malformed payloads must delete nothing.
 */
export function parseStorageCleanupPayload(raw: unknown): StorageCleanupValidationResult {
  const parsed = storageCleanupPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    if (
      raw &&
      typeof raw === 'object' &&
      Array.isArray((raw as { objects?: unknown }).objects) &&
      ((raw as { objects: unknown[] }).objects.length > STORAGE_CLEANUP_MAX_OBJECTS)
    ) {
      return { ok: false, reason: 'too_many_objects' };
    }
    return { ok: false, reason: 'invalid_payload' };
  }

  const deduped = dedupeCleanupObjects(parsed.data.objects);
  for (const object of deduped) {
    const check = validateCleanupObject(object, {
      ownerUserId: parsed.data.owner_user_id,
      tenantId: parsed.data.tenant_id,
    });
    if (!check.ok) {
      return { ok: false, reason: check.reason };
    }
  }

  return {
    ok: true,
    payload: {
      ...parsed.data,
      objects: deduped,
    },
  };
}

export function buildStorageCleanupPayload(input: {
  resourceType: StorageCleanupPayload['resource_type'];
  resourceId: string;
  ownerUserId: string;
  tenantId: string;
  objects: StorageCleanupObject[];
}): StorageCleanupValidationResult {
  return parseStorageCleanupPayload({
    version: STORAGE_CLEANUP_PAYLOAD_VERSION,
    operation: 'delete_objects',
    resource_type: input.resourceType,
    resource_id: input.resourceId,
    owner_user_id: input.ownerUserId,
    tenant_id: input.tenantId,
    objects: dedupeCleanupObjects(input.objects),
  });
}

export function computeCleanupRetryDelaySeconds(attempts: number): number {
  const capped = Math.max(1, Math.min(attempts, STORAGE_CLEANUP_MAX_ATTEMPTS));
  return Math.min(3600, 2 ** capped);
}
