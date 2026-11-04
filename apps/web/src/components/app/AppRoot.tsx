import type { ReactNode } from 'react';
import type { Locale } from '@vireluma/domain';
import type { AppPage } from '../../i18n';
import { backendConfigured } from '../../lib/backend/config';
import { AppProvider, type AppStrings } from './kit';
import { FormMessage } from './ui';

export interface IslandProps {
  locale: Locale;
  strings: AppStrings;
  /** Root-relative paths of every account page for this locale. */
  paths: Record<AppPage, string>;
}

/** Common root for account-area islands: context plus the "no backend" state. */
export function AppRoot({ locale, strings, paths, children }: IslandProps & { children: ReactNode }) {
  if (!backendConfigured) return <FormMessage tone="info">{strings.notConfigured}</FormMessage>;
  return <AppProvider value={{ t: strings, locale, paths }}>{children}</AppProvider>;
}

/** Pending invitation token kept across sign-in/registration (cleared once used). */
export const pendingInvite = {
  key: 'vireluma-invite',
  get(): string | null {
    try {
      const token = localStorage.getItem(this.key);
      return token && /^[0-9a-f]{64}$/.test(token) ? token : null;
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(this.key, token);
    } catch {
      /* storage blocked: the invite link still works while the page stays open */
    }
  },
  clear() {
    try {
      localStorage.removeItem(this.key);
    } catch {
      /* ignore */
    }
  },
};
