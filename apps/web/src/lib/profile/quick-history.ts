import { parseHeadline } from '@/lib/profile/parse-headline';

export type ProfileHistoryIcon = 'now' | 'before' | 'studied' | 'based';

export type CardHistory = {
  before?: string | null;
  studied?: string | null;
};

export type ProfileHistoryLine = {
  label: string;
  value: string;
  icon: ProfileHistoryIcon;
};

export function readCardHistory(value: unknown): CardHistory | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as { before?: unknown; studied?: unknown };
  const before = typeof row.before === 'string' ? row.before.trim() : '';
  const studied = typeof row.studied === 'string' ? row.studied.trim() : '';
  if (!before && !studied) return null;
  return { before: before || null, studied: studied || null };
}

/** Short reverse-side facts for the public identity card. */
export function profileQuickHistory(input: {
  profileSlug: string;
  headline: string | null;
  location?: string | null;
  bio?: string | null;
  history?: CardHistory | null;
}): ProfileHistoryLine[] {
  if (input.profileSlug === 'demo') {
    return [
      { label: 'Now', value: 'Senior AI Engineer · Stripe', icon: 'now' },
      { label: 'Before', value: 'Early engineer at infra startups', icon: 'before' },
      { label: 'Studied', value: 'B.S. Computer Science, UC Berkeley', icon: 'studied' },
      { label: 'Based', value: 'San Francisco', icon: 'based' },
    ];
  }

  const { role, company } = parseHeadline(input.headline);
  const lines: ProfileHistoryLine[] = [
    {
      label: 'Now',
      value: company ? `${role} · ${company}` : role,
      icon: 'now',
    },
  ];

  const before = input.history?.before?.trim() || previousFromBio(input.bio);
  if (before) lines.push({ label: 'Before', value: before, icon: 'before' });

  const studied = input.history?.studied?.trim();
  if (studied) lines.push({ label: 'Studied', value: studied, icon: 'studied' });

  if (input.location?.trim()) {
    lines.push({ label: 'Based', value: input.location.trim(), icon: 'based' });
  }
  return lines;
}

function previousFromBio(bio: string | null | undefined): string | null {
  if (!bio) return null;
  const match = bio.match(/previously\s+([^.]{8,80})/i);
  if (!match) return null;
  const value = match[1].trim();
  return value.charAt(0).toUpperCase() + value.slice(1);
}
