/**
 * Citation text is stored directly on research_papers.citation_text.
 * Copy helpers must never reinterpret HTML or regenerate citation content.
 */
export function normalizeCitationCopyText(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/^\uFEFF/, '').trim();
}

export function citationCopyButtonShouldRender(value: string | null | undefined): boolean {
  return normalizeCitationCopyText(value).length > 0;
}
