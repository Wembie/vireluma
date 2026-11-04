import { describe, expect, it } from 'vitest';
import { qrPath } from './qr.ts';

describe('qrPath', () => {
  it('produces a square symbol with a 4-module quiet zone', () => {
    const { size, path } = qrPath('https://wembie.github.io/vireluma/es/como-funciona/');
    // Version ≥ 1 is 21 modules + 2×4 quiet zone.
    expect(size).toBeGreaterThanOrEqual(29);
    expect((size - 8 - 17) % 4).toBe(0);
    expect(path).toMatch(/^M\d+ \d+h\d+v1h-\d+z/);
    expect(path).not.toMatch(/M[0-3] /); // nothing drawn in the quiet zone columns
  });

  it('is deterministic for the same input', () => {
    expect(qrPath('https://example.org/p/#ABC').path).toBe(qrPath('https://example.org/p/#ABC').path);
  });

  it('grows with higher error correction', () => {
    const url = 'https://wembie.github.io/vireluma/p/#0123456789ABCDEFGHJKMNPQRS';
    expect(qrPath(url, 'H').size).toBeGreaterThanOrEqual(qrPath(url, 'L').size);
  });
});
