/**
 * Phone numbers are stored in E.164 (`+573001234567`). Formatting is a
 * presentation concern. This is deliberately NOT a full numbering-plan
 * library: the UI always shows the normalised number back to the person
 * before saving, so a human confirms what an emergency helper will dial.
 */

/** ISO 3166-1 alpha-2 → ITU calling code, for the countries offered in forms. */
export const CALLING_CODES = {
  AR: '54',
  BO: '591',
  BR: '55',
  BZ: '501',
  CA: '1',
  CL: '56',
  CO: '57',
  CR: '506',
  CU: '53',
  DO: '1',
  EC: '593',
  GT: '502',
  GY: '592',
  HN: '504',
  HT: '509',
  JM: '1',
  MX: '52',
  NI: '505',
  PA: '507',
  PE: '51',
  PR: '1',
  PY: '595',
  SR: '597',
  SV: '503',
  TT: '1',
  US: '1',
  UY: '598',
  VE: '58',
  AO: '244',
  BE: '32',
  CH: '41',
  CV: '238',
  DE: '49',
  ES: '34',
  FR: '33',
  GB: '44',
  IE: '353',
  IT: '39',
  LU: '352',
  MA: '212',
  MZ: '258',
  NL: '31',
  PT: '351',
  SN: '221',
} as const satisfies Record<string, string>;

export type CountryCode = keyof typeof CALLING_CODES;

export const COUNTRY_CODES = Object.keys(CALLING_CODES).sort() as CountryCode[];

export function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === 'string' && Object.hasOwn(CALLING_CODES, value);
}

/** National trunk prefix `0` that is dropped when dialling internationally. */
const TRUNK_ZERO = new Set<CountryCode>(['BE', 'CH', 'DE', 'FR', 'GB', 'IE', 'NL', 'MA', 'PE']);

export const E164 = /^\+[1-9][0-9]{6,14}$/;

/**
 * Normalises user input to E.164. Accepts `+…`, `00…` or a national number
 * for `country`. Returns null when the result is not a plausible E.164 number.
 */
export function normalizePhone(input: string, country?: CountryCode | null): string | null {
  const raw = input.trim();
  if (raw.length === 0 || raw.length > 32) return null;
  // Only digits and common separators are allowed.
  if (!/^[+\d\s().\-/]+$/.test(raw)) return null;
  const plus = raw.startsWith('+');
  let digits = raw.replace(/\D/g, '');

  let e164: string;
  if (plus) {
    e164 = `+${digits}`;
  } else if (digits.startsWith('00')) {
    e164 = `+${digits.slice(2)}`;
  } else {
    if (!country) return null;
    if (TRUNK_ZERO.has(country) && digits.startsWith('0')) digits = digits.slice(1);
    e164 = `+${CALLING_CODES[country]}${digits}`;
  }
  return E164.test(e164) ? e164 : null;
}

const CODES_BY_LENGTH = [...new Set(Object.values(CALLING_CODES))].sort((a, b) => b.length - a.length);

/** `+573001234567` → `+57 300 123 4567` (readable grouping, not a national format). */
export function formatPhone(e164: string): string {
  if (!E164.test(e164)) return e164;
  const digits = e164.slice(1);
  const code = CODES_BY_LENGTH.find((c) => digits.startsWith(c)) ?? digits.slice(0, 2);
  const rest = digits.slice(code.length);
  const groups: string[] = [];
  let i = rest.length;
  // Last group of four, the others of three, counted from the end.
  const last = Math.min(4, i);
  groups.unshift(rest.slice(i - last, i));
  i -= last;
  while (i > 0) {
    const size = Math.min(3, i);
    groups.unshift(rest.slice(i - size, i));
    i -= size;
  }
  return `+${code} ${groups.join(' ')}`;
}

/** Digits only, as WhatsApp click-to-chat links expect (`wa.me/<digits>`). */
export function phoneDigits(e164: string): string {
  return e164.replace(/\D/g, '');
}
