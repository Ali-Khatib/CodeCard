import { z } from 'zod';
import { projectMediaRoleSchema } from '@codecard/validation';
import { STORAGE_RESOURCE_TYPES } from '@/lib/storage/path';
import { UPLOAD_CONTENT_PREFIX_BASE64_MAX } from '@/lib/storage/upload-content-prefix';

export const uploadRequestSchema = z.object({
  resourceType: z.enum(STORAGE_RESOURCE_TYPES),
  resourceId: z.string().uuid().optional(),
  mediaRole: projectMediaRoleSchema.optional(),
  filename: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(255),
  size: z.number().int().positive(),
  /** First file bytes (base64) for magic-byte sniff before signing. */
  contentPrefixBase64: z.string().trim().min(8).max(UPLOAD_CONTENT_PREFIX_BASE64_MAX),
});

export type UploadRequestInput = z.infer<typeof uploadRequestSchema>;
