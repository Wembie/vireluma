/**
 * Message formatting without sentence concatenation: whole sentences live in
 * the dictionaries with `{placeholders}`; plurals use CLDR rules via
 * Intl.PluralRules (e.g. French treats 0 as singular).
 */

export type PluralForms = { one: string; other: string };

export function fmt(template: string, values: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : match,
  );
}

const pluralRules = new Map<string, Intl.PluralRules>();

export function plural(
  forms: PluralForms,
  count: number,
  locale: string,
  values: Record<string, string | number> = {},
): string {
  let rules = pluralRules.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale);
    pluralRules.set(locale, rules);
  }
  const form = rules.select(count) === 'one' ? forms.one : forms.other;
  return fmt(form, { count: count.toLocaleString(locale), ...values });
}

/** Dates are shown in the reader's locale; times only where they matter. */
export function formatDate(iso: string | null | undefined, locale: string, withTime = false): string {
  if (!iso) return '';
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    ...(withTime && { timeStyle: 'short' }),
  }).format(date);
}

/** Localised country name from an ISO code (falls back to the code). */
export function countryName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
