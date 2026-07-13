import { describe, expect, it } from 'vitest';
import {
  avatarUploadMetadataSchema,
  createResearchUploadSchema,
  extractUploadFilenameExtension,
  findForbiddenUploadOwnershipFields,
  projectCoverUploadSchema,
  projectMediaFinalizeSchema,
  projectMediaUploadSchema,
  projectScreenshotUploadSchema,
  signedUploadRequestSchema,
  UPLOAD_IMAGE_MAX_BYTES,
  UPLOAD_DOCUMENT_MAX_BYTES,
} from './upload-schemas';

const PROJECT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('project cover upload schema', () => {
  it('accepts valid approved images', () => {
    for (const mime of ['image/jpeg', 'image/png', 'image/webp'] as const) {
      const ext = mime === 'image/jpeg' ? 'cover.jpg' : mime === 'image/png' ? 'cover.png' : 'cover.webp';
      expect(
        projectCoverUploadSchema.safeParse({
          project_id: PROJECT_ID,
          media_role: 'poster',
          filename: ext,
          mime_type: mime,
          size: 1024,
        }).success,
      ).toBe(true);
    }
  });

  it('rejects SVG and unsupported MIME types', () => {
    expect(
      projectCoverUploadSchema.safeParse({
        project_id: PROJECT_ID,
        media_role: 'poster',
        filename: 'cover.svg',
        mime_type: 'image/svg+xml',
        size: 100,
      }).success,
    ).toBe(false);

    expect(
      projectCoverUploadSchema.safeParse({
        project_id: PROJECT_ID,
        media_role: 'poster',
        filename: 'cover.gif',
        mime_type: 'image/gif',
        size: 100,
      }).success,
    ).toBe(false);
  });

  it('rejects oversized and zero-byte files', () => {
    expect(
      projectCoverUploadSchema.safeParse({
        project_id: PROJECT_ID,
        media_role: 'poster',
        filename: 'cover.png',
        mime_type: 'image/png',
        size: 0,
      }).success,
    ).toBe(false);

    expect(
      projectCoverUploadSchema.safeParse({
        project_id: PROJECT_ID,
        media_role: 'poster',
        filename: 'cover.png',
        mime_type: 'image/png',
        size: UPLOAD_IMAGE_MAX_BYTES + 1,
      }).success,
    ).toBe(false);
  });

  it('rejects malformed project IDs and unsupported roles', () => {
    expect(
      projectCoverUploadSchema.safeParse({
        project_id: 'not-a-uuid',
        media_role: 'poster',
        filename: 'cover.png',
        mime_type: 'image/png',
        size: 100,
      }).success,
    ).toBe(false);

    expect(
      projectCoverUploadSchema.safeParse({
        project_id: PROJECT_ID,
        media_role: 'screenshot',
        filename: 'cover.png',
        mime_type: 'image/png',
        size: 100,
      }).success,
    ).toBe(false);
  });

  it('rejects ownership and bucket fields', () => {
    const result = projectCoverUploadSchema.safeParse({
      project_id: PROJECT_ID,
      media_role: 'poster',
      filename: 'cover.png',
      mime_type: 'image/png',
      size: 100,
      bucket: 'project-media',
      owner_user_id: PROJECT_ID,
    });
    expect(result.success).toBe(false);
  });
});

describe('project screenshot upload schema', () => {
  it('accepts valid screenshot metadata', () => {
    expect(
      projectScreenshotUploadSchema.safeParse({
        project_id: PROJECT_ID,
        media_role: 'screenshot',
        filename: 'screen.png',
        mime_type: 'image/png',
        size: 2048,
      }).success,
    ).toBe(true);
  });

  it('rejects unsupported files and malformed project IDs', () => {
    expect(
      projectScreenshotUploadSchema.safeParse({
        project_id: 'bad-id',
        media_role: 'screenshot',
        filename: 'screen.exe',
        mime_type: 'application/octet-stream',
        size: 100,
      }).success,
    ).toBe(false);
  });

  it('keeps cover and screenshot roles distinct', () => {
    const union = projectMediaUploadSchema.safeParse({
      project_id: PROJECT_ID,
      media_role: 'poster',
      filename: 'screen.png',
      mime_type: 'image/png',
      size: 100,
    });
    expect(union.success).toBe(true);
    if (union.success) {
      expect(union.data.media_role).toBe('poster');
    }
  });
});

describe('filename and MIME safety', () => {
  it('rejects control characters and empty filenames', () => {
    expect(extractUploadFilenameExtension('')).toBeNull();
    expect(extractUploadFilenameExtension('cover\x00.png')).toBeNull();
    expect(extractUploadFilenameExtension('cover.png')).toBe('png');
  });

  it('rejects path-like filenames and double extensions', () => {
    expect(extractUploadFilenameExtension('../cover.png')).toBeNull();
    expect(extractUploadFilenameExtension('cover.png.exe')).toBeNull();
    expect(extractUploadFilenameExtension('nested/cover.png')).toBeNull();
  });

  it('rejects MIME and extension mismatches', () => {
    expect(
      projectScreenshotUploadSchema.safeParse({
        project_id: PROJECT_ID,
        media_role: 'screenshot',
        filename: 'screen.png',
        mime_type: 'image/jpeg',
        size: 100,
      }).success,
    ).toBe(false);
  });

  it('rejects unexpected fields via strict mode', () => {
    expect(
      findForbiddenUploadOwnershipFields({
        project_id: PROJECT_ID,
        bucket_name: 'evil',
      }),
    ).toBe('Unexpected field: bucket_name');
  });
});

describe('research upload schema', () => {
  const researchSchema = createResearchUploadSchema();
  const PAPER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  it('accepts valid research PDF metadata', () => {
    expect(
      researchSchema.safeParse({
        research_paper_id: PAPER_ID,
        kind: 'pdf',
        filename: 'paper.pdf',
        mime_type: 'application/pdf',
        size: 1024,
      }).success,
    ).toBe(true);
  });

  it('rejects non-PDF MIME for PDF intent and oversized PDFs', () => {
    expect(
      researchSchema.safeParse({
        research_paper_id: PAPER_ID,
        kind: 'pdf',
        filename: 'paper.pdf',
        mime_type: 'image/png',
        size: 100,
      }).success,
    ).toBe(false);

    expect(
      researchSchema.safeParse({
        research_paper_id: PAPER_ID,
        kind: 'pdf',
        filename: 'paper.pdf',
        mime_type: 'application/pdf',
        size: UPLOAD_DOCUMENT_MAX_BYTES + 1,
      }).success,
    ).toBe(false);
  });

  it('accepts valid research figure metadata and rejects invalid figure MIME', () => {
    expect(
      researchSchema.safeParse({
        research_paper_id: PAPER_ID,
        kind: 'figure',
        filename: 'figure.png',
        mime_type: 'image/png',
        size: 100,
      }).success,
    ).toBe(true);

    expect(
      researchSchema.safeParse({
        research_paper_id: PAPER_ID,
        kind: 'figure',
        filename: 'figure.svg',
        mime_type: 'image/svg+xml',
        size: 100,
      }).success,
    ).toBe(false);
  });

  it('rejects ownership and bucket fields', () => {
    expect(
      researchSchema.safeParse({
        research_paper_id: PAPER_ID,
        kind: 'pdf',
        filename: 'paper.pdf',
        mime_type: 'application/pdf',
        size: 100,
        tenant_id: PAPER_ID,
      }).success,
    ).toBe(false);
  });
});

describe('compatibility schemas', () => {
  it('keeps avatar upload metadata working', () => {
    expect(
      avatarUploadMetadataSchema.safeParse({
        filename: 'avatar.png',
        mime_type: 'image/png',
        size: 1024,
      }).success,
    ).toBe(true);
  });

  it('keeps signed upload request compatible for avatar and project media', () => {
    expect(
      signedUploadRequestSchema.safeParse({
        resource_type: 'avatar',
        filename: 'avatar.png',
        mime_type: 'image/png',
        size: 1024,
      }).success,
    ).toBe(true);

    expect(
      signedUploadRequestSchema.safeParse({
        resource_type: 'project-media',
        resource_id: PROJECT_ID,
        media_role: 'poster',
        filename: 'cover.png',
        mime_type: 'image/png',
        size: 1024,
      }).success,
    ).toBe(true);

    expect(
      signedUploadRequestSchema.safeParse({
        resource_type: 'project-media',
        resource_id: PROJECT_ID,
        filename: 'cover.png',
        mime_type: 'image/png',
        size: 1024,
      }).success,
    ).toBe(false);
  });

  it('validates project media finalization without URLs or ownership fields', () => {
    expect(
      projectMediaFinalizeSchema.safeParse({
        project_id: PROJECT_ID,
        media_role: 'poster',
        path: '11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/project-media/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/file.png',
      }).success,
    ).toBe(true);

    expect(
      projectMediaFinalizeSchema.safeParse({
        project_id: PROJECT_ID,
        media_role: 'screenshot',
        path: 'https://evil.example/file.png',
      }).success,
    ).toBe(false);
  });
});
