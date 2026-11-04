/**
 * Role-based permissions for people managed in VIRELUMA.
 *
 * This matrix MIRRORS the database rules (RLS policies and RPC checks in
 * supabase/migrations). The database is the authority: the UI uses this only
 * to decide what to show. Changing a rule requires changing both, and the
 * pgTAP tests in supabase/tests prove the database side.
 */

export const MEMBER_ROLES = ['owner', 'admin', 'caregiver', 'emergency_contact', 'viewer'] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export type PersonAction =
  | 'view'
  | 'editProfile'
  | 'manageEmergencyInfo'
  | 'viewScans'
  | 'manageIdentifiers'
  | 'inviteMembers'
  | 'manageMembers'
  | 'viewAudit'
  | 'manageConsent'
  | 'changeStatus'
  | 'transferOwnership'
  | 'deletePerson';

const EDITORS: readonly MemberRole[] = ['owner', 'admin', 'caregiver'];
const MANAGERS: readonly MemberRole[] = ['owner', 'admin'];
const OWNER: readonly MemberRole[] = ['owner'];

export const PERMISSIONS: Readonly<Record<PersonAction, readonly MemberRole[]>> = {
  view: MEMBER_ROLES,
  editProfile: EDITORS,
  manageEmergencyInfo: EDITORS,
  viewScans: EDITORS,
  manageIdentifiers: MANAGERS,
  inviteMembers: MANAGERS,
  manageMembers: MANAGERS,
  viewAudit: MANAGERS,
  manageConsent: OWNER,
  changeStatus: OWNER,
  transferOwnership: OWNER,
  deletePerson: OWNER,
};

export function can(role: MemberRole | null | undefined, action: PersonAction): boolean {
  return role !== null && role !== undefined && PERMISSIONS[action].includes(role);
}

/**
 * Roles an actor may assign through invitations or role changes.
 * Ownership is never assigned — it is transferred. Only the owner manages admins.
 */
export function assignableRoles(actor: MemberRole | null | undefined): MemberRole[] {
  if (actor === 'owner') return ['admin', 'caregiver', 'emergency_contact', 'viewer'];
  if (actor === 'admin') return ['caregiver', 'emergency_contact', 'viewer'];
  return [];
}

/** Whether `actor` may remove a member holding `target` (self-removal is handled separately). */
export function canRemoveMember(actor: MemberRole | null | undefined, target: MemberRole): boolean {
  if (target === 'owner') return false;
  if (target === 'admin') return actor === 'owner';
  return can(actor, 'manageMembers');
}
