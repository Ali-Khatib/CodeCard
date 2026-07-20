/** Split "Role · Company" headlines without pulling canvas badge generators. */
export function parseHeadline(headline: string | null): { role: string; company: string | null } {
  if (!headline) return { role: 'Builder', company: null };
  const parts = headline.split('·').map((s) => s.trim());
  if (parts.length >= 2) return { role: parts[0], company: parts.slice(1).join(' · ') };
  return { role: headline, company: null };
}
