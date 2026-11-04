import { describe, expect, it } from 'vitest';
import {
  PUBLIC_ID_ALPHABET,
  PUBLIC_ID_ENTROPY_BITS,
  PUBLIC_ID_LENGTH,
  formatPublicIdForPrint,
  generatePublicId,
  isPublicId,
  parsePublicId,
  type PublicId,
} from './public-id.ts';

describe('public identifier format', () => {
  it('uses a 32-symbol alphabet without ambiguous letters', () => {
    expect(PUBLIC_ID_ALPHABET).toHaveLength(32);
    expect(new Set(PUBLIC_ID_ALPHABET).size).toBe(32);
    for (const ch of 'ILOU') expect(PUBLIC_ID_ALPHABET).not.toContain(ch);
  });

  it('carries at least 128 bits of entropy', () => {
    expect(PUBLIC_ID_ENTROPY_BITS).toBeGreaterThanOrEqual(128);
  });
});

describe('generatePublicId', () => {
  it('produces canonical identifiers', () => {
    for (let i = 0; i < 200; i++) {
      const id = generatePublicId();
      expect(id).toHaveLength(PUBLIC_ID_LENGTH);
      expect(isPublicId(id)).toBe(true);
    }
  });

  it('does not repeat across many generations', () => {
    const ids = new Set(Array.from({ length: 5000 }, () => generatePublicId()));
    expect(ids.size).toBe(5000);
  });

  it('maps every bit of the random source deterministically', () => {
    const zeros = generatePublicId((b) => b.fill(0));
    const ones = generatePublicId((b) => b.fill(255));
    expect(zeros).toBe('0'.repeat(PUBLIC_ID_LENGTH));
    expect(ones).toBe('Z'.repeat(PUBLIC_ID_LENGTH));
  });

  it('is not sequential for consecutive random inputs', () => {
    let counter = 0;
    const counting = (b: Uint8Array) => b.fill(counter++);
    const a = generatePublicId(counting);
    const b = generatePublicId(counting);
    expect(a).not.toBe(b);
  });
});

describe('parsePublicId', () => {
  const id = generatePublicId();

  it('accepts the canonical form', () => {
    expect(parsePublicId(id)).toBe(id);
  });

  it('accepts lower case and printed groups', () => {
    expect(parsePublicId(formatPublicIdForPrint(id).toLowerCase())).toBe(id);
    expect(parsePublicId(formatPublicIdForPrint(id, 5).replace(/-/g, ' '))).toBe(id);
  });

  it('maps Crockford confusables to their digits', () => {
    const canonical = '01' + id.slice(2);
    expect(parsePublicId('OI' + id.slice(2))).toBe(canonical);
    expect(parsePublicId('ol' + id.slice(2))).toBe(canonical);
  });

  it.each([
    ['empty', ''],
    ['too short', 'ABC'],
    ['too long', 'A'.repeat(PUBLIC_ID_LENGTH + 1)],
    ['contains U', 'U'.repeat(PUBLIC_ID_LENGTH)],
    ['contains punctuation', `${'A'.repeat(PUBLIC_ID_LENGTH - 1)}!`],
    ['injection attempt', `${'A'.repeat(20)}' OR 1=1`],
    ['huge input', 'A'.repeat(10_000)],
  ])('rejects %s', (_label, input) => {
    expect(parsePublicId(input)).toBeNull();
  });
});

describe('formatPublicIdForPrint', () => {
  it('groups symbols with hyphens', () => {
    const id = 'ABCDEFGHJKMNPQRSTVWXYZ0123' as PublicId;
    expect(formatPublicIdForPrint(id)).toBe('ABCD-EFGH-JKMN-PQRS-TVWX-YZ01-23');
  });
});
