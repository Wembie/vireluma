import type {
  ActivityPage,
  ConsentPurpose,
  DetailKind,
  EmergencyContact,
  EmergencyDetail,
  InvitationPreview,
  Locale,
  MemberRole,
  PersonStatus,
  PersonSummary,
  PersonWorkspace,
  Visibility,
} from '@vireluma/domain';
import { SUPABASE_KEY, SUPABASE_URL, backendConfigured, fetchWithTimeout } from './config';
import { accessToken, getSupabase } from './supabase-auth';

/**
 * Data access for the account area through the Supabase Data API (PostgREST).
 *
 * A thin typed client instead of supabase-js: the app needs a handful of
 * calls, and every kilobyte matters on low-end phones. Authorization is
 * enforced by Postgres (RLS + RPC checks); this layer only maps errors.
 */

export const DATA_ERRORS = [
  'not_configured',
  'unauthenticated',
  'forbidden',
  'conflict',
  'invalid',
  'limit',
  'stale',
  'rate_limited',
  'network',
  'unknown',
] as const;
export type DataErrorCode = (typeof DATA_ERRORS)[number];

export class DataError extends Error {
  constructor(
    readonly code: DataErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'DataError';
  }
}

/** Postgres / PostgREST error codes → user-facing categories. */
const PG_CODES: Record<string, DataErrorCode> = {
  '42501': 'forbidden',
  '28000': 'unauthenticated',
  PGRST301: 'unauthenticated',
  PGRST303: 'unauthenticated',
  '23505': 'conflict',
  '23514': 'invalid',
  '23502': 'invalid',
  '22P02': 'invalid',
  '22007': 'invalid',
  '22008': 'invalid',
  '54000': 'limit',
  '40001': 'stale',
};

async function toError(response: Response): Promise<DataError> {
  let code = '';
  try {
    const body = (await response.json()) as { code?: unknown };
    code = typeof body.code === 'string' ? body.code : '';
  } catch {
    /* non-JSON error body */
  }
  if (code in PG_CODES) return new DataError(PG_CODES[code] ?? 'unknown', code);
  if (response.status === 401) return new DataError('unauthenticated');
  if (response.status === 403) return new DataError('forbidden');
  if (response.status === 429) return new DataError('rate_limited');
  return new DataError('unknown', `${response.status} ${code}`);
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Ask PostgREST to return the affected rows. */
  returning?: boolean;
}

async function request<T>(
  path: string,
  { method = 'GET', body, returning }: RequestOptions = {},
): Promise<T> {
  if (!backendConfigured) throw new DataError('not_configured');
  const token = await accessToken();
  if (!token) throw new DataError('unauthenticated');

  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (returning) headers.Prefer = 'return=representation';

  let response: Response;
  try {
    response = await fetchWithTimeout(
      `${SUPABASE_URL}/rest/v1/${path}`,
      {
        method,
        headers,
        cache: 'no-store',
        ...(body !== undefined && { body: JSON.stringify(body) }),
      },
      15_000,
    );
  } catch {
    throw new DataError('network');
  }
  if (!response.ok) throw await toError(response);
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const rpc = <T>(fn: string, args: Record<string, unknown> = {}) =>
  request<T>(`rpc/${fn}`, { method: 'POST', body: args });

const eq = (value: string) => `eq.${encodeURIComponent(value)}`;

// ── Account ──────────────────────────────────────────────────────────────────

export interface AccountProfile {
  id: string;
  display_name: string | null;
  preferred_locale: Locale;
}

export async function getSessionEmail(): Promise<{ id: string; email: string } | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? '' } : null;
}

export async function getAccountProfile(userId: string): Promise<AccountProfile | null> {
  const rows = await request<AccountProfile[]>(
    `account_profiles?select=id,display_name,preferred_locale&id=${eq(userId)}`,
  );
  return rows[0] ?? null;
}

export const updateAccountProfile = (userId: string, patch: Partial<Omit<AccountProfile, 'id'>>) =>
  request<undefined>(`account_profiles?id=${eq(userId)}`, { method: 'PATCH', body: patch });

// ── People ───────────────────────────────────────────────────────────────────

export const listPeople = () => rpc<PersonSummary[]>('list_my_people');

export const getWorkspace = (personId: string) =>
  rpc<PersonWorkspace>('get_person_workspace', { p_person: personId });

export const getActivity = (
  personId: string,
  cursor: { beforeAudit?: number | undefined; beforeScan?: number | undefined } = {},
  limit = 25,
) =>
  rpc<ActivityPage>('get_person_activity', {
    p_person: personId,
    p_before_audit: cursor.beforeAudit ?? null,
    p_before_scan: cursor.beforeScan ?? null,
    p_limit: limit,
  });

export interface NewPerson {
  preferredName: string;
  policyVersion: string;
  isMinor: boolean;
  guardianConfirmed: boolean;
  fullName: string | null;
  dateOfBirth: string | null;
  preferredLocale: Locale;
  countryCode: string | null;
  emergencyMessage: string | null;
}

export const createPerson = (p: NewPerson) =>
  rpc<string>('create_person', {
    p_preferred_name: p.preferredName,
    p_policy_version: p.policyVersion,
    p_is_minor: p.isMinor,
    p_guardian_confirmed: p.guardianConfirmed,
    p_full_name: p.fullName,
    p_date_of_birth: p.dateOfBirth,
    p_preferred_locale: p.preferredLocale,
    p_country_code: p.countryCode,
    p_emergency_message: p.emergencyMessage,
  });

export interface PersonPatch {
  preferred_name?: string;
  full_name?: string | null;
  date_of_birth?: string | null;
  preferred_locale?: Locale;
  country_code?: string | null;
  emergency_message?: string | null;
}

export const updatePerson = (personId: string, patch: PersonPatch) =>
  request<undefined>(`people?id=${eq(personId)}`, { method: 'PATCH', body: patch });

export const setPersonStatus = (personId: string, status: PersonStatus) =>
  rpc<undefined>('set_person_status', { p_person: personId, p_status: status });

export const deletePerson = (personId: string) => rpc<undefined>('delete_person', { p_person: personId });

// ── Contacts and details ─────────────────────────────────────────────────────

export interface ContactFields {
  name: string;
  relationship: string | null;
  phone_e164: string;
  visibility: Visibility;
}

export const addContact = (personId: string, fields: ContactFields, priority: number) =>
  request<EmergencyContact[]>('emergency_contacts?select=id', {
    method: 'POST',
    body: { ...fields, person_id: personId, priority },
    returning: true,
  });

export const updateContact = (id: string, fields: Partial<ContactFields>) =>
  request<undefined>(`emergency_contacts?id=${eq(id)}`, { method: 'PATCH', body: fields });

export const deleteContact = (id: string) =>
  request<undefined>(`emergency_contacts?id=${eq(id)}`, { method: 'DELETE' });

export const reorderContacts = (personId: string, ids: string[]) =>
  rpc<undefined>('reorder_emergency_contacts', { p_person: personId, p_ids: ids });

export interface DetailFields {
  kind: DetailKind;
  title: string;
  details: string | null;
  visibility: Visibility;
}

export const addDetail = (personId: string, fields: DetailFields, sortOrder: number) =>
  request<EmergencyDetail[]>('emergency_details?select=id', {
    method: 'POST',
    body: { ...fields, person_id: personId, sort_order: sortOrder },
    returning: true,
  });

export const updateDetail = (id: string, fields: Partial<DetailFields>) =>
  request<undefined>(`emergency_details?id=${eq(id)}`, { method: 'PATCH', body: fields });

export const deleteDetail = (id: string) =>
  request<undefined>(`emergency_details?id=${eq(id)}`, { method: 'DELETE' });

export const reorderDetails = (personId: string, ids: string[]) =>
  rpc<undefined>('reorder_emergency_details', { p_person: personId, p_ids: ids });

// ── Consent ──────────────────────────────────────────────────────────────────

export const grantConsent = (personId: string, purpose: ConsentPurpose, policyVersion: string) =>
  rpc<undefined>('grant_consent', {
    p_person: personId,
    p_purpose: purpose,
    p_policy_version: policyVersion,
  });

export const revokeConsent = (personId: string, purpose: ConsentPurpose) =>
  rpc<undefined>('revoke_consent', { p_person: personId, p_purpose: purpose });

// ── Identifiers ──────────────────────────────────────────────────────────────

export const issueIdentifier = (personId: string) =>
  rpc<string>('issue_public_identifier', { p_person: personId });

export const revokeIdentifier = (identifierId: string, reason: string | null) =>
  rpc<undefined>('revoke_public_identifier', { p_identifier: identifierId, p_reason: reason });

// ── Members and invitations ──────────────────────────────────────────────────

export const createInvitation = (personId: string, email: string, role: MemberRole) =>
  rpc<string>('create_invitation', { p_person: personId, p_email: email, p_role: role });

export const revokeInvitation = (invitationId: string) =>
  rpc<undefined>('revoke_invitation', { p_invitation: invitationId });

export const previewInvitation = (token: string) =>
  rpc<InvitationPreview>('preview_invitation', { p_token: token });

export const acceptInvitation = (token: string) => rpc<string>('accept_invitation', { p_token: token });

export const updateMemberRole = (personId: string, userId: string, role: MemberRole) =>
  rpc<undefined>('update_member_role', { p_person: personId, p_user: userId, p_role: role });

export const removeMember = (personId: string, userId: string) =>
  rpc<undefined>('remove_member', { p_person: personId, p_user: userId });

export const transferOwnership = (personId: string, userId: string) =>
  rpc<undefined>('transfer_ownership', { p_person: personId, p_new_owner: userId });
