import { describe, expect, it } from 'vitest';
import { COUNTRY_CODES, formatPhone, isCountryCode, normalizePhone, phoneDigits } from './phone.ts';

describe('normalizePhone', () => {
  it('keeps international numbers and strips separators', () => {
    expect(normalizePhone('+57 300 123 4567')).toBe('+573001234567');
    expect(normalizePhone('+1 (415) 555-0100')).toBe('+14155550100');
    expect(normalizePhone('0057 300.123.4567')).toBe('+573001234567');
  });

  it('prefixes national numbers with the country calling code', () => {
    expect(normalizePhone('300 123 4567', 'CO')).toBe('+573001234567');
    expect(normalizePhone('912 345 678', 'PT')).toBe('+351912345678');
  });

  it('drops the trunk zero where the numbering plan uses one', () => {
    expect(normalizePhone('06 12 34 56 78', 'FR')).toBe('+33612345678');
    expect(normalizePhone('030 1234567', 'DE')).toBe('+49301234567');
  });

  it('rejects letters, missing countries and implausible lengths', () => {
    expect(normalizePhone('call me')).toBeNull();
    expect(normalizePhone('3001234567')).toBeNull();
    expect(normalizePhone('+12')).toBeNull();
    expect(normalizePhone('+0123456789')).toBeNull();
    expect(normalizePhone('+1234567890123456')).toBeNull();
    expect(normalizePhone('')).toBeNull();
    expect(normalizePhone('9'.repeat(40), 'CO')).toBeNull();
  });
});

describe('formatPhone', () => {
  it('groups digits after the longest matching calling code', () => {
    expect(formatPhone('+573001234567')).toBe('+57 300 123 4567');
    expect(formatPhone('+593991234567')).toBe('+593 99 123 4567');
    expect(formatPhone('+14155550100')).toBe('+1 415 555 0100');
  });

  it('returns invalid input unchanged', () => {
    expect(formatPhone('not a phone')).toBe('not a phone');
  });

  it('extracts digits for click-to-chat links', () => {
    expect(phoneDigits('+573001234567')).toBe('573001234567');
  });
});

describe('countries', () => {
  it('lists sorted ISO codes and validates them', () => {
    expect(COUNTRY_CODES).toEqual([...COUNTRY_CODES].sort());
    expect(isCountryCode('CO')).toBe(true);
    expect(isCountryCode('ZZ')).toBe(false);
    expect(isCountryCode('toString')).toBe(false);
  });
});
