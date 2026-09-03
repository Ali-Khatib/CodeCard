export const EMAIL_CONFIRMED_TITLE = 'Email confirmed';

export const EMAIL_CONFIRMED_SUBTITLE =
  'Your account is active. Sign in when you are ready, then follow the short setup guide below.';

/** Ordered first-session setup steps with exact dashboard destinations. */
export const NEW_ACCOUNT_SETUP_GUIDE = [
  {
    id: 'profile',
    where: 'Home',
    href: '/dashboard#profile',
    what: 'Add your photo, headline, bio, and links so your card looks finished.',
  },
  {
    id: 'projects',
    where: 'Your Work',
    href: '/dashboard/projects/new',
    what: 'Create your first project with demo, stack, and outcome up front.',
  },
  {
    id: 'research',
    where: 'Research',
    href: '/dashboard/research',
    what: 'Optional: publish a paper so people can open and cite your work.',
  },
  {
    id: 'connections',
    where: 'Connections',
    href: '/dashboard/connections',
    what: 'Share your CodeCard QR so people you meet in person can scan and connect.',
  },
  {
    id: 'circle',
    where: 'Circle',
    href: '/dashboard/circle',
    what: 'Follow builders you trust and see what they ship.',
  },
  {
    id: 'share',
    where: 'Home',
    href: '/dashboard',
    what: 'Preview your public card, then share the link or QR from Settings.',
  },
] as const;
