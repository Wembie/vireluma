#!/usr/bin/env node
/**
 * Rasterises brand SVGs into the PNG / WebP / ICO assets browsers, platforms
 * and printers need. SVG files in apps/web/public/brand stay the masters.
 *
 *   pnpm brand:export
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const brand = join(dirname(fileURLToPath(import.meta.url)), '..', 'apps/web/public/brand');
const src = (p) => readFileSync(join(brand, p));

/** Renders an SVG at an exact pixel width (height follows the aspect ratio unless given). */
async function raster(svgPath, outPath, width, height, format = 'png') {
  const target = join(brand, outPath);
  mkdirSync(dirname(target), { recursive: true });
  const image = sharp(src(svgPath), { density: 600 }).resize(width, height ?? null, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
  const buffer =
    format === 'webp'
      ? await image.webp({ quality: 92 }).toBuffer()
      : await image.png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(target, buffer);
  return buffer;
}

/** Packs PNG images into a multi-resolution .ico (PNG-compressed entries). */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + dir.length;
  entries.forEach(({ size, data }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o);
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1);
    dir.writeUInt8(0, o + 2);
    dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(data.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += data.length;
  });
  return Buffer.concat([header, dir, ...entries.map((e) => e.data)]);
}

const SOCIAL_SVG = (lockup) => {
  const inner = lockup
    .toString('utf8')
    .replace(/^<svg[^>]*>|<\/svg>\s*$/g, '')
    .replace(/<title[^>]*>.*?<\/title>/, '');
  const viewBox = /viewBox="([^"]+)"/.exec(lockup.toString('utf8'))[1].split(' ').map(Number);
  const [, , w, h] = viewBox;
  const width = 760;
  const scale = width / w;
  const x = (1200 - width) / 2;
  const y = (630 - h * scale) / 2;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">` +
      `<rect width="1200" height="630" fill="#102A43"/>` +
      `<circle cx="1120" cy="-40" r="300" fill="none" stroke="#8FE1D4" stroke-opacity=".12" stroke-width="2"/>` +
      `<circle cx="1120" cy="-40" r="380" fill="none" stroke="#8FE1D4" stroke-opacity=".08" stroke-width="2"/>` +
      `<g transform="translate(${x} ${y}) scale(${scale})">${inner}</g></svg>`,
  );
};

const tasks = [
  // Favicons and platform icons
  ['icons/favicon.svg', 'icons/favicon-16.png', 16],
  ['icons/favicon.svg', 'icons/favicon-32.png', 32],
  ['icons/favicon.svg', 'icons/favicon-48.png', 48],
  ['icons/app-icon.svg', 'icons/apple-touch-icon.png', 180],
  ['icons/app-icon.svg', 'icons/icon-192.png', 192],
  ['icons/app-icon.svg', 'icons/icon-512.png', 512],
  ['icons/app-icon-maskable.svg', 'icons/icon-maskable-512.png', 512],
  // Logos for documents, partners and print proofs (print uses the SVG masters)
  ['logo/vireluma-symbol.svg', 'logo/png/vireluma-symbol-512.png', 512],
  ['logo/vireluma-symbol.svg', 'logo/png/vireluma-symbol-1024.png', 1024],
  ['logo/vireluma-symbol-white.svg', 'logo/png/vireluma-symbol-white-1024.png', 1024],
  ['logo/vireluma-horizontal.svg', 'logo/png/vireluma-horizontal-1200.png', 1200],
  ['logo/vireluma-horizontal-white.svg', 'logo/png/vireluma-horizontal-white-1200.png', 1200],
  ['logo/vireluma-vertical.svg', 'logo/png/vireluma-vertical-800.png', 800],
  ['logo/vireluma-horizontal.svg', 'logo/webp/vireluma-horizontal-1200.webp', 1200, undefined, 'webp'],
  ['logo/vireluma-symbol.svg', 'logo/webp/vireluma-symbol-512.webp', 512, undefined, 'webp'],
  ['social/avatar.svg', 'social/avatar-400.png', 400],
];

const rendered = {};
for (const [from, to, w, h, f] of tasks) rendered[to] = await raster(from, to, w, h, f);

writeFileSync(
  join(brand, 'icons/favicon.ico'),
  buildIco([16, 32, 48].map((size) => ({ size, data: rendered[`icons/favicon-${size}.png`] }))),
);

const social = await sharp(SOCIAL_SVG(src('logo/vireluma-horizontal-white.svg')), { density: 300 })
  .resize(1200, 630)
  .png({ compressionLevel: 9 })
  .toBuffer();
writeFileSync(join(brand, 'social/social-preview.png'), social);

console.log(`Exported ${tasks.length + 2} raster assets.`);
