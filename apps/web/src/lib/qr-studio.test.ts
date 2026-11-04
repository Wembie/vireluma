import { describe, expect, it } from 'vitest';
import { encode } from 'uqr';
import { buildArtwork, logoBox, qrModules, type ArtworkOptions } from './qr-studio';
import { countryName, fmt, formatDate, plural } from '../i18n/format';

const URL_ = 'https://wembie.github.io/vireluma/p/#0123456789ABCDEFGHJKMNPQRS';

const base: ArtworkOptions = {
  url: URL_,
  layout: 'card',
  logo: false,
  ecc: 'M',
  labels: {
    scanMe: 'EMERGENCY · SCAN ME',
    instructions: 'Scan to call my family.',
    manual: 'Go to {url} and type',
  },
  manualUrl: 'wembie.github.io/vireluma/p',
  code: '0123-4567-89AB-CDEF-GHJK-MNPQ-RS',
  name: null,
};

describe('qrModules', () => {
  it('keeps the 4-module quiet zone and draws dark modules only', () => {
    const qr = qrModules(URL_, 'M', false);
    expect(qr.size).toBe(encode(URL_, { ecc: 'M', border: 4 }).size);
    expect(qr.path).toMatch(/^M\d+ \d+h\d+v1h-\d+z/);
  });

  it('forces high error correction and caps the area covered by the symbol', () => {
    const plain = encode(URL_, { ecc: 'H', border: 4 });
    const withLogo = qrModules(URL_, 'M', true);
    expect(withLogo.size).toBe(plain.size);
    const box = logoBox(withLogo.size);
    const inner = withLogo.size - 8;
    expect((box.w * box.w) / (inner * inner)).toBeLessThan(0.07); // H recovers ~30%
    expect(box.x).toBeGreaterThan(4 + 7); // never touches the finder patterns
  });
});

describe('buildArtwork', () => {
  it('produces real-size print layouts', () => {
    expect(buildArtwork(base)).toMatchObject({ widthMm: 85.6, heightMm: 54 });
    expect(buildArtwork({ ...base, layout: 'sticker' })).toMatchObject({ widthMm: 50, heightMm: 50 });
    expect(buildArtwork({ ...base, layout: 'wristband' })).toMatchObject({ widthMm: 130, heightMm: 25 });
    expect(buildArtwork({ ...base, layout: 'plain' }).svg).toContain('width="40mm"');
  });

  it('prints the name only when asked and escapes all text', () => {
    expect(buildArtwork(base).svg).not.toContain('Elena');
    const svg = buildArtwork({ ...base, name: 'Elena <script>&' }).svg;
    expect(svg).toContain('Elena &lt;script&gt;&amp;');
    expect(svg).not.toContain('<script>');
  });

  it('splits the manual code so it fits the card', () => {
    const svg = buildArtwork(base).svg;
    expect(svg).toContain('>0123-4567-89AB-CDEF<');
    expect(svg).toContain('>GHJK-MNPQ-RS<');
  });
});

describe('message formatting', () => {
  it('interpolates and uses CLDR plural rules', () => {
    expect(fmt('Hola {name}', { name: 'María' })).toBe('Hola María');
    expect(fmt('{missing}')).toBe('{missing}');
    const forms = { one: '{count} scan', other: '{count} scans' };
    expect(plural(forms, 1, 'en')).toBe('1 scan');
    expect(plural(forms, 0, 'en')).toBe('0 scans');
    expect(plural(forms, 0, 'fr')).toBe('0 scan'); // French: 0 is singular
  });

  it('formats dates and country names in the reader locale', () => {
    expect(formatDate('2026-11-04', 'en')).toBe('Nov 4, 2026');
    expect(formatDate('not a date', 'en')).toBe('');
    expect(formatDate(null, 'en')).toBe('');
    expect(formatDate('2026-11-04T15:30:00Z', 'es', true)).toMatch(/2026/);
    expect(countryName('CO', 'es')).toBe('Colombia');
    expect(countryName('BR', 'pt')).toBe('Brasil');
  });
});
