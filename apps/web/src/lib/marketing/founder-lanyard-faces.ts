import { FOUNDER_ABOUT } from '@/lib/marketing/founder-about';

const W = 1024;
const H = 1536;

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
  ctx.arcTo(x, y, x + w, y, r);
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
  focusY = 0.32,
) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = x + (w - dw) / 2;
  const extraY = dh - h;
  const dy = y - extraY * focusY;
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
  const [front, back] = await Promise.all([
    exportFace(drawFront(photo)),
    exportFace(drawBack(photo)),
  ]);
  return { front, back };
}

function exportFace(canvas: HTMLCanvasElement | null): Promise<string> {
  if (!canvas) return Promise.resolve('');
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(canvas.toDataURL('image/jpeg', 0.92));
          return;
        }
        resolve(URL.createObjectURL(blob));
      },
      'image/jpeg',
      0.92,
    );
  });
}

function drawFront(photo: HTMLImageElement | null): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#121110';
  ctx.fillRect(0, 0, W, H);

  if (photo) {
    drawCover(ctx, photo, 0, 0, W, H, 0.22);
  }

  const fade = ctx.createLinearGradient(0, H * 0.34, 0, H);
  fade.addColorStop(0, 'rgba(10, 8, 7, 0)');
  fade.addColorStop(0.32, 'rgba(10, 8, 7, 0.35)');
  fade.addColorStop(0.62, 'rgba(10, 8, 7, 0.82)');
  fade.addColorStop(1, 'rgba(10, 8, 7, 0.97)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = FOUNDER_ABOUT.accent;
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillText('CODECARD', W / 2, H - 470);

  ctx.fillStyle = '#f6f1ec';
  ctx.font = 'bold 76px system-ui, sans-serif';
  ctx.fillText(FOUNDER_ABOUT.displayName, W / 2, H - 380);

  ctx.fillStyle = '#f0e7dd';
  ctx.font = '36px system-ui, sans-serif';
  let textY = H - 318;
  for (const line of wrapCentered(ctx, FOUNDER_ABOUT.headline, W - 72)) {
    ctx.fillText(line, W / 2, textY);
    textY += 46;
  }

  ctx.fillStyle = '#ddd3c8';
  ctx.font = '32px system-ui, sans-serif';
  ctx.fillText(FOUNDER_ABOUT.degree, W / 2, H - 210);
  ctx.fillText(FOUNDER_ABOUT.school, W / 2, H - 164);
  ctx.fillText(FOUNDER_ABOUT.focus, W / 2, H - 118);

  ctx.fillStyle = FOUNDER_ABOUT.accent;
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText(FOUNDER_ABOUT.publication, W / 2, H - 64);

  return canvas;
}

function drawBack(photo: HTMLImageElement | null): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#141210';
  ctx.fillRect(0, 0, W, H);

  if (photo) {
    ctx.globalAlpha = 0.18;
    drawCover(ctx, photo, 0, 0, W, H, 0.22);
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = 'rgba(10, 8, 7, 0.72)';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = `${FOUNDER_ABOUT.accent}88`;
  ctx.lineWidth = 4;
  roundRect(ctx, 48, 48, W - 96, H - 96, 40);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = FOUNDER_ABOUT.accent;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('CODECARD', W / 2, 140);

  const rows: Array<{ label: string; value: string }> = [
    { label: 'Name', value: FOUNDER_ABOUT.displayName },
    { label: 'Role', value: FOUNDER_ABOUT.headline },
    { label: 'Degree', value: FOUNDER_ABOUT.degree },
    { label: 'School', value: FOUNDER_ABOUT.school },
    { label: 'Focus', value: FOUNDER_ABOUT.focus },
    { label: 'Publication', value: FOUNDER_ABOUT.publication },
  ];

  let y = 230;
  for (const row of rows) {
    ctx.fillStyle = '#8a8178';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(row.label.toUpperCase(), W / 2, y);
    ctx.fillStyle = '#f6f1ec';
    ctx.font = 'bold 32px system-ui, sans-serif';
    const lines = wrapCentered(ctx, row.value, W - 160);
    for (const line of lines) {
      y += 44;
      ctx.fillText(line, W / 2, y);
    }
    y += 52;
  }

  return canvas;
}

function wrapCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
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
