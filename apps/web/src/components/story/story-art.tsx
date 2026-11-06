/**
 * Editorial artwork for the panel row.
 *
 * The reference puts a full-bleed cinematic image at the top of each panel —
 * deep blacks, one warm light source — never a screenshot of its own product.
 * These are drawn rather than photographed: original compositions in the same
 * register, so nothing here is a cropped piece of UI.
 *
 * Each piece is 5:3, decorative, and carries no text.
 */

function Grain({ id }: { id: string }) {
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7" />
      <feColorMatrix type="saturate" values="0" />
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.055" />
      </feComponentTransfer>
    </filter>
  );
}

const BOX = { viewBox: '0 0 500 300', preserveAspectRatio: 'xMidYMid slice' } as const;

/** 01 — Scattered. Planes of work drifting apart in the dark. */
export function ArtScattered() {
  return (
    <svg className="pl-art__svg" {...BOX} role="presentation" focusable="false">
      <defs>
        <radialGradient id="a1-glow" cx="78%" cy="18%" r="82%">
          <stop offset="0%" stopColor="#ff8c3d" stopOpacity="0.72" />
          <stop offset="34%" stopColor="#b4521a" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#050505" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="a1-plane" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e4dfd9" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#e4dfd9" stopOpacity="0.28" />
        </linearGradient>
        <Grain id="a1-grain" />
      </defs>

      <rect width="500" height="300" fill="#070605" />
      <rect width="500" height="300" fill="url(#a1-glow)" />

      {/* Planes receding from the light: near and sharp, far and dim. */}
      <g>
        <g transform="translate(300 44) rotate(-9)" opacity="0.2">
          <rect width="150" height="96" rx="7" fill="url(#a1-plane)" />
        </g>
        <g transform="translate(206 96) rotate(6)" opacity="0.34">
          <rect width="168" height="106" rx="8" fill="url(#a1-plane)" />
        </g>
        <g transform="translate(92 142) rotate(-5)" opacity="0.62">
          <rect width="190" height="120" rx="9" fill="url(#a1-plane)" />
          <rect x="18" y="22" width="86" height="7" rx="3.5" fill="#070605" opacity="0.5" />
          <rect x="18" y="40" width="130" height="5" rx="2.5" fill="#070605" opacity="0.28" />
          <rect x="18" y="54" width="112" height="5" rx="2.5" fill="#070605" opacity="0.22" />
        </g>
        <g transform="translate(-12 198) rotate(10)" opacity="0.9">
          <rect width="176" height="112" rx="9" fill="#efebe6" />
          <rect x="18" y="20" width="74" height="8" rx="4" fill="#070605" opacity="0.62" />
          <rect x="18" y="40" width="124" height="5" rx="2.5" fill="#070605" opacity="0.3" />
        </g>
      </g>

      <circle cx="398" cy="54" r="4" fill="#ff6a1f" />
      <rect width="500" height="300" filter="url(#a1-grain)" opacity="0.9" />
    </svg>
  );
}

/** 02 — The exchange. Two arcs meeting, a seam of light where they do. */
export function ArtExchange() {
  return (
    <svg className="pl-art__svg" {...BOX} role="presentation" focusable="false">
      <defs>
        <radialGradient id="a2-glow" cx="50%" cy="52%" r="56%">
          <stop offset="0%" stopColor="#ffa059" stopOpacity="0.85" />
          <stop offset="40%" stopColor="#8d3f12" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#050505" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="a2-seam" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#ff6a1f" stopOpacity="0" />
          <stop offset="48%" stopColor="#ffd3ad" stopOpacity="1" />
          <stop offset="100%" stopColor="#ff6a1f" stopOpacity="0" />
        </linearGradient>
        <Grain id="a2-grain" />
      </defs>

      <rect width="500" height="300" fill="#070605" />
      <rect width="500" height="300" fill="url(#a2-glow)" />

      {/* Two open forms turned toward each other. */}
      <g fill="none" strokeLinecap="round">
        <path
          d="M214 58 A 96 96 0 1 0 214 242"
          stroke="#e4dfd9"
          strokeOpacity="0.88"
          strokeWidth="13"
        />
        <path
          d="M286 58 A 96 96 0 1 1 286 242"
          stroke="#e4dfd9"
          strokeOpacity="0.5"
          strokeWidth="13"
        />
        <path d="M196 86 A 70 70 0 1 0 196 214" stroke="#e4dfd9" strokeOpacity="0.2" strokeWidth="6" />
      </g>

      {/* The seam, and the thing that crosses it. */}
      <rect x="248" y="40" width="3" height="220" fill="url(#a2-seam)" />
      <g transform="translate(224 126) rotate(-7)">
        <rect width="52" height="34" rx="6" fill="#f3efea" />
        <rect x="8" y="9" width="22" height="4" rx="2" fill="#070605" opacity="0.55" />
        <rect x="8" y="19" width="34" height="3" rx="1.5" fill="#070605" opacity="0.3" />
      </g>
      <circle cx="250" cy="60" r="4" fill="#ff6a1f" />

      <rect width="500" height="300" filter="url(#a2-grain)" opacity="0.9" />
    </svg>
  );
}

/** 03 — Kept. A constellation of people held by faint threads. */
export function ArtKept() {
  const nodes = [
    [86, 212, 5.5, 0.9],
    [152, 128, 4, 0.5],
    [214, 206, 4.5, 0.62],
    [268, 104, 3.5, 0.4],
    [330, 176, 5, 0.72],
    [404, 92, 3.5, 0.34],
    [430, 220, 4, 0.46],
    [120, 62, 3, 0.26],
  ] as const;

  return (
    <svg className="pl-art__svg" {...BOX} role="presentation" focusable="false">
      <defs>
        <radialGradient id="a3-glow" cx="26%" cy="74%" r="78%">
          <stop offset="0%" stopColor="#ff8c3d" stopOpacity="0.6" />
          <stop offset="38%" stopColor="#8d3f12" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#050505" stopOpacity="0" />
        </radialGradient>
        <Grain id="a3-grain" />
      </defs>

      <rect width="500" height="300" fill="#070605" />
      <rect width="500" height="300" fill="url(#a3-glow)" />

      <g stroke="#e4dfd9" fill="none" strokeOpacity="0.3" strokeWidth="1.2">
        <path d="M86 212 L152 128 L268 104 L404 92" />
        <path d="M86 212 L214 206 L330 176 L430 220" />
        <path d="M152 128 L214 206" />
        <path d="M330 176 L404 92" />
        <path d="M120 62 L152 128" />
        <path d="M268 104 L330 176" />
        <path d="M214 206 L268 104" />
      </g>

      {nodes.map(([cx, cy, r, o]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#e4dfd9" fillOpacity={o} />
      ))}

      {/* One connection carries its own light: the one you remember. */}
      <circle cx="86" cy="212" r="22" fill="#ff6a1f" fillOpacity="0.12" />
      <circle cx="86" cy="212" r="12" fill="#ff6a1f" fillOpacity="0.2" />
      <circle cx="86" cy="212" r="5.5" fill="#ff6a1f" />

      <rect width="500" height="300" filter="url(#a3-grain)" opacity="0.9" />
    </svg>
  );
}
