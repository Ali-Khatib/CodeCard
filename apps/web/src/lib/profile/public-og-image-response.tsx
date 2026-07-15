import { ImageResponse } from 'next/og';
import {
  buildGenericPublicOgCard,
  buildPublicProfileOgCard,
  buildPublicProjectOgCard,
  buildPublicResearchOgCard,
  PUBLIC_OG_IMAGE_SIZE,
  safeOgLine,
  type PublicOgCard,
} from '@/lib/profile/public-og-image';

export {
  PUBLIC_OG_IMAGE_ALT,
  PUBLIC_OG_IMAGE_CONTENT_TYPE,
  PUBLIC_OG_IMAGE_SIZE,
} from '@/lib/profile/public-og-image';

/** Generic branded card with no user-specific content (private/missing/draft fallback). */
export function renderGenericPublicOgImage(): ImageResponse {
  return renderPublicOgImage(buildGenericPublicOgCard());
}

export function renderPublicProfileOgImage(input: {
  displayName: string;
  headline: string | null;
  handle: string;
}): ImageResponse {
  return renderPublicOgImage(buildPublicProfileOgCard(input));
}

export function renderPublicProjectOgImage(input: {
  projectTitle: string;
  profileDisplayName: string;
}): ImageResponse {
  return renderPublicOgImage(buildPublicProjectOgCard(input));
}

export function renderPublicResearchOgImage(input: {
  paperTitle: string;
  profileDisplayName: string;
}): ImageResponse {
  return renderPublicOgImage(buildPublicResearchOgCard(input));
}

export function renderPublicOgImage(card: PublicOgCard): ImageResponse {
  const title = safeOgLine(card.title, 56) || 'CodeCard';
  const subtitle = safeOgLine(card.subtitle, 100);
  const handle = safeOgLine(card.handle, 48);
  const eyebrow = safeOgLine(card.eyebrow, 32) || 'CodeCard';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(145deg, #fcf1e7 0%, #ffffff 48%, #f3e8ff 100%)',
          color: '#232324',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#8b6bb0',
              fontWeight: 600,
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: title.length > 36 ? 54 : 64,
              lineHeight: 1.1,
              fontWeight: 600,
              letterSpacing: -1.5,
              maxWidth: 980,
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                display: 'flex',
                fontSize: 30,
                lineHeight: 1.35,
                color: '#767073',
                maxWidth: 920,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: 24,
            color: '#767073',
          }}
        >
          <div style={{ display: 'flex' }}>{handle || 'codecard.app'}</div>
          <div style={{ display: 'flex', color: '#232324', fontWeight: 600 }}>CodeCard</div>
        </div>
      </div>
    ),
    {
      ...PUBLIC_OG_IMAGE_SIZE,
    },
  );
}
