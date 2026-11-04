import { encode } from 'uqr';

export interface QrSvg {
  /** Single path with one 1×1 square per dark module, in module units. */
  path: string;
  /** Size in modules, including the quiet zone. */
  size: number;
}

/**
 * Encodes a URL as QR module geometry. Keeps square modules and a 4-module
 * quiet zone (ISO/IEC 18004) because readability beats decoration — the QR
 * studio (M3) adds styling only together with a decode-back readability check.
 */
export function qrPath(text: string, ecc: 'L' | 'M' | 'Q' | 'H' = 'M'): QrSvg {
  const quiet = 4;
  const { data, size } = encode(text, { ecc, border: quiet });
  let path = '';
  for (let y = 0; y < size; y++) {
    const row = data[y] ?? [];
    let x = 0;
    while (x < size) {
      if (!row[x]) {
        x++;
        continue;
      }
      const start = x;
      while (x < size && row[x]) x++;
      path += `M${start} ${y}h${x - start}v1h${start - x}z`;
    }
  }
  return { path, size };
}
