import { describe, expect, it } from 'vitest';
import {
  MEMBER_ROLES,
  assignableRoles,
  can,
  canRemoveMember,
  type MemberRole,
  type PersonAction,
} from './permissions.ts';

/** Expected matrix, written out explicitly so any change is a deliberate test change. */
const MATRIX: Record<PersonAction, MemberRole[]> = {
  view: ['owner', 'admin', 'caregiver', 'emergency_contact', 'viewer'],
  editProfile: ['owner', 'admin', 'caregiver'],
  manageEmergencyInfo: ['owner', 'admin', 'caregiver'],
  viewScans: ['owner', 'admin', 'caregiver'],
  manageIdentifiers: ['owner', 'admin'],
  inviteMembers: ['owner', 'admin'],
  manageMembers: ['owner', 'admin'],
  viewAudit: ['owner', 'admin'],
  manageConsent: ['owner'],
  changeStatus: ['owner'],
  transferOwnership: ['owner'],
  deletePerson: ['owner'],
};

describe('can', () => {
  for (const [action, allowed] of Object.entries(MATRIX) as [PersonAction, MemberRole[]][]) {
    it.each(MEMBER_ROLES)(`${action} for %s`, (role) => {
      expect(can(role, action)).toBe(allowed.includes(role));
    });
  }

  it('denies everything without a membership', () => {
    for (const action of Object.keys(MATRIX) as PersonAction[]) {
      expect(can(null, action)).toBe(false);
      expect(can(undefined, action)).toBe(false);
    }
  });
});

describe('assignableRoles', () => {
  it('never allows assigning ownership', () => {
    for (const role of MEMBER_ROLES) expect(assignableRoles(role)).not.toContain('owner');
  });
  it('lets only the owner assign admin', () => {
    expect(assignableRoles('owner')).toContain('admin');
    expect(assignableRoles('admin')).not.toContain('admin');
  });
  it('gives non-managers nothing to assign', () => {
    expect(assignableRoles('caregiver')).toEqual([]);
    expect(assignableRoles('viewer')).toEqual([]);
    expect(assignableRoles(null)).toEqual([]);
  });
});

describe('canRemoveMember', () => {
  it('protects the owner', () => {
    for (const role of MEMBER_ROLES) expect(canRemoveMember(role, 'owner')).toBe(false);
  });
  it('lets only the owner remove admins', () => {
    expect(canRemoveMember('owner', 'admin')).toBe(true);
    expect(canRemoveMember('admin', 'admin')).toBe(false);
  });
  it('lets managers remove other roles', () => {
    expect(canRemoveMember('admin', 'caregiver')).toBe(true);
    expect(canRemoveMember('caregiver', 'viewer')).toBe(false);
  });
});
