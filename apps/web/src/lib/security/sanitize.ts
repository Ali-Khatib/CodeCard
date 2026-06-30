const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => HTML_ESCAPE[ch] ?? ch);
}

/** Normalize user text: trim, collapse excessive whitespace, strip null bytes. */
export function normalizeText(input: string, maxLength: number): string {
  return input
    .replace(/\0/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/** Strip control characters except newline/tab for multiline fields. */
export function stripControlChars(input: string, allowNewlines = false): string {
  if (allowNewlines) {
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }
  return input.replace(/[\x00-\x1F\x7F]/g, '');
}
