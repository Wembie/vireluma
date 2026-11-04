import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, isLocale, negotiateLocale } from './locale.ts';
import { contrastRatio } from './contrast.ts';

describe('locale', () => {
  it('recognises supported locales only', () => {
    expect(isLocale('es')).toBe(true);
    expect(isLocale('de')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it('negotiates from browser preferences', () => {
    expect(negotiateLocale(['pt-BR', 'en-US'])).toBe('pt');
    expect(negotiateLocale(['de-DE', 'fr-CA'])).toBe('fr');
    expect(negotiateLocale(['de-DE'])).toBe(DEFAULT_LOCALE);
    expect(negotiateLocale([])).toBe(DEFAULT_LOCALE);
  });
});

describe('contrastRatio', () => {
  it('matches the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    expect(contrastRatio('#767676', '#FFFFFF')).toBeCloseTo(4.54, 2);
  });
  it('rejects malformed colours', () => {
    expect(() => contrastRatio('#FFF', '#000000')).toThrow();
  });
});
