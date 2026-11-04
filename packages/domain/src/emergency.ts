/**
 * The public emergency profile as returned by `resolve_emergency_profile`.
 *
 * The emergency page renders this for strangers, so the response is parsed
 * defensively: unknown fields are dropped, strings are length-capped, phones
 * must be E.164 and anything malformed degrades to a safe state instead of
 * throwing.
 */
import { DETAIL_KINDS, type DetailKind } from './people.ts';
import { E164 } from './phone.ts';
import { isLocale, type Locale } from './locale.ts';

export interface EmergencyProfile {
  preferredName: string;
  emergencyMessage: string | null;
  preferredLocale: Locale | null;
  countryCode: string | null;
  isMinor: boolean;
  contacts: { name: string; relationship: string | null; phone: string }[];
  details: { kind: DetailKind; title: string; details: string | null }[];
  emergencyNumbers: { service: 'general' | 'police' | 'medical' | 'fire'; number: string }[];
}

export const RESOLUTION_STATUSES = [
  'active',
  'invalid',
  'not_found',
  'revoked',
  'suspended',
  'rate_limited',
] as const;

export type EmergencyResolution =
  | { status: 'active'; profile: EmergencyProfile }
  | { status: Exclude<(typeof RESOLUTION_STATUSES)[number], 'active'> }
  /** The response could not be understood; the page shows the generic fallback. */
  | { status: 'malformed' };

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const str = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed ? trimmed.slice(0, max) : null;
};

const list = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : []);

const SERVICES = ['general', 'police', 'medical', 'fire'] as const;

export function parseEmergencyResolution(raw: unknown): EmergencyResolution {
  if (!isObject(raw) || typeof raw.status !== 'string') return { status: 'malformed' };
  const status = raw.status;
  if (status !== 'active') {
    return (RESOLUTION_STATUSES as readonly string[]).includes(status)
      ? ({ status } as EmergencyResolution)
      : { status: 'malformed' };
  }

  const person = isObject(raw.person) ? raw.person : null;
  const preferredName = person ? str(person.preferred_name, 60) : null;
  if (!person || !preferredName) return { status: 'malformed' };

  const contacts = list(raw.contacts, 10).flatMap((c) => {
    if (!isObject(c)) return [];
    const name = str(c.name, 80);
    const phone = typeof c.phone === 'string' && E164.test(c.phone) ? c.phone : null;
    return name && phone ? [{ name, phone, relationship: str(c.relationship, 40) }] : [];
  });

  const details = list(raw.details, 30).flatMap((d) => {
    if (!isObject(d)) return [];
    const title = str(d.title, 80);
    const kind = (DETAIL_KINDS as readonly unknown[]).includes(d.kind) ? (d.kind as DetailKind) : null;
    return title && kind ? [{ kind, title, details: str(d.details, 500) }] : [];
  });

  const emergencyNumbers = list(raw.emergency_numbers, 8).flatMap((n) => {
    if (!isObject(n)) return [];
    const service = (SERVICES as readonly unknown[]).includes(n.service)
      ? (n.service as (typeof SERVICES)[number])
      : null;
    const number = typeof n.number === 'string' && /^[0-9]{2,6}$/.test(n.number) ? n.number : null;
    return service && number ? [{ service, number }] : [];
  });

  const country = str(person.country_code, 2);
  return {
    status: 'active',
    profile: {
      preferredName,
      emergencyMessage: str(person.emergency_message, 280),
      preferredLocale: isLocale(person.preferred_locale) ? person.preferred_locale : null,
      countryCode: country && /^[A-Z]{2}$/.test(country) ? country : null,
      isMinor: person.is_minor === true,
      contacts,
      details,
      emergencyNumbers,
    },
  };
}

/** Map link for a position shared by a helper (only on their explicit action). */
export function mapsLink(latitude: number, longitude: number): string {
  const fix = (n: number) => (Math.round(n * 1e5) / 1e5).toString();
  return `https://www.google.com/maps/search/?api=1&query=${fix(latitude)},${fix(longitude)}`;
}
