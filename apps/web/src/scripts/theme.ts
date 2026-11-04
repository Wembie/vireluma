/**
 * Theme preference handling. The preference is a per-device convenience stored
 * in localStorage; storage failures (private mode, blocked storage) are
 * tolerated and the system preference is used instead.
 */
export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'vireluma-theme';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

export function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'light' || value === 'dark') return value;
  } catch {
    /* storage unavailable — fall back to system */
  }
  return 'system';
}

function apply(pref: ThemePreference): void {
  const dark = pref === 'dark' || (pref === 'system' && media().matches);
  const root = document.documentElement;
  root.dataset.theme = dark ? 'dark' : 'light';
  root.dataset.themePref = pref;
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-theme-choice]')) {
    button.setAttribute('aria-pressed', String(button.dataset.themeChoice === pref));
  }
}

export function setPreference(pref: ThemePreference): void {
  try {
    if (pref === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    /* preference simply won't persist */
  }
  apply(pref);
}

export function initThemeToggles(): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-theme-toggle]')) el.hidden = false;
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-theme-choice]')) {
    button.addEventListener('click', () => {
      setPreference(button.dataset.themeChoice as ThemePreference);
      button.closest('details')?.removeAttribute('open');
    });
  }
  media().addEventListener('change', () => {
    if (readPreference() === 'system') apply('system');
  });
  apply(readPreference());
}
