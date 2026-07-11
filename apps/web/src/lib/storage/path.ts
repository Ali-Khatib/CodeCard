import { randomUUID } from 'node:crypto';
import { FILE_LIMITS, STORAGE_BUCKETS } from '@codecard/config';

export const STORAGE_RESOURCE_TYPES = ['avatar', 'project-media', 'private-doc'] as const;

export type StorageResourceType = (typeof STORAGE_RESOURCE_TYPES)[number];

export type CanonicalStoragePathInput = {
  tenantId: string;
  ownerUserId: string;
  resourceType: StorageResourceType;
  resourceId: string;
  extension: string;
};

export type CanonicalStoragePathResult = {
  bucket: (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];
  path: string;
  filename: string;
  segments: {
    tenantId: string;
    ownerUserId: string;
    resourceType: StorageResourceType;
    resourceId: string;
    filename: string;
  };
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const RESOURCE_TYPE_TO_BUCKET: Record<StorageResourceType, string> = {
  avatar: STORAGE_BUCKETS.avatars,
  'project-media': STORAGE_BUCKETS.projectMedia,
  'private-doc': STORAGE_BUCKETS.privateDocs,
};

const RESOURCE_TYPE_EXTENSIONS: Record<StorageResourceType, readonly string[]> = {
  avatar: FILE_LIMITS.image.extensions,
  'project-media': [...FILE_LIMITS.image.extensions, ...FILE_LIMITS.video.extensions],
  'private-doc': FILE_LIMITS.document.extensions,
};

export function isStorageResourceType(value: string): value is StorageResourceType {
  return (STORAGE_RESOURCE_TYPES as readonly string[]).includes(value);
}

export function bucketForStorageResourceType(resourceType: StorageResourceType): string {
  return RESOURCE_TYPE_TO_BUCKET[resourceType];
}

export function isAllowedStorageExtension(
  resourceType: StorageResourceType,
  extension: string,
): boolean {
  const normalized = normalizeStorageExtension(extension);
  return RESOURCE_TYPE_EXTENSIONS[resourceType].includes(
    normalized as (typeof RESOURCE_TYPE_EXTENSIONS)[StorageResourceType][number],
  );
}

export function normalizeStorageExtension(extension: string): string {
  const trimmed = extension.trim().toLowerCase().replace(/^\./, '');
  if (!trimmed || !/^[a-z0-9]{2,5}$/.test(trimmed)) {
    throw new Error('Unsupported file extension.');
  }
  return trimmed;
}

export function validateCanonicalPathSegment(
  segment: string,
  label: string,
): string {
  if (typeof segment !== 'string') {
    throw new Error(`Invalid ${label}.`);
  }

  const trimmed = segment.trim();
  if (!trimmed || trimmed !== segment) {
    throw new Error(`Invalid ${label}.`);
  }

  if (
    trimmed.includes('/') ||
    trimmed.includes('\\') ||
    trimmed.includes('..') ||
    /[\u0000-\u001F\u007F]/.test(trimmed) ||
    trimmed.includes('%') ||
    trimmed.includes('#') ||
    trimmed.includes('?')
  ) {
    throw new Error(`Invalid ${label}.`);
  }

  if (trimmed.length > 128) {
    throw new Error(`Invalid ${label}.`);
  }

  return trimmed;
}

export function validateCanonicalUuidSegment(segment: string, label: string): string {
  const value = validateCanonicalPathSegment(segment, label);
  if (!UUID_REGEX.test(value)) {
    throw new Error(`Invalid ${label}.`);
  }
  return value.toLowerCase();
}

export function generateStorageFilename(extension: string): string {
  const normalizedExtension = normalizeStorageExtension(extension);
  return `${randomUUID()}.${normalizedExtension}`;
}

export function buildCanonicalStoragePath(
  input: CanonicalStoragePathInput,
): CanonicalStoragePathResult {
  if (!isStorageResourceType(input.resourceType)) {
    throw new Error('Unsupported resource type.');
  }

  const tenantId = validateCanonicalUuidSegment(input.tenantId, 'tenant ID');
  const ownerUserId = validateCanonicalUuidSegment(input.ownerUserId, 'owner user ID');
  const resourceType = validateCanonicalPathSegment(input.resourceType, 'resource type');
  if (!isStorageResourceType(resourceType)) {
    throw new Error('Unsupported resource type.');
  }

  const resourceId = validateCanonicalUuidSegment(input.resourceId, 'resource ID');
  const filename = generateStorageFilename(input.extension);

  if (!isAllowedStorageExtension(resourceType, input.extension)) {
    throw new Error('Unsupported file extension.');
  }

  const path = `${tenantId}/${ownerUserId}/${resourceType}/${resourceId}/${filename}`;
  const bucket = bucketForStorageResourceType(resourceType) as CanonicalStoragePathResult['bucket'];

  return {
    bucket,
    path,
    filename,
    segments: {
      tenantId,
      ownerUserId,
      resourceType,
      resourceId,
      filename,
    },
  };
}

export function parseCanonicalStoragePath(path: string): CanonicalStoragePathResult['segments'] {
  if (typeof path !== 'string' || !path.trim() || path.trim() !== path) {
    throw new Error('Invalid storage path.');
  }

  if (
    path.includes('\\') ||
    path.includes('..') ||
    /[\u0000-\u001F\u007F]/.test(path) ||
    path.includes('%') ||
    path.includes('#') ||
    path.includes('?') ||
    path.startsWith('/') ||
    path.endsWith('/')
  ) {
    throw new Error('Invalid storage path.');
  }

  const parts = path.split('/');
  if (parts.length !== 5) {
    throw new Error('Invalid storage path.');
  }

  const [tenantId, ownerUserId, resourceType, resourceId, filename] = parts;
  if (!isStorageResourceType(resourceType)) {
    throw new Error('Unsupported resource type.');
  }

  return {
    tenantId: validateCanonicalUuidSegment(tenantId, 'tenant ID'),
    ownerUserId: validateCanonicalUuidSegment(ownerUserId, 'owner user ID'),
    resourceType,
    resourceId: validateCanonicalUuidSegment(resourceId, 'resource ID'),
    filename: validateCanonicalPathSegment(filename, 'filename'),
  };
}
