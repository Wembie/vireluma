/**
 * Lighthouse CI against the built site served by `astro preview` (base path
 * included). Accessibility, SEO and best practices block the build; performance
 * warns because shared CI runners make timing metrics noisy.
 *
 * SEO is audited on production builds only: development builds are noindex
 * on purpose, which Lighthouse would (correctly) penalise.
 */
const port = process.env.LHCI_PORT ?? '4321';
const base = `http://localhost:${port}${process.env.PUBLIC_BASE_PATH ?? '/vireluma'}`;
const production = process.env.PUBLIC_APP_ENV === 'production';

module.exports = {
  ci: {
    collect: {
      startServerCommand: `pnpm --filter @vireluma/web exec astro preview --port ${port}`,
      startServerReadyPattern: `localhost:${port}`,
      url: [`${base}/es/`, `${base}/en/how-it-works/`, `${base}/fr/faq/`],
      numberOfRuns: 1,
      settings: { preset: 'desktop' },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': production ? ['error', { minScore: 0.95 }] : 'off',
        'categories:performance': ['warn', { minScore: 0.9 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
