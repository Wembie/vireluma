#!/usr/bin/env node
/**
 * Fails the build when shipped JavaScript or CSS exceeds its budget.
 * Budgets are gzip sizes per page (what a phone on a slow network downloads).
 *
 *   node scripts/bundle-budget.mjs apps/web/dist
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { parse } from 'node-html-parser';

const dist = process.argv[2] ?? 'apps/web/dist';
const KB = 1024;

/** Public pages are content pages: they should need almost no JavaScript. */
const BUDGETS = [
  { match: /^design-system\//, js: 80 * KB, css: 30 * KB },
  // Account area: React + auth client. Never loaded on public or emergency pages.
  // The emergency page falls under the default 12 KB budget (no framework).
  { match: /^[a-z]{2}\/app\//, js: 110 * KB, css: 30 * KB },
  { match: /.*/, js: 12 * KB, css: 25 * KB },
];

const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const full = join(dir, n);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const gz = new Map();
const gzipSize = (file) => {
  if (!gz.has(file)) gz.set(file, gzipSync(readFileSync(file)).length);
  return gz.get(file);
};

/** Resolves an asset URL (with any base path) to its file in dist. */
const toFile = (url) => {
  const idx = url.indexOf('/_astro/');
  return idx === -1 ? null : join(dist, url.slice(idx + 1));
};

const failures = [];
const rows = [];
for (const file of walk(dist).filter((f) => f.endsWith('.html'))) {
  const rel = relative(dist, file).split(sep).join('/');
  const html = readFileSync(file, 'utf8');
  const root = parse(html);
  const js = new Set();
  // Module scripts and island component/renderer URLs.
  for (const s of root.querySelectorAll('script[src]')) js.add(s.getAttribute('src'));
  for (const m of html.matchAll(/(?:component-url|renderer-url)="([^"]+)"/g)) js.add(m[1]);
  for (const m of html.matchAll(/import\("([^"]+\.js)"\)|from\s*"([^"]+\.js)"/g)) js.add(m[1] ?? m[2]);
  const css = root.querySelectorAll('link[rel="stylesheet"]').map((l) => l.getAttribute('href'));

  const sum = (urls) =>
    [...urls].reduce((total, url) => {
      const f = url && toFile(url);
      return f ? total + gzipSize(f) : total;
    }, 0);
  const inlineJs = root
    .querySelectorAll('script:not([src]):not([type="application/ld+json"]):not([type="application/json"])')
    .reduce((t, s) => t + gzipSync(s.text).length, 0);
  const jsBytes = sum(js) + inlineJs;
  const cssBytes = sum(css);
  const budget = BUDGETS.find((b) => b.match.test(rel));
  rows.push({ page: rel, js: jsBytes, css: cssBytes });
  if (jsBytes > budget.js) failures.push(`${rel}: JS ${(jsBytes / KB).toFixed(1)} KB > ${budget.js / KB} KB`);
  if (cssBytes > budget.css)
    failures.push(`${rel}: CSS ${(cssBytes / KB).toFixed(1)} KB > ${budget.css / KB} KB`);
}

const max = (k) => rows.reduce((a, r) => (r[k] > a[k] ? r : a), rows[0]);
const fmt = (n) => `${(n / KB).toFixed(1)} KB`;
console.log(
  `Pages: ${rows.length} · heaviest JS: ${max('js').page} ${fmt(max('js').js)} · heaviest CSS: ${max('css').page} ${fmt(max('css').css)} (gzip)`,
);
if (failures.length) {
  console.error(failures.map((f) => `✖ ${f}`).join('\n'));
  process.exit(1);
}
console.log('✔ Bundle budgets respected.');
