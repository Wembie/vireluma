#!/usr/bin/env node
/**
 * Static SEO and privacy audit of a built site.
 *
 *   node scripts/seo-check.mjs apps/web/dist
 *
 * Fails when public pages lack unique titles/descriptions, canonical URLs or
 * reciprocal hreflang, when JSON-LD is invalid, or when private routes
 * (/p/, /app/, /design-system/, 404) are indexable or listed in the sitemap.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parse } from 'node-html-parser';

const dist = process.argv[2] ?? 'apps/web/dist';
const origin = (process.env.PUBLIC_SITE_ORIGIN ?? 'https://wembie.github.io').replace(/\/$/, '');
const basePath = `/${(process.env.PUBLIC_BASE_PATH ?? '/vireluma').replace(/^\/+|\/+$/g, '')}`.replace(
  /^\/$/,
  '',
);
const production = process.env.PUBLIC_APP_ENV === 'production';
const PRIVATE = /^(p|app|design-system)\/|^404\.html$/;

const errors = [];
const error = (file, message) => errors.push(`${file}: ${message}`);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const htmlFiles = walk(dist)
  .filter((f) => f.endsWith('.html'))
  .map((f) => relative(dist, f).split(sep).join('/'));

const urlFor = (file) => `${origin}${basePath}/${file.replace(/index\.html$/, '')}`;
const pages = new Map();

for (const file of htmlFiles) {
  const root = parse(readFileSync(join(dist, file), 'utf8'));
  const robots = root.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '';
  const page = {
    file,
    url: urlFor(file),
    title: root.querySelectorAll('title').map((t) => t.text.trim()),
    description: root.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
    canonical: root.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    lang: root.querySelector('html')?.getAttribute('lang'),
    robots,
    hreflang: root
      .querySelectorAll('link[rel="alternate"][hreflang]')
      .map((l) => ({ lang: l.getAttribute('hreflang'), href: l.getAttribute('href') })),
    jsonLd: root.querySelectorAll('script[type="application/ld+json"]').map((s) => s.text),
    h1: root.querySelectorAll('h1').length,
    ogImage: root.querySelector('meta[property="og:image"]')?.getAttribute('content'),
  };
  pages.set(page.url, page);

  if (PRIVATE.test(file)) {
    if (!/noindex/.test(robots)) error(file, 'private route must be noindex');
    continue;
  }

  if (page.title.length !== 1 || !page.title[0]) error(file, 'needs exactly one non-empty <title>');
  if (page.description.length < 50 || page.description.length > 200)
    error(file, `meta description length ${page.description.length} outside 50–200`);
  if (page.canonical !== page.url) error(file, `canonical ${page.canonical} ≠ ${page.url}`);
  if (!page.lang) error(file, 'missing <html lang>');
  if (page.h1 !== 1) error(file, `expected one <h1>, found ${page.h1}`);
  if (!page.ogImage?.startsWith(`${origin}${basePath}/`))
    error(file, 'og:image must be an absolute site URL');
  if (production && !/(^|,\s*)index/.test(robots)) error(file, 'production public page must be indexable');
  if (!production && !/noindex/.test(robots)) error(file, 'non-production builds must be noindex');
  for (const raw of page.jsonLd) {
    try {
      JSON.parse(raw);
    } catch {
      error(file, 'invalid JSON-LD');
    }
  }
}

// Titles and descriptions must be unique across public pages.
const publicPages = [...pages.values()].filter((p) => !PRIVATE.test(p.file));
for (const key of ['title', 'description']) {
  const seen = new Map();
  for (const p of publicPages) {
    const value = String(p[key]);
    if (seen.has(value)) error(p.file, `duplicate ${key} (also in ${seen.get(value)})`);
    seen.set(value, p.file);
  }
}

// hreflang must be reciprocal and point to existing pages.
for (const p of publicPages) {
  for (const alt of p.hreflang) {
    const target = pages.get(alt.href);
    if (!target) {
      error(p.file, `hreflang ${alt.lang} → missing page ${alt.href}`);
      continue;
    }
    if (alt.lang !== 'x-default' && !target.hreflang.some((b) => b.href === p.canonical))
      error(p.file, `hreflang ${alt.lang} → ${alt.href} does not link back`);
  }
}

// Sitemap: only public, existing pages.
const sitemaps = readdirSync(dist).filter((f) => /^sitemap-\d+\.xml$/.test(f));
if (sitemaps.length === 0) error('sitemap', 'no sitemap-N.xml generated');
for (const sm of sitemaps) {
  const locs = [...readFileSync(join(dist, sm), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const loc of locs) {
    const path = loc.slice(`${origin}${basePath}/`.length);
    if (PRIVATE.test(path) || /\/(p|app|design-system)\//.test(loc)) error(sm, `private URL listed: ${loc}`);
    if (!pages.has(loc)) error(sm, `URL without page: ${loc}`);
  }
  for (const p of publicPages) if (!locs.includes(p.url)) error(sm, `public page missing: ${p.url}`);
}

if (errors.length) {
  console.error(errors.map((e) => `✖ ${e}`).join('\n'));
  console.error(`\nSEO check failed with ${errors.length} problem(s).`);
  process.exit(1);
}
console.log(
  `✔ SEO check passed: ${publicPages.length} public pages, ${pages.size - publicPages.length} private.`,
);
