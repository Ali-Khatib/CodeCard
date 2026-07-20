import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { normalizeFeaturedProject } from '@/lib/projects/featured';
import { firstSafeProjectLink } from '@/lib/projects/safe-project-link-url';
import { toSafeProfileLinkItems } from '@/lib/profile/safe-profile-link-url';
import { normalizeResearchPaper } from '@/lib/research/research';
import {
  PUBLIC_XSS_PAYLOADS,
  toSafeDoiHref,
  toSafeExternalPdfHref,
  toSafeHttpHref,
  toSafeProfileHref,
  toSafeProjectHref,
} from '@/lib/security/safe-href';
import {
  buildPublicProfileMetadata,
  buildPublicProjectMetadata,
  buildPublicResearchPageMetadata,
  normalizePublicMetadataText,
} from '@/lib/profile/public-metadata';
import { buildPublicProfileOgCard } from '@/lib/profile/public-og-image';

describe('safe href guards', () => {
  it('rejects unsafe schemes and protocol-relative URLs', () => {
    for (const payload of [
      'javascript:alert(1)',
      'JAVASCRIPT:alert(1)',
      '  javascript:alert(1)',
      'data:text/html,hi',
      'vbscript:msgbox(1)',
      'file:///etc/passwd',
      '//evil.example/path',
      '\u0000javascript:alert(1)',
    ]) {
      expect(toSafeHttpHref(payload)).toBeNull();
      expect(toSafeProjectHref(payload)).toBeNull();
      expect(toSafeProfileHref(payload)).toBeNull();
      expect(toSafeExternalPdfHref(payload)).toBeNull();
      expect(toSafeDoiHref(payload)).toBeNull();
    }
  });

  it('allows approved http(s) and profile mailto links', () => {
    expect(toSafeHttpHref('https://example.com/a')).toBe('https://example.com/a');
    expect(toSafeProjectHref('https://github.com/org/repo')).toBe('https://github.com/org/repo');
    expect(toSafeProfileHref('mailto:hello@example.com')).toBe('mailto:hello@example.com');
    expect(toSafeExternalPdfHref('https://arxiv.org/pdf/1234.pdf')).toBe(
      'https://arxiv.org/pdf/1234.pdf',
    );
    expect(toSafeDoiHref('10.1000/xyz')).toBe('https://doi.org/10.1000/xyz');
  });
});

describe('public mapper XSS / URL hardening', () => {
  it('drops unsafe research pdf and doi URLs during normalization', () => {
    const paper = normalizeResearchPaper(
      {
        id: 'paper-1',
        slug: 'notes',
        title: '<script>alert(1)</script>',
        abstract: '<img src=x onerror=alert(1)>',
        authors: ['</script>Ada'],
        pdf_url: 'javascript:alert(1)',
        doi_url: 'javascript:alert(1)',
        citation_text: '<b>citation</b>',
        research_figures: [
          {
            id: 'fig-1',
            image_url: 'javascript:alert(1)',
            caption: '<svg onload=alert(1)>',
          },
        ],
      },
      'ada',
    );

    expect(paper.title).toBe('<script>alert(1)</script>');
    expect(paper.abstract).toBe('<img src=x onerror=alert(1)>');
    expect(paper.pdfUrl).toBeNull();
    expect(paper.doiUrl).toBeNull();
    expect(paper.figures).toEqual([]);
    expect(paper.citationText).toBe('<b>citation</b>');
  });

  it('filters unsafe project links and keeps safe ones', () => {
    const project = normalizeFeaturedProject({
      id: 'proj-1',
      title: '<script>x</script>',
      tagline: null,
      description: 'Hello\n<script>alert(1)</script>',
      technologies: ['<img src=x onerror=alert(1)>'],
      project_links: [
        { type: 'live', label: 'Bad', url: 'javascript:alert(1)', sort_order: 0 },
        { type: 'repo', label: 'Good', url: 'https://github.com/a/b', sort_order: 1 },
        { type: 'demo', label: 'Proto', url: '//evil.example', sort_order: 2 },
      ],
    });

    expect(project.links.map((l) => l.url)).toEqual(['https://github.com/a/b']);
    expect(firstSafeProjectLink(project.links, ['live', 'demo'])).toBeUndefined();
    expect(firstSafeProjectLink(project.links, ['repo'])?.url).toBe('https://github.com/a/b');
    expect(project.description).toContain('<script>');
  });

  it('filters unsafe profile links', () => {
    const links = toSafeProfileLinkItems([
      { type: 'website', label: 'Safe', url: 'https://example.com' },
      { type: 'website', label: 'Bad', url: 'javascript:alert(1)' },
      { type: 'website', label: 'Data', url: 'data:text/html,hi' },
    ]);
    expect(links.map((l) => l.url)).toEqual(['https://example.com']);
  });
});

describe('metadata and OG text remain inert', () => {
  it('keeps XSS payloads as plain text in metadata and OG cards', () => {
    for (const payload of PUBLIC_XSS_PAYLOADS.slice(0, 8)) {
      const text = normalizePublicMetadataText(payload, 80);
      // Metadata keeps HTML-like text as plain text; schemes are never used as hrefs here.
      expect(typeof text).toBe('string');
      const metadata = buildPublicProfileMetadata({
        profileSlug: 'ada',
        displayName: payload,
        headline: payload,
        bio: payload,
      });
      expect(String(metadata.title)).not.toContain('dangerouslySetInnerHTML');
      expect(JSON.stringify(metadata.openGraph?.images)).toContain('/ada/opengraph-image');
      expect(JSON.stringify(metadata)).not.toContain('evil.example/opengraph');

      const og = buildPublicProfileOgCard({
        displayName: payload,
        headline: payload,
        handle: 'ada',
      });
      expect(og.title.length).toBeLessThanOrEqual(48);
    }

    expect(
      buildPublicProjectMetadata({
        profileSlug: 'ada',
        profileDisplayName: 'Ada',
        projectId: 'p1',
        projectTitle: '<svg onload=alert(1)>',
        description: 'javascript:alert(1)',
      }).description,
    ).toBe('javascript:alert(1)');

    expect(
      buildPublicResearchPageMetadata({
        profileSlug: 'ada',
        profileDisplayName: 'Ada',
        paperSlug: 'notes',
        paperTitle: '</title><script>alert(1)</script>',
        abstract: '<img src=x onerror=alert(1)>',
      }).openGraph,
    ).toMatchObject({ type: 'article' });
  });
});

describe('public rendering XSS contracts', () => {
  const publicComponents = [
    'src/components/profile/public-profile-focused.tsx',
    'src/components/profile/public-project-stack.tsx',
    'src/components/featured-work/project-detail-view.tsx',
    'src/components/research/research-paper-detail.tsx',
    'src/components/research/research-paper-card.tsx',
    'src/components/public/public-not-found-view.tsx',
  ];

  it('does not use dangerouslySetInnerHTML for UGC public surfaces', () => {
    for (const file of publicComponents) {
      const source = readFileSync(resolve(process.cwd(), file), 'utf8');
      expect(source).not.toContain('dangerouslySetInnerHTML');
      expect(source).not.toContain('innerHTML');
      expect(source.toLowerCase()).not.toContain('markdown');
      expect(source).not.toContain('iframe');
    }
  });

  it('keeps external public links on noopener noreferrer and safe project helpers', () => {
    const stack = readFileSync(
      resolve(process.cwd(), 'src/components/profile/public-project-stack.tsx'),
      'utf8',
    );
    const detail = readFileSync(
      resolve(process.cwd(), 'src/components/research/research-paper-detail.tsx'),
      'utf8',
    );
    const focused = readFileSync(
      resolve(process.cwd(), 'src/components/profile/public-profile-focused.tsx'),
      'utf8',
    );

    expect(stack).toContain('firstSafeProjectLink');
    expect(stack).toContain('rel="noopener noreferrer"');
    expect(detail).toContain('rel="noopener noreferrer"');
    expect(focused).toContain('toSafeProfileLinkItems');
    const social = readFileSync(
      resolve(process.cwd(), 'src/components/profile/public-profile-social-links.tsx'),
      'utf8',
    );
    expect(social).toContain('rel="noopener noreferrer"');
  });

  it('documents trusted non-UGC dangerouslySetInnerHTML exceptions', () => {
    const layout = readFileSync(resolve(process.cwd(), 'src/app/layout.tsx'), 'utf8');
    expect(layout).toContain('dangerouslySetInnerHTML');
    expect(layout).toContain('THEME_BOOT_SCRIPT');
  });
});
