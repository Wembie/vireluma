import { LOCALES, trimSlashes, type Locale } from '@vireluma/domain';

/**
 * Public marketing routes and their localized slugs.
 *
 * Slugs are part of the public URL contract: once published, changing one
 * requires a redirect page and a sitemap update (see docs/product/internationalization.md).
 */
export const ROUTES = {
  home: { es: '', en: '', pt: '', fr: '' },
  howItWorks: {
    es: 'como-funciona',
    en: 'how-it-works',
    pt: 'como-funciona',
    fr: 'comment-ca-marche',
  },
  useCases: { es: 'casos-de-uso', en: 'use-cases', pt: 'casos-de-uso', fr: 'cas-d-usage' },
  qrNfc: { es: 'qr-y-nfc', en: 'qr-and-nfc', pt: 'qr-e-nfc', fr: 'qr-et-nfc' },
  security: {
    es: 'seguridad-y-privacidad',
    en: 'security-and-privacy',
    pt: 'seguranca-e-privacidade',
    fr: 'securite-et-confidentialite',
  },
  faq: { es: 'preguntas-frecuentes', en: 'faq', pt: 'perguntas-frequentes', fr: 'faq' },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof ROUTES;

export const ROUTE_KEYS = Object.keys(ROUTES) as RouteKey[];

/** Route path relative to the base path, e.g. `es/como-funciona/`. */
export function routePath(locale: Locale, key: RouteKey): string {
  const slug = ROUTES[key][locale];
  return slug ? `${locale}/${slug}/` : `${locale}/`;
}

/** Finds the route for a path relative to the base path (leading/trailing slashes optional). */
export function matchRoute(relativePath: string): { locale: Locale; key: RouteKey } | null {
  const [first = '', ...rest] = trimSlashes(relativePath).split('/');
  const locale = LOCALES.find((l) => l === first);
  if (!locale) return null;
  const slug = rest.join('/');
  const key = ROUTE_KEYS.find((k) => ROUTES[k][locale] === slug);
  return key ? { locale, key } : null;
}

/** Every locale variant of a route, used for hreflang and sitemaps. */
export function alternates(key: RouteKey): { locale: Locale; path: string }[] {
  return LOCALES.map((locale) => ({ locale, path: routePath(locale, key) }));
}

/**
 * Account area pages (noindex, same slug in every locale — they are not marketing pages).
 * `account` is the dashboard at `/{locale}/app/`. Person-specific pages take `?id=<uuid>`
 * (an internal key protected by RLS, never personal data).
 */
export const APP_PAGES = [
  'account',
  'new',
  'person',
  'qr',
  'invite',
  'settings',
  'login',
  'register',
  'check-email',
  'forgot-password',
  'reset-password',
  'callback',
] as const;

export type AppPage = (typeof APP_PAGES)[number];

export function appPath(locale: Locale, page: AppPage): string {
  return page === 'account' ? `${locale}/app/` : `${locale}/app/${page}/`;
}
