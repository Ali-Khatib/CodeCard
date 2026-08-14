import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Apple touch icon — CodeCard brand mark. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fcf1e7',
          borderRadius: 36,
        }}
      >
        <div
          style={{
            fontSize: 108,
            fontWeight: 700,
            color: '#232324',
            letterSpacing: '-0.06em',
            fontFamily: 'Georgia, ui-serif, serif',
          }}
        >
          C
        </div>
      </div>
    ),
    { ...size },
  );
}
