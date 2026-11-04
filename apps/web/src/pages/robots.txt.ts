import type { APIRoute } from 'astro';
import { LOCALES } from '@vireluma/domain';
import { build, urls } from '../config/site';

/**
 * Note: on a GitHub *project* site (wembie.github.io/vireluma/) crawlers only
 * read robots.txt at the host root, which this repository does not control.
 * Indexing rules are therefore also enforced per page with <meta name="robots">.
 * This file becomes authoritative once the site moves to its own domain.
 */
export const GET: APIRoute = () => {
  const lines = build.indexable
    ? [
        'User-agent: *',
        'Allow: /',
        `Disallow: ${urls.path('p/')}`,
        ...LOCALES.map((locale) => `Disallow: ${urls.path(`${locale}/app/`)}`),
        `Disallow: ${urls.path('design-system/')}`,
        '',
        `Sitemap: ${urls.absoluteAsset('sitemap-index.xml')}`,
      ]
    : ['User-agent: *', 'Disallow: /'];
  return new Response(`${lines.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
