import { describe, expect, it } from 'vitest';
import { generatePublicId } from './public-id.ts';
import { createUrlService, normalizeBasePath, normalizeOrigin, readProfileIdFromLocation } from './urls.ts';

const ghPages = createUrlService({ origin: 'https://wembie.github.io', basePath: '/vireluma' });
const customDomain = createUrlService({ origin: 'https://example.org', basePath: '' });

describe('normalizeOrigin', () => {
  it('strips trailing slash', () => {
    expect(normalizeOrigin('https://wembie.github.io/')).toBe('https://wembie.github.io');
  });
  it('allows http only for local development', () => {
    expect(normalizeOrigin('http://localhost:4321')).toBe('http://localhost:4321');
    expect(() => normalizeOrigin('http://example.org')).toThrow(/HTTPS/);
  });
  it('rejects paths, queries and fragments', () => {
    expect(() => normalizeOrigin('https://example.org/app')).toThrow();
    expect(() => normalizeOrigin('https://example.org?x=1')).toThrow();
    expect(() => normalizeOrigin('https://example.org#x')).toThrow();
    expect(() => normalizeOrigin('not a url')).toThrow();
  });
});

describe('normalizeBasePath', () => {
  it.each([
    ['', ''],
    ['/', ''],
    ['vireluma', '/vireluma'],
    ['/vireluma/', '/vireluma'],
    ['//a/b//', '/a/b'],
  ])('%j → %j', (input, expected) => {
    expect(normalizeBasePath(input)).toBe(expected);
  });
  it('rejects unsafe characters', () => {
    expect(() => normalizeBasePath('/a b')).toThrow();
    expect(() => normalizeBasePath('/a/../b?')).toThrow();
  });
});

describe('createUrlService', () => {
  it('prefixes the base path and adds trailing slashes to pages', () => {
    expect(ghPages.path('/')).toBe('/vireluma/');
    expect(ghPages.path('es/como-funciona')).toBe('/vireluma/es/como-funciona/');
    expect(ghPages.path('/es/')).toBe('/vireluma/es/');
    expect(customDomain.path('/')).toBe('/');
    expect(customDomain.path('/en/how-it-works')).toBe('/en/how-it-works/');
  });

  it('does not add trailing slashes to files', () => {
    expect(ghPages.path('/robots.txt')).toBe('/vireluma/robots.txt');
    expect(ghPages.asset('brand/icons/favicon.svg')).toBe('/vireluma/brand/icons/favicon.svg');
  });

  it('builds absolute URLs', () => {
    expect(ghPages.absolute('/fr/')).toBe('https://wembie.github.io/vireluma/fr/');
    expect(ghPages.absoluteAsset('/sitemap-index.xml')).toBe(
      'https://wembie.github.io/vireluma/sitemap-index.xml',
    );
  });

  it('builds permanent profile URLs with the identifier in the fragment', () => {
    const id = generatePublicId();
    expect(ghPages.profileUrl(id)).toBe(`https://wembie.github.io/vireluma/p/#${id}`);
    expect(customDomain.profileUrl(id)).toBe(`https://example.org/p/#${id}`);
  });

  it('keeps the identifier and route identical across origins (migration contract)', () => {
    const id = generatePublicId();
    const strip = (u: string, s: { origin: string; basePath: string }) =>
      u.slice(s.origin.length + s.basePath.length);
    expect(strip(ghPages.profileUrl(id), ghPages)).toBe(strip(customDomain.profileUrl(id), customDomain));
  });
});

describe('readProfileIdFromLocation', () => {
  const id = generatePublicId();

  it('reads the fragment (canonical)', () => {
    expect(readProfileIdFromLocation({ hash: `#${id}`, search: '' })).toBe(id);
  });
  it('falls back to ?id=', () => {
    expect(readProfileIdFromLocation({ hash: '', search: `?id=${id.toLowerCase()}` })).toBe(id);
  });
  it('prefers the fragment over the query', () => {
    expect(readProfileIdFromLocation({ hash: `#${id}`, search: '?id=INVALID' })).toBe(id);
  });
  it('returns null for missing or malformed identifiers', () => {
    expect(readProfileIdFromLocation({ hash: '', search: '' })).toBeNull();
    expect(readProfileIdFromLocation({ hash: '#%E0%A4%A', search: '' })).toBeNull();
    expect(readProfileIdFromLocation({ hash: '#<script>', search: '' })).toBeNull();
  });
});
