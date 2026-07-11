import { z } from 'zod';
import { STORAGE_RESOURCE_TYPES } from '@/lib/storage/path';

export const uploadRequestSchema = z.object({
  resourceType: z.enum(STORAGE_RESOURCE_TYPES),
  resourceId: z.string().uuid().optional(),
  filename: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(255),
  size: z.number().int().positive(),
});

export type UploadRequestInput = z.infer<typeof uploadRequestSchema>;
