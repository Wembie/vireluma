import { encode } from 'uqr';

/**
 * QR artwork for printing. Readability beats decoration: square modules,
 * dark-on-light only, a 4-module quiet zone, and when the brand symbol is
 * placed in the centre the error correction goes to H and the covered area is
 * capped well below what H can recover. Every rendering is decoded back
 * (`checkReadable`) before the person prints it.
 */

export type QrLayout = 'card' | 'sticker' | 'wristband' | 'plain';
export type Ecc = 'M' | 'Q' | 'H';

const INK = '#102A43';
const PAPER = '#FFFFFF';
const QUIET = 4;
/** Share of the QR width covered by the centre symbol (area ≈ 4.8%, H recovers ~30%). */
const LOGO_RATIO = 0.22;

const SYMBOL = (x: number, y: number, size: number) => {
  const s = size / 256;
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${INK}"><path d="M128 222Q26 176 54 40Q108 124 128 222Z"/><path d="M128 222Q230 176 202 40Q148 124 128 222Z"/><circle cx="128" cy="60" r="22"/></g>`;
};

const esc = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );

export interface QrModules {
  size: number;
  path: string;
}

export function qrModules(text: string, ecc: Ecc, logo: boolean): QrModules {
  const { data, size } = encode(text, { ecc: logo ? 'H' : ecc, border: QUIET });
  const hole = logo ? logoBox(size) : null;
  let path = '';
  for (let y = 0; y < size; y++) {
    const row = data[y] ?? [];
    let x = 0;
    while (x < size) {
      if (!row[x] || (hole && inside(hole, x, y))) {
        x++;
        continue;
      }
      const start = x;
      while (x < size && row[x] && !(hole && inside(hole, x, y))) x++;
      path += `M${start} ${y}h${x - start}v1h${start - x}z`;
    }
  }
  return { size, path };
}

/** Centre box (in modules) cleared for the symbol, aligned to whole modules. */
export function logoBox(size: number): { x: number; y: number; w: number } {
  const inner = size - QUIET * 2;
  let w = Math.round(inner * LOGO_RATIO);
  if ((inner - w) % 2 !== 0) w += 1;
  const x = QUIET + (inner - w) / 2;
  return { x, y: x, w };
}

const inside = (box: { x: number; y: number; w: number }, x: number, y: number) =>
  x >= box.x && x < box.x + box.w && y >= box.y && y < box.y + box.w;

/** The QR as an SVG group occupying `side` units at (x, y). */
function qrGroup(qr: QrModules, logo: boolean, x: number, y: number, side: number): string {
  const s = side / qr.size;
  let out = `<g transform="translate(${x} ${y}) scale(${s})"><rect width="${qr.size}" height="${qr.size}" fill="${PAPER}"/><path d="${qr.path}" fill="${INK}"/>`;
  if (logo) {
    const box = logoBox(qr.size);
    const pad = box.w * 0.12;
    out += SYMBOL(box.x + pad, box.y + pad, box.w - pad * 2);
  }
  return `${out}</g>`;
}

/** Greedy word wrap by character budget (print text is short and known). */
function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (line && (line + ' ' + word).length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function textBlock(
  lines: string[],
  x: number,
  y: number,
  size: number,
  weight: number,
  lineHeight = 1.25,
): { svg: string; bottom: number } {
  const svg = lines
    .map(
      (l, i) =>
        `<text x="${x}" y="${y + i * size * lineHeight}" font-size="${size}" font-weight="${weight}" fill="${INK}">${esc(l)}</text>`,
    )
    .join('');
  return { svg, bottom: y + (lines.length - 1) * size * lineHeight };
}

export interface ArtworkOptions {
  url: string;
  layout: QrLayout;
  logo: boolean;
  ecc: Ecc;
  labels: { scanMe: string; instructions: string; manual: string };
  /** Printed short address for manual entry, e.g. `wembie.github.io/vireluma/p`. */
  manualUrl: string;
  /** Grouped public ID for manual entry. */
  code: string;
  name: string | null;
}

export interface Artwork {
  svg: string;
  /** Physical size in millimetres (plain: 40 mm square). */
  widthMm: number;
  heightMm: number;
}

const FONT = `font-family="Inter, 'Segoe UI', Roboto, Arial, sans-serif"`;

export function buildArtwork(o: ArtworkOptions): Artwork {
  const qr = qrModules(o.url, o.ecc, o.logo);
  const wrapSvg = (w: number, h: number, body: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm" ${FONT}><rect width="${w}" height="${h}" rx="${o.layout === 'plain' ? 0 : 3}" fill="${PAPER}"/>${body}</svg>`;
  const manual = o.labels.manual.replace('{url}', o.manualUrl);

  switch (o.layout) {
    case 'plain':
      return { svg: wrapSvg(40, 40, qrGroup(qr, o.logo, 0, 0, 40)), widthMm: 40, heightMm: 40 };

    case 'sticker': {
      const head = textBlock([o.labels.scanMe], 25, 6.2, 3.4, 800);
      const body =
        `<g text-anchor="middle">${head.svg}</g>` +
        qrGroup(qr, o.logo, 7, 8, 36) +
        `<g text-anchor="middle">${textBlock([o.code], 25, 47.2, 2.4, 600).svg}</g>`;
      return { svg: wrapSvg(50, 50, body), widthMm: 50, heightMm: 50 };
    }

    case 'wristband': {
      const tx = 26;
      let body = qrGroup(qr, o.logo, 1, 1, 23);
      body += textBlock([o.labels.scanMe], tx, 7, 3.6, 800).svg;
      if (o.name) body += textBlock([o.name], tx, 12.5, 3.2, 700).svg;
      body += textBlock([manual], tx, o.name ? 17.5 : 13, 2.2, 400).svg;
      body += textBlock([o.code], tx, o.name ? 21.5 : 17.5, 2.6, 600).svg;
      return { svg: wrapSvg(130, 25, body), widthMm: 130, heightMm: 25 };
    }

    case 'card': {
      const tx = 50;
      let body = qrGroup(qr, o.logo, 3, 5, 44);
      const head = textBlock(wrap(o.labels.scanMe, 18), tx, 10, 3.6, 800);
      body += head.svg;
      let y = head.bottom + 6;
      if (o.name) {
        const n = textBlock(wrap(o.name, 18), tx, y, 3.4, 700);
        body += n.svg;
        y = n.bottom + 5.5;
      }
      const ins = textBlock(wrap(o.labels.instructions, 30), tx, y, 2.4, 400);
      body += ins.svg;
      // The grouped code is split over two lines so it always fits the 33 mm text column.
      const groups = o.code.split('-');
      const codeLines = [groups.slice(0, 4).join('-'), groups.slice(4).join('-')].filter(Boolean);
      const man = textBlock(wrap(manual, 34), tx, 40.5, 1.9, 400);
      body += man.svg;
      body += textBlock(codeLines, tx, man.bottom + 3.2, 2.3, 600, 1.2).svg;
      body += `<rect x="0.25" y="0.25" width="85.1" height="53.5" rx="3" fill="none" stroke="#C9D3DD" stroke-width="0.25"/>`;
      return { svg: wrapSvg(85.6, 54, body), widthMm: 85.6, heightMm: 54 };
    }
  }
}

/** Rasterises an SVG string (used for PNG download and the readability check). */
export async function svgToCanvas(
  svg: string,
  widthPx: number,
  heightPx: number,
): Promise<HTMLCanvasElement> {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = widthPx;
    canvas.height = heightPx;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas unavailable');
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, widthPx, heightPx);
    ctx.drawImage(img, 0, 0, widthPx, heightPx);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type ReadCheck = 'ok' | 'fail' | 'unsupported';

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}

/**
 * Decodes the rendered QR and compares it with the expected URL. Uses the
 * native BarcodeDetector when available, otherwise loads jsQR on demand (it
 * is never part of the initial page bundle).
 */
export async function checkReadable(svg: string, expected: string): Promise<ReadCheck> {
  let canvas: HTMLCanvasElement;
  try {
    canvas = await svgToCanvas(svg, 480, 480);
  } catch {
    return 'unsupported';
  }
  const Detector = (globalThis as { BarcodeDetector?: new (o: { formats: string[] }) => BarcodeDetectorLike })
    .BarcodeDetector;
  if (Detector) {
    try {
      const codes = await new Detector({ formats: ['qr_code'] }).detect(canvas);
      if (codes.some((c) => c.rawValue === expected)) return 'ok';
    } catch {
      /* fall through to jsQR */
    }
  }
  try {
    const { default: jsQR } = await import('jsqr');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'unsupported';
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
    return result?.data === expected ? 'ok' : 'fail';
  } catch {
    return 'unsupported';
  }
}

export function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Pixels for a physical size at print resolution. */
export const mmToPx = (mm: number, dpi = 300) => Math.round((mm / 25.4) * dpi);
