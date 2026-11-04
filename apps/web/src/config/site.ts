import { createUrlService } from '@vireluma/domain';

/**
 * Runtime view of the deployment configuration. Origin and base path come from
 * astro.config.ts (via site.config.ts) — never hardcode them elsewhere.
 */
export const urls = createUrlService({
  origin: import.meta.env.SITE,
  basePath: import.meta.env.BASE_URL,
});

export const build = {
  version: import.meta.env.PUBLIC_APP_VERSION,
  sha: import.meta.env.PUBLIC_BUILD_SHA,
  environment: import.meta.env.PUBLIC_APP_ENV,
  /** Search engines may index public marketing pages only in production builds. */
  indexable: import.meta.env.PUBLIC_INDEXABLE,
} as const;

export const project = {
  repositoryUrl: import.meta.env.PUBLIC_REPOSITORY_URL ?? 'https://github.com/Wembie/vireluma',
} as const;

/** True when this build talks to a backend (accounts available). */
export const backend = {
  configured: Boolean(import.meta.env.PUBLIC_SUPABASE_URL && import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY),
} as const;

export const securityPolicyUrl = `${project.repositoryUrl}/security/policy`;
