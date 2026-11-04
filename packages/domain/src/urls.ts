import { parsePublicId, type PublicId } from './public-id.ts';

/**
 * Centralised public URL generation.
 *
 * Every absolute URL the product emits (canonical links, sitemaps, QR codes,
 * NFC payloads, emails) must come from a `UrlService`. The deployment origin
 * and base path are configuration, never literals in application code, so a
 * move from GitHub Pages (`https://wembie.github.io/vireluma`) to a custom
 * domain is a configuration change. See docs/deployment/custom-domain-migration.md.
 */

export interface UrlConfig {
  /** Scheme + host (+ port), e.g. `https://wembie.github.io`. */
  readonly origin: string;
  /** Deployment prefix, e.g. `/vireluma` on a GitHub project site, or `` / `/` at a domain root. */
  readonly basePath: string;
}

export interface UrlService {
  readonly origin: string;
  /** Normalised base path: either `` or `/segment(s)` without trailing slash. */
  readonly basePath: string;
  /** Root-relative path including the base path. Page paths keep a trailing slash. */
  path(routePath: string): string;
  /** Absolute URL for a route path. */
  absolute(routePath: string): string;
  /** Root-relative URL for a static asset (no trailing slash added). */
  asset(assetPath: string): string;
  /** Absolute URL for a static asset. */
  absoluteAsset(assetPath: string): string;
  /** The permanent emergency profile URL encoded in QR codes and NFC tags. */
  profileUrl(id: PublicId): string;
}

/** Route that resolves public identifiers. Part of the permanent URL contract — never rename. */
export const PROFILE_RESOLVER_PATH = '/p/';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function normalizeOrigin(origin: string): string {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    throw new Error(`Invalid origin: "${origin}"`);
  }
  if (url.pathname !== '/' || url.search || url.hash || origin.includes('#')) {
    throw new Error(`Origin must not contain a path, query or fragment: "${origin}"`);
  }
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname))) {
    throw new Error(`Origin must use HTTPS: "${origin}"`);
  }
  return url.origin;
}

export function normalizeBasePath(basePath: string): string {
  const trimmed = basePath.trim().replace(/^\/+|\/+$/g, '');
  if (trimmed === '') return '';
  if (!/^[A-Za-z0-9._~-]+(\/[A-Za-z0-9._~-]+)*$/.test(trimmed)) {
    throw new Error(`Invalid base path: "${basePath}"`);
  }
  return `/${trimmed}`;
}

function joinPath(basePath: string, routePath: string, trailingSlash: boolean): string {
  const clean = routePath.replace(/^\/+/, '');
  let path = `${basePath}/${clean}`;
  if (trailingSlash && !path.endsWith('/') && !/\.[a-z0-9]+$/i.test(path)) path += '/';
  return path;
}

export function createUrlService(config: UrlConfig): UrlService {
  const origin = normalizeOrigin(config.origin);
  const basePath = normalizeBasePath(config.basePath);

  const path = (routePath: string) => joinPath(basePath, routePath, true);
  const asset = (assetPath: string) => joinPath(basePath, assetPath, false);

  return {
    origin,
    basePath,
    path,
    absolute: (routePath) => `${origin}${path(routePath)}`,
    asset,
    absoluteAsset: (assetPath) => `${origin}${asset(assetPath)}`,
    profileUrl: (id) => `${origin}${path(PROFILE_RESOLVER_PATH)}#${id}`,
  };
}

/**
 * Extracts the public identifier from the resolver page location.
 * The canonical form is the fragment (`/p/#ID`) so the identifier is never
 * sent to the static host or leaked through `Referer`. `?id=` is accepted as a
 * fallback for scanners or links that drop fragments.
 */
export function readProfileIdFromLocation(location: { hash: string; search: string }): PublicId | null {
  const fromHash = location.hash.replace(/^#/, '');
  if (fromHash) {
    try {
      return parsePublicId(decodeURIComponent(fromHash));
    } catch {
      return null;
    }
  }
  const fromQuery = new URLSearchParams(location.search).get('id');
  return fromQuery ? parsePublicId(fromQuery) : null;
}
