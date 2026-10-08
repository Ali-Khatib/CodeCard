import { headlinePlainText } from '@/lib/profile/headline-roles';

/** Split "Role · Company" headlines without pulling canvas badge generators. */
export function parseHeadline(headline: string | null): { role: string; company: string | null } {
  const plain = headlinePlainText(headline);
  if (!plain) return { role: 'Builder', company: null };
  const parts = plain.split('·').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return { role: parts[0] ?? plain, company: parts.slice(1).join(' · ') };
  return { role: plain, company: null };
}
