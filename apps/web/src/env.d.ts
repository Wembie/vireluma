/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Injected at build time from /VERSION. */
  readonly PUBLIC_APP_VERSION: string;
  /** Git commit the build was produced from. */
  readonly PUBLIC_BUILD_SHA: string;
  readonly PUBLIC_APP_ENV: 'local' | 'development' | 'production';
  readonly PUBLIC_INDEXABLE: boolean;
  readonly PUBLIC_REPOSITORY_URL?: string;
  /** Google Search Console HTML-tag verification token. */
  readonly PUBLIC_GOOGLE_SITE_VERIFICATION?: string;
  /** Supabase project URL and publishable key (public by design). Unset = no backend in this build. */
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
