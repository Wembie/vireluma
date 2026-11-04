/**
 * People, emergency contacts and emergency details: the shapes shared by the
 * app and the database, plus input validation that mirrors the database
 * CHECK constraints (the database remains the authority).
 */
import type { MemberRole } from './permissions.ts';
import { E164, isCountryCode, type CountryCode } from './phone.ts';
import { isLocale, type Locale } from './locale.ts';

export const VISIBILITIES = ['public_emergency', 'private'] as const;
/** `protected` exists in the database but is reserved until an authorization flow exists. */
export type Visibility = (typeof VISIBILITIES)[number] | 'protected';

export const DETAIL_KINDS = [
  'communication',
  'accessibility',
  'instruction',
  'medical_alert',
  'allergy',
  'medication',
] as const;
export type DetailKind = (typeof DETAIL_KINDS)[number];

/** Kinds that are health data and require active `health_data` consent. */
export const HEALTH_DETAIL_KINDS: readonly DetailKind[] = ['medical_alert', 'allergy', 'medication'];

export const isHealthKind = (kind: DetailKind): boolean => HEALTH_DETAIL_KINDS.includes(kind);

export const CONSENT_PURPOSES = [
  'profile_processing',
  'health_data',
  'minor_guardian',
  'public_photo',
] as const;
export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

export type PersonStatus = 'active' | 'suspended';

/** Mirrors the database limits (CHECK constraints and limit triggers). */
export const LIMITS = {
  preferredName: 60,
  fullName: 120,
  emergencyMessage: 280,
  contactName: 80,
  relationship: 40,
  detailTitle: 80,
  detailBody: 500,
  contactsPerPerson: 10,
  detailsPerPerson: 30,
  peoplePerAccount: 50,
} as const;

/** Version of the consent text shown in the app. Bump when the wording changes. */
export const POLICY_VERSION = '2026-11-draft';

export interface PersonInput {
  preferredName: string;
  fullName: string;
  dateOfBirth: string;
  preferredLocale: Locale;
  countryCode: CountryCode | null;
  emergencyMessage: string;
}

export interface ContactInput {
  name: string;
  relationship: string;
  phoneE164: string | null;
  visibility: Visibility;
}

export interface DetailInput {
  kind: DetailKind;
  title: string;
  details: string;
  visibility: Visibility;
}

export type FieldError = 'required' | 'too_long' | 'invalid';
export type FieldErrors<T> = Partial<Record<keyof T, FieldError>>;

const text = (value: string, max: number, required: boolean): FieldError | undefined => {
  const trimmed = value.trim();
  if (required && trimmed.length === 0) return 'required';
  if (value.length > max) return 'too_long';
  return undefined;
};

const clean = <T extends object>(errors: { [K in keyof T]?: FieldError | undefined }): FieldErrors<T> =>
  Object.fromEntries(Object.entries(errors).filter(([, v]) => v !== undefined)) as FieldErrors<T>;

/** `YYYY-MM-DD`, after 1900-01-01 and not in the future. */
export function isValidBirthDate(value: string, today: Date = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
  return value > '1900-01-01' && date.getTime() <= today.getTime();
}

export function validatePerson(input: PersonInput, today?: Date): FieldErrors<PersonInput> {
  return clean<PersonInput>({
    preferredName: text(input.preferredName, LIMITS.preferredName, true),
    fullName: text(input.fullName, LIMITS.fullName, false),
    emergencyMessage: text(input.emergencyMessage, LIMITS.emergencyMessage, false),
    dateOfBirth: input.dateOfBirth && !isValidBirthDate(input.dateOfBirth, today) ? 'invalid' : undefined,
    preferredLocale: isLocale(input.preferredLocale) ? undefined : 'invalid',
    countryCode: input.countryCode === null || isCountryCode(input.countryCode) ? undefined : 'invalid',
  });
}

export function validateContact(input: ContactInput): FieldErrors<ContactInput> {
  return clean<ContactInput>({
    name: text(input.name, LIMITS.contactName, true),
    relationship: text(input.relationship, LIMITS.relationship, false),
    phoneE164: input.phoneE164 && E164.test(input.phoneE164) ? undefined : 'invalid',
  });
}

export function validateDetail(input: DetailInput): FieldErrors<DetailInput> {
  return clean<DetailInput>({
    title: text(input.title, LIMITS.detailTitle, true),
    details: text(input.details, LIMITS.detailBody, false),
    kind: (DETAIL_KINDS as readonly string[]).includes(input.kind) ? undefined : 'invalid',
  });
}

// ── Read models returned by the database (see 20261105120000_core_product.sql) ──

export interface PersonSummary {
  id: string;
  preferred_name: string;
  status: PersonStatus;
  role: MemberRole;
  is_minor: boolean;
  country_code: string | null;
  contacts_count: number;
  public_contacts_count: number;
  details_count: number;
  active_public_id: string | null;
  identifier_issued_at: string | null;
  last_scan_at: string | null;
  updated_at: string;
}

export interface Person {
  id: string;
  preferred_name: string;
  full_name: string | null;
  date_of_birth: string | null;
  is_minor: boolean;
  preferred_locale: Locale;
  country_code: string | null;
  emergency_message: string | null;
  status: PersonStatus;
  created_at: string;
  updated_at: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string | null;
  phone_e164: string;
  priority: number;
  visibility: Visibility;
}

export interface EmergencyDetail {
  id: string;
  kind: DetailKind;
  title: string;
  details: string | null;
  visibility: Visibility;
  sort_order: number;
}

export interface Member {
  user_id: string;
  role: MemberRole;
  email: string | null;
  display_name: string | null;
  since: string;
  is_me: boolean;
}

export interface Invitation {
  id: string;
  email: string;
  role: MemberRole;
  created_at: string;
  expires_at: string;
}

export interface PersonWorkspace {
  my_role: MemberRole;
  person: Person;
  contacts: EmergencyContact[];
  details: EmergencyDetail[];
  identifier: { id: string; public_id: string; issued_at: string } | null;
  revoked_identifiers: { id: string; issued_at: string; revoked_at: string; reason: string | null }[];
  consents: { purpose: ConsentPurpose; policy_version: string; granted_at: string }[];
  members: Member[];
  /** Null unless the reader manages members. */
  invitations: Invitation[] | null;
  /** Null unless the reader may see scans. */
  scans: { last_30_days: number; last_scan_at: string | null } | null;
}

export interface ActivityPage {
  audit:
    | {
        id: number;
        at: string;
        action: 'insert' | 'update' | 'delete';
        entity: string;
        changed: string[] | null;
        actor_email: string | null;
        by_me: boolean;
      }[]
    | null;
  scans: { id: number; at: string; outcome: string }[];
}

export type InvitationPreview =
  | {
      status: 'valid';
      role: MemberRole;
      preferred_name: string;
      invited_by: string | null;
      expires_at: string;
    }
  | { status: 'already_member'; person_id: string }
  | { status: 'invalid' | 'used' | 'expired' | 'wrong_account' | 'rate_limited' };

// ── Setup progress ───────────────────────────────────────────────────────────

export const SETUP_STEPS = ['profile', 'contacts', 'details', 'identifier'] as const;
export type SetupStep = (typeof SETUP_STEPS)[number];

/**
 * A person is usable once they have a public contact and an active
 * identifier. Emergency details are recommended but optional. Progress is
 * derived from server data, so setup can be resumed on any device.
 */
export function setupProgress(summary: {
  public_contacts_count: number;
  details_count: number;
  active_public_id: string | null;
}): { done: Record<SetupStep, boolean>; complete: boolean; next: SetupStep | null } {
  const done: Record<SetupStep, boolean> = {
    profile: true,
    contacts: summary.public_contacts_count > 0,
    details: summary.details_count > 0,
    identifier: summary.active_public_id !== null,
  };
  const next = SETUP_STEPS.find((s) => !done[s]) ?? null;
  return { done, complete: done.contacts && done.identifier, next };
}

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
