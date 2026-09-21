import { FOUNDER_ABOUT } from '@/lib/marketing/founder-about';

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
  ctx.arcTo(x + w, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

export async function createFounderLanyardFaces(): Promise<{
  front: string;
  back: string;
}> {
  const photo = await loadImage(FOUNDER_ABOUT.photoSrc);
  return {
    front: drawFront(photo),
    back: drawBack(),
  };
}

function drawFront(photo: HTMLImageElement | null): string {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#121110';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = `${FOUNDER_ABOUT.accent}66`;
  ctx.lineWidth = 3;
  roundRect(ctx, 22, 22, W - 44, H - 44, 28);
  ctx.stroke();

  const photoX = 40;
  const photoY = 44;
  const photoW = W - 80;
  const photoH = 430;
  roundRect(ctx, photoX, photoY, photoW, photoH, 22);
  ctx.save();
  ctx.clip();
  if (photo) {
    drawCover(ctx, photo, photoX, photoY, photoW, photoH);
  } else {
    ctx.fillStyle = '#272422';
    ctx.fillRect(photoX, photoY, photoW, photoH);
  }
  ctx.restore();

  ctx.fillStyle = '#f6f1ec';
  ctx.textAlign = 'center';
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText(FOUNDER_ABOUT.displayName, W / 2, 530);

  ctx.fillStyle = '#c9c0b8';
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText('Software Engineer', W / 2, 568);
  ctx.fillText('AI/ML Researcher', W / 2, 598);

  ctx.fillStyle = FOUNDER_ABOUT.accent;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('CODECARD', W / 2, H - 52);

  return canvas.toDataURL('image/png');
}

function drawBack(): string {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#0e0d0c';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = `${FOUNDER_ABOUT.accent}55`;
  ctx.lineWidth = 2;
  roundRect(ctx, 22, 22, W - 44, H - 44, 28);
  ctx.stroke();

  ctx.textAlign = 'center';
  const lines: Array<{ text: string; size: number; color: string; y: number }> = [
    { text: FOUNDER_ABOUT.degree, size: 26, color: '#f6f1ec', y: 180 },
    { text: 'Bahçeşehir University', size: 22, color: '#d7cfc7', y: 230 },
    { text: 'Istanbul', size: 20, color: '#a8a29c', y: 268 },
    { text: FOUNDER_ABOUT.focus, size: 22, color: '#f6f1ec', y: 360 },
    { text: 'ASYU 2026', size: 28, color: FOUNDER_ABOUT.accent, y: 430 },
    { text: 'Accepted Author', size: 22, color: '#d7cfc7', y: 472 },
  ];

  for (const line of lines) {
    ctx.fillStyle = line.color;
    ctx.font = `${line.size === 28 || line.size === 26 ? 'bold ' : ''}${line.size}px system-ui, sans-serif`;
    ctx.fillText(line.text, W / 2, line.y);
  }

  ctx.fillStyle = '#5c574f';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('CODECARD', W / 2, H - 52);

  return canvas.toDataURL('image/png');
}
