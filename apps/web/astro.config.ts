import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { DEFAULT_LOCALE, LOCALES, createUrlService } from '@vireluma/domain';
import { alternates, matchRoute } from './src/i18n/routes.ts';
import { resolveSiteConfig } from './site.config.ts';

const site = resolveSiteConfig(process.env);
const urls = createUrlService(site);

const version = readFileSync(new URL('../../VERSION', import.meta.url), 'utf8').trim();

function gitSha(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

/** Routes that must never appear in sitemaps or search results. */
const PRIVATE_ROUTE = /\/(p|app|design-system)\//;

export default defineConfig({
  site: site.origin,
  base: site.basePath || '/',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  compressHTML: true,
  i18n: {
    locales: [...LOCALES],
    defaultLocale: DEFAULT_LOCALE,
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !PRIVATE_ROUTE.test(new URL(page).pathname) && !page.endsWith('/404/'),
      // Localized slugs differ per language, so hreflang alternates come from the route map
      // rather than the integration's same-path assumption.
      serialize(item) {
        const relative = new URL(item.url).pathname.slice(urls.basePath.length);
        const match = matchRoute(relative);
        if (!match) return item;
        return {
          ...item,
          links: alternates(match.key).map(({ locale, path }) => ({
            lang: locale,
            url: urls.absolute(path),
          })),
        };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.PUBLIC_APP_VERSION': JSON.stringify(version),
      'import.meta.env.PUBLIC_BUILD_SHA': JSON.stringify(gitSha()),
      'import.meta.env.PUBLIC_APP_ENV': JSON.stringify(site.environment),
      'import.meta.env.PUBLIC_INDEXABLE': JSON.stringify(site.indexable),
    },
  },
});
