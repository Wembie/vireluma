import { describe, expect, it } from 'vitest';
import { LOCALES } from '@vireluma/domain';
import { DICTIONARIES } from './index.ts';
import { ROUTES, ROUTE_KEYS, alternates, matchRoute, routePath } from './routes.ts';

type Leaf = { path: string; value: unknown };

function leaves(value: unknown, path = ''): Leaf[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  }
  return [{ path, value }];
}

const source = leaves(DICTIONARIES.es).map((l) => l.path);

describe.each(LOCALES)('dictionary %s', (locale) => {
  const entries = leaves(DICTIONARIES[locale]);

  it('has exactly the same keys and list lengths as the source dictionary', () => {
    expect(entries.map((l) => l.path)).toEqual(source);
  });

  it('has no empty strings', () => {
    const empty = entries.filter((l) => typeof l.value !== 'string' || l.value.trim() === '');
    expect(empty).toEqual([]);
  });

  it('has no untranslated placeholders', () => {
    const suspicious = entries.filter((l) => /\bTODO\b|\bTBD\b|lorem ipsum|\{\{/.test(String(l.value)));
    expect(suspicious).toEqual([]);
  });

  it('keeps meta descriptions within search-result length', () => {
    for (const [, page] of Object.entries(DICTIONARIES[locale].pages)) {
      expect(page.description.length).toBeGreaterThanOrEqual(70);
      expect(page.description.length).toBeLessThanOrEqual(200);
    }
  });
});

describe('localized routes', () => {
  it('defines a slug for every locale and route', () => {
    for (const key of ROUTE_KEYS) for (const l of LOCALES) expect(ROUTES[key][l]).toBeTypeOf('string');
  });

  it('uses URL-safe ASCII slugs', () => {
    for (const key of ROUTE_KEYS) {
      for (const l of LOCALES) expect(ROUTES[key][l]).toMatch(/^[a-z0-9-]*$/);
    }
  });

  it('has unique paths', () => {
    const all = ROUTE_KEYS.flatMap((k) => LOCALES.map((l) => routePath(l, k)));
    expect(new Set(all).size).toBe(all.length);
  });

  it('round-trips through matchRoute', () => {
    for (const key of ROUTE_KEYS) {
      for (const { locale, path } of alternates(key)) {
        expect(matchRoute(path)).toEqual({ locale, key });
        expect(matchRoute(`/${path.replace(/\/$/, '')}`)).toEqual({ locale, key });
      }
    }
  });

  it('rejects unknown paths', () => {
    expect(matchRoute('de/')).toBeNull();
    expect(matchRoute('es/unknown/')).toBeNull();
    expect(matchRoute('')).toBeNull();
  });
});
