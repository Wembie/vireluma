/**
 * Emergency page renderer (no framework). Every value from the network is
 * inserted with textContent / attribute setters — never as HTML.
 */
import {
  LOCALES,
  formatPhone,
  isLocale,
  mapsLink,
  negotiateLocale,
  parsePublicId,
  phoneDigits,
  readProfileIdFromLocation,
  type EmergencyProfile,
  type Locale,
  type PublicId,
} from '@vireluma/domain';
import { urls } from '../config/site';
import { routePath } from '../i18n/routes';
import type { Dictionary } from '../i18n/types';
import { buttonClass } from '../components/ui/variants';
import { resolveEmergencyProfile, type ResolveOutcome } from '../lib/backend/emergency';

type Strings = Dictionary['emergency'] & { disclaimer: string; languageName: string };
type State = { kind: 'loading' } | { kind: 'manual' } | { kind: 'result'; outcome: ResolveOutcome };

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (m, k: string) => values[k] ?? m);

/** Minimal element builder: text children only, never HTML strings. */
function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: (Node | string | null | false)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else el.setAttribute(k, v);
  }
  for (const c of children) if (c) el.append(c);
  return el;
}

const sectionTitle = (text: string) => h('h2', { class: 'text-h4' }, text);

export function start() {
  const all = JSON.parse(document.getElementById('ep-strings')?.textContent ?? '{}') as Record<
    Locale,
    Strings
  >;
  const root = document.getElementById('ep-root');
  const status = document.getElementById('ep-status');
  const picker = document.getElementById('ep-language') as HTMLSelectElement | null;
  if (!root || !status || !picker) return;

  const LOCALE_KEY = 'vireluma-ep-locale';
  let saved: string | null = null;
  try {
    saved = sessionStorage.getItem(LOCALE_KEY);
  } catch {
    /* storage blocked: negotiate every time */
  }
  let locale: Locale = isLocale(saved) ? saved : negotiateLocale(navigator.languages ?? [navigator.language]);
  let state: State = { kind: 'loading' };
  let id: PublicId | null = null;
  let located: { lat: number; lng: number } | null | 'pending' | 'failed' = null;

  const t = () => all[locale];

  const chrome = () => {
    const s = t();
    document.documentElement.lang = locale;
    document.title = `${s.title} — VIRELUMA`;
    picker.value = locale;
    const set = (elId: string, text: string) => {
      const el = document.getElementById(elId);
      if (el) el.textContent = text;
    };
    set('ep-language-label', s.language);
    set('ep-privacy', s.privacy);
    set('ep-disclaimer', s.disclaimer);
    const about = document.getElementById('ep-about');
    if (about) {
      about.textContent = s.about;
      // Built from code and the validated locale, never from text read out of the DOM.
      about.setAttribute('href', urls.path(routePath(locale, 'home')));
    }
  };

  const render = () => {
    chrome();
    const s = t();
    root.replaceChildren();
    status.textContent = '';
    if (state.kind === 'loading') {
      status.textContent = s.loading;
      return;
    }
    if (state.kind === 'manual') {
      root.append(manualForm(s));
      return;
    }
    const outcome = state.outcome;
    if (outcome.status === 'active') {
      root.append(...profileView(s, outcome.profile));
      focusHeading();
      return;
    }
    const copy = s.states[outcome.status];
    root.append(
      h(
        'section',
        { class: 'grid gap-3 rounded-lg border border-border bg-surface p-6' },
        h('h1', { class: 'text-h3 focus:outline-none', tabindex: '-1' }, copy.title),
        h('p', { class: 'text-fg' }, copy.body),
      ),
    );
    if (outcome.status === 'network' || outcome.status === 'malformed' || outcome.status === 'rate_limited') {
      const retry = h('button', { type: 'button', class: buttonClass('primary', 'lg') }, s.retry);
      retry.addEventListener('click', () => void load());
      root.append(h('div', {}, retry));
    }
    if (outcome.status === 'invalid' || outcome.status === 'not_found') root.append(manualForm(s));
    root.append(numbersBlock(s, []));
    focusHeading();
  };

  const focusHeading = () => root.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });

  function profileView(s: Strings, p: EmergencyProfile): Node[] {
    const nodes: Node[] = [];
    const head = h(
      'section',
      { class: 'grid gap-3' },
      h('p', { class: 'text-sm font-semibold uppercase tracking-wide text-primary' }, s.title),
      h('h1', { class: 'text-h1 break-words focus:outline-none', tabindex: '-1' }, p.preferredName),
      h('p', { class: 'text-lg text-fg' }, s.intro),
    );
    if (p.isMinor) {
      head.append(h('p', { class: 'rounded-md bg-warning-soft p-4 font-semibold text-fg' }, s.minor));
    }
    if (p.emergencyMessage) {
      head.append(
        h(
          'figure',
          { class: 'rounded-lg border-l-4 border-primary bg-surface p-4' },
          h('figcaption', { class: 'text-sm font-semibold text-fg-muted' }, s.message),
          h('blockquote', { class: 'mt-1 text-lg text-fg whitespace-pre-line' }, p.emergencyMessage),
        ),
      );
    }
    if (p.preferredLocale && p.preferredLocale !== locale) {
      head.append(
        h(
          'p',
          { class: 'text-sm text-fg-muted' },
          fill(s.speaks, { language: all[p.preferredLocale].languageName }),
        ),
      );
    }
    nodes.push(head);

    // Contacts: the primary action.
    const contacts = h('section', { class: 'grid gap-3', 'aria-labelledby': 'ep-contacts' });
    const contactsTitle = sectionTitle(s.contactsTitle);
    contactsTitle.id = 'ep-contacts';
    contacts.append(contactsTitle);
    if (p.contacts.length === 0) {
      contacts.append(h('p', { class: 'text-fg' }, s.noContacts));
    } else {
      const list = h('ul', { class: 'grid gap-3' });
      for (const c of p.contacts) {
        const label = c.relationship ? `${c.name} · ${c.relationship}` : c.name;
        list.append(
          h(
            'li',
            { class: 'grid gap-2 rounded-lg border border-border bg-surface p-4' },
            h('p', { class: 'font-semibold text-fg break-words' }, label),
            h(
              'a',
              { href: `tel:${c.phone}`, class: buttonClass('primary', 'lg', 'w-full') },
              fill(s.call, { name: c.name }),
            ),
            h('p', { class: 'text-center text-sm tabular-nums text-fg-muted' }, formatPhone(c.phone)),
            h(
              'a',
              {
                href: `https://wa.me/${phoneDigits(c.phone)}`,
                class: buttonClass('outline', 'md', 'w-full'),
                rel: 'noopener noreferrer',
              },
              fill(s.whatsapp, { name: c.name }),
            ),
          ),
        );
      }
      contacts.append(list);
      contacts.append(locationBlock(s, p));
    }
    nodes.push(contacts);

    if (p.details.length > 0) {
      const list = h('ul', { class: 'grid gap-3' });
      for (const d of p.details) {
        list.append(
          h(
            'li',
            { class: 'rounded-lg border border-border bg-surface p-4' },
            h('p', { class: 'text-sm font-semibold text-primary' }, s.kinds[d.kind]),
            h('p', { class: 'font-semibold text-fg break-words' }, d.title),
            d.details ? h('p', { class: 'mt-1 text-fg whitespace-pre-line break-words' }, d.details) : null,
          ),
        );
      }
      nodes.push(h('section', { class: 'grid gap-3' }, sectionTitle(s.helpTitle), list));
    }

    nodes.push(numbersBlock(s, p.emergencyNumbers));
    return nodes;
  }

  function numbersBlock(s: Strings, numbers: EmergencyProfile['emergencyNumbers']): Node {
    const block = h(
      'section',
      { class: 'grid gap-3 rounded-lg bg-bg-subtle p-4' },
      sectionTitle(s.numbersTitle),
    );
    if (numbers.length === 0) {
      // Never invent a number: only verified registry entries are shown.
      block.append(h('p', { class: 'text-fg' }, s.numbersFallback));
      return block;
    }
    const list = h('div', { class: 'flex flex-wrap gap-3' });
    for (const n of numbers) {
      list.append(
        h(
          'a',
          { href: `tel:${n.number}`, class: buttonClass('danger', 'md') },
          fill(s.callNumber, { service: s.services[n.service], number: n.number }),
        ),
      );
    }
    block.append(list);
    return block;
  }

  /** Location is read only when the helper asks, and only used to prefill their own message. */
  function locationBlock(s: Strings, p: EmergencyProfile): Node {
    const block = h(
      'div',
      { class: 'grid gap-3 rounded-lg border border-border p-4' },
      h('h3', { class: 'font-semibold text-fg' }, s.location.title),
      h('p', { class: 'text-sm text-fg-muted' }, s.location.body),
    );
    if (located === null || located === 'pending') {
      const button = h(
        'button',
        { type: 'button', class: buttonClass('outline', 'md', 'w-full') },
        located === 'pending' ? s.location.locating : s.location.button,
      );
      if (located === 'pending') button.setAttribute('aria-busy', 'true');
      button.addEventListener('click', () => {
        if (!('geolocation' in navigator)) {
          located = 'failed';
          render();
          return;
        }
        located = 'pending';
        render();
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            located = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            render();
          },
          () => {
            located = 'failed';
            render();
          },
          { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
        );
      });
      block.append(button);
      return block;
    }
    if (located === 'failed')
      block.append(h('p', { role: 'alert', class: 'text-sm text-fg' }, s.location.unavailable));
    const text =
      typeof located === 'object'
        ? fill(s.location.text, { name: p.preferredName, link: mapsLink(located.lat, located.lng) })
        : fill(s.location.textNoLink, { name: p.preferredName });
    const links = h('div', { class: 'grid gap-2' });
    for (const c of p.contacts) {
      links.append(
        h(
          'a',
          {
            href: `sms:${c.phone}?body=${encodeURIComponent(text)}`,
            class: buttonClass('secondary', 'md', 'w-full'),
          },
          fill(s.location.sms, { name: c.name }),
        ),
        h(
          'a',
          {
            href: `https://wa.me/${phoneDigits(c.phone)}?text=${encodeURIComponent(text)}`,
            class: buttonClass('outline', 'md', 'w-full'),
            rel: 'noopener noreferrer',
          },
          fill(s.location.whatsapp, { name: c.name }),
        ),
      );
    }
    block.append(links);
    return block;
  }

  function manualForm(s: Strings): Node {
    const input = h('input', {
      id: 'ep-code',
      name: 'code',
      class:
        'h-12 w-full rounded-md border border-border-strong bg-surface px-3 font-mono text-lg uppercase tracking-wider text-fg',
      autocomplete: 'off',
      autocapitalize: 'characters',
      spellcheck: 'false',
      inputmode: 'text',
      maxlength: '40',
      required: '',
    });
    const form = h(
      'form',
      { class: 'grid gap-3 rounded-lg border border-border bg-surface p-6', novalidate: '' },
      h('h2', { class: 'text-h4' }, s.manual.title),
      h('p', { class: 'text-fg-muted' }, s.manual.body),
      h('label', { for: 'ep-code', class: 'text-sm font-semibold text-fg' }, s.manual.label),
      input,
      h('button', { type: 'submit', class: buttonClass('primary', 'lg') }, s.manual.submit),
    );
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const parsed = parsePublicId(input.value);
      if (!parsed) {
        state = { kind: 'result', outcome: { status: 'invalid' } };
        render();
        return;
      }
      // Updating the fragment keeps the canonical URL and triggers a load.
      window.location.hash = parsed;
    });
    return form;
  }

  async function load() {
    id = readProfileIdFromLocation(window.location);
    located = null;
    if (!id) {
      const hasInput =
        window.location.hash.length > 1 || new URLSearchParams(window.location.search).has('id');
      state = hasInput ? { kind: 'result', outcome: { status: 'invalid' } } : { kind: 'manual' };
      render();
      return;
    }
    state = { kind: 'loading' };
    render();
    const requested = id;
    const outcome = await resolveEmergencyProfile(requested);
    if (requested !== id) return; // a newer navigation won
    state = { kind: 'result', outcome };
    render();
  }

  picker.addEventListener('change', () => {
    if (isLocale(picker.value) && LOCALES.includes(picker.value)) {
      locale = picker.value;
      try {
        sessionStorage.setItem(LOCALE_KEY, locale);
      } catch {
        /* convenience only */
      }
      render();
    }
  });
  window.addEventListener('hashchange', () => void load());
  void load();
}
