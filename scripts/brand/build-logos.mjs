#!/usr/bin/env node
/**
 * Generates every VIRELUMA logo variant from a single geometry source so the
 * symbol, lockups and icons can never drift apart.
 *
 *   node scripts/brand/build-logos.mjs
 *
 * Inputs:  brand/source/wordmark.json (outlined Manrope 700, OFL)
 * Outputs: apps/web/public/brand/{logo,icons}/*.svg
 * Rasters: run `pnpm brand:export` afterwards.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = (p) => join(root, 'apps/web/public/brand', p);

export const COLORS = {
  navy: '#102A43',
  teal: '#0F766E',
  mint: '#8FE1D4',
  gold: '#F4B860',
  white: '#FFFFFF',
  black: '#000000',
};

/**
 * Symbol geometry on a 256 grid. Two tapered forms grow from one root — the
 * person and the one who helps — leaving a rising channel of negative space
 * that ends in a point of light.
 */
const SYMBOL = {
  left: 'M128 222Q26 176 54 40Q108 124 128 222Z',
  right: 'M128 222Q230 176 202 40Q148 124 128 222Z',
  light: { cx: 128, cy: 60, r: 22 },
  // Visual bounds of the drawing inside the 256 grid.
  bbox: { x: 48, y: 38, w: 160, h: 184 },
};

const PALETTES = {
  color: { left: COLORS.navy, right: COLORS.teal, light: COLORS.gold, text: COLORS.navy },
  reversed: { left: COLORS.white, right: COLORS.mint, light: COLORS.gold, text: COLORS.white },
  navy: { left: COLORS.navy, right: COLORS.navy, light: COLORS.navy, text: COLORS.navy },
  black: { left: COLORS.black, right: COLORS.black, light: COLORS.black, text: COLORS.black },
  white: { left: COLORS.white, right: COLORS.white, light: COLORS.white, text: COLORS.white },
};

const wordmark = JSON.parse(readFileSync(join(root, 'brand/source/wordmark.json'), 'utf8'));
const wordmarkPath = wordmark.d.replace(/-?\d+\.\d+/g, (n) => String(Math.round(Number(n) * 10) / 10));

const svg = (viewBox, title, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-labelledby="t">` +
  `<title id="t">${title}</title>${body}</svg>\n`;

function symbolBody(p, transform = '') {
  const t = transform ? ` transform="${transform}"` : '';
  const { cx, cy, r } = SYMBOL.light;
  return (
    `<g${t}><path fill="${p.left}" d="${SYMBOL.left}"/>` +
    `<path fill="${p.right}" d="${SYMBOL.right}"/>` +
    `<circle fill="${p.light}" cx="${cx}" cy="${cy}" r="${r}"/></g>`
  );
}

/** Cap height of the wordmark relative to the symbol's visual height. */
const CAP_RATIO = 0.4;
const { bbox } = SYMBOL;
const wmScale = (bbox.h * CAP_RATIO) / wordmark.capHeight;
const wmWidth = wordmark.advanceWidth * wmScale;
const wmHeight = wordmark.capHeight * wmScale;
const r1 = (n) => Math.round(n * 100) / 100;

function wordmarkBody(fill, x, y) {
  return `<path fill="${fill}" transform="translate(${r1(x)} ${r1(y)}) scale(${r1(wmScale * 1e4) / 1e4})" d="${wordmarkPath}"/>`;
}

function horizontal(p) {
  const gap = bbox.w * 0.32;
  const width = bbox.w + gap + wmWidth;
  const body =
    symbolBody(p, `translate(${-bbox.x} ${-bbox.y})`) +
    wordmarkBody(p.text, bbox.w + gap, (bbox.h - wmHeight) / 2 + bbox.h * 0.04);
  return svg(`0 0 ${r1(width)} ${bbox.h}`, 'VIRELUMA', body);
}

function vertical(p) {
  const gap = bbox.h * 0.22;
  const width = Math.max(wmWidth, bbox.w);
  const height = bbox.h + gap + wmHeight;
  const body =
    symbolBody(p, `translate(${r1((width - bbox.w) / 2 - bbox.x)} ${-bbox.y})`) +
    wordmarkBody(p.text, (width - wmWidth) / 2, bbox.h + gap);
  return svg(`0 0 ${r1(width)} ${r1(height)}`, 'VIRELUMA', body);
}

function wordmarkOnly(fill) {
  return svg(`0 0 ${r1(wmWidth)} ${r1(wmHeight)}`, 'VIRELUMA', wordmarkBody(fill, 0, 0));
}

function symbol(p) {
  return svg('0 0 256 256', 'VIRELUMA symbol', symbolBody(p));
}

/** Symbol on a navy tile. `inset` < 1 shrinks the mark into the maskable safe zone. */
function tile(inset, radius) {
  const scale = inset;
  const offset = (256 * (1 - scale)) / 2;
  // Optical centre: nudge up slightly because the mark is heavier at the base.
  const t = `translate(${r1(offset)} ${r1(offset + 4 * scale)}) scale(${scale})`;
  return svg(
    '0 0 256 256',
    'VIRELUMA',
    `<rect width="256" height="256" rx="${radius}" fill="${COLORS.navy}"/>` +
      symbolBody(PALETTES.reversed, t),
  );
}

const files = {
  'logo/vireluma-symbol.svg': symbol(PALETTES.color),
  'logo/vireluma-symbol-white.svg': symbol(PALETTES.reversed),
  'logo/vireluma-symbol-mono-navy.svg': symbol(PALETTES.navy),
  'logo/vireluma-symbol-mono-black.svg': symbol(PALETTES.black),
  'logo/vireluma-symbol-mono-white.svg': symbol(PALETTES.white),
  'logo/vireluma-horizontal.svg': horizontal(PALETTES.color),
  'logo/vireluma-horizontal-white.svg': horizontal(PALETTES.reversed),
  'logo/vireluma-horizontal-mono-navy.svg': horizontal(PALETTES.navy),
  'logo/vireluma-horizontal-mono-black.svg': horizontal(PALETTES.black),
  'logo/vireluma-horizontal-mono-white.svg': horizontal(PALETTES.white),
  'logo/vireluma-vertical.svg': vertical(PALETTES.color),
  'logo/vireluma-vertical-white.svg': vertical(PALETTES.reversed),
  'logo/vireluma-wordmark.svg': wordmarkOnly(COLORS.navy),
  'logo/vireluma-wordmark-white.svg': wordmarkOnly(COLORS.white),
  'icons/favicon.svg': tile(0.86, 56),
  'icons/app-icon.svg': tile(0.86, 56),
  // Full-bleed square; platforms apply their own mask. Mark kept inside the 80% safe zone.
  'icons/app-icon-maskable.svg': tile(0.66, 0),
  'social/avatar.svg': tile(0.7, 0),
};

for (const [path, content] of Object.entries(files)) {
  const target = out(path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}
console.log(`Wrote ${Object.keys(files).length} logo files to apps/web/public/brand/`);
