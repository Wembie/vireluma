import { LOCALES, type Locale } from '@vireluma/domain';
import { en } from './dictionaries/en.ts';
import { es } from './dictionaries/es.ts';
import { fr } from './dictionaries/fr.ts';
import { pt } from './dictionaries/pt.ts';
import type { Dictionary } from './types.ts';

export const DICTIONARIES: Record<Locale, Dictionary> = { es, en, pt, fr };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/** BCP 47 tags used in `lang` and `hreflang`. Language-only: content is not region-specific. */
export const HTML_LANG: Record<Locale, string> = { es: 'es', en: 'en', pt: 'pt', fr: 'fr' };

export { LOCALES };
export type { Dictionary, Locale };
export * from './routes.ts';
