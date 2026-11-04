import { LOCALES } from '@vireluma/domain';
import { ROUTE_KEYS, routePath } from '../src/i18n/routes';

/** Every public page path relative to the base URL. */
export const PUBLIC_PATHS = ['', ...LOCALES.flatMap((l) => ROUTE_KEYS.map((k) => routePath(l, k)))];
