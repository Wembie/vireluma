/**
 * Deployment configuration — the ONLY place where the public origin and base
 * path are defined. Everything else derives URLs from `import.meta.env.SITE`
 * and `import.meta.env.BASE_URL` (set by Astro from these values) through the
 * domain `UrlService`.
 *
 * Moving to a custom domain = set PUBLIC_SITE_ORIGIN and PUBLIC_BASE_PATH in
 * the deployment environment. No application code changes.
 */
import { normalizeBasePath, normalizeOrigin } from '@vireluma/domain';

export type AppEnvironment = 'local' | 'development' | 'production';

export interface SiteConfig {
  origin: string;
  basePath: string;
  environment: AppEnvironment;
  /** Only production builds may be indexed by search engines. */
  indexable: boolean;
}

const DEFAULT_ORIGIN = 'https://wembie.github.io';
const DEFAULT_BASE_PATH = '/vireluma';

function readEnvironment(value: string | undefined): AppEnvironment {
  if (value === 'production' || value === 'development') return value;
  return 'local';
}

export function resolveSiteConfig(env: Record<string, string | undefined>): SiteConfig {
  const environment = readEnvironment(env.PUBLIC_APP_ENV);
  return {
    origin: normalizeOrigin(env.PUBLIC_SITE_ORIGIN ?? DEFAULT_ORIGIN),
    basePath: normalizeBasePath(env.PUBLIC_BASE_PATH ?? DEFAULT_BASE_PATH),
    environment,
    indexable: environment === 'production',
  };
}
