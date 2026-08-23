import { parseHeadline } from '@/lib/profile/parse-headline';

export type ProfileHistoryLine = {
  label: string;
  value: string;
};

/** Short reverse-side facts for the public identity card. */
export function profileQuickHistory(input: {
  profileSlug: string;
  headline: string | null;
  location?: string | null;
  bio?: string | null;
}): ProfileHistoryLine[] {
  if (input.profileSlug === 'demo') {
    return [
      { label: 'Now', value: 'Senior AI Engineer · Stripe' },
      { label: 'Before', value: 'Early engineer at infra startups' },
      { label: 'Studied', value: 'B.S. Computer Science, UC Berkeley' },
      { label: 'Based', value: 'San Francisco' },
    ];
  }

  const { role, company } = parseHeadline(input.headline);
  const lines: ProfileHistoryLine[] = [
    {
      label: 'Now',
      value: company ? `${role} · ${company}` : role,
    },
  ];
  if (input.location?.trim()) {
    lines.push({ label: 'Based', value: input.location.trim() });
  }
  const previous = previousFromBio(input.bio);
  if (previous) lines.push({ label: 'Before', value: previous });
  return lines;
}

function previousFromBio(bio: string | null | undefined): string | null {
  if (!bio) return null;
  const match = bio.match(/previously\s+([^.]{8,80})/i);
  if (!match) return null;
  const value = match[1].trim();
  return value.charAt(0).toUpperCase() + value.slice(1);
}
