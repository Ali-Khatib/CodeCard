import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  citationCopyButtonShouldRender,
  normalizeCitationCopyText,
} from './citation-copy';

describe('normalizeCitationCopyText', () => {
  it('trims accidental whitespace and preserves Unicode', () => {
    expect(normalizeCitationCopyText('  Vaswani et al., “Attention”\n  ')).toBe(
      'Vaswani et al., “Attention”',
    );
  });

  it('keeps HTML-like citation text literal', () => {
    expect(normalizeCitationCopyText('<b>Not HTML</b>')).toBe('<b>Not HTML</b>');
  });

  it('hides the copy button when citation is blank', () => {
    expect(citationCopyButtonShouldRender('   ')).toBe(false);
    expect(citationCopyButtonShouldRender('Ada et al.')).toBe(true);
  });
});

describe('citation copy wiring', () => {
  it('uses the shared citation copy button without dangerouslySetInnerHTML', () => {
    const button = readFileSync(
      resolve(process.cwd(), 'src/components/research/citation-copy-button.tsx'),
      'utf8',
    );
    const detail = readFileSync(
      resolve(process.cwd(), 'src/components/research/research-paper-detail.tsx'),
      'utf8',
    );
    const card = readFileSync(
      resolve(process.cwd(), 'src/components/research/research-paper-card.tsx'),
      'utf8',
    );

    expect(button).toContain('useCopyToClipboard');
    expect(button).toContain('aria-live');
    expect(button).toContain('Citation copied');
    expect(button).toContain("Couldn't copy citation");
    expect(button).not.toContain('dangerouslySetInnerHTML');
    expect(detail).toContain('CitationCopyButton');
    expect(card).toContain('CitationCopyButton');
    expect(detail).not.toContain('dangerouslySetInnerHTML');
    expect(card).not.toContain('dangerouslySetInnerHTML');
  });
});
