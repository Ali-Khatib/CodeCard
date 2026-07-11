import { getAppOrigin } from '@/lib/auth/redirect';

function collectAllowedOrigins(request: Request): Set<string> {
  const allowed = new Set<string>([new URL(request.url).origin]);

  const appOrigin = getAppOrigin();
  if (appOrigin) {
    try {
      allowed.add(new URL(appOrigin).origin);
    } catch {
      // ignore invalid configured origin
    }
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    allowed.add(`https://${vercelUrl}`);
  }

  return allowed;
}

export function isSameOriginMutation(request: Request): boolean {
  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite === 'cross-site') {
    return false;
  }

  const origin = request.headers.get('origin');
  if (!origin) {
    return secFetchSite === 'same-origin' || secFetchSite === 'same-site' || secFetchSite === null;
  }

  return collectAllowedOrigins(request).has(origin);
}
