import type { MetadataRoute } from 'next';

function appOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return 'http://localhost:3000';
  try {
    return new URL(raw).origin;
  } catch {
    return 'http://localhost:3000';
  }
}

/**
 * Allow public marketing + published CodeCards; keep private app surfaces out of crawlers.
 */
export default function robots(): MetadataRoute.Robots {
  const origin = appOrigin();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/admin/',
          '/api/',
          '/e2e-fixtures/',
          '/auth/',
          '/demo/analytics',
          '/demo/settings',
          '/demo/connections',
          '/demo/circle',
          '/demo/profile',
          '/demo/projects',
          '/demo/research',
          '/forgot-password',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
