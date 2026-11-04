/** Locales supported by the product. Order is the display order in language pickers. */
export const LOCALES = ['es', 'en', 'pt', 'fr'] as const;

export type Locale = (typeof LOCALES)[number];

/** Colombia is the launch market, so Spanish is the default locale. */
export const DEFAULT_LOCALE: Locale = 'es';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Picks the best supported locale from an ordered list of BCP 47 tags
 * (e.g. `navigator.languages`). Falls back to the default locale.
 */
export function negotiateLocale(preferred: readonly string[]): Locale {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
