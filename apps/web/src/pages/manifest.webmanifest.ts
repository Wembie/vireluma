import type { APIRoute } from 'astro';
import { DEFAULT_LOCALE } from '@vireluma/domain';
import { urls } from '../config/site';
import { getDictionary, routePath } from '../i18n';

/**
 * Web app manifest (install metadata only). No service worker is registered:
 * offline caching of emergency data is a deliberate M3 decision, see roadmap.
 */
export const GET: APIRoute = () => {
  const t = getDictionary(DEFAULT_LOCALE);
  const manifest = {
    name: 'VIRELUMA',
    short_name: 'VIRELUMA',
    description: t.footer.description,
    lang: DEFAULT_LOCALE,
    start_url: urls.path(routePath(DEFAULT_LOCALE, 'home')),
    scope: urls.path(''),
    display: 'standalone',
    background_color: '#F7FAFC',
    theme_color: '#102A43',
    icons: [
      { src: urls.asset('brand/icons/icon-192.png'), sizes: '192x192', type: 'image/png' },
      { src: urls.asset('brand/icons/icon-512.png'), sizes: '512x512', type: 'image/png' },
      {
        src: urls.asset('brand/icons/icon-maskable-512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      { src: urls.asset('brand/icons/favicon.svg'), sizes: 'any', type: 'image/svg+xml' },
    ],
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
};
