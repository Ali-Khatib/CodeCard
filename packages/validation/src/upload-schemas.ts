import { z } from 'zod';

/** Mirrors `FILE_LIMITS.image.maxBytes` in @codecard/config. */
export const UPLOAD_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Mirrors `FILE_LIMITS.document.maxBytes` in @codecard/config. */
export const UPLOAD_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

export const UPLOAD_FILENAME_MAX_LENGTH = 255;

export const PROJECT_SCREENSHOT_MAX_COUNT = 12;

export const PROJECT_MEDIA_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const PROJECT_MEDIA_ROLES = ['poster', 'screenshot'] as const;

export type ProjectMediaRole = (typeof PROJECT_MEDIA_ROLES)[number];

export const RESEARCH_UPLOAD_KINDS = ['pdf', 'figure'] as const;

export type ResearchUploadKind = (typeof RESEARCH_UPLOAD_KINDS)[number];

export const RESEARCH_FIGURE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const STORAGE_RESOURCE_TYPES = ['avatar', 'project-media', 'private-doc'] as const;

export type StorageResourceType = (typeof STORAGE_RESOURCE_TYPES)[number];

export const FORBIDDEN_UPLOAD_OWNERSHIP_FIELDS = [
  'owner_user_id',
  'owner_id',
  'user_id',
  'tenant_id',
  'profile_id',
  'bucket',
  'bucket_name',
  'storage_path',
  'path',
  'destination_path',
  'prefix',
  'is_public',
  'authorization',
  'authorized',
] as const;

const BLOCKED_EXTENSIONS = new Set([
  'svg',
  'html',
  'htm',
  'js',
  'mjs',
  'cjs',
  'exe',
  'bat',
  'cmd',
  'sh',
  'php',
  'jar',
  'vbs',
]);

const MIME_TO_EXTENSIONS: Record<string, readonly string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'application/pdf': ['pdf'],
};

export function extractUploadFilenameExtension(filename: string): string | null {
  const trimmed = filename.trim();
  if (!trimmed || trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('..')) {
    return null;
  }

  if (/[\u0000-\u001F\u007F]/.test(trimmed)) {
    return null;
  }

  const parts = trimmed.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const extension = parts[1]?.trim().toLowerCase();
  if (!extension || !/^[a-z0-9]{2,5}$/.test(extension)) {
    return null;
  }

  return extension;
}

export function findForbiddenUploadOwnershipFields(
  input: Record<string, unknown>,
): string | null {
  for (const key of FORBIDDEN_UPLOAD_OWNERSHIP_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      return `Unexpected field: ${key}`;
    }
  }
  return null;
}

function uploadFilenameSchema(maxLength = UPLOAD_FILENAME_MAX_LENGTH) {
  return z
    .string()
    .trim()
    .min(1, 'Filename is required')
    .max(maxLength, 'Filename is too long')
    .refine((value) => !/[\u0000-\u001F\u007F]/.test(value), 'Invalid filename')
    .refine((value) => extractUploadFilenameExtension(value) !== null, 'Invalid filename');
}

function uploadMimeTypeSchema(allowed: readonly string[]) {
  return z
    .string()
    .trim()
    .min(1, 'MIME type is required')
    .max(255)
    .transform((value) => value.toLowerCase())
    .refine(
      (value): value is (typeof allowed)[number] =>
        (allowed as readonly string[]).includes(value),
      'Unsupported file type',
    );
}

function uploadSizeSchema(maxBytes: number) {
  return z
    .number()
    .int('File size must be an integer')
    .positive('File size must be greater than zero')
    .max(maxBytes, 'File is too large');
}

function refineFilenameMimeCompatibility(
  data: { filename: string; mime_type: string },
  ctx: z.RefinementCtx,
) {
  const extension = extractUploadFilenameExtension(data.filename);
  if (!extension) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid filename',
      path: ['filename'],
    });
    return;
  }

  if (BLOCKED_EXTENSIONS.has(extension)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Unsupported file type',
      path: ['filename'],
    });
    return;
  }

  const mimeExtensions = MIME_TO_EXTENSIONS[data.mime_type] ?? [];
  if (!mimeExtensions.includes(extension)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'File type does not match filename',
      path: ['mime_type'],
    });
  }
}

const avatarAllowedMimeTypes = PROJECT_MEDIA_IMAGE_MIME_TYPES;

export const avatarUploadMetadataSchema = z
  .object({
    filename: uploadFilenameSchema(),
    mime_type: uploadMimeTypeSchema(avatarAllowedMimeTypes),
    size: uploadSizeSchema(UPLOAD_IMAGE_MAX_BYTES),
  })
  .strict()
  .superRefine(refineFilenameMimeCompatibility);

export const projectMediaRoleSchema = z.enum(PROJECT_MEDIA_ROLES);

const projectMediaFileFields = {
  project_id: z.string().uuid('Invalid project ID'),
  filename: uploadFilenameSchema(),
  mime_type: uploadMimeTypeSchema(PROJECT_MEDIA_IMAGE_MIME_TYPES),
  size: uploadSizeSchema(UPLOAD_IMAGE_MAX_BYTES),
};

export const projectCoverUploadSchema = z
  .object({
    ...projectMediaFileFields,
    media_role: z.literal('poster'),
  })
  .strict()
  .superRefine(refineFilenameMimeCompatibility);

export const projectScreenshotUploadSchema = z
  .object({
    ...projectMediaFileFields,
    media_role: z.literal('screenshot'),
  })
  .strict()
  .superRefine(refineFilenameMimeCompatibility);

export const projectMediaUploadSchema = z.union([
  projectCoverUploadSchema,
  projectScreenshotUploadSchema,
]);

export const projectMediaFinalizeSchema = z
  .object({
    project_id: z.string().uuid('Invalid project ID'),
    media_role: projectMediaRoleSchema,
    path: z
      .string()
      .trim()
      .min(1, 'Storage path is required')
      .max(512, 'Storage path is too long')
      .refine((value) => !/^https?:\/\//i.test(value), 'Invalid storage path')
      .refine((value) => !value.includes('..'), 'Invalid storage path')
      .refine((value) => !value.startsWith('/'), 'Invalid storage path'),
  })
  .strict();

export const signedUploadRequestSchema = z
  .object({
    resource_type: z.enum(STORAGE_RESOURCE_TYPES),
    resource_id: z.string().uuid('Invalid resource ID').optional(),
    media_role: projectMediaRoleSchema.optional(),
    filename: uploadFilenameSchema(),
    mime_type: z.string().trim().min(1).max(255),
    size: z.number().int().positive(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.resource_type === 'avatar') {
      const avatar = avatarUploadMetadataSchema.safeParse({
        filename: data.filename,
        mime_type: data.mime_type,
        size: data.size,
      });
      if (!avatar.success) {
        for (const issue of avatar.error.issues) {
          ctx.addIssue({ ...issue, path: issue.path });
        }
      }
      return;
    }

    if (data.resource_type === 'project-media') {
      if (!data.resource_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Project ID is required',
          path: ['resource_id'],
        });
      }
      if (!data.media_role) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Media role is required',
          path: ['media_role'],
        });
        return;
      }

      const projectUpload =
        data.media_role === 'poster'
          ? projectCoverUploadSchema.safeParse({
              project_id: data.resource_id,
              media_role: data.media_role,
              filename: data.filename,
              mime_type: data.mime_type,
              size: data.size,
            })
          : projectScreenshotUploadSchema.safeParse({
              project_id: data.resource_id,
              media_role: data.media_role,
              filename: data.filename,
              mime_type: data.mime_type,
              size: data.size,
            });

      if (!projectUpload.success) {
        for (const issue of projectUpload.error.issues) {
          const mappedPath =
            issue.path[0] === 'project_id' ? ['resource_id'] : issue.path;
          ctx.addIssue({ ...issue, path: mappedPath });
        }
      }
    }
  });

export function createResearchUploadSchema() {
  return z.union([
    z
      .object({
        research_paper_id: z.string().uuid('Invalid research paper ID'),
        kind: z.literal('pdf'),
        filename: uploadFilenameSchema(),
        mime_type: z.literal('application/pdf'),
        size: uploadSizeSchema(UPLOAD_DOCUMENT_MAX_BYTES),
      })
      .strict()
      .superRefine((data, ctx) => refineFilenameMimeCompatibility(data, ctx)),
    z
      .object({
        research_paper_id: z.string().uuid('Invalid research paper ID'),
        kind: z.literal('figure'),
        filename: uploadFilenameSchema(),
        mime_type: uploadMimeTypeSchema(RESEARCH_FIGURE_MIME_TYPES),
        size: uploadSizeSchema(UPLOAD_IMAGE_MAX_BYTES),
      })
      .strict()
      .superRefine((data, ctx) => refineFilenameMimeCompatibility(data, ctx)),
  ]);
}

export type AvatarUploadMetadataInput = z.infer<typeof avatarUploadMetadataSchema>;
export type ProjectCoverUploadInput = z.infer<typeof projectCoverUploadSchema>;
export type ProjectScreenshotUploadInput = z.infer<typeof projectScreenshotUploadSchema>;
export type ProjectMediaFinalizeInput = z.infer<typeof projectMediaFinalizeSchema>;
export type SignedUploadRequestInput = z.infer<typeof signedUploadRequestSchema>;
export type ResearchUploadInput = z.infer<ReturnType<typeof createResearchUploadSchema>>;
