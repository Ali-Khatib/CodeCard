import type { ProfileLinkItem } from '@/lib/icons/profile-links';

const W = 512;
const H = 768;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function createLanyardFrontImage(opts: {
  avatarUrl: string | null;
  displayName: string;
  headline: string | null;
  company?: string | null;
  accentColor: string;
}): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#141414');
  grad.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = `${opts.accentColor}55`;
  ctx.lineWidth = 3;
  roundRect(ctx, 24, 24, W - 48, H - 48, 28);
  ctx.stroke();

  const avatarSize = 160;
  const avatarX = (W - avatarSize) / 2;
  const avatarY = 72;
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.clip();
  if (opts.avatarUrl) {
    const img = await loadImage(opts.avatarUrl);
    if (img) ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
    else {
      ctx.fillStyle = '#27272a';
      ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    }
  } else {
    ctx.fillStyle = '#27272a';
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'bold 64px system-ui,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(opts.displayName.charAt(0), W / 2, avatarY + avatarSize / 2 + 22);
  }
  ctx.restore();

  ctx.fillStyle = '#fafafa';
  ctx.font = 'bold 36px system-ui,sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(opts.displayName, W / 2, 290);

  if (opts.headline) {
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '22px system-ui,sans-serif';
    const lines = wrapText(ctx, opts.headline, W - 80);
    lines.slice(0, 2).forEach((line, i) => {
      ctx.fillText(line, W / 2, 330 + i * 28);
    });
  }

  if (opts.company) {
    ctx.fillStyle = opts.accentColor;
    ctx.font = '18px system-ui,sans-serif';
    ctx.fillText(opts.company, W / 2, 400);
  }

  ctx.fillStyle = '#52525b';
  ctx.font = 'bold 14px system-ui,sans-serif';
  ctx.fillText('CodeCard', W / 2, H - 56);

  return canvas.toDataURL('image/png');
}

export async function createLanyardBackImage(opts: {
  profileUrl: string;
  location?: string | null;
  linkCount: number;
  accentColor: string;
}): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#0c0c0c';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = `${opts.accentColor}44`;
  ctx.lineWidth = 2;
  roundRect(ctx, 24, 24, W - 48, H - 48, 28);
  ctx.stroke();

  const qrSize = 200;
  const qrX = (W - qrSize) / 2;
  const qrY = 80;
  ctx.fillStyle = '#fafafa';
  roundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 12);
  ctx.fill();

  const qrImg = await loadImage(
    `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(opts.profileUrl)}&bgcolor=ffffff&color=0a0a0a`,
  );
  if (qrImg) ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = '#71717a';
  ctx.font = '16px system-ui,sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Scan to connect', W / 2, qrY + qrSize + 40);

  if (opts.location) {
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText(opts.location, W / 2, qrY + qrSize + 72);
  }

  const iconY = qrY + qrSize + 110;
  const spacing = 56;
  const startX = W / 2 - ((opts.linkCount - 1) * spacing) / 2;
  for (let i = 0; i < opts.linkCount; i++) {
    ctx.fillStyle = '#3f3f46';
    ctx.beginPath();
    ctx.arc(startX + i * spacing, iconY, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toDataURL('image/png');
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export { parseHeadline } from './parse-headline';

export type { ProfileLinkItem };
