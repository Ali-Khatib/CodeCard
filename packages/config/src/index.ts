export const APP_NAME = 'CodeCard';

export const LIMITS = {
  slug: { min: 3, max: 63 },
  displayName: { max: 80 },
  headline: { max: 120 },
  bio: { max: 2000 },
  projectTitle: { max: 120 },
  projectTagline: { max: 160 },
  projectDescription: { max: 10000 },
  noteBody: { max: 5000 },
  collectionName: { max: 80 },
  technologies: { max: 20 },
  domains: { max: 10 },
  focusAreas: { max: 10 },
  projects: { max: 50 },
  collections: { max: 50 },
  savedConnections: { max: 500 },
} as const;

export const FILE_LIMITS = {
  image: {
    maxBytes: 5 * 1024 * 1024,
    extensions: ['jpg', 'jpeg', 'png', 'webp', 'avif'] as const,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const,
  },
  video: {
    maxBytes: 50 * 1024 * 1024,
    extensions: ['mp4', 'webm'] as const,
    mimeTypes: ['video/mp4', 'video/webm'] as const,
  },
  document: {
    maxBytes: 10 * 1024 * 1024,
    extensions: ['pdf'] as const,
    mimeTypes: ['application/pdf'] as const,
  },
} as const;

export const RATE_LIMITS = {
  auth: { requests: 10, window: '1 m' as const },
  profileLookup: { requests: 60, window: '1 m' as const },
  analytics: { requests: 120, window: '1 m' as const },
  upload: { requests: 20, window: '1 h' as const },
  ai: { requests: 10, window: '1 h' as const },
  moderation: { requests: 5, window: '1 h' as const },
  dmca: { requests: 3, window: '1 h' as const },
  billing: { requests: 20, window: '1 m' as const },
} as const;

export const STORAGE_BUCKETS = {
  avatars: 'avatars',
  projectMedia: 'project-media',
  privateDocs: 'private-docs',
} as const;

export const PAYMENT_PROVIDERS = {
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    regions: 'US, CA, UK, EU, AU, and more',
  },
  paddle: {
    id: 'paddle',
    name: 'Paddle',
    regions: '190+ countries — local tax & checkout where Stripe is limited',
  },
} as const;

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'Good enough to launch and share.',
    priceMonthly: 0,
    limits: {
      projects: 5,
    },
    features: [
      'Up to 5 projects',
      'Basic project media',
      'GitHub import',
      'QR + link sharing',
      'Basic analytics',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'For people who actually want to use CodeCard seriously.',
    priceMonthly: 8,
    priceYearly: 76,
    stripePriceEnvKey: 'STRIPE_PRO_PRICE_ID',
    /** Global checkout where Stripe is unavailable — Paddle acts as merchant of record */
    paddlePriceEnvKey: 'PADDLE_PRO_PRICE_ID',
    limits: {
      projects: null,
    },
    features: [
      'Unlimited projects',
      'Remove CodeCard branding',
      'Custom domain',
      'Premium analytics',
      'Per research paper analytics',
      'Visitor insights',
      'AI insights',
      'AI project polishing',
      'Guided project creation',
      'Early access',
    ],
  },
} as const;

export const PUBLIC_CACHE_SECONDS = 60;
export const PUBLIC_STALE_WHILE_REVALIDATE = 300;

export * from './security';
