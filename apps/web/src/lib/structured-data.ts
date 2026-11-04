import type { Locale } from '@vireluma/domain';
import { project, urls } from '../config/site';
import { HTML_LANG, getDictionary, routePath, type RouteKey } from '../i18n';

type JsonLd = Record<string, unknown>;

export function organization(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${urls.absolute('')}#organization`,
    name: 'VIRELUMA',
    url: urls.absolute(''),
    logo: urls.absoluteAsset('brand/logo/png/vireluma-symbol-512.png'),
    sameAs: [project.repositoryUrl],
  };
}

export function website(locale: Locale): JsonLd {
  const t = getDictionary(locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'VIRELUMA',
    url: urls.absolute(routePath(locale, 'home')),
    description: t.pages.home.description,
    inLanguage: HTML_LANG[locale],
    publisher: { '@id': `${urls.absolute('')}#organization` },
  };
}

export function breadcrumbs(locale: Locale, key: RouteKey): JsonLd {
  const t = getDictionary(locale);
  const items = [
    { name: 'VIRELUMA', path: routePath(locale, 'home') },
    ...(key === 'home' ? [] : [{ name: t.nav[key], path: routePath(locale, key) }]),
  ];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: urls.absolute(item.path),
    })),
  };
}

export function faqPage(locale: Locale): JsonLd {
  const items = getDictionary(locale).pages.faq.items;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: HTML_LANG[locale],
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}
