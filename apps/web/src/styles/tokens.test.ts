import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@vireluma/domain';

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

interface Block {
  selector: string;
  body: string;
}

const blocks: Block[] = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
  selector: (m[1] ?? '').trim(),
  body: m[2] ?? '',
}));

function declarations(body: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const [, name = '', value = ''] of body.matchAll(/(--vl-[\w-]+):\s*([^;]+);/g)) {
    map.set(name, value.trim());
  }
  return map;
}

/** Resolves a theme's tokens: primitives from `:root`, overridden by the blocks matching `selector`. */
function theme(selector: RegExp): (name: string) => string {
  const tokens = new Map<string, string>();
  for (const b of blocks)
    if (b.selector === ':root') for (const [k, v] of declarations(b.body)) tokens.set(k, v);
  for (const b of blocks)
    if (selector.test(b.selector)) for (const [k, v] of declarations(b.body)) tokens.set(k, v);

  const resolve = (name: string, depth = 0): string => {
    const value = tokens.get(name);
    if (value === undefined) throw new Error(`Token ${name} not defined`);
    const ref = /^var\((--vl-[\w-]+)\)$/.exec(value)?.[1];
    return ref && depth < 5 ? resolve(ref, depth + 1) : value;
  };
  return resolve;
}

const light = theme(/^:root$/);
const dark = theme(/^:root\[data-theme='dark'\]$/);

/** [foreground, background, minimum ratio] — 4.5 for text, 3 for UI boundaries and focus indicators. */
const PAIRS: [string, string, number][] = [
  ['--vl-fg', '--vl-bg', 4.5],
  ['--vl-fg', '--vl-surface', 4.5],
  ['--vl-fg', '--vl-bg-subtle', 4.5],
  ['--vl-fg-muted', '--vl-bg', 4.5],
  ['--vl-fg-muted', '--vl-surface', 4.5],
  ['--vl-fg-heading', '--vl-bg', 4.5],
  ['--vl-fg-heading', '--vl-surface-accent', 4.5],
  ['--vl-fg', '--vl-surface-accent', 4.5],
  ['--vl-fg-on-brand', '--vl-surface-brand', 4.5],
  ['--vl-fg-on-brand-muted', '--vl-surface-brand', 4.5],
  ['--vl-primary', '--vl-bg', 4.5],
  ['--vl-primary', '--vl-surface', 4.5],
  ['--vl-on-primary', '--vl-primary', 4.5],
  ['--vl-on-primary', '--vl-primary-hover', 4.5],
  ['--vl-on-secondary', '--vl-secondary', 4.5],
  ['--vl-success', '--vl-surface', 4.5],
  ['--vl-warning', '--vl-surface', 4.5],
  ['--vl-danger', '--vl-surface', 4.5],
  ['--vl-info', '--vl-info-soft', 4.5],
  ['--vl-success', '--vl-success-soft', 4.5],
  ['--vl-warning', '--vl-warning-soft', 4.5],
  ['--vl-danger', '--vl-danger-soft', 4.5],
  ['--vl-fg', '--vl-primary-soft', 4.5],
  ['--vl-border-strong', '--vl-surface', 3],
  ['--vl-focus', '--vl-bg', 3],
  ['--vl-focus', '--vl-surface', 3],
];

describe.each([
  ['light', light],
  ['dark', dark],
])('%s theme contrast (WCAG 2.2 AA)', (_name, resolve) => {
  it.each(PAIRS)('%s on %s ≥ %d', (fg, bg, min) => {
    expect(contrastRatio(resolve(fg), resolve(bg))).toBeGreaterThanOrEqual(min);
  });
});

describe('dark theme blocks', () => {
  it('keeps the media-query and explicit dark blocks identical', () => {
    const media = blocks.find((b) => b.selector.includes(":root:not([data-theme='light'])"));
    const explicit = blocks.find((b) => b.selector === ":root[data-theme='dark']");
    expect(media).toBeDefined();
    expect(explicit).toBeDefined();
    expect([...declarations(media?.body ?? '')]).toEqual([...declarations(explicit?.body ?? '')]);
  });
});
