import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/** Tab favicon — CodeCard ink mark on bone. */
export default function Icon() {
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
          borderRadius: 8,
        }}
      >
        <div
          style={{
            fontSize: 20,
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
