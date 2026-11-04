import { describe, expect, it } from 'vitest';
import {
  LIMITS,
  isHealthKind,
  isUuid,
  isValidBirthDate,
  setupProgress,
  validateContact,
  validateDetail,
  validatePerson,
  type PersonInput,
} from './people.ts';

const person: PersonInput = {
  preferredName: 'Elena',
  fullName: '',
  dateOfBirth: '',
  preferredLocale: 'es',
  countryCode: 'CO',
  emergencyMessage: '',
};

describe('validatePerson', () => {
  it('accepts a minimal person', () => {
    expect(validatePerson(person)).toEqual({});
  });

  it('requires a preferred name and enforces database lengths', () => {
    expect(validatePerson({ ...person, preferredName: '   ' })).toEqual({ preferredName: 'required' });
    expect(validatePerson({ ...person, emergencyMessage: 'x'.repeat(LIMITS.emergencyMessage + 1) })).toEqual({
      emergencyMessage: 'too_long',
    });
  });

  it('validates birth dates and enumerations', () => {
    const today = new Date('2026-11-04T12:00:00Z');
    expect(validatePerson({ ...person, dateOfBirth: '2030-01-01' }, today)).toEqual({
      dateOfBirth: 'invalid',
    });
    expect(validatePerson({ ...person, countryCode: 'ZZ' as never })).toEqual({ countryCode: 'invalid' });
    expect(validatePerson({ ...person, preferredLocale: 'de' as never })).toEqual({
      preferredLocale: 'invalid',
    });
  });
});

describe('isValidBirthDate', () => {
  const today = new Date('2026-11-04T12:00:00Z');
  it('rejects impossible and out-of-range dates', () => {
    expect(isValidBirthDate('1950-02-29', today)).toBe(false);
    expect(isValidBirthDate('1899-12-31', today)).toBe(false);
    expect(isValidBirthDate('04/11/1950', today)).toBe(false);
    expect(isValidBirthDate('1948-02-29', today)).toBe(true);
    expect(isValidBirthDate('2026-11-04', today)).toBe(true);
  });
});

describe('contacts and details', () => {
  it('needs a name and a normalised phone', () => {
    expect(
      validateContact({
        name: 'María',
        relationship: '',
        phoneE164: '+573001234567',
        visibility: 'public_emergency',
      }),
    ).toEqual({});
    expect(validateContact({ name: '', relationship: '', phoneE164: null, visibility: 'private' })).toEqual({
      name: 'required',
      phoneE164: 'invalid',
    });
  });

  it('validates details and flags health kinds', () => {
    expect(
      validateDetail({ kind: 'allergy', title: 'Penicilina', details: '', visibility: 'private' }),
    ).toEqual({});
    expect(validateDetail({ kind: 'other' as never, title: '', details: '', visibility: 'private' })).toEqual(
      {
        kind: 'invalid',
        title: 'required',
      },
    );
    expect(isHealthKind('medication')).toBe(true);
    expect(isHealthKind('communication')).toBe(false);
  });
});

describe('setupProgress', () => {
  it('derives the next step from server data', () => {
    expect(
      setupProgress({ public_contacts_count: 0, details_count: 0, active_public_id: null }),
    ).toMatchObject({
      complete: false,
      next: 'contacts',
    });
    expect(
      setupProgress({ public_contacts_count: 1, details_count: 0, active_public_id: null }),
    ).toMatchObject({
      complete: false,
      next: 'details',
    });
    expect(
      setupProgress({ public_contacts_count: 1, details_count: 0, active_public_id: 'X' }),
    ).toMatchObject({
      complete: true,
      next: 'details',
    });
    expect(
      setupProgress({ public_contacts_count: 1, details_count: 2, active_public_id: 'X' }).next,
    ).toBeNull();
  });

  it('recognises UUIDs', () => {
    expect(isUuid('6f1c1a8e-3c1d-4c49-9a43-2b8f0c7d9e10')).toBe(true);
    expect(isUuid('6f1c1a8e')).toBe(false);
    expect(isUuid(null)).toBe(false);
  });
});
