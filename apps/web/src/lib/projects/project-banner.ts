export const PROJECT_BANNER_WIDTH = 1600;
export const PROJECT_BANNER_HEIGHT = 400;

export const PROJECT_BANNER_LIMITS = {
  eyebrow: 24,
  title: 80,
  subtitle: 72,
} as const;

export type ProjectBannerDraft = {
  eyebrow: string;
  title: string;
  subtitle: string;
  accent: string;
  background: string;
  backgroundBottom?: string | null;
};

export type ProjectBannerPreset = {
  id: string;
  label: string;
  accent: string;
  background: string;
  backgroundBottom: string;
};

export const PROJECT_BANNER_PRESETS: readonly ProjectBannerPreset[] = [
  { id: 'ink', label: 'Ink', accent: '#e95a0b', background: '#1c1612', backgroundBottom: '#100e0c' },
  { id: 'night', label: 'Night', accent: '#d4a85c', background: '#10161c', backgroundBottom: '#0a0e12' },
  { id: 'violet', label: 'Violet', accent: '#b092c4', background: '#1a141c', backgroundBottom: '#0e0c10' },
  { id: 'forest', label: 'Forest', accent: '#8fbf9f', background: '#101814', backgroundBottom: '#0a100c' },
  { id: 'sea', label: 'Sea', accent: '#7eb6d6', background: '#101820', backgroundBottom: '#0a1014' },
  { id: 'paper', label: 'Paper', accent: '#c4a47a', background: '#12141a', backgroundBottom: '#0a0c10' },
];

const TITLE_COLOR = '#f7f2eb';
const SUBTITLE_COLOR = '#d6cec4';

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function parseBannerHex(value: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const hex = match[1]!;
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}

function darken([red, green, blue]: [number, number, number], amount: number): [number, number, number] {
  return [
    clampChannel(red * (1 - amount)),
    clampChannel(green * (1 - amount)),
    clampChannel(blue * (1 - amount)),
  ];
}

function rgb([red, green, blue]: [number, number, number]): string {
  return `rgb(${red}, ${green}, ${blue})`;
}

function fillTrackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
) {
  let cursor = x;
  for (const char of text) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + tracking;
  }
}

function wrapTitleLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  if (words.length === 1) return [words[0]!];

  let best: string[] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let split = 1; split < words.length; split += 1) {
    const first = words.slice(0, split).join(' ');
    const second = words.slice(split).join(' ');
    const firstWidth = ctx.measureText(first).width;
    const secondWidth = ctx.measureText(second).width;
    if (firstWidth > maxWidth || secondWidth > maxWidth) continue;
    const score = Math.max(firstWidth, secondWidth) + Math.abs(firstWidth - secondWidth) * 0.2;
    if (score < bestScore) {
      bestScore = score;
      best = [first, second];
    }
  }
  if (best) return best;

  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines.slice(0, 2);
}

function layoutTitle(
  ctx: CanvasRenderingContext2D,
  title: string,
  family: string,
): { lines: string[]; size: number; top: number } {
  const maxWidth = 1360;
  if (!title) return { lines: [], size: 78, top: 148 };

  for (let size = 78; size >= 56; size -= 2) {
    ctx.font = `400 ${size}px ${family}`;
    if (ctx.measureText(title).width <= maxWidth) {
      return { lines: [title], size, top: 148 };
    }
  }

  const wrappedWidth = 1040;
  for (let size = 54; size >= 34; size -= 2) {
    ctx.font = `400 ${size}px ${family}`;
    const lines = wrapTitleLines(ctx, title, wrappedWidth);
    const fits =
      lines.length > 0 &&
      lines.length <= 2 &&
      lines.every((line) => ctx.measureText(line).width <= wrappedWidth);
    if (fits) {
      return { lines, size, top: 132 };
    }
  }

  ctx.font = '400 34px ' + family;
  const lines = wrapTitleLines(ctx, title, wrappedWidth).slice(0, 2);
  return { lines, size: 34, top: 132 };
}

function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  family: string,
  startSize: number,
  maxWidth: number,
  minSize: number,
): number {
  let size = startSize;
  ctx.font = `400 ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 2;
    ctx.font = `400 ${size}px ${family}`;
  }
  return size;
}

export function drawProjectBanner(
  ctx: CanvasRenderingContext2D,
  draft: ProjectBannerDraft,
): void {
  const width = PROJECT_BANNER_WIDTH;
  const height = PROJECT_BANNER_HEIGHT;
  const accent = parseBannerHex(draft.accent) ?? [233, 90, 11];
  const background = parseBannerHex(draft.background) ?? [28, 22, 18];
  const bottom = parseBannerHex(draft.backgroundBottom ?? '') ?? darken(background, 0.4);
  const eyebrow = draft.eyebrow.trim().toUpperCase().slice(0, PROJECT_BANNER_LIMITS.eyebrow);
  const title = draft.title.trim().slice(0, PROJECT_BANNER_LIMITS.title);
  const subtitle = draft.subtitle.trim().slice(0, PROJECT_BANNER_LIMITS.subtitle);

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, rgb(background));
  gradient.addColorStop(1, rgb(bottom));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.fillStyle = rgb(accent);
  ctx.globalAlpha = 0.11;
  ctx.beginPath();
  ctx.ellipse(170, 200, 350, 280, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.04;
  ctx.beginPath();
  ctx.ellipse(1370, 180, 390, 340, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillStyle = rgb(accent);
  ctx.beginPath();
  ctx.roundRect(72, 118, 46, 6, 3);
  ctx.fill();

  if (eyebrow) {
    ctx.font = '600 18px "Segoe UI", sans-serif';
    ctx.fillStyle = rgb(accent);
    fillTrackedText(ctx, eyebrow, 132, 104, 3);
  }

  const titleFamily = 'Georgia, "Times New Roman", serif';
  const titleLayout = layoutTitle(ctx, title, titleFamily);
  ctx.font = `400 ${titleLayout.size}px ${titleFamily}`;
  ctx.fillStyle = TITLE_COLOR;
  ctx.textAlign = 'center';
  const lineGap = Math.round(titleLayout.size * 1.08);
  titleLayout.lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, titleLayout.top + index * lineGap);
  });
  const titleWidth = Math.max(
    0,
    ...titleLayout.lines.map((line) => ctx.measureText(line).width),
  );
  const titleLeft = (width - titleWidth) / 2;

  const subtitleFamily = '"Segoe UI", sans-serif';
  const subtitleTop = titleLayout.lines.length > 1 ? 268 : 252;
  fitFont(ctx, subtitle || ' ', subtitleFamily, 26, 1400, 16);
  ctx.fillStyle = SUBTITLE_COLOR;
  ctx.textAlign = 'center';
  ctx.fillText(subtitle, width / 2, subtitleTop);

  const lineWidth = Math.min(titleWidth, 280);
  const lineX = titleLayout.lines.length > 1 ? (width - lineWidth) / 2 : titleLeft;
  ctx.fillStyle = rgb(accent);
  ctx.fillRect(lineX, 331, Math.max(lineWidth, title ? 1 : 0), 2);
  ctx.textAlign = 'left';
}

export async function projectBannerFile(draft: ProjectBannerDraft): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = PROJECT_BANNER_WIDTH;
  canvas.height = PROJECT_BANNER_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Banner canvas is unavailable.');
  }
  drawProjectBanner(ctx, draft);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.92);
  });
  if (!blob) {
    throw new Error('Banner image could not be created.');
  }
  return new File([blob], 'banner.jpg', { type: 'image/jpeg' });
}
